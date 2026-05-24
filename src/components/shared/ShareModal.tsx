import React, { useState } from 'react';
import { X, Copy, Check, Mail } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

// Bulletproof Inline SVG Icons to avoid lucide-react version brand mismatch failures
const WhatsAppIcon = () => (
  <svg className="h-4.5 w-4.5 shrink-0 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.012 2C6.48 2 2.012 6.48 2.012 12c0 2.17.76 4.21 2.03 5.83L2.52 22l4.35-1.12c1.49.55 3.26 1.12 5.14 1.12 5.52 0 10-4.48 10-10S17.532 2 12.012 2zm4.75 13.92c-.24.68-1.2 1.34-1.63 1.42-.42.08-.83.21-2.73-.55-2.43-.97-3.95-3.41-4.07-3.57-.12-.16-.97-1.29-.97-2.45 0-1.16.61-1.73.83-1.96.22-.23.49-.29.65-.29.16 0 .33 0 .47.01.15.01.35-.06.55.43.2.49.69 1.68.75 1.8.06.12.1.26.02.42-.08.16-.18.26-.35.45-.17.19-.36.42-.51.56-.17.15-.35.32-.15.67.2.34.88 1.45 1.88 2.34.86.77 1.58 1.01 1.93 1.15.35.14.55.12.76-.1.21-.22.9-1.05 1.14-1.41.24-.36.48-.3.8-.18.32.12 2.05 1.01 2.4 1.19.35.18.59.27.67.41.08.14.08.82-.16 1.5z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg className="h-4.5 w-4.5 shrink-0 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="h-4.5 w-4.5 shrink-0 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg className="h-4.5 w-4.5 shrink-0 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

export function ShareModal({ isOpen, onClose, title, url }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(`Check out "${title}" on Curtain Call!`);

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: WhatsAppIcon,
      color: 'bg-green-600 hover:bg-green-700 text-white',
      link: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`
    },
    {
      name: 'X / Twitter',
      icon: TwitterIcon,
      color: 'bg-black border border-white/10 hover:bg-zinc-900 text-white',
      link: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
    },
    {
      name: 'Facebook',
      icon: FacebookIcon,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    },
    {
      name: 'LinkedIn',
      icon: LinkedInIcon,
      color: 'bg-blue-700 hover:bg-blue-800 text-white',
      link: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-zinc-800 hover:bg-zinc-700 border border-white/5 text-white',
      link: `mailto:?subject=${encodedTitle}&body=Hi! Check this out on Curtain Call: ${url}`
    }
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl animate-scale-up z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif font-bold text-white text-lg">Share</h3>
          <button 
            onClick={onClose}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Share Options Grid */}
        <div className="flex flex-col gap-3.5 mb-6">
          {shareOptions.map((opt, i) => {
            const Icon = opt.icon;
            return (
              <a
                key={i}
                href={opt.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${opt.color}`}
              >
                <Icon />
                Share on {opt.name}
              </a>
            );
          })}
        </div>

        {/* Copy Link input */}
        <div className="bg-zinc-950 border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-3">
          <span className="text-zinc-500 text-xs truncate select-all font-mono pl-1 max-w-[200px]">
            {url}
          </span>
          <button
            onClick={handleCopyLink}
            className="bg-white text-black text-xs font-bold py-2.5 px-4 rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-1.5 shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
