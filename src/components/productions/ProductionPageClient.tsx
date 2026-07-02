'use client';

import { useState, useEffect, use } from 'react';
import { ClientDB } from '@/lib/db';
import { Production } from '@/lib/types';
import { MOCK_REVIEWS } from '@/lib/mock';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Clock, Ticket, ArrowLeft, Share2, Check, Calendar, ExternalLink } from 'lucide-react';
import { ProductionReviews } from '@/components/productions/ProductionReviews';
import { WatchlistButton } from '@/components/productions/WatchlistButton';
import { PhotoGallery } from '@/components/productions/PhotoGallery';
import { CastCrewSection } from '@/components/productions/CastCrewSection';
import { ImageLightbox } from '@/components/shared/ImageLightbox';
import { ShareModal } from '@/components/shared/ShareModal';
import { useAuth } from '@/lib/AuthContext';

function parseShowDateTime(showDateStr: string, showTimeStr: string): Date | null {
  if (!showDateStr) return null;
  const dateParts = showDateStr.split('-');
  if (dateParts.length !== 3) return null;
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
  const day = parseInt(dateParts[2], 10);

  let hours = 19; // Default to 7:00 PM
  let minutes = 0;

  if (showTimeStr) {
    const timeParts = showTimeStr.match(/(\d+):(\d+)/);
    if (timeParts) {
      hours = parseInt(timeParts[1], 10);
      minutes = parseInt(timeParts[2], 10);

      // Handle AM/PM format if present
      const isPM = /pm/i.test(showTimeStr);
      const isAM = /am/i.test(showTimeStr);
      if (isPM && hours < 12) {
        hours += 12;
      } else if (isAM && hours === 12) {
        hours = 0;
      }
    }
  }

  return new Date(year, month, day, hours, minutes, 0, 0);
}

export function ProductionPageClient({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [production, setProduction] = useState<Production | null>(null);
  const [hasSynced, setHasSynced] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'critic' | 'audience'>('critic');

  useEffect(() => {
    if (user) {
      const isCritic = ClientDB.isApprovedCritic(user.email);
      setActiveTab(isCritic ? 'critic' : 'audience');
    } else {
      setActiveTab('audience');
    }
  }, [user]);

  const scrollToReviews = () => {
    if (user) {
      const isCritic = ClientDB.isApprovedCritic(user.email);
      setActiveTab(isCritic ? 'critic' : 'audience');
    } else {
      setActiveTab('audience');
    }
    const section = document.getElementById('reviews-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Load dynamically from the ClientDB on mount
  useEffect(() => {
    const loadData = () => {
      const fetched = ClientDB.getProductionById(resolvedParams.id);
      if (fetched) {
        setProduction(fetched);
      } else {
        setProduction(null);
      }
    };

    loadData();

    const handleSync = () => {
      loadData();
      setHasSynced(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('cc-db-synced', handleSync);
      return () => window.removeEventListener('cc-db-synced', handleSync);
    }
  }, [resolvedParams.id]);

  if (!production) {
    if (hasSynced) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4 text-center">
          <h2 className="text-2xl font-serif font-bold text-white mb-2">Play Not Found</h2>
          <p className="text-zinc-400 text-sm max-w-md mb-6">
            We couldn't find the theatrical specs for this play. It may have been retired or you might have used an invalid link.
          </p>
          <Link href="/plays" className="text-sm bg-red-600 text-white font-medium px-6 py-2.5 rounded-full hover:bg-red-700 transition-colors">
            Back to Plays Archive
          </Link>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-500 text-sm font-mono animate-pulse">
          Loading production play specs...
        </div>
      </div>
    );
  }

  // Load and count Critic vs Audience reviews dynamically to prevent lumping together
  const allReviews = ClientDB.getReviews().filter(r => r.productionId === production.id);
  const criticReviewsCount = allReviews.filter(r => r.type && r.type.toLowerCase() === 'critic').length;
  const audienceReviewsCount = allReviews.filter(r => r.type && r.type.toLowerCase() === 'audience').length;

  // Calculate dynamic salesActive and reviewsLocked based on play scheduled start time
  let reviewsLocked = production.status === 'Coming Soon';
  let salesActive = production.status !== 'Past Production' && production.status !== 'Recently Concluded' && (production.externalTicketUrl || (production.ticketTiers && production.ticketTiers.length > 0));

  if (production.showDate) {
    const showStart = parseShowDateTime(production.showDate, production.showTime || '19:00');
    if (showStart) {
      const now = new Date();
      const oneHourPastStart = new Date(showStart.getTime() + 60 * 60 * 1000);
      const isPastOneHour = now >= oneHourPastStart;
      
      if (isPastOneHour) {
        salesActive = false;
        reviewsLocked = false; // Open reviews
      } else {
        reviewsLocked = production.status !== 'Past Production' && production.status !== 'Recently Concluded';
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">

      {/* ── CINEMATIC BACKDROP ── */}
      <div className="relative w-full h-[32vh] sm:h-[40vh] md:h-[55vh] min-h-[220px] overflow-hidden bg-zinc-950">
        {production.posterUrl && (
          <img
            src={production.posterUrl}
            alt={production.title}
            className="absolute inset-0 w-full h-full object-cover opacity-30 blur-[2px] scale-110"
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
      <div className="container mx-auto px-4 -mt-16 sm:-mt-24 relative z-10">
        <div className="flex gap-6 items-end">

          {/* Poster thumbnail with Lightbox */}
          {production.posterUrl && (
            <div className="relative w-28 sm:w-40 lg:w-52 aspect-[2/3] shrink-0 rounded-2xl block">
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
            {/* Status & Type Badges (Clean, Compact, No Clutter) */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              {production.status !== 'Draft' && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                  production.status === 'Currently Showing'
                    ? 'bg-red-600/25 text-red-400 border border-red-500/30'
                    : production.status === 'Recently Concluded'
                    ? 'bg-amber-600/25 text-amber-400 border border-amber-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-white/10'
                }`}>
                  {production.status}
                </span>
              )}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                (!production.eventType || production.eventType === 'Theatre')
                  ? 'bg-purple-600/25 text-purple-400 border border-purple-500/30'
                  : 'bg-indigo-600/25 text-indigo-400 border border-indigo-500/30'
              }`}>
                {production.customEventType || production.eventType || 'Theatre'}
              </span>
              {production.productionType && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                  production.productionType === 'Student'
                    ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30'
                    : 'bg-emerald-600/25 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {production.productionType}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-5xl font-serif font-bold text-white leading-tight mb-2">
              {production.title}
            </h1>

            {/* Horizontal Sleek Metadata Bar (Venue, Runtime, Date) */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400 mb-4 font-medium select-none">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-zinc-550 shrink-0" />
                <span>{production.venue}</span>
              </span>
              {/* For theatre: show runtime. For events with start+end time: show "HH:MM – HH:MM" */}
              {(!production.eventType || production.eventType === 'Theatre') && production.runtime && (
                <>
                  <span className="text-zinc-700 font-bold">·</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock className="h-3.5 w-3.5 text-zinc-550 shrink-0" />
                    <span>{production.runtime}</span>
                  </span>
                </>
              )}
              {(production.dates && production.dates.length > 0) ? (
                 production.dates.map((d: any, i: number) => (
                   <div key={i} className="flex items-center gap-1">
                     <span className="text-zinc-700 font-bold">·</span>
                     <span className="flex items-center gap-1 text-red-400 font-semibold shrink-0">
                       <Calendar className="h-3.5 w-3.5 shrink-0" />
                       <span>
                         {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                         {d.time && d.endTime
                           ? ` · ${d.time} – ${d.endTime}`
                           : d.time
                           ? ` @ ${d.time}`
                           : ''}
                       </span>
                     </span>
                   </div>
                 ))
              ) : production.showDate && (
                <>
                  <span className="text-zinc-700 font-bold">·</span>
                  <span className="flex items-center gap-1 text-red-400 font-semibold shrink-0">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {new Date(production.showDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {production.showTime && production.endTime
                        ? ` · ${production.showTime} – ${production.endTime}`
                        : production.showTime
                        ? ` @ ${production.showTime}`
                        : ''}
                    </span>
                  </span>
                </>
              )}
            </div>

            {/* Score Pills */}
            <div className="flex items-center gap-4 flex-wrap">
              {(!production.eventType || production.eventType === 'Theatre') && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="bg-red-600 rounded-full h-10 w-10 flex items-center justify-center font-bold text-sm shadow-lg shadow-red-600/30 shrink-0">
                      {production.criticScore !== null && production.criticScore !== undefined ? `${production.criticScore}%` : '--'}
                    </div>
                    <div className="leading-tight">
                      <div className="text-xs font-semibold text-white">Critic Score</div>
                      <div className="text-[10px] text-zinc-500">
                        {criticReviewsCount} {criticReviewsCount === 1 ? 'rating' : 'ratings'}
                      </div>
                    </div>
                  </div>

                  <div className="w-px h-8 bg-white/10" />
                </>
              )}

              <div className="flex items-center gap-2">
                <div className="bg-zinc-800 border border-white/10 rounded-full h-10 w-10 flex items-center justify-center font-bold text-sm shrink-0">
                  {production.audienceScore !== null && production.audienceScore !== undefined ? production.audienceScore : '--'}
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
        <div className="flex flex-col gap-2.5 max-w-xl">
          {/* Row 1: Primary Action (Get Tickets - Bold, prominent call-to-action) */}
          {salesActive && (
            <div>
              {production.externalTicketUrl ? (() => {
                let linkExpired = false;
                if (production.showDate) {
                  const showDate = new Date(production.showDate);
                  showDate.setHours(0, 0, 0, 0);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  linkExpired = today > showDate;
                }
                if (linkExpired) return null;
                const rawUrl = production.externalTicketUrl || '';
                const cleanUrl = rawUrl.trim();
                const absoluteUrl = /^https?:\/\//i.test(cleanUrl) ? cleanUrl : `https://${cleanUrl}`;
                return (
                  <a
                    href={absoluteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white text-black text-center py-3.5 rounded-xl font-bold hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-lg"
                  >
                    <Ticket className="h-4 w-4" />
                    Get Tickets
                    <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                  </a>
                );
              })() : (
                <Link
                  href={`/tickets/${production.id}`}
                  className="w-full bg-white text-black text-center py-3.5 rounded-xl font-bold hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider block shadow-lg"
                >
                  <Ticket className="h-4 w-4" />
                  Get Tickets
                </Link>
              )}
            </div>
          )}

          {/* Row 2: Secondary Action Grid (Watchlist, Review, and Share in a single clean row) */}
          <div className="grid grid-cols-3 gap-2">
            <WatchlistButton productionId={production.id} compact={true} eventType={production.eventType} />
            <button
              onClick={scrollToReviews}
              className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 hover:text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wider"
            >
              <Star className="h-4 w-4 text-red-500" />
              <span>Review</span>
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 hover:text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wider"
            >
              <Share2 className="h-4 w-4 text-zinc-400" />
              <span>Share</span>
            </button>
          </div>
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
              {(!production.eventType || production.eventType === 'Theatre') ? 'Synopsis' : 'Description'}
            </h2>
            <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: production.synopsis }} />
          </div>

          {/* Stage Photography Gallery — theatre only */}
          {(!production.eventType || production.eventType === 'Theatre') && (
            <PhotoGallery productionTitle={production.title} galleryImages={production.galleryImages} />
          )}

          {/* Reviews section */}
          <div id="reviews-section" className="scroll-mt-24">
            <ProductionReviews
              reviews={ClientDB.getReviews().filter(r => r.productionId === production.id)}
              productionTitle={production.title}
              productionId={production.id}
              status={production.status}
              eventType={production.eventType || 'Theatre'}
              activeTab={(!production.eventType || production.eventType === 'Theatre') ? activeTab : 'audience'}
              onTabChange={setActiveTab}
              reviewsLocked={reviewsLocked}
            />
          </div>

        </div>

        {/* Right: Creative Playbill (Isolatedcast details) */}
        {(!production.eventType || production.eventType === 'Theatre') && (
        <div className="w-full lg:w-80 shrink-0">
          <CastCrewSection artists={ClientDB.getArtists()} productionTitle={production.title} production={production} />
        </div>
        )}

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
