'use client';

import { useState, useEffect } from 'react';
import { ClientDB } from '@/lib/db';
import { Production } from '@/lib/types';
import { ProductionCard } from '@/components/shared/ProductionCard';
import { Search, PlusCircle, Drama, Info, FileText } from 'lucide-react';
import Link from 'next/link';

export default function DocumentedPlaysPage() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');

  // Load dynamically from the ClientDB on mount
  useEffect(() => {
    setProductions(ClientDB.getProductions());
  }, []);

  // Filter productions dynamically
  const filteredProductions = productions.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.synopsis.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGenre = selectedGenre === 'All' || p.genre === selectedGenre;

    return matchesSearch && matchesGenre;
  });

  // Get distinct genres for filters based on active database
  const genres = ['All', ...Array.from(new Set(productions.map(p => p.genre)))];

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Plays Archive</h1>
          <p className="text-zinc-400 text-base md:text-lg max-w-2xl">
            A comprehensive living registry of African theatrical productions, classics, musicals, and stage histories.
          </p>
        </div>
        <Link
          href="/submit"
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-4 rounded-2xl transition-all shadow-lg shadow-red-900/20 text-center text-sm md:text-base shrink-0 border border-red-500/10"
        >
          <PlusCircle className="h-5 w-5" /> Submit Play for Listing
        </Link>
      </div>

      {/* Directory Controls */}
      <div className="flex flex-col lg:flex-row gap-6 mb-10 items-stretch lg:items-center justify-between">
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
          <input
            type="text"
            placeholder="Search documented plays by title, playwright, themes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 transition-all shadow-inner"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] py-1 shrink-0">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border whitespace-nowrap ${
                selectedGenre === genre
                  ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-900/10'
                  : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

      </div>

      {/* Main Grid View */}
      {filteredProductions.length === 0 ? (
        <div className="text-center py-24 bg-zinc-900/30 rounded-3xl border border-white/5 max-w-xl mx-auto px-6">
          <Drama className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="font-serif font-bold text-white text-lg mb-1">No Documented Plays Found</h3>
          <p className="text-sm text-zinc-500 leading-relaxed mb-6">
            We couldn&apos;t find any plays matching &ldquo;{searchQuery}&rdquo;. Help us fill our archives by submitting this playbill.
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white font-bold px-5 py-3 rounded-xl transition-all text-xs uppercase tracking-wider"
          >
            <PlusCircle className="h-4 w-4" /> Submit &ldquo;{searchQuery}&rdquo; Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredProductions.map(production => (
            <ProductionCard key={production.id} production={production} />
          ))}
        </div>
      )}

      {/* Directory Vetting Notice */}
      <div className="max-w-4xl mx-auto mt-16 p-6 bg-zinc-900/30 border border-white/5 rounded-3xl flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="p-3 bg-zinc-900 border border-white/10 rounded-2xl shrink-0">
          <FileText className="h-6 w-6 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-serif font-bold text-white mb-1 flex items-center gap-1.5 text-sm">
            <Info className="h-4 w-4 text-zinc-500" /> Vetting & Curatorial Standards
          </h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Curtain Call maintains archival integrity. Documented plays listed here comprise verified regional stages, credits, reviews, and historical data. Any theatrical community member can request additions or edit existing specifications by submitting verification credentials.
          </p>
        </div>
        <Link
          href="/submit"
          className="bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all shrink-0 whitespace-nowrap uppercase tracking-wider"
        >
          Submit Guidelines
        </Link>
      </div>

    </div>
  );
}
