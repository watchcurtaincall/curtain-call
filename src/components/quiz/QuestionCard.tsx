'use client';

import { useState } from 'react';
import { QuizQuestion } from '@/lib/types';

interface QuestionCardProps {
  question: QuizQuestion;
  onAnswer: (selectedIndex: number) => void;
}

export function QuestionCard({ question, onAnswer }: QuestionCardProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleSelect = (idx: number) => {
    if (selectedIdx !== null) return; // Answer already selected
    setSelectedIdx(idx);
    onAnswer(idx);
  };

  return (
    <div className="w-full flex flex-col gap-6 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-[40px] pointer-events-none" />

      {/* Difficulty and Theme info */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">
          Question {question.index + 1} of 5
        </span>
        <span className={`text-[9px] font-bold uppercase tracking-widest font-mono border px-2.5 py-0.5 rounded-full ${
          question.difficulty === 'easy' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
          question.difficulty === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
          'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {question.difficulty}
        </span>
      </div>

      {/* Question Text */}
      <h3 className="text-lg sm:text-xl font-serif font-bold text-white leading-snug text-center py-4">
        {question.text}
      </h3>

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-3 mt-2">
        {question.options.map((option, idx) => {
          const isSelected = selectedIdx === idx;
          const isAnySelected = selectedIdx !== null;

          return (
            <button
              key={idx}
              role="button"
              type="button"
              disabled={isAnySelected}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left p-4.5 rounded-2xl border transition-all text-xs font-medium relative overflow-hidden active:scale-[0.99] flex items-center gap-3 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-red-550/15 to-amber-550/15 border-red-500/50 text-white shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                  : 'bg-zinc-950/70 border-white/5 text-zinc-300 hover:border-white/15 hover:text-white'
              } ${isAnySelected && !isSelected ? 'opacity-40 cursor-default active:scale-100' : ''}`}
            >
              {/* Index marker */}
              <span className={`w-6 h-6 rounded-lg font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border ${
                isSelected
                  ? 'bg-red-500/20 border-red-500/35 text-red-400'
                  : 'bg-zinc-900 border-white/5 text-zinc-500'
              }`}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="leading-relaxed">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
