import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { generateQuizQuestions } from '@/lib/quiz/questionGeneration';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: NextRequest) {
  // Validate cron secret to prevent public triggering
  const authHeader = req.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD in UTC
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase server client not initialized' }, { status: 500 });
  }

  // Idempotency: check if today's quiz_day row already exists
  const { data: existing, error: checkErr } = await supabaseServer
    .from('quiz_days')
    .select('quiz_date, questions_generated')
    .eq('quiz_date', today)
    .maybeSingle();

  if (checkErr) {
    console.error('[CronGenerate] Supabase check error:', checkErr);
    return NextResponse.json({ error: checkErr.message }, { status: 500 });
  }

  if (existing?.questions_generated) {
    return NextResponse.json({
      message: 'Questions already generated for today',
      date: today,
      skipped: true,
    });
  }

  // Generate questions
  const { questions, source } = await generateQuizQuestions();

  // Upsert the quiz_day row
  const { error: upsertErr } = await supabaseServer
    .from('quiz_days')
    .upsert(
      {
        quiz_date: today,
        questions: questions,
        questions_generated: true,
        winner_slots_total: 10,
        winner_slots_remaining: 10,
        generated_at: new Date().toISOString(),
        generation_source: source,
      },
      { onConflict: 'quiz_date' }
    );

  if (upsertErr) {
    console.error('[CronGenerate] Upsert error:', upsertErr);
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  console.log(`[CronGenerate] ✅ Generated ${questions.length} questions for ${today} (source: ${source})`);

  return NextResponse.json({
    message: 'Questions generated successfully',
    date: today,
    source,
    questionCount: questions.length,
  });
}
