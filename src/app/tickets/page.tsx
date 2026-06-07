'use client';

import { useState, useEffect } from 'react';
import { ClientDB, syncFromSupabase, sortItemsByDateAdded } from '@/lib/db';
import { Production } from '@/lib/types';
import { ProductionCard } from '@/components/shared/ProductionCard';
import { Search, Ticket, Drama, ExternalLink, Info, FileText, Calendar, MapPin, Sparkles, Filter } from 'lucide-react';
import Link from 'next/link';

export default function BoxOfficeTicketsPage() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'CurtainCall' | 'External'>('All');
  const [selectedType, setSelectedType] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter, selectedType]);

  useEffect(() => {
    const loadData = () => {
      // Load and filter only plays that have tickets (external link OR ticket tiers) and are active/upcoming!
      const all = ClientDB.getProductions();
      const ticketed = all.filter(p => {
        const hasTickets = p.externalTicketUrl || (p.ticketTiers && p.ticketTiers.length > 0);
        const isActive = p.status === 'Currently Showing' || p.status === 'Coming Soon';
        return hasTickets && isActive && p.curationStatus !== 'Pending' && p.curationStatus !== 'Declined';
      });
      setProductions(sortItemsByDateAdded(ticketed));
    };
    
    loadData();
    syncFromSupabase();

    if (typeof window !== 'undefined') {
      window.addEventListener('cc-db-synced', loadData);
      return () => window.removeEventListener('cc-db-synced', loadData);
    }
  }, []);

  const filteredProductions = productions.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.genre.toLowerCase().includes(searchQuery.toLowerCase());

    const pType = p.eventType || 'Theatre';
    const matchesType = selectedType === 'All' || pType === selectedType;

    let matchesFilter = true;
    if (selectedFilter === 'CurtainCall') {
      matchesFilter = !!(p.ticketTiers && p.ticketTiers.length > 0);
    } else if (selectedFilter === 'External') {
      matchesFilter = !!p.externalTicketUrl;
    }

    return matchesSearch && matchesType && matchesFilter;
  });

  const eventTypes = ['All', ...Array.from(new Set(productions.map(p => p.eventType || 'Theatre')))];

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-12 min-h-screen relative">
      {/* Background radial highlight */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-red-950/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-6 border-b border-white/5 relative z-10">
        <div>
          <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 mb-3 shadow-md">
            <Sparkles className="h-3 w-3 animate-pulse" /> Live Admissions & Passes
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">Curtain Call Box Office</h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mt-2 leading-relaxed">
            Discover upcoming shows, claim premium admissions vouchers, and purchase gate entries securely.
          </p>
        </div>

        <Link
          href="/create"
          className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 hover:text-white font-bold px-5 py-3.5 rounded-2xl transition-all shadow-xl text-xs uppercase tracking-widest shrink-0 active:scale-98"
        >
          <Ticket className="h-4.5 w-4.5 text-red-500 shrink-0" /> Sell a Ticket
        </Link>
      </div>

      {/* Event Filters & Search controls */}
      <div className="flex flex-col lg:flex-row gap-6 mb-10 items-stretch lg:items-center justify-between relative z-10">
        
        {/* Search */}
        <div className="relative flex-1 max-w-xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Search active ticketed shows by venue, title, or themes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 transition-all shadow-inner"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex bg-zinc-900 border border-white/5 p-1 rounded-xl shrink-0">
            {[
              { id: 'All', label: 'All Tickets' },
              { id: 'CurtainCall', label: 'Curtain Call Direct' },
              { id: 'External', label: 'External Links' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  selectedFilter === f.id
                    ? 'bg-zinc-800 text-white border border-white/5 shadow-md'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
            {eventTypes.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                  selectedType === type
                    ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-950/20'
                    : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Grid */}
      {filteredProductions.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-white/5 max-w-xl mx-auto px-6 relative z-10 animate-fade-up">
          <Ticket className="h-12 w-12 text-zinc-700 mx-auto mb-4 animate-bounce" />
          <h3 className="font-serif font-bold text-white text-lg mb-1">No Active Tickets Found</h3>
          <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto mb-6">
            We couldn't find any ticketed events matching your search query or filters. Check back soon for fresh stage premieres!
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedFilter('All'); setSelectedType('All'); }}
            className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-10 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 w-full">
            {filteredProductions
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map(production => (
                <div key={production.id} className="relative group">
                  <ProductionCard production={production} showTicketBadge={true} />
                </div>
              ))}
          </div>

          {/* Pagination */}
          {Math.ceil(filteredProductions.length / itemsPerPage) > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4 bg-zinc-900/60 border border-white/5 p-3 rounded-2xl max-w-xs mx-auto backdrop-blur-xl shadow-2xl">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-800 disabled:cursor-not-allowed transition-all border border-white/5"
              >
                Prev
              </button>
              <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest font-semibold">
                Page {currentPage} of {Math.ceil(filteredProductions.length / itemsPerPage)}
              </span>
              <button
                type="button"
                disabled={currentPage === Math.ceil(filteredProductions.length / itemsPerPage)}
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredProductions.length / itemsPerPage), p + 1))}
                className="px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-800 disabled:cursor-not-allowed transition-all border border-white/5"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Fine-print FAQ footer */}
      <div className="max-w-4xl mx-auto mt-16 p-6 bg-zinc-900/30 border border-white/5 rounded-3xl flex flex-col md:flex-row gap-4 items-start md:items-center relative z-10">
        <div className="p-3 bg-zinc-900 border border-white/10 rounded-2xl shrink-0">
          <Info className="h-6 w-6 text-red-500" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <h4 className="font-serif font-bold text-white mb-1 flex items-center gap-1.5 text-sm">
            Curtain Call Box Office Admissions Guarantee
          </h4>
          <p className="text-[11px] text-zinc-550 leading-relaxed">
            All tickets bought directly on Curtain Call are securely processed and backed by digital admissions gate passes. The gate check-in scanning is managed directly by the production team. For external tickets, purchases are made directly on the respective ticketing partner's platforms.
          </p>
        </div>
      </div>

    </div>
  );
}
