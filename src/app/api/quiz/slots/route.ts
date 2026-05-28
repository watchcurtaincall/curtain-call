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

    return NextResponse.json({
      slotsRemaining,
      quizDate: todayWATStr,
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
