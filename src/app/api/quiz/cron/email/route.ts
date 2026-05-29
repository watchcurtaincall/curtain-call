import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getDailyQuizReminderHtml } from '@/lib/quiz/emailTemplates';

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://curtain-call.vercel.app';

// Vercel cron sends GET requests
export async function GET(req: NextRequest) {
  return handler(req);
}
export async function POST(req: NextRequest) {
  return handler(req);
}

async function handler(req: NextRequest) {
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

  // Verify today's questions are ready
  const { data: quizDay } = await supabaseServer
    .from('quiz_days')
    .select('questions_generated, winner_slots_total')
    .eq('quiz_date', today)
    .maybeSingle();

  if (!quizDay?.questions_generated) {
    return NextResponse.json({ error: 'Questions not generated yet for today' }, { status: 400 });
  }

  // Fetch all verified users who have opted in to quiz notifications
  const { data: users, error: usersErr } = await supabaseServer
    .from('profiles')
    .select('email, name')
    .eq('email_verified', true)
    .eq('quiz_notifications', true);

  if (usersErr) {
    console.error('[CronEmail] Failed to fetch users:', usersErr);
    return NextResponse.json({ error: usersErr.message }, { status: 500 });
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ message: 'No opted-in users found', sent: 0 });
  }

  // Send emails via existing /api/send-email endpoint
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const user of users) {
    try {
      const shortName = (user.name || user.email).split(' ')[0];
      const res = await fetch(`${APP_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          subject: `${shortName} Your daily quiz is live - play now`,
          html: getDailyQuizReminderHtml(
            user.name || user.email,
            user.email,
            today,
            quizDay.winner_slots_total,
            `${APP_URL}/quiz`
          ),
        }),
      });
      if (res.ok) {
        sent++;
      } else {
        failed++;
        errors.push(`${user.email}: ${res.status}`);
      }
    } catch (err: any) {
      failed++;
      errors.push(`${user.email}: ${err.message}`);
    }
  }

  console.log(`[CronEmail] ✅ Sent ${sent}/${users.length} quiz reminder emails for ${today}`);

  if (sent > 0) {
    try {
      await supabaseServer.rpc('increment_email_sent', {
        p_quiz_date: today,
        p_count: sent
      });
    } catch (e) {
      console.error('[CronEmail] Failed to increment email sent count', e);
    }
  }

  return NextResponse.json({
    message: 'Email cron complete',
    date: today,
    sent,
    failed,
    errors: errors.slice(0, 5),
  });
}


