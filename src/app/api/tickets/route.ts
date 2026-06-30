import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserSession } from '@/lib/quiz/auth';

export const dynamic = 'force-dynamic';


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

// GET: Fetch tickets — requires email param so each user only retrieves their own tickets
export async function GET(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const adminSecret = request.headers.get('x-admin-secret');
  const systemSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  const isAdmin = adminSecret && systemSecret && adminSecret === systemSecret;

  if (!email && !isAdmin) {
    return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
  }

  // Session verification to prevent PII leak
  const verifiedUser = await verifyUserSession(request);
  if (!verifiedUser && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdmin && email && email.toLowerCase() !== verifiedUser?.email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    let query = supabaseServer.from('tickets').select('*').order('timestamp', { ascending: false });
    if (!isAdmin && email) {
      query = query.eq('buyer_email', email.toLowerCase());
    }
    const { data: tickets, error } = await query;

    if (error) {
      console.error('[API Tickets] Fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(tickets || [], {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (err: any) {
    console.error('[API Tickets] GET exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Upsert a ticket
export async function POST(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  // Session verification to prevent unauthorized ticket injection
  const verifiedUser = await verifyUserSession(request);
  const adminSecret = request.headers.get('x-admin-secret');
  const systemSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  const isAdmin = adminSecret && systemSecret && adminSecret === systemSecret;

  if (!verifiedUser && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ticket = await request.json();
    if (!ticket || !ticket.id) {
      return NextResponse.json({ error: 'Missing ticket object or ID' }, { status: 400 });
    }

    if (!isAdmin && verifiedUser && ticket.buyer_email?.toLowerCase() !== verifiedUser.email) {
      return NextResponse.json({ error: 'Forbidden: Cannot create tickets for other accounts' }, { status: 403 });
    }

    const { data, error } = await supabaseServer
      .from('tickets')
      .upsert(ticket)
      .select();

    if (error) {
      console.error('[API Tickets] Upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticket: data?.[0] });
  } catch (err: any) {
    console.error('[API Tickets] POST exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
