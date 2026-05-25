'use client';

import { useState, useEffect, use } from 'react';
import { ClientDB } from '@/lib/db';
import { Production } from '@/lib/types';
import { MOCK_REVIEWS } from '@/lib/mock';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Clock, Ticket, ArrowLeft, Share2, Check } from 'lucide-react';
import { ProductionReviews } from '@/components/productions/ProductionReviews';
import { WatchlistButton } from '@/components/productions/WatchlistButton';
import { PhotoGallery } from '@/components/productions/PhotoGallery';
import { CastCrewSection } from '@/components/productions/CastCrewSection';
import { ImageLightbox } from '@/components/shared/ImageLightbox';
import { ShareModal } from '@/components/shared/ShareModal';

export default function ProductionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [production, setProduction] = useState<Production | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  // Load dynamically from the ClientDB on mount
  useEffect(() => {
    const fetched = ClientDB.getProductionById(resolvedParams.id);
    if (fetched) {
      setProduction(fetched);
    } else {
      const list = ClientDB.getProductions();
      if (list.length > 0) {
        setProduction(list[0]);
      }
    }
  }, [resolvedParams.id]);

  if (!production) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-500 text-sm font-mono animate-pulse">
          Loading production playbill specs...
        </div>
      </div>
    );
  }

  // Load and count Critic vs Audience reviews dynamically to prevent lumping together
  const allReviews = ClientDB.getReviews().filter(r => r.productionId === production.id);
  const criticReviewsCount = allReviews.filter(r => r.type === 'Critic').length;
  const audienceReviewsCount = allReviews.filter(r => r.type === 'Audience').length;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">

      {/* ── CINEMATIC BACKDROP ── */}
      <div className="relative w-full h-[50vh] md:h-[65vh] min-h-[320px] overflow-hidden bg-zinc-950">
        {production.posterUrl && (
          <Image
            src={production.posterUrl}
            alt={production.title}
            fill
            priority
            className="object-cover opacity-30 blur-[2px] scale-110"
          />
        )}
        {/* Gradient fades into page bg */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/60 to-transparent" />

        {/* Back button floats in top-left */}
        <div className="absolute top-4 left-4 z-10">
          <Link
            href="/plays"
            className="inline-flex items-center gap-2 text-sm text-zinc-300 bg-black/40 hover:bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors border border-white/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Archive
          </Link>
        </div>
      </div>

      {/* ── TITLE BLOCK (sits on top of backdrop gradient) ── */}
      <div className="container mx-auto px-4 -mt-24 relative z-10">
        <div className="flex gap-6 items-end">

          {/* Poster thumbnail with Lightbox — desktop only */}
          {production.posterUrl && (
            <div className="relative w-40 lg:w-52 aspect-[2/3] shrink-0 rounded-2xl hidden md:block">
              <ImageLightbox
                src={production.posterUrl}
                alt={production.title}
                aspectRatio="aspect-[2/3]"
                rounded="rounded-2xl"
              />
            </div>
          )}

          {/* Title + badges */}
          <div className="flex-1 pb-2">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-widest ${
                production.status === 'Currently Showing'
                  ? 'bg-red-600/20 text-red-400 border border-red-600/40'
                  : production.status === 'Recently Concluded'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40'
                  : 'bg-zinc-800 text-zinc-400 border border-white/10'
              }`}>
                {production.status}
              </span>
              <span className="text-zinc-500 text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" /> {production.runtime}
              </span>
              <span className="text-zinc-500 text-xs flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {production.venue}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight mb-4">
              {production.title}
            </h1>

            {/* Score Pills */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="bg-red-600 rounded-full h-10 w-10 flex items-center justify-center font-bold text-sm shadow-lg shadow-red-600/30 shrink-0">
                  {production.criticScore !== null ? `${production.criticScore}%` : '--'}
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-white">Critic Score</div>
                  <div className="text-[10px] text-zinc-500">
                    {criticReviewsCount} {criticReviewsCount === 1 ? 'rating' : 'ratings'}
                  </div>
                </div>
              </div>

              <div className="w-px h-8 bg-white/10" />

              <div className="flex items-center gap-2">
                <div className="bg-zinc-800 border border-white/10 rounded-full h-10 w-10 flex items-center justify-center font-bold text-sm shrink-0">
                  {production.audienceScore !== null ? production.audienceScore : '--'}
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-white flex items-center gap-1">
                    Audience <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {audienceReviewsCount} {audienceReviewsCount === 1 ? 'rating' : 'ratings'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTAs ── */}
      <div className="container mx-auto px-4 mt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {production.status !== 'Past Production' && production.status !== 'Recently Concluded' && production.ticketTiers && production.ticketTiers.length > 0 && (
            <Link
              href={`/tickets/${production.id}`}
              className="flex-1 bg-white text-black text-center py-4 rounded-2xl font-bold hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 text-base"
            >
              <Ticket className="h-5 w-5" />
              Get Tickets
            </Link>
          )}
          <WatchlistButton productionId={production.id} />
          <button
            onClick={() => setShareOpen(true)}
            className="bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-base group"
          >
            <Share2 className="h-5 w-5 text-zinc-400 group-hover:text-white transition-colors" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="container mx-auto px-4 py-10 flex flex-col lg:flex-row gap-12">

        {/* Left: Main content */}
        <div className="flex-1 min-w-0 flex flex-col gap-12">

          {/* Synopsis */}
          <div>
            <h2 className="text-xl font-serif font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-red-600 rounded-full inline-block" />
              Synopsis
            </h2>
            <p className="text-zinc-300 leading-relaxed text-base">
              {production.synopsis}
            </p>
          </div>

          {/* Stage Photography Gallery */}
          <PhotoGallery productionTitle={production.title} galleryImages={production.galleryImages} />

          {/* Reviews section */}
          <ProductionReviews
            reviews={ClientDB.getReviews().filter(r => r.productionId === production.id)}
            productionTitle={production.title}
            productionId={production.id}
            status={production.status}
          />

        </div>

        {/* Right: Creative Playbill (Isolatedcast details) */}
        <div className="w-full lg:w-80 shrink-0">
          <CastCrewSection artists={ClientDB.getArtists()} productionTitle={production.title} production={production} />
        </div>

      </div>
      <ShareModal 
        isOpen={shareOpen} 
        onClose={() => setShareOpen(false)} 
        title={production.title} 
        url={typeof window !== 'undefined' ? window.location.href : ''} 
      />
    </div>
  );
}
