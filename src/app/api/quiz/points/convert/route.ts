import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { userId, pointsAmount } = body;

    if (!userId || typeof pointsAmount !== 'number' || pointsAmount < 1) {
      return NextResponse.json({ error: 'Missing or invalid pointsAmount parameter' }, { status: 400 });
    }

    // 1. Verify user's email and current points balance
    const { data: authUser, error: authUserErr } = await supabaseServer.auth.admin.getUserById(userId);
    if (authUserErr || !authUser?.user?.email) {
      return NextResponse.json({ error: 'User email details not found' }, { status: 400 });
    }
    const email = authUser.user.email.toLowerCase();

    const { data: wallet, error: walletErr } = await supabaseServer
      .from('quiz_points_wallet')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (walletErr) {
      console.error('[API Points Convert] Fetch wallet error:', walletErr);
      return NextResponse.json({ error: walletErr.message }, { status: 500 });
    }

    if (!wallet || wallet.balance < pointsAmount) {
      return NextResponse.json({ error: 'Insufficient points balance for conversion' }, { status: 400 });
    }

    // 2. Call conversion RPC
    const { data: convertRes, error: convertErr } = await supabaseServer.rpc('convert_points_to_cash', {
      p_user_id: userId,
      p_points: pointsAmount
    });

    if (convertErr) {
      console.error('[API Points Convert] convert_points_to_cash RPC error:', convertErr);
      return NextResponse.json({ error: convertErr.message }, { status: 500 });
    }

    if (!convertRes || convertRes.success === false) {
      return NextResponse.json({ error: convertRes?.error || 'Conversion failed' }, { status: 400 });
    }

    const newPointsBalance = convertRes.new_balance;

    // 3. Compute new Producer Balance server-side to return to client
    // a. Fetch user's productions
    const { data: userProds } = await supabaseServer
      .from('productions')
      .select('id')
      .eq('submitter_email', email);
    const userPlayIds = (userProds || []).map(p => p.id);

    // b. Fetch tickets for these productions
    let grossEarnings = 0;
    if (userPlayIds.length > 0) {
      const { data: tickets } = await supabaseServer
        .from('tickets')
        .select('price')
        .in('production_id', userPlayIds);
      grossEarnings = (tickets || []).reduce((acc, t) => acc + Number(t.price), 0);
    }
    const totalEarned = grossEarnings * 0.95;

    // c. Fetch withdrawals for this user email
    const { data: userWithdrawals } = await supabaseServer
      .from('withdrawals')
      .select('amount, status')
      .eq('email', email);

    const approvedWithdrawals = (userWithdrawals || []).filter(w => w.status === 'Approved');
    const totalWithdrawn = approvedWithdrawals.reduce((acc, w) => acc + Number(w.amount), 0);

    const pendingWithdrawals = (userWithdrawals || []).filter(w => w.status === 'Pending');
    const totalPending = pendingWithdrawals.reduce((acc, w) => acc + Number(w.amount), 0);

    // d. Fetch quiz cash credits
    const { data: cashCredits } = await supabaseServer
      .from('quiz_cash_credits')
      .select('amount_naira')
      .eq('user_id', userId);
    const totalCashCredits = (cashCredits || []).reduce((acc, c) => acc + Number(c.amount_naira), 0);

    // e. Final calculation
    const newProducerBalance = Math.max(0, totalEarned + totalCashCredits - totalWithdrawn - totalPending);

    return NextResponse.json({
      success: true,
      newPointsBalance,
      newProducerBalance,
      message: `Successfully converted ${pointsAmount} points into ₦${pointsAmount.toLocaleString()} in your Producer Hub Wallet.`
    });
  } catch (err: any) {
    console.error('[API Points Convert] POST exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
