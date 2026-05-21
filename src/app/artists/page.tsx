'use client';

import { useState, useEffect } from 'react';
import { ClientDB } from '@/lib/db';
import { Artist } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { User } from 'lucide-react';

export default function ArtistsDirectoryPage() {
  const [artists, setArtists] = useState<Artist[]>([]);

  // Load dynamically from the ClientDB on mount
  useEffect(() => {
    setArtists(ClientDB.getArtists());
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Theatremakers</h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Discover the brilliant directors, actors, and playwrights shaping the narrative of African theatre.
          </p>
        </div>
        <Link
          href="/submit"
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-red-900/20 text-center text-sm md:text-base shrink-0 border border-red-500/10"
        >
          Join as Theatremaker
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {artists.map(artist => (
          <Link key={artist.id} href={`/artists/${artist.id}`} className="group block">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4 border border-white/5 bg-zinc-900 shadow-md transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.5)]">
              {artist.headshotUrl ? (
                <Image
                  src={artist.headshotUrl}
                  alt={artist.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 200px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                  <User className="h-10 w-10 text-zinc-500" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
            </div>
            <h3 className="font-serif text-lg font-bold text-white group-hover:text-red-400 transition-colors flex flex-wrap items-center gap-1.5">
              {artist.isDeceased ? `The Late ${artist.name}` : artist.name}
            </h3>
            <p className="text-zinc-500 text-sm mt-0.5">{artist.roleType}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
