import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import { Production } from '@/lib/types';

export function ProductionCard({ production }: { production: Production }) {
  const isShowing = production.status === 'Currently Showing';

  return (
    <Link
      href={`/productions/${production.slug || production.id}`}
      className="group flex flex-col gap-3 focus:outline-none"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-zinc-900 border border-white/5 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_24px_48px_rgba(0,0,0,0.6)] flex items-center justify-center">
        {production.posterUrl ? (
          <Image
            src={production.posterUrl}
            alt={production.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-zinc-500"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">No Poster</span>
          </div>
        )}
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* Status badge */}
        <div className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase backdrop-blur-sm border ${
          production.status === 'Currently Showing'
            ? 'bg-red-600/80 border-red-500/50 text-white'
            : production.status === 'Recently Concluded'
            ? 'bg-amber-600/85 border-amber-500/50 text-white'
            : 'bg-black/60 border-white/10 text-zinc-300'
        }`}>
          {production.status}
        </div>

        {/* Production type tag (Student vs Professional) — stacked below status badge to avoid overlap */}
        {production.productionType && (
          <div className={`absolute top-9 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase backdrop-blur-sm border ${
            production.productionType === 'Student'
              ? 'bg-blue-600/80 border-blue-500/50 text-white'
              : 'bg-emerald-600/80 border-emerald-500/50 text-white'
          }`}>
            {production.productionType}
          </div>
        )}

        {/* Score chips */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
          {production.criticScore !== null && production.criticScore !== undefined && Number(production.criticScore) > 0 ? (
            <div className="flex items-center bg-red-600/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[11px] font-bold text-white">
              {production.criticScore}%
            </div>
          ) : null}
          {production.audienceScore !== null && production.audienceScore !== undefined && Number(production.audienceScore) > 0 ? (
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10 text-[11px] font-bold text-white">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              {production.audienceScore}
            </div>
          ) : null}
        </div>
      </div>

      {/* Text */}
      <div className="px-0.5">
        <h3 className="font-serif text-base font-bold text-zinc-100 group-hover:text-white transition-colors leading-snug line-clamp-2 mb-1">
          {production.title}
        </h3>
        <p className="flex items-center gap-1 text-xs text-zinc-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{production.venue}</span>
        </p>
      </div>
    </Link>
  );
}
