'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ClientDB } from '@/lib/db';
import { Article } from '@/lib/types';
import Link from 'next/link';
import { Calendar, User, BookOpen, ArrowRight } from 'lucide-react';

let isFirstMount = true;

export default function EditorialPage() {
  const [initialData] = useState(() => {
    if (typeof window !== 'undefined' && !isFirstMount) {
      return ClientDB.getArticles();
    }
    return null;
  });

  const [articles, setArticles] = useState<Article[]>(initialData || []);

  useEffect(() => {
    isFirstMount = false;
    const loadData = () => {
      const allArticles = ClientDB.getArticles();
      setArticles(allArticles);
    };
    loadData();

    if (typeof window !== 'undefined') {
      window.addEventListener('cc-db-synced', loadData);
      return () => window.removeEventListener('cc-db-synced', loadData);
    }
  }, []);

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
        <div className="bg-zinc-900/60 border border-white/5 p-6 rounded-2xl md:min-w-[320px] w-full md:w-auto shrink-0 shadow-xl">
          <h3 className="text-white font-bold mb-2">Have a stage chronicle to share?</h3>
          <p className="text-sm text-zinc-400 mb-4">Submit your cultural essays, reviews, or theatremaker spotlight drafts to our editors.</p>
          <Link
            href="/submit?tab=blog"
            className="w-full block text-center bg-white text-black font-semibold py-2.5 rounded-full hover:bg-zinc-200 transition-colors text-sm uppercase tracking-wider font-mono text-xs"
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
            <Link 
              key={article.id} 
              href={`/editorial/${article.id}`}
              className="group bg-zinc-900/40 border border-white/5 rounded-3xl p-5 hover:border-white/10 transition-all shadow-xl hover:shadow-2xl card-hover flex flex-col justify-between"
            >
              <div>
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
              </div>

              <div className="flex items-center gap-1.5 text-xs text-red-500 font-bold uppercase tracking-wider mt-5 pt-4 border-t border-white/5 w-max group-hover:text-red-400 transition-colors">
                Read Chronicle <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
