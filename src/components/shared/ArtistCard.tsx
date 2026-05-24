import Image from 'next/image';
import Link from 'next/link';
import { Artist } from '@/lib/types';

export function ArtistCard({ artist }: { artist: Artist }) {
  const isVirtual = !artist.id;
  
  const CardContent = (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative h-32 w-32 md:h-40 md:w-40 overflow-hidden rounded-full bg-zinc-900 border-2 border-white/5 transition-all duration-300 group-hover:border-white/20 group-hover:shadow-xl group-hover:shadow-white/5">
        {artist.headshotUrl ? (
          <img
            src={artist.headshotUrl}
            alt={artist.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-zinc-500">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        )}
      </div>
      <div>
        <h3 className="font-serif text-base font-bold text-zinc-100 group-hover:text-white transition-colors">
          {artist.name}
        </h3>
        <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">
          {artist.roleType}
        </p>
      </div>
    </div>
  );

  if (isVirtual) {
    return (
      <div className="group flex flex-col items-center cursor-default">
        {CardContent}
      </div>
    );
  }

  return (
    <Link href={`/artists/${artist.id}`} className="group flex flex-col items-center">
      {CardContent}
    </Link>
  );
}
