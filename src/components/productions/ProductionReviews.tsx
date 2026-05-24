'use client';

import { useState } from 'react';
import { Star, ShieldCheck, PenLine, Lock } from 'lucide-react';
import Link from 'next/link';
import { WriteReviewModal } from './WriteReviewModal';
import { ProductionStatus } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import { ClientDB } from '@/lib/db';

interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  type: string;
  date?: string;
}

export function ProductionReviews({ reviews, productionTitle, productionId, status }: {
  reviews: Review[];
  productionTitle: string;
  productionId: string;
  status: ProductionStatus;
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'critic' | 'audience'>('critic');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCriticModal, setShowCriticModal] = useState(false);

  const criticReviews = reviews.filter(r => r.type === 'Critic');
  const audienceReviews = reviews.filter(r => r.type === 'Audience');
  const isCritic = user ? ClientDB.isApprovedCritic(user.email) : false;

  return (
    <div>
      {showReviewModal && (
        <WriteReviewModal
          productionTitle={productionTitle}
          productionId={productionId}
          reviewType="Audience"
          onClose={() => setShowReviewModal(false)}
        />
      )}
      {showCriticModal && (
        <WriteReviewModal
          productionTitle={productionTitle}
          productionId={productionId}
          reviewType="Critic"
          onClose={() => setShowCriticModal(false)}
        />
      )}
      {/* Tab Headers */}
      <div className="flex gap-0 border-b border-white/10 mb-8">
        {(['critic', 'audience'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-1 pb-3 mr-8 text-base font-serif font-bold capitalize transition-all relative ${
              activeTab === tab ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {tab === 'critic' ? 'Critic Reviews' : 'Audience Reviews'}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Critic Tab */}
      {activeTab === 'critic' && (
        <div className="space-y-4">
          {status === 'Coming Soon' ? (
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 text-center flex flex-col items-center justify-center gap-3 py-12">
              <span className="text-3xl">🎭</span>
              <p className="text-sm font-semibold text-zinc-400">
                This stage production is coming soon!
              </p>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                Official professional critic scores and verified reviews will open once the production premieres.
              </p>
            </div>
          ) : (
            <>
              {/* Write/Apply CTA card */}
              {isCritic ? (
                <div className="p-5 rounded-2xl bg-zinc-900 border border-white/5 flex flex-col gap-3">
                  <p className="text-sm text-zinc-400">
                    You are a verified Curtain Call critic! Share your official rating and critique with the platform.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCriticModal(true)}
                    className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-100 transition-colors text-sm"
                  >
                    Write Critic Review
                  </button>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-zinc-900 border border-white/5 flex flex-col gap-3">
                  <p className="text-sm text-zinc-400">
                    Are you a theatre journalist or professional critic? Get verified to post official scores.
                  </p>
                  <Link
                    href="/critics/apply"
                    className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-100 transition-colors text-sm text-center"
                  >
                    Apply to be a Critic
                  </Link>
                </div>
              )}

              {criticReviews.length === 0 ? (
                <p className="text-center text-zinc-600 py-10 text-sm">No critic reviews yet.</p>
              ) : (
                criticReviews.map(review => (
                  <div key={review.id} className="p-5 rounded-2xl bg-zinc-900 border border-white/5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                          <PenLine className="h-3.5 w-3.5 text-zinc-400" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white flex items-center gap-1">
                            {review.author}
                            <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                          </div>
                          <div className="text-[11px] text-zinc-600">Verified Critic</div>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-red-500 bg-red-600/10 px-2.5 py-1 rounded-full border border-red-600/20">
                        {review.rating}%
                      </span>
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed italic">
                      "{review.content}"
                    </p>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}

      {/* Audience Tab */}
      {activeTab === 'audience' && (
        <div className="space-y-4">
          {status === 'Coming Soon' ? (
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 text-center flex flex-col items-center justify-center gap-3 py-12">
              <span className="text-3xl">⭐</span>
              <p className="text-sm font-semibold text-zinc-400">
                This stage production is coming soon!
              </p>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                Audience ratings and community reviews will open once the production goes live.
              </p>
            </div>
          ) : (
            <>
              {/* Write a review CTA */}
              {user ? (
                <div className="p-5 rounded-2xl bg-zinc-900 border border-white/5 flex flex-col gap-3">
                  <p className="text-sm text-zinc-400">
                    Seen this production? Share your take with the community.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(true)}
                    className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-100 transition-colors text-sm"
                  >
                    Write a Review
                  </button>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl bg-zinc-900/60 border border-white/5 p-6 backdrop-blur-md">
                  {/* Backdrop subtle ambient light */}
                  <div className="absolute -right-20 -top-20 w-40 h-40 bg-red-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
                  
                  <div className="flex flex-col items-center text-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0 shadow-lg">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="font-serif font-bold text-white text-base leading-tight">Audience Curation Hub</h3>
                    <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                      To preserve review authenticity, only registered members of the Curtain Call community can submit professional stage ratings.
                    </p>
                    <Link
                      href="/login"
                      className="mt-2 inline-flex items-center justify-center bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold px-6 py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider shadow-lg shadow-red-950/20 hover:scale-[1.02] active:scale-[0.98] border border-white/10"
                    >
                      Sign In to Review
                    </Link>
                  </div>
                </div>
              )}

              {audienceReviews.length === 0 ? (
                <p className="text-center text-zinc-600 py-10 text-sm">
                  No audience reviews yet — be the first.
                </p>
              ) : (
                audienceReviews.map(review => (
                  <div key={review.id} className="p-5 rounded-2xl bg-zinc-900 border border-white/5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center font-semibold text-sm text-zinc-300">
                          {review.author.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{review.author}</div>
                          <div className="text-[11px] text-zinc-600">{review.date || 'Recently'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold text-white bg-zinc-800 px-2.5 py-1 rounded-full">
                        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                        {parseFloat((review.rating / 10).toFixed(1))}
                      </div>
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {review.content}
                    </p>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
