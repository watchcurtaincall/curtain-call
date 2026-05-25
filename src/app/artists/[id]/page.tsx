'use client';

import { useState, useEffect, use } from 'react';
import { ClientDB } from '@/lib/db';
import { Artist } from '@/lib/types';
import Link from 'next/link';
import { ArrowLeft, Globe, LayoutGrid, List, Link as LinkIcon, Camera, User, Share2, Check } from 'lucide-react';
import { ProductionCard } from '@/components/shared/ProductionCard';
import { ImageLightbox } from '@/components/shared/ImageLightbox';
import { ArtistBioSection } from '@/components/artists/ArtistBioSection';
import { ShareModal } from '@/components/shared/ShareModal';

export default function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  // Load dynamically from the ClientDB on mount using the page param ID
  useEffect(() => {
    const loadData = () => {
      const fetched = ClientDB.getArtistById(resolvedParams.id);
      if (fetched) {
        setArtist(fetched);
      } else {
        // Fallback to first artist if not found
        const list = ClientDB.getArtists();
        if (list.length > 0) {
          setArtist(list[0]);
        }
      }
    };

    loadData();
    ClientDB.incrementArtistHits(resolvedParams.id);

    if (typeof window !== 'undefined') {
      window.addEventListener('cc-db-synced', loadData);
      return () => window.removeEventListener('cc-db-synced', loadData);
    }
  }, [resolvedParams.id]);

  // Mock stageography using all mock productions for demonstration
  const stageography = ClientDB.getProductions();

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-500 text-sm font-mono animate-pulse">
          Loading verified artist dossier...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen container mx-auto px-4 py-8 bg-zinc-950">
      <Link href="/artists" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" />
        Back to Directory
      </Link>
      
      <div className="flex flex-col md:flex-row gap-12 mb-16">
        {/* Profile Image with Lightbox */}
        <div className="relative w-48 h-48 md:w-64 md:h-64 shrink-0 rounded-full overflow-hidden border-4 border-zinc-800 shadow-2xl bg-zinc-900 flex items-center justify-center">
          {artist.headshotUrl ? (
            <ImageLightbox
              src={artist.headshotUrl}
              alt={artist.name}
              aspectRatio="aspect-square"
              rounded="rounded-full"
              priority={true}
            />
          ) : (
            <User className="h-20 w-20 text-zinc-700" />
          )}
        </div>
        
        {/* Profile Details */}
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2 animate-fade-up flex flex-wrap items-center gap-3">
            {artist.isDeceased ? `The Late ${artist.name}` : artist.name}
            {artist.isDeceased && (
              <span className="text-xs bg-zinc-800 border border-white/10 text-zinc-400 px-2.5 py-1 rounded-full uppercase tracking-wider font-sans font-bold">
                Late {artist.dateOfDeath ? `(d. ${new Date(artist.dateOfDeath).getFullYear()})` : ''}
              </span>
            )}
          </h1>
          <p className="text-xl text-zinc-400 uppercase tracking-widest mb-6">
            {artist.roleType}
          </p>
          
          <ArtistBioSection
            name={artist.name}
            roleType={artist.roleType}
            bio={artist.bio || `${artist.name} is a renowned ${artist.roleType.toLowerCase()} based in Lagos, Nigeria. With a rich history of contributions to the Nigerian theatre ecosystem, their work explores themes of tradition, modernity, and the human condition.`}
          />
          
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={toggleFollow}
              className={`px-6 py-2.5 rounded-full font-bold transition-all text-sm tracking-wide ${
                isFollowing
                  ? 'bg-zinc-800 text-zinc-300 border border-white/10 hover:bg-zinc-700 hover:text-white'
                  : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              {isFollowing ? '✓ Following' : 'Follow Artist'}
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="px-6 py-2.5 rounded-full font-bold transition-all text-sm tracking-wide bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 flex items-center justify-center gap-1.5 group"
            >
              <Share2 className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
              <span>Share</span>
            </button>
            <div className="flex items-center gap-3 text-zinc-400">
              <Link href="#" className="hover:text-white transition-colors p-2 bg-zinc-900 rounded-full">
                <Camera className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-white transition-colors p-2 bg-zinc-900 rounded-full">
                <LinkIcon className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-white transition-colors p-2 bg-zinc-900 rounded-full">
                <Globe className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stageography */}
      <section>
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-3xl font-serif font-bold text-white mb-2">Stageography</h2>
            <p className="text-zinc-400 text-sm">Professional production history</p>
          </div>
          <div className="flex bg-zinc-900 rounded-lg p-1 border border-white/5">
            <button className="p-2 bg-black rounded-md shadow-sm">
              <LayoutGrid className="h-4 w-4 text-white" />
            </button>
            <button className="p-2 hover:bg-black/50 rounded-md transition-colors text-zinc-500">
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {stageography.slice(0, 5).map(production => (
            <ProductionCard key={production.id} production={production} />
          ))}
        </div>
      </section>
      <ShareModal 
        isOpen={shareOpen} 
        onClose={() => setShareOpen(false)} 
        title={artist.name} 
        url={typeof window !== 'undefined' ? window.location.href : ''} 
      />
    </div>
  );
}
