import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

export async function POST(req: Request) {
  try {
    const { title, body, url, adminSecret } = await req.json();

    // Very basic security for the admin endpoint
    if (adminSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    // Initialize Web Push
    webpush.setVapidDetails(
      'mailto:hello@curtaincall.com.ng',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    // Fetch all subscriptions from Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: subs, error } = await supabase.from('push_subscriptions').select('id, subscription');

    if (error || !subs) {
      console.error('Failed to fetch subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    const payload = JSON.stringify({
      title,
      body,
      data: { url: url || '/' }
    });

    // Send notifications in parallel
    const promises = subs.map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, payload);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired or invalid, remove from DB
          await supabase.from('push_subscriptions').delete().eq('id', row.id);
        } else {
          console.error('Failed to send notification to', row.id, err);
        }
      }
    });

    await Promise.allSettled(promises);

    return NextResponse.json({ success: true, count: subs.length });
  } catch (error) {
    console.error('Admin push error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
