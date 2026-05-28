import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { toWATDateString } from '@/lib/quiz/streakCalculation';
import { QuizQuestion, QuizQuestionInternal } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const todayWATStr = toWATDateString(new Date());

    // 1. Check if attempt already exists for user and date (any status)
    const { data: existingAttempt, error: existingErr } = await supabaseServer
      .from('quiz_attempts')
      .select('id')
      .eq('user_id', userId)
      .eq('quiz_date', todayWATStr)
      .maybeSingle();

    if (existingErr) {
      console.error('[API Quiz Start] Check existing attempt error:', existingErr);
      return NextResponse.json({ error: existingErr.message }, { status: 500 });
    }

    if (existingAttempt) {
      return NextResponse.json({ error: 'Attempt already exists for today' }, { status: 409 });
    }

    // 2. Fetch today's questions from quiz_days
    const { data: quizDay, error: quizDayErr } = await supabaseServer
      .from('quiz_days')
      .select('questions, generation_status')
      .eq('quiz_date', todayWATStr)
      .maybeSingle();

    if (quizDayErr) {
      console.error('[API Quiz Start] Fetch quiz_days error:', quizDayErr);
      return NextResponse.json({ error: quizDayErr.message }, { status: 500 });
    }

    if (!quizDay || (quizDay.generation_status !== 'ready' && quizDay.generation_status !== 'fallback')) {
      return NextResponse.json({ error: 'Quiz is not ready for today' }, { status: 400 });
    }

    const internalQuestions = quizDay.questions as QuizQuestionInternal[];
    if (!Array.isArray(internalQuestions) || internalQuestions.length !== 5) {
      return NextResponse.json({ error: 'Quiz questions are malformed or missing' }, { status: 500 });
    }

    // Extract question IDs for recording in attempt row
    const questionIds = internalQuestions.map(q => q.id);

    // 3. Create the pending attempt record
    const { data: newAttempt, error: insertErr } = await supabaseServer
      .from('quiz_attempts')
      .insert({
        user_id: userId,
        quiz_date: todayWATStr,
        status: 'pending',
        points_awarded: 0,
        question_ids: questionIds,
        answers: [],
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('[API Quiz Start] Insert attempt error:', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // 4. Map questions to client shape (stripping correctAnswerIndex)
    const clientQuestions: QuizQuestion[] = internalQuestions.map(q => ({
      id: q.id,
      text: q.text,
      options: q.options,
      difficulty: q.difficulty,
      index: q.index,
    }));

    return NextResponse.json({
      attemptId: newAttempt.id,
      questions: clientQuestions,
    });
  } catch (err: any) {
    console.error('[API Quiz Start] POST exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
