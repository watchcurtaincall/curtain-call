import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getDeterministicUUID } from '@/lib/quiz/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    let { attemptId, userId, reason } = body;

    if (!attemptId || !userId || !reason) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    userId = getDeterministicUUID(userId);

    const { error } = await supabaseServer
      .from('quiz_attempts')
      .update({
        status: 'voided',
        result_type: 'voided',
        void_reason: reason,
        completed_at: new Date().toISOString(),
      })
      .eq('id', attemptId)
      .eq('user_id', userId);

    if (error) {
      console.error('[API Quiz Void] Void attempt error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API Quiz Void] POST exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
