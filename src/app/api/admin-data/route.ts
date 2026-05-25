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

// GET: Returns all newsletter subscribers, user profiles, and all pending queues (bypassing client-side RLS)
export async function GET() {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    // 1. Fetch newsletter subscribers
    const { data: subscribers, error: subErr } = await supabaseServer
      .from('newsletter_subscribers')
      .select('email, created_at');

    if (subErr) {
      console.error('[API Admin Data] Error fetching subscribers:', subErr);
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }

    const subscriberEmails = (subscribers || []).map(s => ({
      email: s.email.toLowerCase(),
      createdAt: s.created_at
    }));

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
      verificationCode: p.verification_code || undefined,
      createdAt: p.created_at
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
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
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
      // 1. De-register user account from Supabase Auth to enable fresh re-testing of signups
      const { data: usersData, error: listError } = await supabaseServer.auth.admin.listUsers();
      if (!listError && usersData?.users) {
        const authUser = usersData.users.find(u => u.email?.toLowerCase() === emailLower);
        if (authUser) {
          console.log('[API Admin Data] Purging user from Supabase Auth:', authUser.id);
          const { error: authDelError } = await supabaseServer.auth.admin.deleteUser(authUser.id);
          if (authDelError) {
            console.error('[API Admin Data] Supabase Auth delete failed:', authDelError);
          }
        }
      }

      // 2. Delete database profile from profiles table
      const { error } = await supabaseServer
        .from('profiles')
        .delete()
        .eq('email', emailLower);

      if (error) {
        console.error('[API Admin Data] Delete profile failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `Profile and Auth account for ${emailLower} successfully deleted.` });
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[API Admin Data] DELETE exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Securely upserts a newsletter subscriber or user profile bypassing RLS policies
export async function POST(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing type or data' }, { status: 400 });
    }

    if (type === 'subscriber') {
      const { email } = data;
      if (!email) {
        return NextResponse.json({ error: 'Missing email' }, { status: 400 });
      }
      
      const emailClean = email.toLowerCase().trim();
      
      // Check if email already exists in subscribers
      const { data: existing, error: findError } = await supabaseServer
        .from('newsletter_subscribers')
        .select('email')
        .eq('email', emailClean)
        .maybeSingle();
        
      if (findError) {
        console.error('[API Admin Data] Error checking existing subscriber:', findError);
      }
      
      if (existing) {
        return NextResponse.json({ success: true, alreadySubscribed: true, message: 'Already subscribed' });
      }
      
      const { error } = await supabaseServer
        .from('newsletter_subscribers')
        .upsert({ email: emailClean });

      if (error) {
        console.error('[API Admin Data] Upsert subscriber failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Subscribed successfully via Admin-Service Bypass' });
    } else if (type === 'signup') {
      const { email, name, handle, location, joinDate, isVerified, verificationCode } = data;
      if (!email || !name) {
        return NextResponse.json({ error: 'Missing email or name' }, { status: 400 });
      }

      const { error } = await supabaseServer
        .from('profiles')
        .upsert({
          email: email.toLowerCase(),
          name,
          handle: handle || null,
          location: location || null,
          join_date: joinDate || 'May 2026',
          is_verified: isVerified ?? true,
          verification_code: verificationCode || null
        });

      if (error) {
        console.error('[API Admin Data] Upsert profile failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Profile saved successfully via Admin-Service Bypass' });
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[API Admin Data] POST exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
