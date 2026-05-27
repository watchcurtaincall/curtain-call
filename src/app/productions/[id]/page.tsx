import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { ProductionPageClient } from '@/components/productions/ProductionPageClient';

interface Props {
  params: Promise<{ id: string }>;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  let title = "Curtain Call | Stage Play Specs";
  let description = "Discover, review, and archive African theatre productions on Curtain Call.";
  let imageUrl = "https://watchcurtaincall.com/og-default.png"; // Fallback URL

  try {
    if (supabase) {
      const { data } = await supabase
        .from('productions')
        .select('title, synopsis, poster_url')
        .eq('id', id)
        .single();
      if (data) {
        title = `${data.title} | Curtain Call`;
        if (data.synopsis) description = data.synopsis.slice(0, 160) + (data.synopsis.length > 160 ? '...' : '');
        if (data.poster_url) imageUrl = data.poster_url;
      }
    } else {
      // Fallback to static mock data if supabase config isn't loaded
      const { MOCK_PRODUCTIONS } = require('@/lib/mock');
      const play = MOCK_PRODUCTIONS.find((p: any) => p.id === id);
      if (play) {
        title = `${play.title} | Curtain Call`;
        if (play.synopsis) description = play.synopsis.slice(0, 160) + (play.synopsis.length > 160 ? '...' : '');
        if (play.posterUrl) imageUrl = play.posterUrl;
      }
    }
  } catch (error) {
    console.error('[Metadata generation] Failed:', error);
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl, width: 800, height: 600, alt: title }] : [],
      type: 'video.movie',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    }
  };
}

export default function ProductionPage({ params }: Props) {
  return <ProductionPageClient params={params} />;
}
