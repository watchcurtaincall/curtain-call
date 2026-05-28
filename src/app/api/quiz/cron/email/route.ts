import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://curtain-call.vercel.app';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];
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
      const res = await fetch(`${APP_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          subject: `🎭 Today's Theatre Quiz is Live! ${quizDay.winner_slots_total} winner slots available`,
          html: buildEmailHtml(user.name || user.email, today, quizDay.winner_slots_total),
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

  return NextResponse.json({
    message: 'Email cron complete',
    date: today,
    sent,
    failed,
    errors: errors.slice(0, 5),
  });
}

function buildEmailHtml(name: string, date: string, slots: number): string {
  const displayDate = new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Today's Theatre Quiz is Live!</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#18181b;border-radius:24px;overflow:hidden;border:1px solid #27272a;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7f1d1d,#450a0a);padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#fca5a5;font-weight:700;letter-spacing:4px;text-transform:uppercase;">Curtain Call</p>
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">🎭 Daily Theatre Quiz</h1>
              <p style="margin:12px 0 0;font-size:14px;color:#fca5a5;">${displayDate}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#d4d4d8;line-height:1.6;">
                Hi <strong style="color:#ffffff;">${name.split(' ')[0]}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#a1a1aa;line-height:1.7;">
                Today's 5-question theatre quiz is now live. Answer all 5 correctly to compete for one of the <strong style="color:#fbbf24;">${slots} winner slots</strong> and earn bonus points convertible to real cash in your producer wallet.
              </p>

              <!-- Stats row -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#27272a;border-radius:16px;padding:20px;text-align:center;width:33%;">
                    <p style="margin:0;font-size:22px;font-weight:800;color:#fbbf24;">5</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#71717a;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Questions</p>
                  </td>
                  <td style="width:12px;"></td>
                  <td style="background:#27272a;border-radius:16px;padding:20px;text-align:center;width:33%;">
                    <p style="margin:0;font-size:22px;font-weight:800;color:#f97316;">${slots}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#71717a;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Slots Left</p>
                  </td>
                  <td style="width:12px;"></td>
                  <td style="background:#27272a;border-radius:16px;padding:20px;text-align:center;width:33%;">
                    <p style="margin:0;font-size:22px;font-weight:800;color:#4ade80;">5s</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#71717a;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Per Question</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/quiz"
                       style="display:inline-block;background:#ffffff;color:#000000;font-weight:800;font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:16px 40px;border-radius:16px;text-decoration:none;">
                      Take Today's Quiz →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:12px;color:#52525b;text-align:center;line-height:1.6;">
                ⚡ Slots fill up fast — be first to answer all 5 correctly!<br/>
                Don't switch tabs during the quiz or your session will be voided.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#09090b;padding:24px 40px;text-align:center;border-top:1px solid #27272a;">
              <p style="margin:0;font-size:11px;color:#3f3f46;">
                © ${new Date().getFullYear()} Curtain Call · Nigeria's Theatre Platform<br/>
                <a href="${APP_URL}/profile" style="color:#52525b;text-decoration:underline;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
