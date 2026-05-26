'use client';

import { useState } from 'react';
import { X, Award, ShieldCheck, Heart, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Artist, Production } from '@/lib/types';
import { SuggestCreditModal } from './SuggestCreditModal';

interface CastCrewSectionProps {
  artists: Artist[];
  productionTitle: string;
  production?: Production;
}

// ── Smart fuzzy name matcher ──────────────────────────────────────────────────
// Handles: exact match, trimmed match, "First Last" ↔ "Last, First",
//          first-name-only match when last names differ by 1 char, etc.
function matchArtist(dbArtists: Artist[], memberName: string): Artist | undefined {
  if (!memberName) return undefined;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  const target = norm(memberName);

  // 1. Exact normalised match
  let match = dbArtists.find(a => norm(a.name) === target);
  if (match) return match;

  // 2. DB name contains member name (or vice-versa) — handles middle names / titles
  match = dbArtists.find(a => {
    const aName = norm(a.name);
    return aName.includes(target) || target.includes(aName);
  });
  if (match) return match;

  // 3. All words in target exist in the DB artist name (order-independent)
  const targetWords = target.split(' ').filter(Boolean);
  match = dbArtists.find(a => {
    const aWords = norm(a.name).split(' ').filter(Boolean);
    return targetWords.every(tw => aWords.some(aw => aw === tw || aw.startsWith(tw) || tw.startsWith(aw)));
  });
  return match;
}

export function CastCrewSection({ artists, productionTitle, production }: CastCrewSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);

  // Build credits from the production's castAndCrew array first
  const getFullCredits = () => {
    if (production?.castAndCrew && production.castAndCrew.length > 0) {
      return {
        creative: production.castAndCrew.filter(c => c.category === 'Creative'),
        cast: production.castAndCrew.filter(c => c.category === 'Cast'),
        technical: production.castAndCrew.filter(c => c.category === 'Technical')
      };
    }

    // Only allow seeded fallback credits for mock/seeded plays
    const isMockPlay = production?.id && /^p\d+$/.test(production.id);
    if (!isMockPlay) {
      return { creative: [], cast: [], technical: [] };
    }

    const isMotherland = productionTitle.toLowerCase().includes('motherland');
    const isWaterside = productionTitle.toLowerCase().includes('waterside');

    if (isMotherland) {
      return {
        creative: [
          { role: 'Director / Producer / Writer', name: 'Bolanle Austen-Peters' },
          { role: 'Co-Playwright', name: 'Makinde Adeniran' },
          { role: 'Stage Choreographer', name: 'Joshua Alabi' },
        ],
        cast: [
          { role: 'Young Hassana (Lead)', name: 'Temi Otedola' },
          { role: 'Older Hassana', name: 'Uzo Osimkpa' },
          { role: 'Adekola', name: 'Gideon Okeke' },
        ],
        technical: [
          { role: 'Technical Director', name: 'Tunde Jegede' },
          { role: 'Stage Manager', name: 'Chidi Okafor' },
        ],
      };
    } else if (isWaterside) {
      return {
        creative: [
          { role: 'Director / Writer', name: 'Joshua Alabi' },
          { role: 'Co-Producer', name: 'Bolanle Austen-Peters' },
        ],
        cast: [
          { role: 'Osarume (Lead)', name: 'Temi Otedola' },
          { role: 'Oghenovo (Lead)', name: 'Uzo Osimkpa' },
        ],
        technical: [
          { role: 'Stage Manager', name: 'Segun Alabi' },
          { role: 'Soundscape Design', name: 'Olumide Odukoya' },
        ],
      };
    } else {
      return {
        creative: [
          { role: 'Director / Writer', name: 'William Benson' },
          { role: 'Executive Producer', name: 'Bolanle Austen-Peters' },
        ],
        cast: [
          { role: 'Oba Ovonramwen (Lead)', name: 'William Benson' },
          { role: 'Consul Phillips', name: 'Makinde Adeniran' },
        ],
        technical: [
          { role: 'Stage Designer', name: 'Segun Alabi' },
        ],
      };
    }
  };

  const credits = getFullCredits();

  // Flatten all credits for the preview grid (up to 8)
  const allCreditsList = [
    ...credits.creative,
    ...credits.cast,
    ...credits.technical,
  ];

  // For each credit, attempt a fuzzy DB match so we can show real headshot + link
  const enriched = allCreditsList.slice(0, 8).map(member => {
    const matched = matchArtist(artists, member.name);
    return {
      name: member.name,
      role: member.role,
      // Prefer DB artist data if matched
      artist: matched || null,
    };
  });

  // ── Credit card renderer ────────────────────────────────────────────────
  const CreditCard = ({ name, role, artist }: { name: string; role: string; artist: Artist | null }) => {
    const href = artist ? `/artists/${artist.slug || artist.id}` : null;
    const headshotUrl = artist?.headshotUrl || '';

    const Inner = (
      <div className="flex flex-col items-center gap-2.5 text-center w-full group-hover:opacity-90 transition-opacity">
        {/* Avatar */}
        <div className="relative h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 lg:h-24 lg:w-24 overflow-hidden rounded-full bg-zinc-900 border-2 border-white/5 transition-all duration-300 group-hover:border-red-500/40 group-hover:shadow-xl group-hover:shadow-red-950/20 shrink-0">
          {headshotUrl ? (
            <img
              src={headshotUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-zinc-800/80 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-zinc-500">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          )}
          {/* "In DB" glow ring indicator */}
          {artist && (
            <div className="absolute inset-0 rounded-full ring-2 ring-red-500/30 ring-offset-0 pointer-events-none" />
          )}
        </div>

        {/* Name & role */}
        <div className="min-w-0 px-1">
          <h3 className={`font-serif text-sm sm:text-base lg:text-sm font-bold leading-snug line-clamp-2 transition-colors ${artist ? 'text-zinc-100 group-hover:text-red-400' : 'text-zinc-200'}`}>
            {name}
          </h3>
          <p className="text-[10px] sm:text-xs lg:text-[10px] text-zinc-400 mt-0.5 uppercase tracking-wider line-clamp-2 leading-normal">
            {role}
          </p>
          {artist && (
            <span className="inline-block mt-1 text-[9px] text-red-500/70 font-semibold tracking-widest uppercase">
              View Profile →
            </span>
          )}
        </div>
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="group flex flex-col items-center w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 rounded-2xl">
          {Inner}
        </Link>
      );
    }

    return (
      <div className="group flex flex-col items-center cursor-default w-full">
        {Inner}
      </div>
    );
  };

  // ── Credits modal row ────────────────────────────────────────────────────
  const ModalCreditRow = ({ name, role }: { name: string; role: string }) => {
    const matched = matchArtist(artists, name);
    const href = matched ? `/artists/${matched.slug || matched.id}` : null;

    const nameEl = href ? (
      <Link href={href} className="text-sm font-medium text-white hover:text-red-400 transition-colors underline-offset-2 hover:underline">
        {name}
      </Link>
    ) : (
      <span className="text-sm font-medium text-white">{name}</span>
    );

    return (
      <div className="flex flex-col">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{role}</span>
        {nameEl}
      </div>
    );
  };

  return (
    <div>
      {/* Suggest credit modal */}
      {showSuggest && production && (
        <SuggestCreditModal
          productionId={production.id}
          productionTitle={productionTitle}
          onClose={() => setShowSuggest(false)}
        />
      )}

      {/* Cast & Crew Preview Grid */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-red-600 rounded-full inline-block" />
          Cast & Crew
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSuggest(true)}
            className="text-sm text-zinc-400 hover:text-white font-bold transition-colors bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Suggest
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-red-500 hover:text-red-400 font-bold transition-colors uppercase tracking-wider bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl"
          >
            All Credits
          </button>
        </div>
      </div>

      {enriched.length === 0 ? (
        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-8 text-center text-zinc-500 text-xs font-mono backdrop-blur-md">
          🎬 No cast or crew credits listed yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 gap-x-4 gap-y-6">
          {enriched.map((item, idx) => (
            <CreditCard key={idx} name={item.name} role={item.role} artist={item.artist} />
          ))}
        </div>
      )}

      {/* Full Credits Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowModal(false)} />

          {/* Modal Box */}
          <div className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-zinc-900/50">
              <div>
                <h3 className="font-serif font-bold text-white text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-red-500" /> Complete Roster & Credits
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">{productionTitle}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable credit roll */}
            <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
              <div className="flex flex-col gap-8">

                {credits.creative.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 border-b border-red-500/10 pb-1.5">
                      Creative Team
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {credits.creative.map((c, i) => (
                        <ModalCreditRow key={i} name={c.name} role={c.role} />
                      ))}
                    </div>
                  </div>
                )}

                {credits.cast.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 border-b border-red-500/10 pb-1.5">
                      Cast & Character Billing
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {credits.cast.map((c, i) => (
                        <ModalCreditRow key={i} name={c.name} role={c.role} />
                      ))}
                    </div>
                  </div>
                )}

                {credits.technical.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 border-b border-red-500/10 pb-1.5">
                      Technical & Stage Operations
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {credits.technical.map((c, i) => (
                        <ModalCreditRow key={i} name={c.name} role={c.role} />
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 bg-zinc-900/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                <ShieldCheck className="h-3.5 w-3.5 text-zinc-600" /> Officially registered play credits. Handcrafted with <Heart className="h-3 w-3 text-red-500/50 fill-red-500/20" /> on Curtain Call.
              </div>
              {production && (
                <button
                  onClick={() => { setShowModal(false); setShowSuggest(true); }}
                  className="shrink-0 text-[11px] font-bold text-red-500 hover:text-red-400 uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                  <Plus className="h-3 w-3" /> Suggest Credit
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
