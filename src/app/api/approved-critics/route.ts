import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create server-side Supabase client using service role key to bypass RLS!
const supabaseServer = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;

// GET: Returns list of approved critic emails and auto-heals if missing
export async function GET() {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    // 1. Fetch whitelisted critics
    const { data: whitelist, error: wlErr } = await supabaseServer
      .from('approved_critics')
      .select('email');

    if (wlErr) {
      console.error('[API Approved Critics] Error fetching whitelist:', wlErr);
      return NextResponse.json({ error: wlErr.message }, { status: 500 });
    }

    const whitelistedEmails = new Set((whitelist || []).map(w => w.email.toLowerCase()));

    // 2. Fetch approved applications from critic_applications to auto-heal
    const { data: apps, error: appsErr } = await supabaseServer
      .from('critic_applications')
      .select('email, curation_status');

    if (!appsErr && apps) {
      const approvedApps = apps.filter(a => a.curation_status === 'Approved');
      
      // Auto-heal: If any email is approved in critic_applications but not in approved_critics, insert it!
      for (const app of approvedApps) {
        if (app.email) {
          const emailLower = app.email.toLowerCase();
          if (!whitelistedEmails.has(emailLower)) {
            console.log(`[API Approved Critics Auto-Heal] Whitelisting approved application email: ${emailLower}`);
            const { error: insErr } = await supabaseServer
              .from('approved_critics')
              .upsert({ email: emailLower });
            
            if (!insErr) {
              whitelistedEmails.add(emailLower);
            } else {
              console.error(`[API Approved Critics Auto-Heal] Failed to auto-whitelist ${emailLower}:`, insErr);
            }
          }
        }
      }
    }

    return NextResponse.json(Array.from(whitelistedEmails));
  } catch (err: any) {
    console.error('[API Approved Critics] GET exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Whitelist an approved critic email
export async function POST(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Invalid email parameter' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();
    const { error } = await supabaseServer
      .from('approved_critics')
      .upsert({ email: emailLower });

    if (error) {
      console.error('[API Approved Critics] POST upsert failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, whitelisted: emailLower });
  } catch (err: any) {
    console.error('[API Approved Critics] POST exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Revoke whitelisted critic status
export async function DELETE(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Invalid email parameter' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();
    const { error } = await supabaseServer
      .from('approved_critics')
      .delete()
      .eq('email', emailLower);

    if (error) {
      console.error('[API Approved Critics] DELETE failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, revoked: emailLower });
  } catch (err: any) {
    console.error('[API Approved Critics] DELETE exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
