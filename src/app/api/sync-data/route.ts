import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveRealUserId, verifyUserSession } from '@/lib/quiz/auth';

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

export async function GET(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'public' | 'private'
  const email = searchParams.get('email')?.toLowerCase() || '';
  let isAdmin = email === 'watchcurtaincall@gmail.com';

  if (type === 'private' || (!type && email)) {
    const verifiedUser = await verifyUserSession(request);
    if (!verifiedUser) {
      return NextResponse.json({ error: 'Unauthorized: Session missing or invalid' }, { status: 401 });
    }
    const verifiedEmail = verifiedUser.email;
    const verifiedIsAdmin = verifiedEmail === 'watchcurtaincall@gmail.com';

    if (email !== verifiedEmail && !verifiedIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Access denied' }, { status: 403 });
    }
    isAdmin = verifiedIsAdmin;
  }

  try {
    if (type === 'public') {
      // Fetch only approved public data that can be cached on CDN globally
      const [
        prodsRes, artistsRes, articlesRes, reviewsRes, approvedCriticsRes
      ] = await Promise.all([
        supabaseServer.from('productions').select('*').eq('curation_status', 'Approved').order('created_at', { ascending: false }),
        supabaseServer.from('artists').select('*').eq('curation_status', 'Approved').order('created_at', { ascending: false }),
        supabaseServer.from('articles').select('*').eq('curation_status', 'Approved').order('created_at', { ascending: false }),
        supabaseServer.from('reviews').select('*'),
        supabaseServer.from('approved_critics').select('email')
      ]);

      if (prodsRes.error) console.error('[Sync API] error public prods:', prodsRes.error);
      if (artistsRes.error) console.error('[Sync API] error public artists:', artistsRes.error);
      if (articlesRes.error) console.error('[Sync API] error public articles:', articlesRes.error);

      return NextResponse.json({
        productions: prodsRes.data || [],
        artists: artistsRes.data || [],
        articles: articlesRes.data || [],
        reviews: reviewsRes.data || [],
        approvedCritics: (approvedCriticsRes.data || []).map((w: any) => w.email.toLowerCase())
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1200' // Cache on CDN for 5-20 minutes
        }
      });
    }

    if (type === 'private') {
      if (!email) {
        return NextResponse.json({ error: 'Email parameter required for private sync' }, { status: 400 });
      }

      // 1. Fetch user's production IDs to fetch tickets for their productions
      const { data: userProds } = await supabaseServer
        .from('productions')
        .select('id')
        .eq('submitter_email', email);
      const userPlayIds = (userProds || []).map(p => p.id);

      // 2. Fetch pending items that this user has submitted (or all pending if admin)
      const pendingProdsPromise = isAdmin
        ? supabaseServer.from('productions').select('*').eq('curation_status', 'Pending').order('created_at', { ascending: false })
        : supabaseServer.from('productions').select('*').eq('curation_status', 'Pending').eq('submitter_email', email).order('created_at', { ascending: false });

      const pendingArtistsPromise = isAdmin
        ? supabaseServer.from('artists').select('*').eq('curation_status', 'Pending').order('created_at', { ascending: false })
        : supabaseServer.from('artists').select('*').eq('curation_status', 'Pending').eq('submitter_email', email).order('created_at', { ascending: false });

      const pendingArticlesPromise = isAdmin
        ? supabaseServer.from('articles').select('*').eq('curation_status', 'Pending').order('created_at', { ascending: false })
        : supabaseServer.from('articles').select('*').eq('curation_status', 'Pending').eq('submitter_email', email).order('created_at', { ascending: false });

      // 3. Resolve user ID for secure quiz cash credits filtering
      let userId = null;
      try {
        userId = await resolveRealUserId(email);
      } catch (e) {
        console.error('[Sync API] Error resolving userId:', e);
      }

      const quizCashCreditsPromise = userId 
        ? supabaseServer.from('quiz_cash_credits').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] });

      // 4. Query private items in parallel
      const [
        criticAppsRes, withdrawalsRes, ticketsRes, notificationsRes,
        subscribersRes, profilesRes, userProfileRes, quizCashCreditsRes,
        pendingProdsRes, pendingArtistsRes, pendingArticlesRes
      ] = await Promise.all([
        isAdmin ? supabaseServer.from('critic_applications').select('*') : supabaseServer.from('critic_applications').select('*').eq('email', email),
        isAdmin ? supabaseServer.from('withdrawals').select('*').order('created_at', { ascending: false }) : supabaseServer.from('withdrawals').select('*').eq('email', email).order('created_at', { ascending: false }),
        
        // Optimize ticket fetch: fetch tickets bought by user, or tickets for their productions
        isAdmin 
          ? supabaseServer.from('tickets').select('*').order('timestamp', { ascending: false })
          : (userPlayIds.length > 0 
              ? supabaseServer.from('tickets').select('*').or(`buyer_email.eq.${email},production_id.in.(${userPlayIds.join(',')})`).order('timestamp', { ascending: false })
              : supabaseServer.from('tickets').select('*').eq('buyer_email', email).order('timestamp', { ascending: false })
            ),

        supabaseServer.from('notifications').select('*').eq('email', email).order('timestamp', { ascending: false }),
        isAdmin ? supabaseServer.from('newsletter_subscribers').select('email, created_at') : Promise.resolve({ data: [] }),
        isAdmin ? supabaseServer.from('profiles').select('*') : Promise.resolve({ data: [] }),
        supabaseServer.from('profiles').select('is_verified').eq('email', email).maybeSingle(),
        quizCashCreditsPromise,
        pendingProdsPromise,
        pendingArtistsPromise,
        pendingArticlesPromise
      ]);

      return NextResponse.json({
        criticApplications: criticAppsRes.data || [],
        withdrawals: withdrawalsRes.data || [],
        tickets: ticketsRes.data || [],
        notifications: notificationsRes.data || [],
        subscribers: isAdmin ? (subscribersRes.data || []).map((s: any) => ({
          email: s.email.toLowerCase(),
          createdAt: s.created_at
        })) : [],
        profiles: isAdmin ? (profilesRes.data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          handle: p.handle,
          location: p.location,
          joinDate: p.join_date || 'May 2026',
          isVerified: p.is_verified ?? true,
          verificationCode: p.verification_code || undefined,
          createdAt: p.created_at
        })) : [],
        userProfile: userProfileRes?.data || null,
        quizCashCredits: quizCashCreditsRes?.data || [],
        productions: pendingProdsRes.data || [],
        artists: pendingArtistsRes.data || [],
        articles: pendingArticlesRes.data || []
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate' // Never cache private data
        }
      });
    }

    // BACKWARD COMPATIBILITY: If type is not specified, query everything in parallel as before
    const [
      prodsRes, artistsRes, articlesRes, reviewsRes,
      criticAppsRes, approvedCriticsRes, withdrawalsRes,
      ticketsRes, notificationsRes, subscribersRes, profilesRes,
      userProfileRes, quizCashCreditsRes
    ] = await Promise.all([
      supabaseServer.from('productions').select('*').order('created_at', { ascending: false }),
      supabaseServer.from('artists').select('*').order('created_at', { ascending: false }),
      supabaseServer.from('articles').select('*').order('created_at', { ascending: false }),
      supabaseServer.from('reviews').select('*'),
      supabaseServer.from('critic_applications').select('*'),
      supabaseServer.from('approved_critics').select('email'),
      supabaseServer.from('withdrawals').select('*').order('created_at', { ascending: false }),
      supabaseServer.from('tickets').select('*').order('timestamp', { ascending: false }),
      email ? supabaseServer.from('notifications').select('*').eq('email', email).order('timestamp', { ascending: false }) : Promise.resolve({ data: [] }),
      isAdmin ? supabaseServer.from('newsletter_subscribers').select('email, created_at') : Promise.resolve({ data: [] }),
      isAdmin ? supabaseServer.from('profiles').select('*') : Promise.resolve({ data: [] }),
      email ? supabaseServer.from('profiles').select('is_verified').eq('email', email).maybeSingle() : Promise.resolve({ data: null }),
      email ? supabaseServer.from('quiz_cash_credits').select('*').order('created_at', { ascending: false }) : Promise.resolve({ data: [] })
    ]);

    if (prodsRes.error) console.error('[Sync API] error prods:', prodsRes.error);
    if (artistsRes.error) console.error('[Sync API] error artists:', artistsRes.error);
    if (articlesRes.error) console.error('[Sync API] error articles:', articlesRes.error);
    if (reviewsRes.error) console.error('[Sync API] error reviews:', reviewsRes.error);

    return NextResponse.json({
      productions: prodsRes.data || [],
      artists: artistsRes.data || [],
      articles: articlesRes.data || [],
      reviews: reviewsRes.data || [],
      criticApplications: criticAppsRes.data || [],
      approvedCritics: (approvedCriticsRes.data || []).map((w: any) => w.email.toLowerCase()),
      withdrawals: withdrawalsRes.data || [],
      tickets: ticketsRes.data || [],
      notifications: notificationsRes.data || [],
      subscribers: isAdmin ? (subscribersRes.data || []).map((s: any) => ({
        email: s.email.toLowerCase(),
        createdAt: s.created_at
      })) : [],
      profiles: isAdmin ? (profilesRes.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        handle: p.handle,
        location: p.location,
        joinDate: p.join_date || 'May 2026',
        isVerified: p.is_verified ?? true,
        verificationCode: p.verification_code || undefined,
        createdAt: p.created_at
      })) : [],
      userProfile: userProfileRes?.data || null,
      quizCashCredits: quizCashCreditsRes?.data || []
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });

  } catch (err: any) {
    console.error('[API Sync Data] GET Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Securely upsert any database item using Supabase Service Role client, bypassing client RLS
export async function POST(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    const verifiedUser = await verifyUserSession(request);
    if (!verifiedUser) {
      return NextResponse.json({ error: 'Unauthorized: Session missing or invalid' }, { status: 401 });
    }

    const body = await request.json();
    const { table, dbItem } = body;

    if (!table || !dbItem) {
      return NextResponse.json({ error: 'Missing table or dbItem parameter' }, { status: 400 });
    }

    const verifiedEmail = verifiedUser.email;
    const verifiedIsAdmin = verifiedEmail === 'watchcurtaincall@gmail.com';

    if (!verifiedIsAdmin) {
      const allowedTables = ['productions', 'artists', 'articles', 'critic_applications', 'withdrawals', 'tickets', 'reviews'];
      if (!allowedTables.includes(table)) {
        return NextResponse.json({ error: 'Unauthorized: Access to this table is restricted to admin' }, { status: 403 });
      }

      // Check ownership on the incoming item
      if (['productions', 'artists', 'articles'].includes(table)) {
        if (dbItem.submitter_email?.toLowerCase() !== verifiedEmail) {
          return NextResponse.json({ error: 'Unauthorized: submitter_email must match your logged in email' }, { status: 403 });
        }
        // Verify existing record ownership if updating
        if (dbItem.id) {
          const { data: existing } = await supabaseServer
            .from(table)
            .select('submitter_email')
            .eq('id', dbItem.id)
            .maybeSingle();
          if (existing && existing.submitter_email?.toLowerCase() !== verifiedEmail) {
            return NextResponse.json({ error: 'Unauthorized: You do not own the record you are trying to update' }, { status: 403 });
          }
        }
      } else if (['critic_applications', 'withdrawals'].includes(table)) {
        if (dbItem.email?.toLowerCase() !== verifiedEmail) {
          return NextResponse.json({ error: 'Unauthorized: email must match your logged in email' }, { status: 403 });
        }
        if (dbItem.id) {
          const { data: existing } = await supabaseServer
            .from(table)
            .select('email')
            .eq('id', dbItem.id)
            .maybeSingle();
          if (existing && existing.email?.toLowerCase() !== verifiedEmail) {
            return NextResponse.json({ error: 'Unauthorized: You do not own the record you are trying to update' }, { status: 403 });
          }
        }
      } else if (table === 'tickets') {
        if (dbItem.buyer_email?.toLowerCase() !== verifiedEmail) {
          return NextResponse.json({ error: 'Unauthorized: buyer_email must match your logged in email' }, { status: 403 });
        }
        if (dbItem.id) {
          const { data: existing } = await supabaseServer
            .from(table)
            .select('buyer_email')
            .eq('id', dbItem.id)
            .maybeSingle();
          if (existing && existing.buyer_email?.toLowerCase() !== verifiedEmail) {
            return NextResponse.json({ error: 'Unauthorized: You do not own the record you are trying to update' }, { status: 403 });
          }
        }
      } else if (table === 'reviews') {
        // Reviews don't have an email column but we want to prevent overwriting existing reviews
        if (dbItem.id) {
          const { data: existing } = await supabaseServer
            .from('reviews')
            .select('id')
            .eq('id', dbItem.id)
            .maybeSingle();
          if (existing) {
            return NextResponse.json({ error: 'Unauthorized: Reviews cannot be modified after creation' }, { status: 403 });
          }
        }
      }
    }

    let currentDbItem = { ...dbItem };
    let attempts = 0;
    let success = false;
    let finalData = null;
    let lastError = null;

    while (attempts < 10) {
      const { data, error } = await supabaseServer
        .from(table)
        .upsert(currentDbItem)
        .select();

      if (!error) {
        success = true;
        finalData = data?.[0];
        break;
      }

      lastError = error;
      console.warn(`[API Sync Data] Upsert attempt ${attempts + 1} failed on table ${table}:`, error.message);

      // Self-Healing Schema Cache Fallback: If column doesn't exist, strip and retry
      if (error.code === 'PGRST204' && error.message && error.message.includes('schema cache')) {
        const match = error.message.match(/Could not find the '([^']+)' column/);
        if (match && match[1]) {
          const colName = match[1];
          console.warn(`[API Sync Data Fallback] Stripping missing column '${colName}' and retrying upsert...`);
          delete currentDbItem[colName];
          attempts++;
          continue;
        }
      }

      // If it's a different error or we couldn't parse the column name, stop retrying
      break;
    }

    if (!success && lastError) {
      console.error(`[API Sync Data] Final upsert failure on table ${table}:`, lastError);
      return NextResponse.json({ error: lastError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: finalData });
  } catch (err: any) {
    console.error('[API Sync Data] POST Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Securely delete a record using Supabase Service Role client, bypassing client RLS
export async function DELETE(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    const verifiedUser = await verifyUserSession(request);
    if (!verifiedUser) {
      return NextResponse.json({ error: 'Unauthorized: Session missing or invalid' }, { status: 401 });
    }

    const body = await request.json();
    const { table, id } = body;

    if (!table || !id) {
      return NextResponse.json({ error: 'Missing table or id parameter' }, { status: 400 });
    }

    const verifiedEmail = verifiedUser.email;
    const verifiedIsAdmin = verifiedEmail === 'watchcurtaincall@gmail.com';

    if (!verifiedIsAdmin) {
      const allowedTables = ['productions', 'artists', 'articles'];
      if (!allowedTables.includes(table)) {
        return NextResponse.json({ error: 'Unauthorized: Access to this table is restricted to admin' }, { status: 403 });
      }

      // Query database for ownership check
      const { data: existing, error: fetchErr } = await supabaseServer
        .from(table)
        .select('submitter_email')
        .eq('id', id)
        .maybeSingle();

      if (fetchErr) {
        return NextResponse.json({ error: 'Error checking record ownership' }, { status: 500 });
      }
      if (!existing) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }
      if (existing.submitter_email?.toLowerCase() !== verifiedEmail) {
        return NextResponse.json({ error: 'Unauthorized: You do not own this record' }, { status: 403 });
      }
    }

    const { error } = await supabaseServer
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[API Sync Data] Delete error on table ${table}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API Sync Data] DELETE Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
