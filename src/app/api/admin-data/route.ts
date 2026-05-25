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

// GET: Returns all newsletter subscribers, user profiles, and all pending queues (bypassing client-side RLS)
export async function GET() {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    // 1. Fetch newsletter subscribers
    const { data: subscribers, error: subErr } = await supabaseServer
      .from('newsletter_subscribers')
      .select('email');

    if (subErr) {
      console.error('[API Admin Data] Error fetching subscribers:', subErr);
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }

    const subscriberEmails = (subscribers || []).map(s => s.email.toLowerCase());

    // 2. Fetch profiles
    const { data: profiles, error: profErr } = await supabaseServer
      .from('profiles')
      .select('*');

    if (profErr) {
      console.error('[API Admin Data] Error fetching profiles:', profErr);
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    const mappedProfiles = (profiles || []).map(p => ({
      name: p.name,
      email: p.email,
      handle: p.handle,
      location: p.location,
      joinDate: p.join_date || 'May 2026',
      isVerified: p.is_verified ?? true,
      verificationCode: p.verification_code || undefined
    }));

    // 3. Fetch Pending Plays / Productions
    const { data: pendingPlays, error: playErr } = await supabaseServer
      .from('productions')
      .select('*')
      .eq('curation_status', 'Pending');

    if (playErr) {
      console.error('[API Admin Data] Error fetching pending plays:', playErr);
    }

    // 4. Fetch Pending Artists
    const { data: pendingArtists, error: artistErr } = await supabaseServer
      .from('artists')
      .select('*')
      .eq('curation_status', 'Pending');

    if (artistErr) {
      console.error('[API Admin Data] Error fetching pending artists:', artistErr);
    }

    // 5. Fetch Pending Articles
    const { data: pendingArticles, error: articleErr } = await supabaseServer
      .from('articles')
      .select('*')
      .eq('curation_status', 'Pending');

    if (articleErr) {
      console.error('[API Admin Data] Error fetching pending articles:', articleErr);
    }

    // 6. Fetch Pending Critics / Applications
    const { data: pendingCritics, error: criticErr } = await supabaseServer
      .from('critic_applications')
      .select('*')
      .eq('curation_status', 'Pending');

    if (criticErr) {
      console.error('[API Admin Data] Error fetching pending critics:', criticErr);
    }

    return NextResponse.json({
      subscribers: subscriberEmails,
      signups: mappedProfiles,
      pendingPlays: pendingPlays || [],
      pendingArtists: pendingArtists || [],
      pendingArticles: pendingArticles || [],
      pendingCritics: pendingCritics || []
    });
  } catch (err: any) {
    console.error('[API Admin Data] GET exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Deletes a subscriber or profile
export async function DELETE(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'subscriber' | 'signup'
    const email = searchParams.get('email');

    if (!type || !email) {
      return NextResponse.json({ error: 'Missing type or email parameter' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();

    if (type === 'subscriber') {
      const { error } = await supabaseServer
        .from('newsletter_subscribers')
        .delete()
        .eq('email', emailLower);

      if (error) {
        console.error('[API Admin Data] Delete subscriber failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `Subscriber ${emailLower} removed.` });
    } else if (type === 'signup') {
      const { error } = await supabaseServer
        .from('profiles')
        .delete()
        .eq('email', emailLower);

      if (error) {
        console.error('[API Admin Data] Delete profile failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `Profile for ${emailLower} deleted.` });
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[API Admin Data] DELETE exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
