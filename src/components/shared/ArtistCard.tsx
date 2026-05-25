import Image from 'next/image';
import Link from 'next/link';
import { Artist } from '@/lib/types';

export function ArtistCard({ artist }: { artist: Artist }) {
  const isVirtual = !artist.id;
  
  const CardContent = (
    <div className="flex flex-col items-center gap-2.5 text-center w-full">
      <div className="relative h-28 w-28 sm:h-32 sm:w-32 md:h-40 md:w-40 lg:h-24 lg:w-24 overflow-hidden rounded-full bg-zinc-900 border-2 border-white/5 transition-all duration-300 group-hover:border-white/20 group-hover:shadow-xl group-hover:shadow-white/5 shrink-0">
        {artist.headshotUrl ? (
          <img
            src={artist.headshotUrl}
            alt={artist.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 sm:h-10 sm:w-10 lg:h-7 lg:w-7 text-zinc-500">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0 px-1">
        <h3 className="font-serif text-sm sm:text-base lg:text-sm font-bold text-zinc-100 group-hover:text-white transition-colors line-clamp-2 leading-snug">
          {artist.name}
        </h3>
        <p className="text-[10px] sm:text-xs lg:text-[10px] text-zinc-400 mt-0.5 uppercase tracking-wider line-clamp-2 leading-normal">
          {artist.roleType}
        </p>
      </div>
    </div>
  );

  if (isVirtual) {
    return (
      <div className="group flex flex-col items-center cursor-default w-full">
        {CardContent}
      </div>
    );
  }

  return (
    <Link href={`/artists/${artist.id}`} className="group flex flex-col items-center w-full">
      {CardContent}
    </Link>
  );
}
