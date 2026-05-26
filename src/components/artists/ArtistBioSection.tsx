'use client';

import { useState } from 'react';
import { BookOpen, X, Sparkles, Award, FileText } from 'lucide-react';

interface ArtistBioSectionProps {
  name: string;
  roleType: string;
  bio: string;
  career?: string;
  style?: string;
  achievements?: string[];
}

export function ArtistBioSection({ name, roleType, bio, career, style, achievements }: ArtistBioSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Generate detailed Wikipedia-style sections dynamically for the modal, removing hardcoded BAP/Lagos dummy texts
  const wikiSections = {
    overview: bio,
    career: career || `${name} is a leading creative force in the contemporary African stage landscape. Working extensively in professional ${roleType.toLowerCase()} roles, they have contributed to numerous key productions that bridge traditional folklore with global modernism.`,
    style: style || `Characterized by thorough technical precision, creative interpretation, and a deep respect for theatrical heritage, ${name}'s theatrical work continues to inspire theatremakers and curators alike.`,
    achievements: (achievements && achievements.length > 0) ? achievements : [
      `Distinguished ${roleType.toLowerCase()} career in live African theatre`,
      'Contributed verified stage credits to the Curtain Call Playbill Directory',
      'Verified Contributor to the African Theatre History Archive'
    ]
  };

  return (
    <>
      <div className="max-w-2xl mb-8">
        <p className="text-zinc-300 leading-relaxed text-base line-clamp-3">
          {bio}
        </p>
        <button
          onClick={() => setIsOpen(true)}
          className="mt-3 text-sm text-red-500 hover:text-red-400 font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 bg-red-500/5 hover:bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/20"
        >
          <BookOpen className="h-4 w-4" /> Read Full Biography & History
        </button>
      </div>

      {/* Wikipedia-style Biography Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl animate-scale-up">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-500" />
                <div>
                  <h3 className="font-serif font-bold text-white text-lg">Theatrical Biography</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">{roleType}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Wiki Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
              
              {/* Name Block */}
              <div>
                <h2 className="text-3xl font-serif font-bold text-white">{name}</h2>
                <div className="w-12 h-1 bg-red-600 rounded-full mt-2" />
              </div>

              {/* Section 1: Overview */}
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-red-500" /> Executive Summary
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed font-normal bg-zinc-900/50 p-4 border border-white/5 rounded-2xl">
                  {wikiSections.overview}
                </p>
              </div>

              {/* Section 2: Career History */}
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                  Theatrical Career & Milestones
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {wikiSections.career}
                </p>
              </div>

              {/* Section 3: Artistic Style */}
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                  Performance Aesthetic & Style
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {wikiSections.style}
                </p>
              </div>

              {/* Section 4: Documented Achievements */}
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-red-500" /> Documented Playbill Achievements
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {wikiSections.achievements.map((item, index) => (
                    <li key={index} className="flex gap-2.5 text-xs text-zinc-400">
                      <span className="text-red-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 bg-zinc-900/30 text-center text-[10px] text-zinc-600 font-mono uppercase tracking-wider">
              Curtain Call Verified Theatrical Encyclopaedia
            </div>

          </div>
        </div>
      )}
    </>
  );
}
