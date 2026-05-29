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
        userAttempt = {
          status: attempt.status,
          ...(attempt.status === 'completed' && {
            score: attempt.score,
            pointsAwarded: attempt.points_awarded,
            slotPosition: attempt.slot_position,
            resultType: attempt.result_type,
          }),
          ...(attempt.status === 'voided' && {
            resultType: 'voided' as const,
          })
        };
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
        .select('amount_naira')
        .eq('user_id', userId);
      
      if (credits) {
        cashCredits = credits.reduce((sum, row) => sum + Number(row.amount_naira), 0);
      }
    }

    return NextResponse.json({
      quizDate: todayWATStr,
      slotsRemaining,
      totalSlots: 10,
      userAttempt,
      streakCount,
      pointsBalance,
      // Pass cashCredits so Producer Dashboard can show converted funds
      cashCredits,
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
