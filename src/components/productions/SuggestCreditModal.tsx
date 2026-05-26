'use client';

import { useState } from 'react';
import { X, Users, Plus, Check, Sparkles } from 'lucide-react';
import { ClientDB } from '@/lib/db';

interface SuggestCreditModalProps {
  productionId: string;
  productionTitle: string;
  onClose: () => void;
}

export function SuggestCreditModal({ productionId, productionTitle, onClose }: SuggestCreditModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [category, setCategory] = useState<'Creative' | 'Cast' | 'Technical'>('Cast');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;
    setSubmitting(true);

    const suggestion = {
      id: `credit_suggestion_${Date.now()}`,
      productionId,
      productionTitle,
      name: name.trim(),
      role: role.trim(),
      category,
      reason: reason.trim() || undefined,
      status: 'Pending' as const,
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage queue
    const key = 'curtain_credit_suggestions';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(suggestion);
    localStorage.setItem(key, JSON.stringify(existing));

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-fade-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-zinc-900/60">
          <div>
            <h3 className="font-serif font-bold text-white text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-red-500" />
              Suggest a Credit
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{productionTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6 flex flex-col items-center gap-4 animate-fade-up">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Check className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-white text-lg">Suggestion Submitted!</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed max-w-xs mx-auto">
                  Thank you! Our editorial team will review and verify the credit before publishing it.
                </p>
              </div>
              <button
                onClick={onClose}
                className="bg-white text-black font-bold px-6 py-3 rounded-xl text-sm hover:bg-zinc-100 transition-colors mt-2"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 flex gap-3 items-start">
                <Sparkles className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Know someone who was part of this production that isn&apos;t listed? Suggest their credit — 
                  our curators will verify and approve it.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  Person&apos;s Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joke Silva"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-zinc-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                    Their Role <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Actress"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-zinc-600"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  >
                    <option value="Cast">Cast</option>
                    <option value="Creative">Creative</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  Source / Evidence
                  <span className="text-[9px] bg-zinc-800 text-zinc-500 border border-white/5 px-1.5 py-0.5 rounded font-mono">Optional</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Official programme, social media post, or website URL..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-zinc-600 resize-none [scrollbar-width:none]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !name.trim() || !role.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold py-3.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="font-mono text-xs animate-pulse">Submitting...</span>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Submit Credit Suggestion
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
