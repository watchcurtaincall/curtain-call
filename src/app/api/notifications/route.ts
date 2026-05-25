import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseServer = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;

// GET: Returns notifications for a specific user email
export async function GET(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
    }

    const { data: notifications, error } = await supabaseServer
      .from('notifications')
      .select('*')
      .eq('email', email.toLowerCase())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('[API Notifications] Fetch notifications failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(notifications || []);
  } catch (err: any) {
    console.error('[API Notifications] GET exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Creates a new notification
export async function POST(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    const notif = await request.json();
    if (!notif.email || !notif.title || !notif.body) {
      return NextResponse.json({ error: 'Missing required notification fields' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('notifications')
      .upsert({
        id: notif.id,
        email: notif.email.toLowerCase(),
        type: notif.type,
        title: notif.title,
        body: notif.body,
        read: notif.read ?? false,
        time: notif.time || 'Just now',
        timestamp: notif.timestamp || Date.now()
      });

    if (error) {
      console.error('[API Notifications] Create notification failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Notification recorded.' });
  } catch (err: any) {
    console.error('[API Notifications] POST exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Marks a notification as read
export async function PUT(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const allForEmail = searchParams.get('allForEmail');

    if (!id && !allForEmail) {
      return NextResponse.json({ error: 'Missing id or allForEmail parameter' }, { status: 400 });
    }

    if (allForEmail) {
      // Mark all as read for user email
      const { error } = await supabaseServer
        .from('notifications')
        .update({ read: true })
        .eq('email', allForEmail.toLowerCase());

      if (error) {
        console.error('[API Notifications] Mark all notifications read failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `All notifications for ${allForEmail} marked read.` });
    } else if (id) {
      // Mark specific notification as read
      const { error } = await supabaseServer
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) {
        console.error('[API Notifications] Mark notification read failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `Notification ${id} marked read.` });
    }
  } catch (err: any) {
    console.error('[API Notifications] PUT exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
