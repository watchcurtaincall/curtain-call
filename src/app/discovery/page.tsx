'use client';

import { useState, useMemo, useEffect } from 'react';
import { ClientDB, sortItemsByDateAdded } from '@/lib/db';
import { Production } from '@/lib/types';
import { ProductionCard } from '@/components/shared/ProductionCard';
import { Search, Filter, X } from 'lucide-react';

const FILTERS = ['All Shows', 'Currently Showing', 'Coming Soon', 'Highly Rated', 'Musical', 'Drama'];

export default function DiscoveryPage() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Shows');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // 2 columns * 10 rows = 20 items per page

  // Reset pagination on query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query, activeFilter]);

  useEffect(() => {
    const loadData = () => {
      // Sort plays by date added so newly added plays appear at the top!
      setProductions(sortItemsByDateAdded(ClientDB.getProductions().filter(p => p.status !== 'Draft')));
      setLoading(false);
    };
    loadData();

    if (typeof window !== 'undefined') {
      window.addEventListener('cc-db-synced', loadData);
      return () => window.removeEventListener('cc-db-synced', loadData);
    }
  }, []);

  const results = useMemo(() => {
    let list = [...productions];

    // Text search across title, synopsis, venue, genre
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.synopsis?.toLowerCase().includes(q) ||
        p.venue.toLowerCase().includes(q) ||
        p.genre.toLowerCase().includes(q)
      );
    }

    // Status / genre filter
    switch (activeFilter) {
      case 'Currently Showing':
        list = list.filter(p => p.status === 'Currently Showing');
        break;
      case 'Coming Soon':
        list = list.filter(p => p.status === 'Coming Soon');
        break;
      case 'Highly Rated':
        list = list.filter(p => (p.criticScore ?? 0) >= 85).sort((a, b) => (b.criticScore ?? 0) - (a.criticScore ?? 0));
        break;
      case 'Musical':
        list = list.filter(p => p.genre.toLowerCase().includes('musical'));
        break;
      case 'Drama':
        list = list.filter(p => p.genre.toLowerCase().includes('drama'));
        break;
    }

    // Ensure all lists (except Highly Rated) are explicitly sorted by date added descending (newest first)
    if (activeFilter !== 'Highly Rated') {
      list = sortItemsByDateAdded(list);
    }

    return list;
  }, [productions, query, activeFilter]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-950">
        <div className="w-10 h-10 border-2 border-zinc-800 border-t-red-600 rounded-full animate-spin" />
        <span className="text-xs text-zinc-500 font-mono tracking-widest uppercase">Loading Curation...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">Discovery</h1>
        <p className="text-zinc-400 text-base max-w-xl">
          Explore the vibrant world of African theatre — running shows, historical epics, and anticipated premieres.
        </p>
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search productions, venues, genres…"
            className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25 transition-all"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button className="p-3 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors">
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-1 [scrollbar-width:none]">
        {FILTERS.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
              activeFilter === filter
                ? 'bg-white text-black border-white'
                : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white hover:border-white/25'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Results */}
      {results.length > 0 ? (
        <>
          <p className="text-xs text-zinc-600 mb-6 uppercase tracking-wider">
            {results.length} production{results.length !== 1 ? 's' : ''}{query ? ` for "${query}"` : ''}
          </p>
          <div className="flex flex-col gap-10">
            {/* Strict 2-column grid to keep listings extremely neat and organized */}
            <div className="grid grid-cols-2 gap-6">
              {results
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map(p => (
                  <ProductionCard key={p.id} production={p} />
                ))}
            </div>

            {/* Premium Glassmorphic Pagination Controls */}
            {Math.ceil(results.length / itemsPerPage) > 1 && (
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
                  Page {currentPage} of {Math.ceil(results.length / itemsPerPage)}
                </span>
                <button
                  type="button"
                  disabled={currentPage === Math.ceil(results.length / itemsPerPage)}
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(results.length / itemsPerPage), p + 1))}
                  className="px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-800 disabled:cursor-not-allowed transition-all border border-white/5"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="text-5xl">🎭</div>
          <h2 className="text-xl font-serif font-bold text-white">No results found</h2>
          <p className="text-zinc-500 text-sm max-w-xs">
            We couldn&apos;t find anything matching &quot;{query}&quot;. Try a different search or remove filters.
          </p>
          <button
            onClick={() => { setQuery(''); setActiveFilter('All Shows'); }}
            className="mt-2 text-sm text-red-500 hover:text-red-400 underline"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
