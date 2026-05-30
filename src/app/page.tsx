'use client';

import { ProductionCard } from '@/components/shared/ProductionCard';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, BookOpen, Calendar, ArrowRight, Flame, Trophy, Award, Sparkles, Heart } from 'lucide-react';

import { ClientDB, syncFromSupabase, sortItemsByDateAdded } from '@/lib/db';
import { Production, Artist } from '@/lib/types';
import { useState, useEffect } from 'react';

export default function Home() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [trendingPeople, setTrendingPeople] = useState<Artist[]>([]);
  const [recentArticles, setRecentArticles] = useState<any[]>([]);
  const [featuredHighlights, setFeaturedHighlights] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dynamically load data from client-side active database on mount
  useEffect(() => {
    setMounted(true);
    const hasSyncedBefore = localStorage.getItem('cc_last_sync_time');

    const loadData = () => {
      // Sort plays by date added so newly added plays appear at the top!
      setProductions(sortItemsByDateAdded(ClientDB.getProductions()));

      // ── Trending Theatremakers (Deterministic cross-device sorting)
      const sortedArtists = ClientDB.getArtists()
        .sort((a, b) => {
          const diff = (b.hits || 0) - (a.hits || 0);
          if (diff !== 0) return diff;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 6);
      setTrendingPeople(sortedArtists);
      
      const allArticles = ClientDB.getArticles();
      setRecentArticles(allArticles.slice(0, 3));
      setFeaturedHighlights(allArticles.length > 3 ? allArticles.slice(3, 6) : allArticles.slice(0, 3));
      
      // If we have completed a sync previously, we bypass the loading phase entirely to load in 0ms!
      if (hasSyncedBefore) {
        setLoading(false);
      }
    };

    loadData();
    
    // Background pull database sync on page load/mount
    syncFromSupabase();

    const handleSync = () => {
      loadData();
      setLoading(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('cc-db-synced', handleSync);
      return () => window.removeEventListener('cc-db-synced', handleSync);
    }
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col gap-16 pb-24">
        {/* Premium Shimmer Hero Block */}
        <div className="relative w-full h-[80vh] min-h-[580px] bg-zinc-900/10 animate-pulse flex items-end p-8 md:p-16 border-b border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
          <div className="max-w-2xl w-full flex flex-col gap-4 relative z-10">
            <div className="h-6 w-32 bg-white/10 rounded-full" />
            <div className="h-16 w-3/4 bg-white/10 rounded-2xl" />
            <div className="h-6 w-1/2 bg-white/10 rounded-xl" />
            <div className="flex gap-3 mt-4">
              <div className="h-12 w-32 bg-white/10 rounded-full" />
              <div className="h-12 w-32 bg-white/10 rounded-full" />
            </div>
          </div>
        </div>

        {/* Shimmer Directory Section */}
        <div className="container mx-auto px-4 flex flex-col gap-6">
          <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3 animate-pulse">
                <div className="w-28 h-28 rounded-full bg-white/10" />
                <div className="h-4 w-20 bg-white/10 rounded-md" />
                <div className="h-3 w-12 bg-white/10 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Shimmer Grid Section */}
        <div className="container mx-auto px-4 flex flex-col gap-6">
          <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3 animate-pulse bg-zinc-900/20 border border-white/5 rounded-3xl p-4">
                <div className="w-full aspect-[2/3] bg-white/10 rounded-2xl" />
                <div className="h-5 w-3/4 bg-white/10 rounded-md" />
                <div className="h-4 w-1/2 bg-white/10 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Sort and filter productions for different categories
  const featured = productions.filter(p => p.status !== 'Draft').slice(0, 5); // Take top 5 for hero carousel
  const currentlyShowing = productions.filter(p => p.status === 'Currently Showing');
  const comingSoon = productions.filter(p => p.status === 'Coming Soon');
  
  // "Highest Rated by Critics" equivalent to "Certified Fresh"
  const highestRatedCritics = productions
    .filter(p => p.criticScore !== null && p.status !== 'Draft')
    .sort((a, b) => (b.criticScore || 0) - (a.criticScore || 0))
    .slice(0, 4);

  // "Audience Favorites"
  const highestRatedAudience = productions
    .filter(p => p.audienceScore !== null && p.status !== 'Draft')
    .sort((a, b) => (b.audienceScore || 0) - (a.audienceScore || 0))
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-20 pb-24 bg-zinc-950">
      {/* Dynamic Hero Carousel displaying latest 5 plays */}
      <HeroCarousel productions={featured} />

      {/* ── TRENDING THEATREMAKERS ── Premium Spotlight Grid Deck */}
      {trendingPeople.length > 0 && (
      <section className="container mx-auto px-4 md:px-6">
        <div className="flex items-end justify-between gap-4 mb-10 pb-5 border-b border-white/5 relative">
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-serif font-bold text-white flex items-center gap-2.5 tracking-tight">
              <Sparkles className="h-6 w-6 text-amber-500 shrink-0" />
              Trending Theatremakers
            </h2>
            <p className="text-zinc-400 text-sm mt-1.5 font-normal">Spotlighting the creative minds behind contemporary African theatre.</p>
          </div>
          <Link href="/artists" className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full transition-all shrink-0 whitespace-nowrap hover:bg-white/5">
            Explore Directory
          </Link>
          <div className="absolute bottom-0 left-0 w-24 h-[1px] bg-gradient-to-r from-amber-500 to-transparent" />
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {trendingPeople.map((artist, index) => (
            <Link 
              key={artist.id} 
              href={`/artists/${artist.slug || artist.id}`} 
              className={`group bg-zinc-900/30 backdrop-blur-md border border-white/5 hover:border-amber-500/30 rounded-3xl p-4 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_32px_rgba(0,0,0,0.6)] cursor-pointer ${index >= 4 ? 'hidden md:flex' : 'flex'}`}
            >
              <div className="relative w-24 h-24 rounded-full mb-4 border border-zinc-800 group-hover:border-amber-500 transition-all duration-500 shadow-xl overflow-hidden">
                <Image
                  src={artist.headshotUrl}
                  alt={artist.name}
                  fill
                  sizes="96px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Elegant gold rank badge */}
                <div className="absolute -top-1 -left-1 bg-amber-500 border border-white/10 rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold text-black shadow-lg">
                  #{index + 1}
                </div>
              </div>

              <h3 className="font-serif text-sm font-bold text-zinc-100 group-hover:text-amber-400 transition-colors line-clamp-1 leading-tight mb-1">
                {artist.name}
              </h3>
              
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider line-clamp-1">
                {artist.roleType.split(' / ')[0]}
              </p>
            </Link>
          ))}
        </div>
      </section>
      )}


      {/* Currently Showing Section */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="flex items-end justify-between gap-4 mb-10 pb-5 border-b border-white/5 relative">
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-serif font-bold text-white flex items-center gap-3 tracking-tight">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#e50914]"></span>
              Currently Showing
            </h2>
            <p className="text-zinc-400 text-sm mt-1.5">Live stage performances happening now in Lagos and beyond.</p>
          </div>
          <Link href="/discovery?filter=showing" className="text-xs font-bold text-red-500 hover:text-red-400 uppercase tracking-widest border border-red-500/20 px-4 py-2 rounded-full transition-all shrink-0 whitespace-nowrap hover:bg-red-500/5">
            View All Shows
          </Link>
          <div className="absolute bottom-0 left-0 w-24 h-[1px] bg-gradient-to-r from-red-500 to-transparent" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {currentlyShowing.map(production => (
            <ProductionCard key={production.id} production={production} />
          ))}
        </div>
      </section>

      {/* Coming Soon / Buy Tickets */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="flex items-end justify-between gap-4 mb-10 pb-5 border-b border-white/5 relative">
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-serif font-bold text-white tracking-tight">Coming Soon</h2>
            <p className="text-zinc-400 text-sm mt-1.5">Highly anticipated premieres and showcases. Secure your tickets early.</p>
          </div>
          <Link href="/discovery?filter=upcoming" className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full transition-all shrink-0 whitespace-nowrap hover:bg-white/5">
            View Upcoming
          </Link>
          <div className="absolute bottom-0 left-0 w-24 h-[1px] bg-gradient-to-r from-zinc-500 to-transparent" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {comingSoon.map(production => (
            <ProductionCard key={production.id} production={production} />
          ))}
        </div>
      </section>

      {/* Critics' Choice & Editorial Spotlight Wrapper */}
      <div className="bg-zinc-900/10 border-y border-white/5 py-16 relative overflow-hidden">
        {/* Cinematic Backdrop Glow */}
        <div className="absolute -top-40 right-10 w-96 h-96 rounded-full bg-red-500/5 blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute -bottom-40 left-10 w-96 h-96 rounded-full bg-amber-500/5 blur-[120px] mix-blend-screen pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 flex flex-col gap-16">
          
          {/* Highest Rated by Critics */}
          <section className="bg-zinc-950/40 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 md:p-10 shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-10 pb-5 border-b border-white/5 relative">
              <div className="flex-1 min-w-0">
                <h2 className="text-3xl font-serif font-bold text-white flex items-center gap-2.5 tracking-tight">
                  <Award className="h-6 w-6 text-red-500 shrink-0" />
                  Critic&apos;s Choice
                </h2>
                <p className="text-zinc-400 text-sm mt-1.5">The highest-reviewed stage productions and musicals rated by verified critics.</p>
              </div>
              <div className="absolute bottom-0 left-0 w-24 h-[1px] bg-gradient-to-r from-red-500 to-transparent" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {highestRatedCritics.map(production => (
                <ProductionCard key={production.id} production={production} />
              ))}
            </div>
          </section>

          {/* Audience Favorites */}
          <section className="bg-zinc-950/40 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 md:p-10 shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-10 pb-5 border-b border-white/5 relative">
              <div className="flex-1 min-w-0">
                <h2 className="text-3xl font-serif font-bold text-white flex items-center gap-2.5 tracking-tight">
                  <Heart className="h-6 w-6 text-amber-500 shrink-0" />
                  Audience Favorites
                </h2>
                <p className="text-zinc-400 text-sm mt-1.5">Fan-favorite productions deeply loved by passionate theatregoers.</p>
              </div>
              <div className="absolute bottom-0 left-0 w-24 h-[1px] bg-gradient-to-r from-amber-500 to-transparent" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {highestRatedAudience.map(production => (
                <ProductionCard key={production.id} production={production} />
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* ── EDITORIAL CHRONICLES & BLOGS ── */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="flex items-end justify-between gap-4 mb-10 pb-5 border-b border-white/5 relative">
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-serif font-bold text-white flex items-center gap-2.5 tracking-tight">
              <BookOpen className="h-6 w-6 text-red-500 shrink-0" />
              Recent Chronicles
            </h2>
            <p className="text-zinc-400 text-sm mt-1.5">Expert cultural analysis, historic documentation, and stage critiques.</p>
          </div>
          <Link href="/editorial" className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full transition-all shrink-0 whitespace-nowrap hover:bg-white/5">
            View All Chronicles
          </Link>
          <div className="absolute bottom-0 left-0 w-24 h-[1px] bg-gradient-to-r from-red-500 to-transparent" />
        </div>

        {/* Editorial Layout: Left Main Column, Right Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main blog columns (Left 2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {recentArticles.map(article => (
              <Link
                key={article.id}
                href={`/editorial/${article.id}`}
                className="bg-zinc-900/30 hover:bg-zinc-900/60 backdrop-blur-md border border-white/5 hover:border-white/15 rounded-3xl p-5 transition-all duration-300 flex flex-col sm:flex-row gap-6 items-stretch shadow-md hover:shadow-xl group cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="relative w-full sm:w-48 aspect-[4/3] rounded-2xl overflow-hidden shrink-0 bg-zinc-950 border border-white/5">
                  <Image
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 192px"
                    className="object-cover transition-transform duration-500 group-hover:scale-102"
                  />
                </div>
                
                {/* Description */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
                        {article.category || 'Theatre Spotlight'}
                      </span>
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-semibold">
                        <Calendar className="h-3.5 w-3.5" /> {article.date}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-semibold">• {article.readTime || '5 min read'}</span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-white group-hover:text-red-400 transition-colors leading-snug mb-2">
                      {article.title}
                    </h3>
                    <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">
                      {article.excerpt}
                    </p>
                  </div>
                  
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-zinc-300 group-hover:text-white uppercase tracking-widest mt-4 transition-colors">
                    Read Chronicle <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Sidebar Area (Right 1/3) */}
          <div className="flex flex-col gap-6">
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 flex flex-col gap-6 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-white/5 pointer-events-none" />
              
              <div>
                <h3 className="font-serif font-bold text-white text-lg flex items-center gap-2">
                  Featured Highlights
                </h3>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1.5 font-bold">Hottest editorials read by the guild</p>
              </div>

              <div className="flex flex-col gap-4 divide-y divide-white/5 relative z-10">
                {featuredHighlights.map((feat, index) => {
                  const getViews = (id: string) => {
                    const map: Record<string, string> = {
                      art1: '4.2k reads',
                      art2: '3.8k reads',
                      art3: '2.9k reads',
                    };
                    return map[id] || '1.8k reads';
                  };
                  return (
                    <div key={feat.id} className={`${index > 0 ? 'pt-4' : ''} group`}>
                      <span className="text-[9px] font-bold text-red-500/80 tracking-widest font-mono uppercase">
                        Chronicle #{index + 1}
                      </span>
                      <Link 
                        href={`/editorial/${feat.id}`}
                        className="block font-serif text-sm font-bold text-zinc-300 group-hover:text-white transition-colors leading-snug mt-1.5 line-clamp-2"
                      >
                        {feat.title}
                      </Link>
                      <span className="text-[9px] text-zinc-500 mt-1 block uppercase font-bold tracking-wider">
                        {getViews(feat.id)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-5 mt-2 relative z-10">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Want to publish a stage critique, historical chronicle, or regional theatre spotlight? Get in touch with us.
                </p>
                <Link 
                  href="/submit"
                  className="inline-block bg-white text-black text-[10px] font-bold px-4 py-2.5 rounded-xl mt-4 uppercase tracking-wider hover:bg-zinc-200 transition-colors"
                >
                  Write For Us
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
