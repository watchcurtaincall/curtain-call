'use client';

import { useState, useEffect } from 'react';
import { Star, ShieldCheck, PenTool } from 'lucide-react';
import Link from 'next/link';
import { MOCK_REVIEWS } from '@/lib/mock';
import { ClientDB } from '@/lib/db';
import { Production } from '@/lib/types';

export default function CriticsHubPage() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const loadData = () => {
      setProductions(ClientDB.getProductions());
      setReviews(ClientDB.getReviews());
    };
    loadData();

    if (typeof window !== 'undefined') {
      window.addEventListener('cc-db-synced', loadData);
      return () => window.removeEventListener('cc-db-synced', loadData);
    }
  }, []);

  const criticReviews = reviews.filter(r => r.type === 'Critic');

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 flex items-center gap-3">
            Verified Critics <ShieldCheck className="h-8 w-8 text-blue-500" />
          </h1>
          <p className="text-zinc-400 text-lg">
            Curtain Call separates professional critique from general audience reactions. Our Verified Critics are established journalists, academics, and theatre professionals.
          </p>
        </div>
        <div className="bg-zinc-900 border border-white/5 p-6 rounded-2xl md:min-w-[300px]">
          <h3 className="text-white font-bold mb-2">Want to join the guild?</h3>
          <p className="text-sm text-zinc-400 mb-4">Apply for Verified Critic status to have your reviews highlighted across the platform.</p>
          <Link href="/critics/apply" className="w-full block text-center bg-white text-black font-medium py-2.5 rounded-full hover:bg-zinc-200 transition-colors text-sm font-semibold">
            Apply Now
          </Link>
        </div>
      </div>

      {/* Latest Critic Reviews */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-white mb-8 border-b border-white/10 pb-4">Latest Critical Reviews</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {criticReviews.map(review => {
            const production = productions.find(p => p.id === review.productionId);
            return (
              <div key={review.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-6 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center">
                      <PenTool className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm flex items-center gap-1">
                        {review.author} <ShieldCheck className="h-4 w-4 text-blue-500" />
                      </p>
                      <p className="text-zinc-500 text-xs">Verified Critic</p>
                    </div>
                  </div>
                  <h4 className="font-serif font-bold text-white mb-2 line-clamp-1">{production?.title}</h4>
                  <p className="text-zinc-400 text-sm italic mb-6 line-clamp-4">"{review.content}"</p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-red-500 text-red-500" />
                    <span className="text-white font-bold">{review.rating}</span>
                    <span className="text-zinc-500 text-xs">/ 100</span>
                  </div>
                  <Link href={`/productions/${review.productionId}`} className="text-red-500 text-sm font-medium hover:text-red-400">
                    Read Full Review
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
