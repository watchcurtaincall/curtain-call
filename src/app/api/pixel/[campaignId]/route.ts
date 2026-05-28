import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// Base64 encoded 1x1 transparent PNG
const TRANSPARENT_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId: quizDate } = await params;

    if (quizDate && supabaseServer) {
      // Increment the opened count
      await supabaseServer.rpc('increment_email_opened', {
        p_quiz_date: quizDate,
      });
    }

    // Return the transparent pixel with correct headers
    return new NextResponse(TRANSPARENT_PIXEL, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    // Fail silently so the email client doesn't show a broken image icon
    console.error('[Pixel Tracking] Error:', error);
    return new NextResponse(TRANSPARENT_PIXEL, {
      status: 200,
      headers: { 'Content-Type': 'image/png' },
    });
  }
}
