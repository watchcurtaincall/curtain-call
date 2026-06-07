import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';



export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { base64, filename, mimeType } = body;

    if (!base64 || !filename) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });
    }

    // Convert base64 to Buffer
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload to Supabase Storage
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${filename}`;
    const { data, error } = await supabaseServer.storage
      .from('curtain-call-images')
      .upload(uniqueFilename, buffer, {
        contentType: mimeType || 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseServer.storage
      .from('curtain-call-images')
      .getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error('Image upload failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
