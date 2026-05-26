'use client';

import { useState, useEffect } from 'react';
import { Star, X, Loader2, CheckCircle } from 'lucide-react';
import { ClientDB } from '@/lib/db';

interface EditReviewModalProps {
  review: {
    id: string;
    productionId: string;
    rating: number; // Stored out of 100 (e.g. 90 = 9/10 stars)
    headline: string;
    content: string;
    type?: string;
  };
  productionTitle: string;
  onClose: () => void;
  onSave: () => void;
}

type Step = 'form' | 'submitting' | 'success';

export function EditReviewModal({ review, productionTitle, onClose, onSave }: EditReviewModalProps) {
  const [rating, setRating] = useState(Math.round(review.rating / 10));
  const [hovered, setHovered] = useState(0);
  const [headline, setHeadline] = useState(review.headline || '');
  const [body, setBody] = useState(review.content || '');
  const [step, setStep] = useState<Step>('form');

  const charCount = body.trim().length;
  const isValid = rating > 0 && headline.trim().length > 2 && charCount >= 50;

  // Trap scroll on mount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setStep('submitting');

    ClientDB.updateReview({
      id: review.id,
      rating: rating * 10,
      content: body,
      headline
    });

    await new Promise(r => setTimeout(r, 1200));
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-lg bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-scale-up z-10">

        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-6 pb-8 pt-4">
          {step === 'success' ? (
            <div className="flex flex-col items-center text-center py-8 gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-white mb-2">Review Updated!</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Your changes have been saved successfully and the production scores recalculated.
                </p>
              </div>
              <button
                onClick={() => {
                  onSave();
                  onClose();
                }}
                className="mt-2 bg-white text-black font-bold px-8 py-3 rounded-xl hover:bg-zinc-100 transition-colors text-sm"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Editing Review For</p>
                <h2 className="text-xl font-serif font-bold text-white leading-tight">{productionTitle}</h2>
              </div>

              {/* Star Rating */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Your Rating</label>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const val = i + 1;
                    const filled = val <= (hovered || rating);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(val)}
                        onMouseEnter={() => setHovered(val)}
                        onMouseLeave={() => setHovered(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            filled ? 'fill-yellow-400 text-yellow-400' : 'fill-zinc-800 text-zinc-700'
                          }`}
                        />
                      </button>
                    );
                  })}
                  {rating > 0 && (
                    <span className="ml-2 text-sm font-bold text-white">{rating}/10</span>
                  )}
                </div>
              </div>

              {/* Headline */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Review Headline</label>
                <input
                  type="text"
                  placeholder="Sum it up in a few words…"
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  maxLength={100}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                  required
                />
              </div>

              {/* Body */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Your Review</label>
                <textarea
                  placeholder="Share what you thought about the performance, staging, direction…"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={5}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors resize-none"
                  required
                />
                <div className="flex justify-between items-center">
                  <p className={`text-xs transition-colors ${charCount < 50 ? 'text-red-500' : 'text-green-500'}`}>
                    {charCount < 50 ? `${50 - charCount} more characters needed` : 'Minimum met ✓'}
                  </p>
                  <p className="text-xs text-zinc-600">{charCount} chars</p>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!isValid || step === 'submitting'}
                className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {step === 'submitting' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving Changes…</>
                ) : (
                  'Save Changes'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
