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

export async function POST(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    const verifiedUser = await verifyUserSession(request);
    if (!verifiedUser || verifiedUser.email !== 'watchcurtaincall@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const { articleId, email, title } = await request.json();

    if (!articleId || !email) {
      return NextResponse.json({ error: 'Missing articleId or email parameters' }, { status: 400 });
    }

    const emailClean = email.toLowerCase().trim();

    // 1. Resolve actual user ID for the user's email
    const userId = await resolveRealUserId(emailClean);

    // 2. Insert ₦2,000 into the quiz_cash_credits table for this user
    const { data: creditData, error: creditError } = await supabaseServer
      .from('quiz_cash_credits')
      .insert({
        user_id: userId,
        amount_naira: 2000,
        source: 'article_approval',
      })
      .select();

    if (creditError) {
      console.error('[Approve Article API] Failed to credit wallet:', creditError);
      return NextResponse.json({ error: 'Failed to credit user wallet: ' + creditError.message }, { status: 500 });
    }

    // 3. Return success details
    return NextResponse.json({
      success: true,
      message: `Successfully credited ₦2,000 to user wallet (${userId}).`,
      creditData
    });
  } catch (err: any) {
    console.error('[Approve Article API] POST Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
