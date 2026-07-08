import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { ProductionPageClient } from '@/components/productions/ProductionPageClient';
import { mapProductionFromDb } from '@/lib/db';

interface Props {
  params: Promise<{ id: string }>;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  let title = "Curtain Call | Stage Show";
  let description = "Discover, review, and archive African theatre productions on Curtain Call.";
  let imageUrl = "https://curtaincall.com.ng/og-default.png"; // Fallback URL

  try {
    if (supabase) {
      // Query by ID first, then fallback to matching by slug
      let prodData = null;
      
        const { data } = await supabase
          .from('productions')
          .select('title, synopsis, poster_url, venue, status')
          .ilike('id', id)
          .maybeSingle();
      
      prodData = data;
      
      // If not found by ID, attempt querying by slug
      if (!prodData) {
        const { data: slugData } = await supabase
          .from('productions')
          .select('title, synopsis, poster_url, venue, status')
          .ilike('slug', id)
          .maybeSingle();
        prodData = slugData;
      }

      if (prodData) {
        title = `${prodData.title} | Curtain Call`;
        if (prodData.synopsis) description = prodData.synopsis.slice(0, 160) + (prodData.synopsis.length > 160 ? '...' : '');
        if (prodData.poster_url) {
          imageUrl = prodData.poster_url;
          if (imageUrl.startsWith('/storage/')) {
            imageUrl = `https://jzbsegkzxozytguytijb.supabase.co${imageUrl}`;
          } else if (imageUrl.startsWith('/')) {
            imageUrl = `https://curtaincall.com.ng${imageUrl}`;
          }
        }
        const encodedTitle = encodeURIComponent(prodData.title || 'Curtain Call');
        const encodedVenue = encodeURIComponent(prodData.venue || '');
        const encodedPoster = encodeURIComponent(imageUrl === "https://curtaincall.com.ng/og-default.png" ? "" : imageUrl);
        const encodedStatus = encodeURIComponent(prodData.status || 'Currently Showing');
        imageUrl = `https://curtaincall.com.ng/api/og?title=${encodedTitle}&venue=${encodedVenue}&posterUrl=${encodedPoster}&status=${encodedStatus}`;
      }
    } else {
      // Fallback to static mock data if supabase config isn't loaded
      const { MOCK_PRODUCTIONS } = require('@/lib/mock');
      const play = MOCK_PRODUCTIONS.find((p: any) => p.id.toLowerCase() === id.toLowerCase() || p.slug?.toLowerCase() === id.toLowerCase());
      if (play) {
        title = `${play.title} | Curtain Call`;
        if (play.synopsis) description = play.synopsis.slice(0, 160) + (play.synopsis.length > 160 ? '...' : '');
        if (play.posterUrl) {
          imageUrl = play.posterUrl;
          if (imageUrl.startsWith('/storage/')) {
            imageUrl = `https://jzbsegkzxozytguytijb.supabase.co${imageUrl}`;
          } else if (imageUrl.startsWith('/')) {
            imageUrl = `https://curtaincall.com.ng${imageUrl}`;
          }
        }
        const encodedTitle = encodeURIComponent(play.title || 'Curtain Call');
        const encodedVenue = encodeURIComponent(play.venue || '');
        const encodedPoster = encodeURIComponent(imageUrl === "https://curtaincall.com.ng/og-default.png" ? "" : imageUrl);
        const encodedStatus = encodeURIComponent(play.status || 'Currently Showing');
        imageUrl = `https://curtaincall.com.ng/api/og?title=${encodedTitle}&venue=${encodedVenue}&posterUrl=${encodedPoster}&status=${encodedStatus}`;
      }
    }
  } catch (error) {
    console.error('[Metadata generation] Failed:', error);
  }

  return {
    metadataBase: new URL('https://www.curtaincall.com.ng'),
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl }] : [],
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

export default async function ProductionPage({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  let prodData = null;
  
  if (supabase) {
    const { data } = await supabase.from('productions').select('*').ilike('id', id).maybeSingle();
    prodData = data;
    if (!prodData) {
      const { data: slugData } = await supabase.from('productions').select('*').ilike('slug', id).maybeSingle();
      prodData = slugData;
    }
  } else {
    const { MOCK_PRODUCTIONS } = require('@/lib/mock');
    prodData = MOCK_PRODUCTIONS.find((p: any) => p.id.toLowerCase() === id.toLowerCase() || p.slug?.toLowerCase() === id.toLowerCase());
  }

  const jsonLd = prodData ? {
    "@context": "https://schema.org",
    "@type": "TheaterEvent",
    "name": prodData.title,
    "description": prodData.synopsis,
    "image": prodData.poster_url || prodData.posterUrl,
    "startDate": prodData.show_start_date || "2026-06-01T19:00",
    "endDate": prodData.show_end_date || "2026-06-30T22:00",
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": prodData.venue || "Theater",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Lagos",
        "addressCountry": "NG"
      }
    }
  } : null;

  const mappedProd = prodData ? mapProductionFromDb(prodData) : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductionPageClient params={params} initialProduction={mappedProd} />
    </>
  );
}
