import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { toWATDateString, calculateNewStreak } from '@/lib/quiz/streakCalculation';
import { QuizQuestionInternal } from '@/lib/types';
import { resolveRealUserId } from '@/lib/quiz/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { attemptId, userId: originalUserId, answers } = body;

    if (!attemptId || !originalUserId || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }

    const userId = await resolveRealUserId(originalUserId);

    const todayWATStr = toWATDateString(new Date());

    // 1. Fetch today's questions from quiz_days to evaluate answers
    const { data: quizDay, error: quizDayErr } = await supabaseServer
      .from('quiz_days')
      .select('questions')
      .eq('quiz_date', todayWATStr)
      .maybeSingle();

    if (quizDayErr || !quizDay) {
      console.error('[API Quiz Submit] Fetch quiz_days error:', quizDayErr);
      return NextResponse.json({ error: 'Quiz day details not found' }, { status: 500 });
    }

    const internalQuestions = quizDay.questions as QuizQuestionInternal[];
    if (!Array.isArray(internalQuestions) || internalQuestions.length !== 5) {
      return NextResponse.json({ error: 'Quiz questions are malformed or missing' }, { status: 500 });
    }

    // 2. Evaluate answers
    let score = 0;
    let allCorrect = true;

    for (const q of internalQuestions) {
      const userAnswer = answers.find(a => a.questionId === q.id);
      if (userAnswer && userAnswer.selectedIndex === q.correctAnswerIndex) {
        score++;
      } else {
        allCorrect = false;
      }
    }

    // Double check that we actually have 5 answers
    if (answers.length !== 5) {
      allCorrect = false;
    }

    let resultType: 'won' | 'consolation' | 'failed' = 'failed';
    let pointsAwarded = 0;
    let slotPosition: number | null = null;

    if (allCorrect) {
      try {
        // Atomic slot claiming RPC
        const { data: slot, error: rpcErr } = await supabaseServer.rpc('claim_winner_slot', {
          p_quiz_date: todayWATStr,
          p_attempt_id: attemptId
        });

        if (rpcErr) {
          console.error('[API Quiz Submit] claim_winner_slot RPC error:', rpcErr);
          resultType = 'consolation';
          pointsAwarded = 20;
        } else if (slot !== null && slot !== undefined) {
          resultType = 'won';
          pointsAwarded = 100;
          slotPosition = slot;
        } else {
          resultType = 'consolation';
          pointsAwarded = 20;
        }
      } catch (rpcEx) {
        console.error('[API Quiz Submit] claim_winner_slot RPC exception:', rpcEx);
        resultType = 'consolation';
        pointsAwarded = 20;
      }
    } else {
      resultType = 'failed';
      pointsAwarded = 0;
    }

    // 3. Update the quiz_attempt row
    const { error: updateAttemptErr } = await supabaseServer
      .from('quiz_attempts')
      .update({
        status: 'completed',
        result_type: resultType,
        score,
        points_awarded: pointsAwarded,
        slot_position: slotPosition,
        answers,
        completed_at: new Date().toISOString(),
      })
      .eq('id', attemptId)
      .eq('user_id', userId);

    if (updateAttemptErr) {
      console.error('[API Quiz Submit] Update attempt error:', updateAttemptErr);
      return NextResponse.json({ error: updateAttemptErr.message }, { status: 500 });
    }

    // 4. Update the user's points wallet
    let newPointsBalance = pointsAwarded;
    if (pointsAwarded > 0) {
      const { data: wallet, error: fetchWalletErr } = await supabaseServer
        .from('quiz_points_wallet')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchWalletErr) {
        console.error('[API Quiz Submit] Fetch wallet error:', fetchWalletErr);
      }

      if (wallet) {
        newPointsBalance = wallet.balance + pointsAwarded;
        const { error: walletUpdateErr } = await supabaseServer
          .from('quiz_points_wallet')
          .update({
            balance: newPointsBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (walletUpdateErr) console.error('[API Quiz Submit] Update wallet error:', walletUpdateErr);
      } else {
        const { error: walletInsertErr } = await supabaseServer
          .from('quiz_points_wallet')
          .insert({
            user_id: userId,
            balance: pointsAwarded,
          });

        if (walletInsertErr) console.error('[API Quiz Submit] Insert wallet error:', walletInsertErr);
      }

      // 5. Log transaction
      const { error: txnErr } = await supabaseServer
        .from('quiz_point_transactions')
        .insert({
          user_id: userId,
          quiz_date: todayWATStr,
          result_type: resultType,
          points_delta: pointsAwarded,
          balance_after: newPointsBalance,
          attempt_id: attemptId,
        });

      if (txnErr) console.error('[API Quiz Submit] Log transaction error:', txnErr);
    } else {
      // Fetch current balance even if 0 points awarded
      const { data: wallet } = await supabaseServer
        .from('quiz_points_wallet')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();
      if (wallet) {
        newPointsBalance = wallet.balance;
      }
    }

    // 6. Streak and badge calculations
    let newStreakCount = 0;
    let email = '';
    let name = 'Anonymous User';

    if (originalUserId.includes('@')) {
      email = originalUserId.toLowerCase();
      name = email.split('@')[0];
    } else {
      const { data: authUser, error: authUserErr } = await supabaseServer.auth.admin.getUserById(originalUserId);
      if (!authUserErr && authUser?.user?.email) {
        email = authUser.user.email.toLowerCase();
        name = authUser.user.user_metadata?.name || 'Anonymous User';
      }
    }

    if (email) {
      const { data: profile, error: profileErr } = await supabaseServer
        .from('profiles')
        .select('quiz_streak, quiz_last_completion_date, quiz_badges')
        .eq('email', email)
        .maybeSingle();

      if (!profileErr && profile) {
        const lastCompletionDate = profile.quiz_last_completion_date
          ? new Date(profile.quiz_last_completion_date)
          : null;

        newStreakCount = calculateNewStreak(
          profile.quiz_streak || 0,
          lastCompletionDate,
          new Date()
        );

        // Award milestone badges & points
        const currentBadges = Array.isArray(profile.quiz_badges) ? [...profile.quiz_badges] : [];
        const updatedBadges = new Set(currentBadges);
        let bonusPoints = 0;

        if (newStreakCount >= 7 && !updatedBadges.has('7_day')) {
          updatedBadges.add('7_day');
          bonusPoints += 500;
        }
        if (newStreakCount >= 30 && !updatedBadges.has('30_day')) {
          updatedBadges.add('30_day');
          bonusPoints += 1500;
        }
        if (newStreakCount >= 100 && !updatedBadges.has('100_day')) {
          updatedBadges.add('100_day');
          bonusPoints += 5000;
        }

        if (bonusPoints > 0) {
          pointsAwarded += bonusPoints;
          newPointsBalance += bonusPoints;

          // Update wallet with new balance including bonuses
          const { error: bonusWalletErr } = await supabaseServer
            .from('quiz_points_wallet')
            .update({
              balance: newPointsBalance,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          if (bonusWalletErr) console.error('[API Quiz Submit] Bonus wallet update error:', bonusWalletErr);

          // Log bonus transaction
          await supabaseServer
            .from('quiz_point_transactions')
            .insert({
              user_id: userId,
              quiz_date: todayWATStr,
              result_type: 'won', // Count milestone bonus as a "win"
              points_delta: bonusPoints,
              balance_after: newPointsBalance,
              attempt_id: attemptId,
            });
        }

        const { error: profileUpdateErr } = await supabaseServer
          .from('profiles')
          .update({
            quiz_streak: newStreakCount,
            quiz_last_completion_date: todayWATStr,
            quiz_badges: Array.from(updatedBadges),
          })
          .eq('email', email);

        if (profileUpdateErr) {
          console.error('[API Quiz Submit] Profile streak update error:', profileUpdateErr);
        }
      } else {
        // Profile does not exist yet (anonymous or un-synchronized), set initial streak
        const initialBadges: string[] = [];
        const { error: profileInsertErr } = await supabaseServer
          .from('profiles')
          .insert({
            email,
            name,
            quiz_streak: 1,
            quiz_last_completion_date: todayWATStr,
            quiz_badges: initialBadges,
          });
        if (profileInsertErr) {
          console.error('[API Quiz Submit] Profile streak insert error:', profileInsertErr);
        }
        newStreakCount = 1;
      }
    }

    return NextResponse.json({
      resultType,
      score,
      pointsAwarded,
      ...(slotPosition !== null && { slotPosition }),
      newStreakCount,
      newPointsBalance,
    });
  } catch (err: any) {
    console.error('[API Quiz Submit] POST exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
