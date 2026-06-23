import { NextResponse } from 'next/server';
import { verifyUserSession } from '@/lib/quiz/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const verifiedUser = await verifyUserSession(request);
    if (!verifiedUser || verifiedUser.email !== 'watchcurtaincall@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

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
    let emails = json.data || [];

    // Fetch our custom open tracking
    const { supabaseServer } = await import('@/lib/supabaseServer');
    if (supabaseServer) {
      const { data: opens } = await supabaseServer.from('email_opens').select('email, campaign_id');
      if (opens && opens.length > 0) {
        const openSet = new Set(opens.map((o: any) => o.email.toLowerCase()));
        emails = emails.map((email: any) => {
          const toEmail = Array.isArray(email.to) ? email.to[0] : email.to;
          if (toEmail && openSet.has(toEmail.toLowerCase())) {
            email.last_event = 'opened';
          }
          return email;
        });
      }
    }

    return NextResponse.json(emails);
  } catch (error: any) {
    console.error('[Admin Email Logs API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
