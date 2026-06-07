import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { toWATDateString } from '@/lib/quiz/streakCalculation';
import { getUserIdFromRequest } from '@/lib/quiz/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    const userId = await getUserIdFromRequest(request);
    const todayWATStr = toWATDateString(new Date());

    // 1. Fetch quiz_days row for today
    const { data: quizDay, error: quizDayErr } = await supabaseServer
      .from('quiz_days')
      .select('*')
      .eq('quiz_date', todayWATStr)
      .maybeSingle();

    if (quizDayErr) {
      console.error('[API Quiz Status] Fetch quiz_days error:', quizDayErr);
      return NextResponse.json({ error: quizDayErr.message }, { status: 500 });
    }

    const questionsReady = quizDay 
      ? (quizDay.generation_status === 'ready' || quizDay.generation_status === 'fallback' || quizDay.generation_status === 'generated') 
      : false;
    const slotsRemaining = quizDay ? quizDay.slots_remaining : 10;

    // 2. Fetch user's attempt for today
    let userAttempt = { status: 'none' as const };
    let streakCount = 0;
    let pointsBalance = 0;
    let cashCredits = 0;
    let cashTransactions: any[] = [];

    if (userId) {
      const { data: attempt, error: attemptErr } = await supabaseServer
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('quiz_date', todayWATStr)
        .maybeSingle();

      if (attemptErr) {
        console.error('[API Quiz Status] Fetch attempt error:', attemptErr);
        return NextResponse.json({ error: attemptErr.message }, { status: 500 });
      }

      if (attempt) {
        // Build base attempt info
        const baseAttempt: any = {
          status: attempt.status,
        };

        if (attempt.status === 'completed') {
          baseAttempt.score = attempt.score;
          baseAttempt.pointsAwarded = attempt.points_awarded;
          baseAttempt.slotPosition = attempt.slot_position;
          baseAttempt.resultType = attempt.result_type;

          // Attach review data: user's answers + questions with correct answers
          try {
            const { data: qDay } = await supabaseServer
              .from('quiz_days')
              .select('questions')
              .eq('quiz_date', todayWATStr)
              .maybeSingle();

            if (qDay?.questions && Array.isArray(attempt.answers)) {
              baseAttempt.reviewData = (qDay.questions as any[]).map((q: any) => {
                const userAnswer = (attempt.answers as any[]).find((a: any) => a.questionId === q.id);
                return {
                  id: q.id,
                  text: q.text,
                  options: q.options,
                  correctAnswerIndex: q.correctAnswerIndex,
                  selectedIndex: userAnswer?.selectedIndex ?? -1,
                  isCorrect: userAnswer?.selectedIndex === q.correctAnswerIndex,
                };
              });
            }
          } catch (reviewErr) {
            console.error('[API Quiz Status] Error fetching review data:', reviewErr);
          }
        }

        if (attempt.status === 'voided') {
          baseAttempt.resultType = 'voided' as const;
        }

        userAttempt = baseAttempt;
      }


      // 3. Fetch user's profile for streak count
      const { data: authUser, error: authUserErr } = await supabaseServer.auth.admin.getUserById(userId);
      if (authUserErr || !authUser?.user) {
        console.error('[API Quiz Status] Error fetching auth user details:', authUserErr);
      } else {
        const email = authUser.user.email;
        if (email) {
          const { data: profile, error: profileErr } = await supabaseServer
            .from('profiles')
            .select('quiz_streak')
            .eq('email', email.toLowerCase())
            .maybeSingle();

          if (profileErr) {
            console.error('[API Quiz Status] Fetch profile error:', profileErr);
          } else if (profile) {
            streakCount = profile.quiz_streak || 0;
          }
        }
      }

      // 4. Fetch points balance
      const { data: wallet } = await supabaseServer
        .from('quiz_points_wallet')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();
      if (wallet) {
        pointsBalance = wallet.balance;
      }

      // 5. Fetch cash credits
      const { data: credits } = await supabaseServer
        .from('quiz_cash_credits')
        .select('amount_naira, created_at, source')
        .eq('user_id', userId);
      
      if (credits) {
        cashCredits = credits.reduce((sum, row) => sum + Number(row.amount_naira), 0);
        cashTransactions = credits;
      }
    }

    return NextResponse.json({
      quizDate: todayWATStr,
      slotsRemaining,
      totalSlots: 10,
      userAttempt,
      streakCount,
      pointsBalance,
      // Pass cashCredits so Creator Hub can show converted funds
      cashCredits,
      cashTransactions,
      questionsReady,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (err: any) {
    console.error('[API Quiz Status] GET exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
