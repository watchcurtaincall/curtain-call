import { Metadata } from 'next';
import { ArticleDetailPageClient } from '@/components/editorial/ArticlePageClient';
import { createClient } from '@supabase/supabase-js';

interface Props {
  params: Promise<{ id: string }>;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  let title = "Curtain Call | Editorial";
  let description = "Read essays and reviews about the African theatre industry.";
  let imageUrl = "https://curtaincall.com.ng/og-default.png";

  try {
    let article = null;
    
    // In a real app we'd fetch from supabase:
    // const { data } = await supabase.from('articles').select('*').eq('id', id).single();
    // article = data;

    // For now we fallback to mock
    if (!article) {
      const { MOCK_ARTICLES } = require('@/lib/db');
      article = MOCK_ARTICLES?.find((a: any) => a.id === id);
    }

    if (article) {
      title = `${article.title} | Curtain Call Editorial`;
      description = article.excerpt || description;
      if (article.imageUrl) {
        imageUrl = article.imageUrl.startsWith('/') ? `https://curtaincall.com.ng${article.imageUrl}` : article.imageUrl;
      }
    }
  } catch (error) {}

  return {
    metadataBase: new URL('https://www.curtaincall.com.ng'),
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl }] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    }
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  let article = null;
  
  try {
    // const { data } = await supabase.from('articles').select('*').eq('id', id).single();
    // article = data;
    if (!article) {
      const { MOCK_ARTICLES } = require('@/lib/db');
      article = MOCK_ARTICLES?.find((a: any) => a.id === id) || null;
    }
  } catch (e) {}

  const jsonLd = article ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "image": article.imageUrl?.startsWith('/') ? `https://curtaincall.com.ng${article.imageUrl}` : article.imageUrl,
    "datePublished": article.date || "2026-05-01T08:00:00+08:00",
    "author": [{
        "@type": "Person",
        "name": article.author,
      }]
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ArticleDetailPageClient id={id} initialArticle={article} />
    </>
  );
}
