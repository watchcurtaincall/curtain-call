'use client';

import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import Image from 'next/image';

interface ImageLightboxProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string; // e.g. 'aspect-[2/3]' or 'aspect-square'
  rounded?: string; // e.g. 'rounded-2xl'
  priority?: boolean;
}

export function ImageLightbox({
  src,
  alt,
  className = 'w-full h-full',
  aspectRatio = 'aspect-[2/3]',
  rounded = 'rounded-2xl',
  priority = false,
}: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Clickable Image Container */}
      <div
        onClick={() => setIsOpen(true)}
        className={`relative ${aspectRatio} ${rounded} overflow-hidden group cursor-pointer border border-white/5 bg-zinc-900 shadow-2xl transition-all duration-500 hover:border-red-500/30 ${className}`}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Subtle hover overlay with zoom icon */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <div className="p-3 bg-red-600 rounded-2xl shadow-xl shadow-red-900/30 scale-75 group-hover:scale-100 transition-all duration-300 text-white">
            <ZoomIn className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Full Screen Lightbox Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-xl transition-all duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 p-3 text-zinc-400 hover:text-white hover:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-white/5 transition-all z-10"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Image Wrapper */}
          <div className="relative w-full max-w-xl max-h-[80vh] aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-scale-up flex items-center justify-center bg-zinc-950">
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
