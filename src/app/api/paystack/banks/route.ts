import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://api.paystack.co/bank?currency=NGN&perPage=100', {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
      next: { revalidate: 86400 }, // cache 24h
    });

    if (!res.ok) throw new Error('Paystack bank list failed');
    const data = await res.json();

    const banks = (data.data as Array<{ name: string; code: string; slug: string }>).map(b => ({
      name: b.name,
      code: b.code,
      slug: b.slug,
    }));

    return NextResponse.json({ banks });
  } catch {
    // Return fallback list on error
    return NextResponse.json({
      banks: [],
      error: 'Could not fetch live bank list — using fallback',
    }, { status: 200 });
  }
}
