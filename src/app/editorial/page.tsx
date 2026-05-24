'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ClientDB } from '@/lib/db';
import { Article } from '@/lib/types';
import Link from 'next/link';
import { X, Calendar, User, BookOpen } from 'lucide-react';

export default function EditorialPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    const loadData = () => {
      const allArticles = ClientDB.getArticles();
      setArticles(allArticles);

      // Check query parameter for automatic reading
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const articleId = params.get('read');
        if (articleId) {
          const article = allArticles.find(a => a.id === articleId);
          if (article) {
            setSelectedArticle(article);
          }
        }
      }
    };
    loadData();

    if (typeof window !== 'undefined') {
      window.addEventListener('cc-db-synced', loadData);
      return () => window.removeEventListener('cc-db-synced', loadData);
    }
  }, []);

  // Trap body scroll when modal is open
  useEffect(() => {
    if (selectedArticle) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedArticle]);

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            Editorial Chronicles
          </h1>
          <p className="text-zinc-400 text-lg">
            Interviews, cultural commentary, and behind-the-curtain looks at the stage productions shaping African theatre.
          </p>
        </div>
        <div className="bg-zinc-900 border border-white/5 p-6 rounded-2xl md:min-w-[320px] w-full md:w-auto shrink-0 shadow-xl">
          <h3 className="text-white font-bold mb-2">Have a stage chronicle to share?</h3>
          <p className="text-sm text-zinc-400 mb-4">Submit your cultural essays, reviews, or theatremaker spotlight drafts to our editors.</p>
          <Link
            href="/submit?tab=blog"
            className="w-full block text-center bg-white text-black font-semibold py-2.5 rounded-full hover:bg-zinc-200 transition-colors text-sm uppercase tracking-wider"
          >
            Submit an Article
          </Link>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="text-zinc-500 font-mono text-sm py-12 animate-pulse">
          Loading editorial archives...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map(article => (
            <article 
              key={article.id} 
              onClick={() => setSelectedArticle(article)}
              className="group cursor-pointer bg-zinc-900/40 border border-white/5 rounded-3xl p-5 hover:border-white/10 transition-all shadow-xl hover:shadow-2xl card-hover"
            >
              <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-zinc-900 border border-white/5">
                <Image 
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500 mb-2">
                <span>{article.date}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                <span>{article.author}</span>
              </div>
              <h2 className="text-xl font-serif font-bold text-white mb-2 group-hover:text-red-400 transition-colors leading-snug">
                {article.title}
              </h2>
              <p className="text-zinc-400 text-sm line-clamp-3 leading-relaxed">
                {article.excerpt}
              </p>
            </article>
          ))}
        </div>
      )}

      {/* ── GORGEOUS FULL CHRONICLE READER MODAL ── */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop blur overlay */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setSelectedArticle(null)}
          />

          {/* Reader Box */}
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[85vh] flex flex-col animate-scale-up">
            {/* Header image cover */}
            <div className="relative h-64 md:h-80 w-full shrink-0 border-b border-white/5">
              <Image 
                src={selectedArticle.imageUrl}
                alt={selectedArticle.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
              <button 
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-zinc-400 hover:text-white rounded-full border border-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10 pt-6 flex flex-col gap-6">
              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-500 uppercase tracking-widest pb-4 border-b border-white/5">
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {selectedArticle.date}</span>
                <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {selectedArticle.author}</span>
                <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> 3 min read</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-white leading-tight">
                {selectedArticle.title}
              </h1>

              {/* Excerpt panel */}
              <div className="bg-zinc-800/40 border border-white/5 rounded-2xl p-4 md:p-5 italic text-zinc-300 text-sm leading-relaxed border-l-2 border-l-red-500">
                "{selectedArticle.excerpt}"
              </div>

              {/* Rich Body Text */}
              <div className="text-zinc-300 text-sm md:text-base leading-relaxed flex flex-col gap-5 font-serif font-light whitespace-pre-line">
                {selectedArticle.content || "No chronicle text content provided."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
