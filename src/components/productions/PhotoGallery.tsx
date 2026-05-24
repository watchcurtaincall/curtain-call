'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Grid, Maximize2 } from 'lucide-react';

interface PhotoGalleryProps {
  productionTitle: string;
  galleryImages?: string[];
}

const DEFAULT_GALLERY_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=1200&auto=format&fit=crop',
    caption: 'Visceral opening sequence under heavy mist.',
  },
  {
    url: 'https://images.unsplash.com/photo-1503095396549-807759245b35?q=80&w=1200&auto=format&fit=crop',
    caption: 'Lead protagonist delivers an intense monologue.',
  },
  {
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
    caption: 'Stunning set design capturing the raw theatrical grandeur.',
  },
  {
    url: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?q=80&w=1200&auto=format&fit=crop',
    caption: 'Full-house standing ovation during the final curtain call.',
  },
  {
    url: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=1200&auto=format&fit=crop',
    caption: 'Dramatic silhouette choreographies in Act II.',
  },
  {
    url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=1200&auto=format&fit=crop',
    caption: 'A candid glimpse into backstage dress rehearsals.',
  },
];

export function PhotoGallery({ productionTitle, galleryImages = [] }: PhotoGalleryProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!galleryImages || galleryImages.length === 0) {
    return null;
  }

  const photos = galleryImages.map((url, i) => ({
    url,
    caption: `Stage photography scene ${i + 1}`,
  }));

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const nextPhoto = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % photos.length);
    }
  };

  const prevPhoto = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-red-600 rounded-full inline-block" />
          Production Gallery
        </h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-wider bg-red-500/5 hover:bg-red-500/10 border border-red-500/25 px-3 py-1.5 rounded-xl"
        >
          <Grid className="h-3.5 w-3.5" /> View All ({photos.length})
        </button>
      </div>

      {/* Slider Carousel Container */}
      <div className="relative group">
        {/* Navigation Arrows */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-xl bg-black/60 border border-white/10 hover:bg-black/90 text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-xl bg-black/60 border border-white/10 hover:bg-black/90 text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Scrollable track */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] pb-2"
        >
          {photos.map((photo, index) => (
            <div
              key={index}
              onClick={() => openLightbox(index)}
              className="relative min-w-[280px] sm:min-w-[360px] aspect-[16/10] rounded-2xl overflow-hidden border border-white/5 cursor-pointer snap-start hover:border-white/20 transition-all group/item"
            >
              <Image
                src={photo.url}
                alt={`${productionTitle} gallery photo`}
                fill
                sizes="(max-width: 768px) 280px, 360px"
                className="object-cover transition-transform duration-500 group-hover/item:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <p className="text-white text-xs font-medium leading-relaxed mb-1">{photo.caption}</p>
                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <Maximize2 className="h-3 w-3" /> Expand Photo
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Modal Overlay (View All) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setModalOpen(false)} />
          
          <div className="relative w-full max-w-5xl bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl animate-fade-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-zinc-900/50">
              <div>
                <h3 className="font-serif font-bold text-white text-lg">Production Gallery</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{productionTitle}</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setModalOpen(false);
                      openLightbox(index);
                    }}
                    className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/5 cursor-pointer hover:border-white/20 transition-all group/grid"
                  >
                    <Image
                      src={photo.url}
                      alt={`${productionTitle} photo`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover/grid:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover/grid:opacity-100 transition-opacity flex items-end p-4">
                      <p className="text-white text-xs leading-relaxed">{photo.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Full-screen View */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm select-none">
          {/* Close trigger */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-3 text-zinc-500 hover:text-white bg-zinc-900/80 border border-white/5 rounded-2xl transition-colors hover:scale-105 z-10"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation Controls */}
          <button
            onClick={prevPhoto}
            className="absolute left-4 p-3 rounded-2xl bg-zinc-900/80 border border-white/5 text-white hover:bg-zinc-800 transition-all hover:scale-105"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextPhoto}
            className="absolute right-4 p-3 rounded-2xl bg-zinc-900/80 border border-white/5 text-white hover:bg-zinc-800 transition-all hover:scale-105"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Main image content container */}
          <div className="flex flex-col items-center gap-4 max-w-4xl px-12">
            <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src={photos[lightboxIndex].url}
                alt={`${productionTitle} photo`}
                fill
                priority
                className="object-cover"
              />
            </div>
            
            {/* Caption & index */}
            <div className="text-center max-w-xl">
              <p className="text-white text-sm md:text-base leading-relaxed italic">
                &ldquo;{photos[lightboxIndex].caption}&rdquo;
              </p>
              <span className="text-xs text-zinc-600 mt-2 block font-mono">
                {lightboxIndex + 1} of {photos.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
