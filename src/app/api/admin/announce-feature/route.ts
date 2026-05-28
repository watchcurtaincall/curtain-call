import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getFeatureAnnouncementHtml } from '@/lib/quiz/emailTemplates';

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://curtain-call.vercel.app';

export async function POST(req: NextRequest) {
  // Simple validation to ensure only authorized system requests trigger announcements
  const authHeader = req.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase server client not initialized' }, { status: 500 });
  }

  // Fetch all verified users to announce the new feature
  const { data: users, error: usersErr } = await supabaseServer
    .from('profiles')
    .select('email, name')
    .eq('email_verified', true);

  if (usersErr) {
    console.error('[AnnounceFeature] Failed to fetch users:', usersErr);
    return NextResponse.json({ error: usersErr.message }, { status: 500 });
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ message: 'No verified users found in the database.', sent: 0 });
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Loop through and send the beautiful announcement email
  for (const user of users) {
    try {
      const emailHtml = getFeatureAnnouncementHtml(user.name || user.email, APP_URL);
      
      const res = await fetch(`${APP_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          subject: 'We just launched something new — and you can earn from it',
          html: emailHtml,
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

  console.log(`[AnnounceFeature] Successfully dispatched announcement to ${sent}/${users.length} users.`);

  return NextResponse.json({
    message: 'Announcement dispatch completed.',
    sent,
    failed,
    errors: errors.slice(0, 10),
  });
}
