'use client';

import { useState, useEffect } from 'react';
import { ClientDB, sortItemsByDateAdded } from '@/lib/db';
import { Artist } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { User } from 'lucide-react';

export default function ArtistsDirectoryPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // 2 items per row, 10 rows

  // Load dynamically from the ClientDB on mount
  useEffect(() => {
    const loadData = () => {
      // Sort artists by date added so newly added theatremakers appear at the top!
      setArtists(sortItemsByDateAdded(ClientDB.getArtists()));
    };
    loadData();

    if (typeof window !== 'undefined') {
      window.addEventListener('cc-db-synced', loadData);
      return () => window.removeEventListener('cc-db-synced', loadData);
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Theatremakers</h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Discover the brilliant artists shaping the narrative of African theatre.
          </p>
        </div>
        <Link
          href="/submit"
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-red-900/20 text-center text-sm md:text-base shrink-0 border border-red-500/10"
        >
          Join as Theatremaker
        </Link>
      </div>

      <div className="flex flex-col gap-10">
        {/* Grid layout: 2 columns on mobile, scaling to 5 columns on desktop viewports */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 w-full">
          {artists
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map(artist => (
              <Link key={artist.id} href={`/artists/${artist.slug || artist.id}`} className="group block">
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

        {/* Premium Glassmorphic Pagination Controls */}
        {Math.ceil(artists.length / itemsPerPage) > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6 bg-zinc-900/60 border border-white/5 p-3 rounded-2xl max-w-xs mx-auto backdrop-blur-xl shadow-2xl">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-800 disabled:cursor-not-allowed transition-all border border-white/5"
            >
              Prev
            </button>
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest font-semibold">
              Page {currentPage} of {Math.ceil(artists.length / itemsPerPage)}
            </span>
            <button
              type="button"
              disabled={currentPage === Math.ceil(artists.length / itemsPerPage)}
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(artists.length / itemsPerPage), p + 1))}
              className="px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-800 disabled:cursor-not-allowed transition-all border border-white/5"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
