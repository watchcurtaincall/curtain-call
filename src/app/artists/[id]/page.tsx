'use client';

import { useState, useEffect, use } from 'react';
import { ClientDB } from '@/lib/db';
import { Artist } from '@/lib/types';
import Link from 'next/link';
import { ArrowLeft, Globe, LayoutGrid, List, Link as LinkIcon, Camera, User, Share2, Award, BookOpen, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { ProductionCard } from '@/components/shared/ProductionCard';
import { ImageLightbox } from '@/components/shared/ImageLightbox';
import { ShareModal } from '@/components/shared/ShareModal';

export default function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [hasSynced, setHasSynced] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Load dynamically from the ClientDB on mount using the page param ID
  useEffect(() => {
    const loadData = () => {
      const fetched = ClientDB.getArtistById(resolvedParams.id);
      if (fetched) {
        setArtist(fetched);
      } else {
        setArtist(null);
      }
    };

    loadData();
    ClientDB.incrementArtistHits(resolvedParams.id);

    const handleSync = () => {
      loadData();
      setHasSynced(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('cc-db-synced', handleSync);
      return () => window.removeEventListener('cc-db-synced', handleSync);
    }
  }, [resolvedParams.id]);

  // Map dynamic stageography credits (null-safe: artist may not be loaded yet)
  const explicitScenography = artist?.scenography || [];
  
  // Find all productions where the artist is credited in castAndCrew
  const implicitProductions = artist ? ClientDB.getProductions().filter(p => {
    return p.castAndCrew?.some(member => 
      member.name.toLowerCase().trim() === artist.name.toLowerCase().trim()
    );
  }) : [];

  // Merge them to avoid duplicates, prioritizing explicit scenography details
  const stageographyMap = new Map<string, { productionId: string; role: string }>();

  // Add implicit matches first
  implicitProductions.forEach(prod => {
    if (artist) {
      const member = prod.castAndCrew?.find(m => m.name.toLowerCase().trim() === artist.name.toLowerCase().trim());
      if (member) {
        stageographyMap.set(prod.id, {
          productionId: prod.id,
          role: member.role
        });
      }
    }
  });

  // Add explicit scenography (overrides/updates implicit roles if duplicated)
  explicitScenography.forEach((item: any) => {
    stageographyMap.set(item.productionId, item);
  });

  const stageographyProductions = Array.from(stageographyMap.values())
    .map((item: any) => {
      const prod = ClientDB.getProductions().find(p => p.id === item.productionId);
      if (prod) {
        return {
          ...prod,
          artistRole: item.role
        };
      }
      return null;
    })
    .filter(Boolean) as any[];

  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const status = localStorage.getItem(`curtain_followed_${resolvedParams.id}`) === 'true';
      setIsFollowing(status);
    }
  }, [resolvedParams.id]);

  const toggleFollow = () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    localStorage.setItem(`curtain_followed_${resolvedParams.id}`, String(nextState));
  };

  if (!artist) {
    if (hasSynced) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4 text-center">
          <h2 className="text-2xl font-serif font-bold text-white mb-2">Theatremaker Profile Not Found</h2>
          <p className="text-zinc-400 text-sm max-w-md mb-6">
            We couldn't find the profile dossier for this theatremaker. It may have been retired or you might have used an invalid link.
          </p>
          <Link href="/artists" className="text-sm bg-red-600 text-white font-medium px-6 py-2.5 rounded-full hover:bg-red-700 transition-colors">
            Back to Directory
          </Link>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-500 text-sm font-mono animate-pulse">
          Loading verified artist dossier...
        </div>
      </div>
    );
  }

  // Fallbacks or real values for biography sections
  const showBio = artist.bio || '';
  const showCareer = artist.career || '';
  const showStyle = artist.style || '';
  const showAchievements = artist.achievements && artist.achievements.length > 0 ? artist.achievements : [];
  const showAwards = artist.awards && artist.awards.length > 0 ? artist.awards : [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 selection:bg-red-600 selection:text-white">
      
      {/* ── BACKGROUND GLOW EFFECT ── */}
      <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-red-950/15 via-red-900/5 to-transparent pointer-events-none z-0 blur-[120px]" />

      {/* ── MAIN CONTAINER ── */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-8">
        
        {/* Navigation Breadcrumb */}
        <Link href="/artists" className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors mb-8 group bg-zinc-900/40 border border-white/5 px-4 py-2 rounded-xl backdrop-blur-md">
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Directory</span>
        </Link>

        {/* ── TOP HERO BANNER ── */}
        <div className="relative rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-r from-zinc-900/60 via-zinc-900/40 to-zinc-950/90 p-6 sm:p-8 lg:p-12 mb-12 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12">
            {/* Round Headshot Frame (Modern Avatar Style) */}
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 shrink-0 rounded-full overflow-hidden border-4 border-zinc-800 shadow-2xl bg-zinc-950 flex items-center justify-center group">
              <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
              {artist.headshotUrl ? (
                <ImageLightbox
                  src={artist.headshotUrl}
                  alt={artist.name}
                  aspectRatio="aspect-square"
                  rounded="rounded-full"
                  priority={true}
                />
              ) : (
                <User className="h-20 w-20 text-zinc-700 stroke-[1.25]" />
              )}
            </div>

            {/* Profile Title Block */}
            <div className="flex-1 text-center lg:text-left self-center">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mb-3">
                <span className="bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Star className="h-3 w-3 fill-red-400/20" /> Verified Artiste
                </span>
                {artist.isDeceased && (
                  <span className="bg-zinc-800 border border-white/5 text-zinc-400 font-mono text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
                    Late {artist.dateOfDeath ? `(d. ${new Date(artist.dateOfDeath).getFullYear()})` : ''}
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
                {artist.isDeceased ? `The Late ${artist.name}` : artist.name}
              </h1>
              <p className="text-base sm:text-lg text-zinc-400 font-mono uppercase tracking-widest mt-2">
                {artist.roleType}
              </p>
              
              {/* Interaction Row */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-6">
                <button
                  onClick={toggleFollow}
                  className={`px-5 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-wider ${
                    isFollowing
                      ? 'bg-zinc-800 text-zinc-300 border border-white/10 hover:bg-zinc-700 hover:text-white'
                      : 'bg-white text-black hover:bg-zinc-200 shadow-xl shadow-white/5'
                  }`}
                >
                  {isFollowing ? '✓ Following Artiste' : 'Follow Artiste'}
                </button>
                <button
                  onClick={() => setShareOpen(true)}
                  className="px-5 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 text-white border border-white/5 flex items-center justify-center gap-1.5 group"
                >
                  <Share2 className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
                  <span>Share</span>
                </button>
                <div className="flex items-center gap-2 bg-zinc-950/60 border border-white/5 p-1 rounded-xl">
                  <Link href="#" className="hover:text-white transition-colors p-2 text-zinc-500 rounded-lg hover:bg-zinc-900">
                    <Camera className="h-4 w-4" />
                  </Link>
                  <Link href="#" className="hover:text-white transition-colors p-2 text-zinc-500 rounded-lg hover:bg-zinc-900">
                    <LinkIcon className="h-4 w-4" />
                  </Link>
                  <Link href="#" className="hover:text-white transition-colors p-2 text-zinc-500 rounded-lg hover:bg-zinc-900">
                    <Globe className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── TWO-COLUMN CONTENT AREA (WIKIPEDIA TYPE GRID) ── */}
        <div className="grid lg:grid-cols-12 gap-8 items-start mb-16">
          
          {/* LEFT COLUMN: NARRATIVE ARTICLE STREAM (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            
            {/* SECTION 1: EXECUTIVE SUMMARY / BIOGRAPHY */}
            {showBio && (
              <article className="prose prose-invert max-w-none">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white border-b border-white/10 pb-2.5 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-red-500 shrink-0" /> Biography & History
                </h2>
                <p className="text-zinc-300 leading-relaxed text-base sm:text-lg font-serif italic border-l-2 border-red-500/50 pl-5 my-6">
                  {showBio}
                </p>
              </article>
            )}

            {/* SECTION 2: CAREER & PROJECTS */}
            {showCareer && (
              <article className="prose prose-invert max-w-none">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white border-b border-white/10 pb-2.5 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-red-500 shrink-0" /> Theatrical Career
                </h2>
                <p className="text-zinc-300 leading-relaxed text-sm sm:text-base mt-4">
                  {showCareer}
                </p>
              </article>
            )}

            {/* SECTION 3: ARTISTIC STYLE & THEMES */}
            {showStyle && (
              <article className="prose prose-invert max-w-none">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white border-b border-white/10 pb-2.5 flex items-center gap-2">
                  <Star className="h-5 w-5 text-red-500 shrink-0" /> Style & Aesthetic
                </h2>
                <p className="text-zinc-300 leading-relaxed text-sm sm:text-base mt-4">
                  {showStyle}
                </p>
              </article>
            )}

            {/* SECTION 4: PLAYBILL ACHIEVEMENTS */}
            {showAchievements.length > 0 && (
              <article className="prose prose-invert max-w-none">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white border-b border-white/10 pb-2.5 flex items-center gap-2">
                  <Award className="h-5 w-5 text-red-500 shrink-0" /> Documented Achievements
                </h2>
                <ul className="flex flex-col gap-3 mt-5 pl-1">
                  {showAchievements.map((ach, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-zinc-400 bg-zinc-900/30 border border-white/5 rounded-2xl p-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0 animate-pulse" />
                      <span className="leading-relaxed">{ach}</span>
                    </li>
                  ))}
                </ul>
              </article>
            )}

            {/* SECTION 5: AWARDS & RECOGNITIONS */}
            {showAwards.length > 0 && (
              <article className="prose prose-invert max-w-none">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white border-b border-white/10 pb-2.5 flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500 shrink-0" /> Awards & Recognitions
                </h2>
                <div className="mt-5 overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/30">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 font-medium">Year</th>
                        <th className="px-4 py-3 font-medium">Award</th>
                        <th className="px-4 py-3 font-medium hidden sm:table-cell">Category</th>
                        <th className="px-4 py-3 font-medium text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[...showAwards].sort((a, b) => parseInt(b.year) - parseInt(a.year)).map((award, idx) => (
                        <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-4 text-zinc-300 font-mono">{award.year}</td>
                          <td className="px-4 py-4">
                            <span className="font-bold text-white">{award.title}</span>
                            <div className="sm:hidden text-xs text-zinc-500 mt-0.5">{award.category}</div>
                          </td>
                          <td className="px-4 py-4 text-zinc-400 hidden sm:table-cell">{award.category}</td>
                          <td className="px-4 py-4 text-right">
                            <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${
                              award.status === 'won' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]' :
                              award.status === 'nominated' ? 'bg-zinc-800/80 text-zinc-300 border-white/10' :
                              'bg-zinc-950/80 text-zinc-500 border-white/5'
                            }`}>
                              {award.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            )}

          </div>

          {/* RIGHT COLUMN: STICKY INFOBOX / DEMOGRAPHICS FACTSHEET (4 cols) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24">
            
            {/* Factsheet Box Card */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/5 rounded-full blur-[60px] pointer-events-none" />
              
              <div className="border-b border-white/5 pb-4 mb-4 text-center">
                <h3 className="font-serif font-bold text-lg text-white">Artiste Factsheet</h3>
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">Dossier profile statistics</p>
              </div>

              {/* Data Rows */}
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Role Type', value: artist.roleType },
                  { label: 'Platform Status', value: artist.isDeceased ? 'Honorary (Deceased)' : 'Active Contributor', valueColor: artist.isDeceased ? 'text-zinc-500' : 'text-emerald-400 font-bold' },
                  { label: 'Total Show Hits', value: `${(artist.hits || 0).toLocaleString()} views` },
                  { label: 'Credentials ID', value: artist.id.toUpperCase().substring(0, 12), fontMono: true },
                  { label: 'Theatremaker', value: 'Verified Member', icon: ShieldCheck }
                ].map((row, idx) => {
                  const RowIcon = row.icon;
                  return (
                    <div key={idx} className="flex justify-between items-start gap-4 text-xs border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <span className="text-zinc-500 font-mono uppercase tracking-wider">{row.label}</span>
                      <span className={`text-right text-white font-medium flex items-center gap-1.5 ${row.fontMono ? 'font-mono' : ''} ${row.valueColor || ''}`}>
                        {RowIcon && <RowIcon className="h-4.5 w-4.5 text-red-500" />}
                        {row.value}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Footer Quote block */}
              <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-4 mt-6 text-[11px] text-zinc-500 italic leading-relaxed text-center font-serif">
                &ldquo;Art is the mirror of the human condition. We build platforms so these creatives live forever.&rdquo;
              </div>

            </div>
          </aside>

        </div>

        {/* ── STAGEOGRAPHY BLOCK ── */}
        <section className="border-t border-white/10 pt-12">
          <div className="flex items-center justify-between mb-8 pb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">Stageography</h2>
              <p className="text-zinc-500 text-sm mt-1">Professional theatrical play history logged on Curtain Call</p>
            </div>
            <div className="flex bg-zinc-900/60 rounded-xl p-1 border border-white/5 backdrop-blur-md">
              <button className="p-2 bg-black rounded-lg shadow-md border border-white/5">
                <LayoutGrid className="h-4 w-4 text-white" />
              </button>
              <button className="p-2 hover:bg-black/30 rounded-lg transition-colors text-zinc-600">
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {stageographyProductions.length === 0 ? (
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-12 text-center text-zinc-500 font-mono text-xs max-w-md mx-auto">
              No stageography credits documented on Curtain Call yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {stageographyProductions.map(production => (
                <div key={production.id} className="relative group">
                  <ProductionCard production={production} />
                  <div className="absolute top-3 left-3 bg-red-600/90 text-white font-mono text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-lg border border-red-500/20 backdrop-blur-sm">
                    {production.artistRole}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      <ShareModal 
        isOpen={shareOpen} 
        onClose={() => setShareOpen(false)} 
        title={artist.name} 
        url={typeof window !== 'undefined' ? window.location.href : ''} 
      />
    </div>
  );
}
