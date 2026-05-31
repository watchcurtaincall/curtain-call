import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Calendar, Ticket } from 'lucide-react';
import { Production } from '@/lib/types';

export function ProductionCard({ production, showTicketBadge }: { production: Production, showTicketBadge?: boolean }) {
  return (
    <Link
      href={`/productions/${production.slug || production.id}`}
      className="group flex flex-col gap-3.5 focus:outline-none"
    >
      {/* Poster Container with premium physical lift & custom border triggers */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-zinc-950 border border-white/5 transition-all duration-300 group-hover:-translate-y-2 group-hover:border-red-500/30 group-hover:shadow-[0_24px_48px_rgba(0,0,0,0.7)] flex items-center justify-center">
        {production.posterUrl ? (
          <Image
            src={production.posterUrl}
            alt={production.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-zinc-600"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-600">No Poster</span>
          </div>
        )}
        {/* Cinematic vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/5" />

        {/* Badges Container: top-left with wrap to prevent overlap on narrow mobile screens */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex flex-wrap items-start gap-1.5 z-10 pr-2 pointer-events-none">
          {/* Ticket Badge (if requested by parent) */}
          {showTicketBadge && (
            <div className="bg-zinc-950/90 text-white font-mono text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-lg border border-white/10 backdrop-blur-sm flex items-center gap-1 group-hover:border-red-500/40 transition-colors pointer-events-auto">
              <Ticket className="h-2.5 w-2.5 text-red-500" />
              {production.externalTicketUrl ? "External" : "Direct Buy"}
            </div>
          )}

          {/* Status badge */}
          {production.status && (
            <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase backdrop-blur-md border whitespace-nowrap pointer-events-auto ${
              production.status === 'Currently Showing'
                ? 'bg-red-600/90 border-red-500/50 text-white'
                : production.status === 'Recently Concluded'
                ? 'bg-amber-600/90 border-amber-500/50 text-white'
                : 'bg-zinc-950/80 border-white/10 text-zinc-300'
            }`}>
              {production.status}
            </div>
          )}

          {/* Production type tag (Student vs Professional) */}
          {production.productionType && (
            <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase backdrop-blur-md border whitespace-nowrap pointer-events-auto ${
              production.productionType === 'Student'
                ? 'bg-blue-600/85 border-blue-500/50 text-white'
                : 'bg-emerald-600/85 border-emerald-500/50 text-white'
            }`}>
              {production.productionType}
            </div>
          )}
        </div>

        {/* Score chips: bottom-left */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 z-10">
          {production.criticScore !== null && production.criticScore !== undefined && Number(production.criticScore) > 0 ? (
            <div className="flex items-center bg-red-600/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white border border-red-500/30">
              {production.criticScore}%
            </div>
          ) : null}
          {production.audienceScore !== null && production.audienceScore !== undefined && Number(production.audienceScore) > 0 ? (
            <div className="flex items-center gap-1 bg-zinc-950/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10 text-[10px] font-bold text-white">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              {production.audienceScore}
            </div>
          ) : null}
        </div>
      </div>

      {/* Text Details with clean line heights */}
      <div className="px-0.5 flex flex-col gap-1">
        <h3 className="font-serif text-base font-bold text-zinc-200 group-hover:text-white transition-colors leading-snug line-clamp-2">
          {production.title}
        </h3>
        <p className="flex items-center gap-1 text-xs text-zinc-500 font-medium">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
          <span className="truncate">{production.venue}</span>
        </p>
        {production.status === 'Coming Soon' && production.showDate && (
          <p className="text-[9px] text-red-400 font-bold mt-1 uppercase tracking-widest bg-red-950/40 border border-red-500/20 px-2.5 py-1 rounded-xl w-fit flex items-center gap-1 font-sans">
            <Calendar className="h-3 w-3 shrink-0" /> {new Date(production.showDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {production.showTime && ` @ ${production.showTime}`}
          </p>
        )}
      </div>
    </Link>
  );
}
