import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { account_number, bank_code } = await req.json();

    if (!account_number || !bank_code) {
      return NextResponse.json({ error: 'account_number and bank_code are required' }, { status: 400 });
    }

    if (account_number.length !== 10) {
      return NextResponse.json({ error: 'Account number must be 10 digits' }, { status: 400 });
    }

    const res = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.message || 'Account could not be resolved' }, { status: 422 });
    }

    const data = await res.json();

    return NextResponse.json({
      account_name: data.data.account_name,
      account_number: data.data.account_number,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
