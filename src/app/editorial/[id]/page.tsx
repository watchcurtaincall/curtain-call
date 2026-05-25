'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, BookOpen, Clock, Share2, MessageSquare, AlertTriangle } from 'lucide-react';
import { ClientDB } from '@/lib/db';
import { Article } from '@/lib/types';

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticle = () => {
      const allArticles = ClientDB.getArticles();
      const found = allArticles.find(a => a.id === id);
      if (found) {
        setArticle(found);
      }
      setLoading(false);
    };

    loadArticle();

    if (typeof window !== 'undefined') {
      window.addEventListener('cc-db-synced', loadArticle);
      return () => window.removeEventListener('cc-db-synced', loadArticle);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="text-zinc-500 font-mono text-sm py-12 animate-pulse flex items-center gap-2">
          <Clock className="h-4 w-4 animate-spin text-red-500" />
          Opening Editorial Archives...
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">Chronicle Not Found</h1>
        <p className="text-zinc-400 text-sm max-w-md mb-8">
          The editorial essay or spotlight draft you are trying to access could not be retrieved from our archives.
        </p>
        <Link
          href="/editorial"
          className="inline-flex items-center gap-2 bg-white text-black font-semibold px-6 py-2.5 rounded-full hover:bg-zinc-200 transition-colors text-sm uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Archives
        </Link>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
      {/* Immersive Hero Header */}
      <div className="relative w-full h-[55vh] min-h-[400px] border-b border-white/5 overflow-hidden">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          priority
          className="object-cover object-center"
        />
        {/* Soft elegant atmospheric blurs and gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-zinc-950/70 to-zinc-950" />
        
        {/* Immersive ambient colored light */}
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[250px] bg-red-600/10 rounded-full blur-[100px] -z-10" />

        <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-12 max-w-4xl mx-auto z-10">
          {/* Top navigation */}
          <div>
            <button
              onClick={() => router.push('/editorial')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md hover:bg-black/60 text-zinc-400 hover:text-white rounded-full border border-white/10 transition-all text-xs font-semibold uppercase tracking-wider shadow-lg"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Chronicles
            </button>
          </div>

          {/* Headline details */}
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold text-red-500 tracking-[3px] font-mono uppercase bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full w-max">
              The Front Row Seat
            </span>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight md:leading-[1.15] drop-shadow-md">
              {article.title}
            </h1>
            
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 uppercase tracking-widest pt-2">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-red-500" /> {article.date}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-red-500" /> {article.author}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
              <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-red-500" /> 4 min read</span>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content Layout */}
      <div className="max-w-3xl mx-auto px-6 md:px-8 mt-12 grid grid-cols-1 gap-10">
        {/* Decorative Quote Panel for the Excerpt */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-6 md:p-8 italic text-zinc-300 text-sm md:text-base leading-relaxed border-l-4 border-l-red-600 shadow-xl">
          "{article.excerpt}"
        </div>

        {/* Dynamic Rich Text Chronicle Body */}
        <div className="text-zinc-300 text-base md:text-lg leading-relaxed flex flex-col gap-6 font-serif font-light whitespace-pre-line prose prose-invert max-w-none">
          {article.content || "No chronicle text content provided."}
        </div>

        {/* Footer/Share panel */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Curtain Call Ltd</span>
            <span>·</span>
            <span>All Rights Reserved</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Share2 className="h-4 w-4" /> Share Chronicle
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
