import { NextResponse } from 'next/server';
import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Signature missing' }, { status: 401 });
    }

    // Verify signature using Paystack secret key to prove authenticity
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(bodyText)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature validation' }, { status: 400 });
    }

    const event = JSON.parse(bodyText);
    console.log('✓ Secure Paystack Webhook Event Received:', event.event);

    // Process charge success events
    if (event.event === 'charge.success') {
      const data = event.data;
      const email = data.customer.email;
      const amount = data.amount / 100; // Convert to NGN
      const reference = data.reference;
      const metadata = data.metadata || {};

      console.log(`💰 Payment of ₦${amount} succeeded for customer ${email}. Ref: ${reference}`, metadata);
      
      // In production database schemas:
      // Update transaction tables, issue ticketing vouchers, and credit producer balances.
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('✗ Paystack Webhook processing failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
