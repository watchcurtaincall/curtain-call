import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { toWATDateString } from '@/lib/quiz/streakCalculation';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    const todayWATStr = toWATDateString(new Date());

    const { data: quizDay, error } = await supabaseServer
      .from('quiz_days')
      .select('slots_remaining, quiz_date')
      .eq('quiz_date', todayWATStr)
      .maybeSingle();

    if (error) {
      console.error('[API Quiz Slots] Fetch slots error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const slotsRemaining = quizDay ? quizDay.slots_remaining : 10;

    // Fetch claimed slots
    const { data: attempts, error: slotsErr } = await supabaseServer
      .from('quiz_attempts')
      .select('slot_position, user_id, completed_at')
      .eq('quiz_date', todayWATStr)
      .not('slot_position', 'is', null)
      .order('slot_position', { ascending: true });

    if (slotsErr) {
      console.error('[API Quiz Slots] Fetch attempts error:', slotsErr);
    }

    const slots = (attempts || []).map(a => ({
      position: a.slot_position,
      userId: a.user_id,
      claimedAt: a.completed_at
    }));

    return NextResponse.json({
      slotsRemaining,
      quizDate: todayWATStr,
      slots
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (err: any) {
    console.error('[API Quiz Slots] GET exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
