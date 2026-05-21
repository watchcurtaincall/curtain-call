'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Ticket, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Production } from '@/lib/types';

export function HeroCarousel({ productions }: { productions: Production[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % productions.length);
    }, 6000);
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
    <section className="relative w-full h-[80vh] min-h-[580px] flex items-end group overflow-hidden">

      {/* Background layers */}
      {productions.map((prod, index) => (
        <div
          key={prod.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={prod.posterUrl}
            alt={prod.title}
            fill
            className="object-cover"
            priority={index === 0}
          />
          {/* Cinematic vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/55 to-zinc-950/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/30 to-transparent" />
        </div>
      ))}

      {/* Nav arrows — always visible on mobile, hover on desktop */}
      <button
        onClick={() => go(currentIndex - 1)}
        className="absolute top-1/2 -translate-y-1/2 left-3 z-20 p-2.5 bg-black/40 hover:bg-black/70 rounded-full backdrop-blur-sm text-white transition-all border border-white/10 md:opacity-0 md:group-hover:opacity-100"
        aria-label="Previous"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => go(currentIndex + 1)}
        className="absolute top-1/2 -translate-y-1/2 right-3 z-20 p-2.5 bg-black/40 hover:bg-black/70 rounded-full backdrop-blur-sm text-white transition-all border border-white/10 md:opacity-0 md:group-hover:opacity-100"
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 pb-14">
        <div className="max-w-2xl">

          {/* Pills row */}
          <div className="flex items-center gap-2 mb-5">
            <span className="bg-red-600 text-white text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full">
              {featured.status}
            </span>
            {featured.criticScore && (
              <span className="bg-white/10 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full border border-white/10">
                Critics {featured.criticScore}%
              </span>
            )}
            {featured.audienceScore && (
              <span className="flex items-center gap-1 bg-white/10 backdrop-blur-md text-amber-400 text-[10px] font-bold px-3 py-1 rounded-full border border-white/10">
                <Star className="h-3 w-3 fill-amber-400" />
                {featured.audienceScore}
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            key={currentIndex}
            className="text-5xl md:text-7xl font-serif font-bold text-white leading-[1.05] mb-4 animate-fade-up drop-shadow-lg"
          >
            {featured.title}
          </h1>

          {/* Synopsis */}
          <p className="text-zinc-300 text-sm md:text-base mb-8 line-clamp-2 max-w-lg leading-relaxed">
            {featured.synopsis}
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/productions/${featured.id}`}
              className="bg-white text-black px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-zinc-100 transition-colors"
            >
              View Details
            </Link>
            {featured.status !== 'Past Production' && (
              !!featured.submitterEmail ||
              featured.id.startsWith('direct_play_') ||
              featured.id.startsWith('prod_')
            ) && (
              <Link
                href={`/tickets/${featured.id}`}
                className="bg-zinc-900/60 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-zinc-800/80 transition-colors"
              >
                <Ticket className="h-4 w-4" />
                Get Tickets
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Dot + progress indicators */}
      <div className="absolute bottom-5 right-4 z-20 flex items-center gap-1.5">
        {productions.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`rounded-full transition-all duration-300 ${
              i === currentIndex
                ? 'w-6 h-1.5 bg-white'
                : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
