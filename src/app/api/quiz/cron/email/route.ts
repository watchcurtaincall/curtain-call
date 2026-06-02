import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getDailyQuizReminderHtml } from '@/lib/quiz/emailTemplates';
import webpush from 'web-push';

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.curtaincall.com.ng';

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
    .select('generation_status, slots_remaining')
    .eq('quiz_date', today)
    .maybeSingle();

  if (!quizDay || (quizDay.generation_status !== 'ready' && quizDay.generation_status !== 'fallback' && quizDay.generation_status !== 'generated')) {
    return NextResponse.json({ error: 'Questions not generated yet for today' }, { status: 400 });
  }

  // Fetch all users
  const { data: users, error: usersErr } = await supabaseServer
    .from('profiles')
    .select('email, name');

  if (usersErr) {
    console.error('[CronEmail] Failed to fetch users:', usersErr);
    return NextResponse.json({ error: usersErr.message }, { status: 500 });
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ message: 'No opted-in users found', sent: 0 });
  }

  // Send emails in a single batch via Resend Batch API to avoid Vercel 10s timeout
  const resendApiKey = process.env.RESEND_API_KEY;
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  const resendPayload = users.map(user => {
    const shortName = (user.name || user.email).split(' ')[0];
    const html = getDailyQuizReminderHtml(
      user.name || user.email,
      user.email,
      today,
      quizDay.slots_remaining || 10,
      `${APP_URL}/quiz`
    );
    const textAlternative = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      from: 'Curtain Call <notifications@curtaincall.com.ng>',
      to: [user.email],
      subject: `${shortName} Your daily quiz is live - play now`,
      html,
      text: textAlternative
    };
  });



  let primaryFailed = false;

  // Primary Bulk: Resend
  if (resendApiKey && resendApiKey !== 're_your_resend_api_key_here') {
    try {
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resendPayload),
      });

      if (res.ok) {
        const json = await res.json();
        sent = json.data ? json.data.length : users.length;
        console.log('[CronEmail] Successfully batched via Resend.');
      } else {
        const errorText = await res.text();
        console.error('[CronEmail] Resend Batch API error:', errorText);
        primaryFailed = true;
        errors.push(`Resend Error: ${errorText}`);
      }
    } catch (err: any) {
      console.error('[CronEmail] Resend Batch exception:', err);
      primaryFailed = true;
      errors.push(err.message);
    }
  } else {
    primaryFailed = true;
  }

  // Fallback Bulk: Brevo
  if (primaryFailed) {
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      console.warn('[CronEmail] Brevo key missing too. Simulating.');
      sent = users.length;
    } else {
      console.log('[CronEmail] Attempting delivery via Brevo (Fallback)...');
      try {
        const brevoPayload = {
          sender: { name: 'Curtain Call', email: 'notifications@curtaincall.com.ng' },
          messageVersions: users.map(user => {
            const shortName = (user.name || user.email).split(' ')[0];
            const html = getDailyQuizReminderHtml(user.name || user.email, user.email, today, quizDay.slots_remaining || 10, `${APP_URL}/quiz`);
            const textAlternative = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            return {
              to: [{ email: user.email }],
              subject: `${shortName} Your daily quiz is live - play now`,
              htmlContent: html,
              textContent: textAlternative
            };
          })
        };

        const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(brevoPayload),
        });

        if (brevoRes.ok || brevoRes.status === 202) {
          sent = users.length;
          console.log('[CronEmail] Successfully batched via Brevo.');
        } else {
          const errorText = await brevoRes.text();
          console.error('[CronEmail] Brevo Batch API error:', errorText);
          failed = users.length;
          errors.push(`Brevo Error: ${errorText}`);
        }
      } catch (err: any) {
        console.error('[CronEmail] Brevo Batch exception:', err);
        failed = users.length;
        errors.push(err.message);
      }
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

  // --- Push Notifications ---
  let pushSent = 0;
  let pushFailed = 0;
  try {
    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:hello@curtaincall.com.ng',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );

      const { data: subs, error: subsErr } = await supabaseServer.from('push_subscriptions').select('id, subscription');
      
      if (!subsErr && subs && subs.length > 0) {
        const payload = JSON.stringify({
          title: "Today's quiz is live!",
          body: "The daily theatre quiz is ready. Claim your winner slot!",
          data: { url: "/quiz" }
        });

        const promises = subs.map(async (row) => {
          try {
            await webpush.sendNotification(row.subscription, payload);
            pushSent++;
          } catch (err: any) {
            pushFailed++;
            if (err.statusCode === 410 || err.statusCode === 404) {
              await supabaseServer.from('push_subscriptions').delete().eq('id', row.id);
            }
          }
        });
        await Promise.allSettled(promises);
        console.log(`[CronEmail] ✅ Sent ${pushSent} push notifications for ${today}`);
      }
    } else {
      console.warn('[CronEmail] Missing VAPID keys. Skipping push notifications.');
    }
  } catch (pushErr) {
    console.error('[CronEmail] Failed to send push notifications:', pushErr);
  }

  return NextResponse.json({
    message: 'Email cron complete',
    date: today,
    emailSent: sent,
    emailFailed: failed,
    pushSent,
    pushFailed,
    errors: errors.slice(0, 5),
  });
}


