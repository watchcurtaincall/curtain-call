import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// GET: Fetch all tickets
export async function GET() {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    const { data: tickets, error } = await supabaseServer
      .from('tickets')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('[API Tickets] Fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(tickets || []);
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

  try {
    const ticket = await request.json();
    if (!ticket || !ticket.id) {
      return NextResponse.json({ error: 'Missing ticket object or ID' }, { status: 400 });
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
