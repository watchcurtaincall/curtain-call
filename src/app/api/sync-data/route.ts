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

export async function GET(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.toLowerCase() || '';
  const isAdmin = email === 'watchcurtaincall@gmail.com';

  try {
    // Query all tables in parallel for maximum speed
    const [
      prodsRes,
      artistsRes,
      articlesRes,
      reviewsRes,
      criticAppsRes,
      approvedCriticsRes,
      withdrawalsRes,
      ticketsRes,
      notificationsRes,
      subscribersRes,
      profilesRes
    ] = await Promise.all([
      // 1. productions
      supabaseServer.from('productions').select('*'),
      // 2. artists
      supabaseServer.from('artists').select('*'),
      // 3. articles
      supabaseServer.from('articles').select('*'),
      // 4. reviews
      supabaseServer.from('reviews').select('*'),
      // 5. critic_applications
      supabaseServer.from('critic_applications').select('*'),
      // 6. approved_critics
      supabaseServer.from('approved_critics').select('email'),
      // 7. withdrawals
      supabaseServer.from('withdrawals').select('*').order('created_at', { ascending: false }),
      // 8. tickets
      supabaseServer.from('tickets').select('*').order('timestamp', { ascending: false }),
      // 9. notifications
      email ? supabaseServer.from('notifications').select('*').eq('email', email).order('timestamp', { ascending: false }) : Promise.resolve({ data: [] }),
      // 10. subscribers (only for admin)
      isAdmin ? supabaseServer.from('newsletter_subscribers').select('email') : Promise.resolve({ data: [] }),
      // 11. profiles (only for admin)
      isAdmin ? supabaseServer.from('profiles').select('*') : Promise.resolve({ data: [] })
    ]);

    // Handle and report errors on the server side
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
      subscribers: isAdmin ? (subscribersRes.data || []).map((s: any) => s.email.toLowerCase()) : [],
      profiles: isAdmin ? (profilesRes.data || []).map((p: any) => ({
        name: p.name,
        email: p.email,
        handle: p.handle,
        location: p.location,
        joinDate: p.join_date || 'May 2026',
        isVerified: p.is_verified ?? true,
        verificationCode: p.verification_code || undefined
      })) : []
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (err: any) {
    console.error('[API Sync Data] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
