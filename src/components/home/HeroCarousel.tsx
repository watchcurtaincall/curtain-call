'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Ticket, ChevronLeft, ChevronRight, Star, Calendar, ArrowRight } from 'lucide-react';
import { Production } from '@/lib/types';
import { stripHtml } from '@/lib/db';

export function HeroCarousel({ productions }: { productions: Production[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % productions.length);
    }, 8000); // 8 seconds per slide for a slower, more majestic experience
    return () => clearInterval(timer);
  }, [productions.length]);

  const go = (next: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((next + productions.length) % productions.length);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const featured = productions[currentIndex];
  if (!featured) return null;

  return (
    <section className="relative w-full h-[85vh] min-h-[620px] flex items-center md:items-end group overflow-hidden border-b border-white/5 bg-zinc-950">

      {/* Background layers with Ken Burns effect */}
      {productions.map((prod, index) => (
        <div
          key={prod.id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            index === currentIndex 
              ? 'opacity-100 scale-100 pointer-events-auto' 
              : 'opacity-0 scale-105 pointer-events-none'
          }`}
        >
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <Image
              src={prod.posterUrl}
              alt={prod.title}
              fill
              className={`object-cover ${index === currentIndex ? 'animate-cinematic-zoom' : ''}`}
              priority={index === 0}
            />
          </div>
          {/* Immersive cinematic Vignettes & Gradient washes */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/85 via-zinc-950/40 to-transparent hidden md:block" />
          {/* Subtle warm stage glow backing */}
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-red-500/10 blur-[120px] mix-blend-screen" />
          <div className="absolute -bottom-40 right-20 w-80 h-80 rounded-full bg-amber-500/5 blur-[100px] mix-blend-screen" />
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={() => go(currentIndex - 1)}
        className="absolute top-1/2 -translate-y-1/2 left-4 md:left-6 z-20 p-3 bg-zinc-950/60 hover:bg-red-600/90 rounded-full backdrop-blur-md text-white transition-all border border-white/10 hover:border-red-500/30 shadow-lg md:opacity-0 md:group-hover:opacity-100 transform hover:scale-105 active:scale-95"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => go(currentIndex + 1)}
        className="absolute top-1/2 -translate-y-1/2 right-4 md:right-6 z-20 p-3 bg-zinc-950/60 hover:bg-red-600/90 rounded-full backdrop-blur-md text-white transition-all border border-white/10 hover:border-red-500/30 shadow-lg md:opacity-0 md:group-hover:opacity-100 transform hover:scale-105 active:scale-95"
        aria-label="Next Slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Primary Cinematic Content Panel */}
      <div className="container mx-auto px-4 md:px-6 relative z-10 pb-16 md:pb-20">
        <div className="max-w-2xl bg-zinc-950/30 md:bg-zinc-950/40 backdrop-blur-xl border border-white/15 p-6 md:p-10 rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.85)] flex flex-col gap-6 relative overflow-hidden transition-all duration-300 hover:border-white/20">
          
          {/* Subtle gloss shine reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none" />

          {/* Badges and tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-red-600 text-white text-[9px] font-bold uppercase tracking-[0.18em] px-3.5 py-1 rounded-full shadow-sm shadow-red-900/20">
              {featured.status}
            </span>
            {featured.criticScore && (
              <span className="bg-white/10 backdrop-blur-md text-zinc-100 text-[9px] font-bold uppercase tracking-[0.15em] px-3.5 py-1 rounded-full border border-white/15">
                Critics {featured.criticScore}%
              </span>
            )}
            {featured.audienceScore && (
              <span className="flex items-center gap-1 bg-amber-500/10 backdrop-blur-md text-amber-400 text-[9px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full border border-amber-500/20">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {featured.audienceScore} Audience
              </span>
            )}
          </div>

          {/* Dynamic Animated Title */}
          <div className="flex flex-col gap-2">
            <h1
              key={currentIndex}
              className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white leading-[1.05] tracking-tight drop-shadow-md animate-fade-up select-none"
            >
              {featured.title}
            </h1>
          </div>

          {/* Description / Synopsis */}
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed line-clamp-3 max-w-xl font-normal drop-shadow-sm">
            {stripHtml(featured.synopsis)}
          </p>

          {/* Action CTAs */}
          <div className="flex items-center gap-4 flex-wrap pt-2">
            <Link
              href={`/shows/${featured.slug || featured.id}`}
              className="bg-white text-black px-7 py-3.5 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-zinc-200 active:scale-95 transition-all shadow-lg hover:shadow-white/5"
            >
              Explore Show
              <ArrowRight className="h-4 w-4" />
            </Link>
            {featured.status !== 'Past Production' && featured.status !== 'Recently Concluded' && (
              featured.externalTicketUrl ? (() => {
                const url = featured.externalTicketUrl.trim();
                const absoluteUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
                return (
                  <a
                    href={absoluteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-zinc-900/60 backdrop-blur-md border border-white/15 text-white px-7 py-3.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-zinc-800/80 active:scale-95 transition-all shadow-md"
                  >
                    <Ticket className="h-4 w-4 text-red-400" />
                    Get Tickets
                  </a>
                );
              })() : (
                <Link
                  href={`/tickets/${featured.id}`}
                  className="bg-zinc-900/60 backdrop-blur-md border border-white/15 text-white px-7 py-3.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-zinc-800/80 active:scale-95 transition-all shadow-md"
                >
                  <Ticket className="h-4 w-4 text-red-400" />
                  Get Tickets
                </Link>
              )
            )}
          </div>
        </div>
      </div>

      {/* Progress Indicators & Dots */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 bg-zinc-950/40 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/5">
        {productions.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`relative rounded-full transition-all duration-300 focus:outline-none ${
              i === currentIndex
                ? 'w-8 h-2 bg-red-500 shadow-[0_0_10px_#e50914]'
                : 'w-2 h-2 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
