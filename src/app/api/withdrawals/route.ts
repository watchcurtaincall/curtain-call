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

// GET: Fetch withdrawals — requires email param so each producer only retrieves their own
export async function GET(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const adminSecret = request.headers.get('x-admin-secret');
  const isAdmin = adminSecret && adminSecret === process.env.ADMIN_SECRET;

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
    let query = supabaseServer.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (!isAdmin && email) {
      query = query.eq('email', email.toLowerCase());
    }
    const { data: withdrawals, error } = await query;

    if (error) {
      console.error('[API Withdrawals] Fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(withdrawals || [], {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (err: any) {
    console.error('[API Withdrawals] GET exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Upsert a withdrawal
export async function POST(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  // Session verification to prevent forged withdrawals
  const verifiedUser = await verifyUserSession(request);
  const adminSecret = request.headers.get('x-admin-secret');
  const isAdmin = adminSecret && adminSecret === process.env.ADMIN_SECRET;

  if (!verifiedUser && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const req = await request.json();
    if (!req || !req.id) {
      return NextResponse.json({ error: 'Missing withdrawal request or ID' }, { status: 400 });
    }

    if (!isAdmin && verifiedUser && req.email?.toLowerCase() !== verifiedUser.email) {
      return NextResponse.json({ error: 'Forbidden: Cannot create withdrawals for other accounts' }, { status: 403 });
    }

    const { data, error } = await supabaseServer
      .from('withdrawals')
      .upsert(req)
      .select();

    if (error) {
      console.error('[API Withdrawals] Upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, withdrawal: data?.[0] });
  } catch (err: any) {
    console.error('[API Withdrawals] POST exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
