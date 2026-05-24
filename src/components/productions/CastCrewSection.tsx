'use client';

import { useState } from 'react';
import { X, Award, ShieldCheck, Heart } from 'lucide-react';
import { ArtistCard } from '@/components/shared/ArtistCard';
import { Artist, Production } from '@/lib/types';

interface CastCrewSectionProps {
  artists: Artist[];
  productionTitle: string;
  production?: Production;
}

export function CastCrewSection({ artists, productionTitle, production }: CastCrewSectionProps) {
  const [showModal, setShowModal] = useState(false);

  // Custom detailed credits based on production
  const getFullCredits = () => {
    if (production?.castAndCrew && production.castAndCrew.length > 0) {
      return {
        creative: production.castAndCrew.filter(c => c.category === 'Creative'),
        cast: production.castAndCrew.filter(c => c.category === 'Cast'),
        technical: production.castAndCrew.filter(c => c.category === 'Technical')
      };
    }

    const isMotherland = productionTitle.toLowerCase().includes('motherland');
    const isWaterside = productionTitle.toLowerCase().includes('waterside');
    const isOba = productionTitle.toLowerCase().includes('oba') || productionTitle.toLowerCase().includes('ovonramwen');

    if (isMotherland) {
      return {
        creative: [
          { role: 'Director / Producer / Writer', name: 'Bolanle Austen-Peters' },
          { role: 'Co-Playwright', name: 'Makinde Adeniran' },
          { role: 'Stage Choreographer', name: 'Joshua Alabi' },
          { role: 'Costume Designer', name: 'Ituen Basi' },
          { role: 'Set & Lighting Design', name: 'Yinka Adebayo' },
        ],
        cast: [
          { role: 'Young Hassana (Lead)', name: 'Temi Otedola' },
          { role: 'Older Hassana', name: 'Uzo Osimkpa' },
          { role: 'Oba Ovonramwen', name: 'William Benson' },
          { role: 'Adekola', name: 'Gideon Okeke' },
          { role: 'Ensemble Lead', name: 'Tosin Adeyemi' },
        ],
        technical: [
          { role: 'Technical Director', name: 'Tunde Jegede' },
          { role: 'Stage Manager', name: 'Chidi Okafor' },
          { role: 'Sound Engineer', name: 'Olumide Odukoya' },
          { role: 'Stage Crew Lead', name: 'Segun Alabi' },
        ],
      };
    } else if (isWaterside) {
      return {
        creative: [
          { role: 'Director / Writer', name: 'Joshua Alabi' },
          { role: 'Co-Producer', name: 'Bolanle Austen-Peters' },
          { role: 'Set Designer', name: 'William Benson' },
        ],
        cast: [
          { role: 'Osarume (Lead)', name: 'Temi Otedola' },
          { role: 'Oghenovo (Lead)', name: 'Uzo Osimkpa' },
          { role: 'The Totem Voice', name: 'Makinde Adeniran' },
        ],
        technical: [
          { role: 'Stage Manager', name: 'Segun Alabi' },
          { role: 'Soundscape Design', name: 'Olumide Odukoya' },
          { role: 'Lighting Designer', name: 'Yinka Adebayo' },
        ],
      };
    } else {
      return {
        creative: [
          { role: 'Director / Writer', name: 'William Benson' },
          { role: 'Executive Producer', name: 'Bolanle Austen-Peters' },
          { role: 'Choreography Lead', name: 'Joshua Alabi' },
        ],
        cast: [
          { role: 'Oba Ovonramwen (Lead)', name: 'William Benson' },
          { role: 'Consul Phillips', name: 'Makinde Adeniran' },
          { role: 'Queen Sandra', name: 'Uzo Osimkpa' },
        ],
        technical: [
          { role: 'Historical Consultant', name: 'Professor E. B. Benin' },
          { role: 'Stage Designer', name: 'Segun Alabi' },
          { role: 'Lighting Operator', name: 'Yinka Adebayo' },
        ],
      };
    }
  };

  const credits = getFullCredits();
  
  // Find database matches for the first 8 cast & creative crew members
  const dbArtists = artists && artists.length > 0 ? artists : [];
  const castList = credits.cast || [];
  const creativeList = credits.creative || [];
  const allCreditsList = [...creativeList, ...castList];

  const matchedPreviewArtists = allCreditsList.slice(0, 8).map(member => {
    const matched = dbArtists.find(a => a.name.toLowerCase() === member.name.toLowerCase());
    if (matched) {
      return {
        ...matched,
        roleType: member.role
      };
    } else {
      return {
        id: '', // Virtual/Dynamic
        name: member.name,
        roleType: member.role,
        headshotUrl: '', // Default placeholder SVG
      } as Artist;
    }
  });

  return (
    <div>
      {/* Cast & Crew Preview Grid */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-red-600 rounded-full inline-block" />
          Cast & Crew
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-red-500 hover:text-red-400 font-bold transition-colors uppercase tracking-wider bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl"
        >
          All Credits
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {matchedPreviewArtists.map((artist, idx) => (
          <ArtistCard key={artist.id || idx} artist={artist} />
        ))}
      </div>

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
                  <Award className="h-5 w-5 text-red-500" /> Complete Playbill & Credits
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
                
                {/* 1. CREATIVE TEAM */}
                <div>
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 border-b border-red-500/10 pb-1.5">
                    Creative Team
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {credits.creative.map((c, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{c.role}</span>
                        <span className="text-sm font-medium text-white mt-0.5">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. CAST BILLING */}
                <div>
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 border-b border-red-500/10 pb-1.5">
                    Cast & Character Billing
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {credits.cast.map((c, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{c.role}</span>
                        <span className="text-sm font-medium text-white mt-0.5">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. TECHNICAL & STAGE CREW */}
                <div>
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 border-b border-red-500/10 pb-1.5">
                    Technical & Stage Operations
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {credits.technical.map((c, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{c.role}</span>
                        <span className="text-sm font-medium text-white mt-0.5">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Footer with a theatre credit note */}
            <div className="px-6 py-4 border-t border-white/5 bg-zinc-900/30 text-center flex items-center justify-center gap-1.5 text-xs text-zinc-600">
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-600" /> Officially registered Playbill credits. Handcrafted with <Heart className="h-3 w-3 text-red-500/50 fill-red-500/20" /> on Curtain Call.
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
