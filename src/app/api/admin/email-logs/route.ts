import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      headers: {
        'Authorization': `Bearer ${resendApiKey}`
      }
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Resend API Error: ${res.status} ${errorText}`);
    }

    const json = await res.json();
    return NextResponse.json(json.data || []);
  } catch (error: any) {
    console.error('[Admin Email Logs API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
