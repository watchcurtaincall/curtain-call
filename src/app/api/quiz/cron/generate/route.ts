import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { generateQuizQuestions } from '@/lib/quiz/questionGeneration';

const CRON_SECRET = process.env.CRON_SECRET;

// Vercel cron sends GET requests
export async function GET(req: NextRequest) {
  return handler(req);
}
export async function POST(req: NextRequest) {
  return handler(req);
}

async function handler(req: NextRequest) {
  // Validate cron secret to prevent public triggering
  const authHeader = req.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use WAT (UTC+1) for date calculation
  const now = new Date();
  const watOffset = 60; // WAT is UTC+1
  const watDate = new Date(now.getTime() + watOffset * 60 * 1000);
  const today = watDate.toISOString().split('T')[0];
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase server client not initialized' }, { status: 500 });
  }

  // Idempotency: check if today's quiz_day row already exists
  const { data: existing, error: checkErr } = await supabaseServer
    .from('quiz_days')
    .select('quiz_date, generation_status')
    .eq('quiz_date', today)
    .maybeSingle();

  if (checkErr) {
    console.error('[CronGenerate] Supabase check error:', checkErr);
    return NextResponse.json({ error: checkErr.message }, { status: 500 });
  }

  if (existing?.generation_status === 'ready' || existing?.generation_status === 'fallback' || existing?.generation_status === 'generated') {
    return NextResponse.json({
      message: 'Questions already generated for today',
      date: today,
      skipped: true,
    });
  }

  // Fetch the last 7 days of questions to prevent repetition
  const { data: pastDays } = await supabaseServer
    .from('quiz_days')
    .select('questions')
    .lt('quiz_date', today)
    .order('quiz_date', { ascending: false })
    .limit(7);

  let recentQuestionsContext = '';
  if (pastDays && pastDays.length > 0) {
    const pastQuestions = pastDays
      .flatMap(day => day.questions || [])
      .map(q => q.text)
      .filter(Boolean);
    
    if (pastQuestions.length > 0) {
      recentQuestionsContext = pastQuestions.map(q => `- ${q}`).join('\n');
    }
  }

  // Generate questions
  const { questions, source } = await generateQuizQuestions(recentQuestionsContext);

  // Upsert the quiz_day row using correct schema columns
  const { error: upsertErr } = await supabaseServer
    .from('quiz_days')
    .upsert(
      {
        quiz_date: today,
        questions: questions,
        generation_status: 'ready',
        slots_remaining: 10,
        slots_claimed: 0,
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
