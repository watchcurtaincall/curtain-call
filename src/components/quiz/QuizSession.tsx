'use client';

import { useState, useCallback, useRef } from 'react';
import { QuizQuestion } from '@/lib/types';
import { QuestionCard } from './QuestionCard';
import { QuestionTimer } from './QuestionTimer';
import { FocusGuard } from './FocusGuard';
import {
  CheckCircle, AlertTriangle, Trophy, Star, Zap,
  XCircle, ChevronDown, Share2, Copy, Check, ArrowRight
} from 'lucide-react';

interface AnswerRecord {
  questionId: string;
  selectedIndex: number;
  elapsedMs: number;
}

interface SubmitResult {
  resultType: 'won' | 'consolation' | 'failed';
  score: number;
  pointsAwarded: number;
  slotPosition?: number;
  newStreakCount: number;
  newPointsBalance: number;
}

interface QuizSessionProps {
  attemptId: string;
  userId: string;
  questions: QuizQuestion[];
  onComplete: () => void;
}

// Extended question type with correct answer (only passed in after submit)
interface ReviewQuestion extends QuizQuestion {
  correctAnswerIndex: number;
}

async function voidAttemptWithRetry(
  attemptId: string,
  userId: string,
  reason: 'visibility' | 'blur' | 'unload'
): Promise<void> {
  const delays = [500, 1000, 2000];
  for (let i = 0; i <= delays.length; i++) {
    try {
      const res = await fetch('/api/quiz/attempt/void', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, userId, reason }),
      });
      if (res.ok) return;
    } catch (err) {
      console.error(`[QuizSession] Void attempt ${i + 1} failed:`, err);
    }
    if (i < delays.length) {
      await new Promise(r => setTimeout(r, delays[i]));
    }
  }
}

// ── Share button ──────────────────────────────────────────
function ShareButton({ score, pointsAwarded, slotPosition, resultType }: {
  score: number; pointsAwarded: number; slotPosition?: number; resultType: string;
}) {
  const [copied, setCopied] = useState(false);
  const text = [
    '🎭 Curtain Call — Daily Theatre Quiz',
    '',
    resultType === 'won' && slotPosition
      ? `🏆 I scored ${score}/5 and claimed Winner Slot #${slotPosition}!`
      : score === 5 ? `⭐ I scored a perfect ${score}/5!`
      : `🎬 I scored ${score}/5 on today's quiz.`,
    pointsAwarded > 0 ? `💰 +${pointsAwarded} points earned` : '',
    '',
    'Think you can beat me? curtaincall.com.ng/quiz',
  ].filter(Boolean).join('\n');

  const share = async () => {
    if (navigator.share) { try { await navigator.share({ text }); return; } catch {} }
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <button onClick={share} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-xs uppercase tracking-widest active:scale-95">
      {copied ? <><Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!</> : <><Share2 className="h-3.5 w-3.5" /> Share</>}
    </button>
  );
}

// ── Per-question review ───────────────────────────────────
function AnswerReview({ questions, answers }: {
  questions: (QuizQuestion & { correctAnswerIndex?: number })[];
  answers: AnswerRecord[];
}) {
  const [open, setOpen] = useState(false);

  const reviewed = questions.map((q, qi) => {
    const ans = answers.find(a => a.questionId === q.id);
    const selectedIndex = ans?.selectedIndex ?? -1;
    const correctIndex = (q as any).correctAnswerIndex ?? -1;
    const isCorrect = correctIndex >= 0 && selectedIndex === correctIndex;
    return { ...q, selectedIndex, correctIndex, isCorrect, qi };
  });

  const wrongCount = reviewed.filter(q => !q.isCorrect).length;

  // If we don't have correctAnswerIndex yet (server hasn't responded), show loading note
  const hasCorrectData = reviewed.some(q => q.correctIndex >= 0);

  return (
    <div className="w-full border border-white/8 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-zinc-900/60 hover:bg-zinc-900 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-white">Review Answers</span>
          {hasCorrectData && (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              wrongCount === 0
                ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/15 border-red-500/20 text-red-400'
            }`}>
              {wrongCount === 0 ? 'All correct!' : `${wrongCount} wrong`}
            </span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="flex flex-col divide-y divide-white/5">
          {reviewed.map((q) => (
            <div key={q.id} className={`px-5 py-4 ${q.isCorrect ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
              {/* Question */}
              <div className="flex items-start gap-2.5 mb-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${q.isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                  {q.isCorrect
                    ? <CheckCircle className="h-3 w-3 text-emerald-400" />
                    : <XCircle className="h-3 w-3 text-red-400" />
                  }
                </div>
                <p className="text-sm text-white font-medium leading-snug">
                  <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest mr-1">Q{q.qi + 1}.</span>
                  {q.text}
                </p>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-1.5 pl-7">
                {q.options.map((opt, i) => {
                  const isCorrectOpt = i === q.correctIndex;
                  const isSelected = i === q.selectedIndex;
                  const isWrongPick = isSelected && !isCorrectOpt;

                  return (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${
                      isCorrectOpt
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : isWrongPick
                        ? 'bg-red-500/10 border-red-500/30 text-red-300'
                        : 'bg-zinc-900/40 border-white/5 text-zinc-500'
                    }`}>
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[9px] font-black ${
                        isCorrectOpt ? 'bg-emerald-500 border-emerald-400 text-white'
                        : isWrongPick ? 'bg-red-500 border-red-400 text-white'
                        : 'border-zinc-700 text-zinc-600'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCorrectOpt && <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest shrink-0">✓ Correct</span>}
                      {isWrongPick && <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest shrink-0">Your pick</span>}
                    </div>
                  );
                })}
                {q.selectedIndex === -1 && (
                  <p className="text-[11px] text-zinc-600 italic mt-1">⏱ Timed out — no answer selected</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function QuizSession({ attemptId, userId, questions, onComplete }: QuizSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [sessionState, setSessionState] = useState<'active' | 'voided' | 'submitting' | 'result' | 'error'>('active');
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<(QuizQuestion & { correctAnswerIndex?: number })[]>(questions);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  const currentQuestion = questions[currentQuestionIndex];
  const isSessionActive = sessionState === 'active';

  const handleAnswer = useCallback(async (selectedIndex: number) => {
    const elapsedMs = Math.min(Date.now() - questionStartTimeRef.current, 15000);
    const record: AnswerRecord = {
      questionId: currentQuestion.id,
      selectedIndex,
      elapsedMs,
    };

    const updatedAnswers = [...answers, record];
    setAnswers(updatedAnswers);

    if (updatedAnswers.length < questions.length) {
      setCurrentQuestionIndex(i => i + 1);
      questionStartTimeRef.current = Date.now();
    } else {
      // All answered — submit
      setSessionState('submitting');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      try {
        const res = await fetch('/api/quiz/attempt/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attemptId, userId, answers: updatedAnswers }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Submission failed');
        setSubmitResult(data);
        setSessionState('result');

        // Fetch full questions with correct answers for review
        try {
          const statusRes = await fetch(`/api/quiz/status?userId=${encodeURIComponent(userId)}`);
          const statusData = await statusRes.json();
          if (statusData?.userAttempt?.reviewData) {
            setReviewQuestions(statusData.userAttempt.reviewData.map((rd: any) => ({
              ...rd,
              correctAnswerIndex: rd.correctAnswerIndex,
            })));
          }
        } catch { /* review data is optional enhancement */ }

      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to submit quiz');
        setSessionState('error');
      }
    }
  }, [answers, currentQuestion, questions, attemptId, userId]);

  const handleTimerExpire = useCallback(() => {
    handleAnswer(-1); // -1 = timeout
  }, [handleAnswer]);

  const handleVoid = useCallback(async (reason: 'visibility' | 'blur' | 'unload') => {
    if (sessionState !== 'active') return;
    setSessionState('voided');
    await voidAttemptWithRetry(attemptId, userId, reason);
  }, [sessionState, attemptId, userId]);

  const handleBackToHub = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onComplete();
  }, [onComplete]);

  // ── RESULT SCREEN ──
  if (sessionState === 'result' && submitResult) {
    const { resultType, score, pointsAwarded, slotPosition, newStreakCount, newPointsBalance } = submitResult;
    return (
      <div className="w-full flex flex-col items-center gap-6 animate-fade-up">
        {/* Result badge */}
        <div className={`w-24 h-24 rounded-[28px] flex items-center justify-center shadow-2xl ${
          resultType === 'won' ? 'bg-gradient-to-br from-amber-500 to-yellow-400 border-2 border-amber-300/40' :
          resultType === 'consolation' ? 'bg-gradient-to-br from-blue-600 to-blue-500 border-2 border-blue-400/30' :
          'bg-gradient-to-br from-zinc-700 to-zinc-800 border-2 border-white/10'
        }`}>
          {resultType === 'won' ? <Trophy className="h-11 w-11 text-white drop-shadow-lg" /> :
           resultType === 'consolation' ? <Star className="h-11 w-11 text-white drop-shadow-lg" /> :
           <Zap className="h-11 w-11 text-zinc-400" />}
        </div>

        {/* Title */}
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-3xl font-serif font-bold text-white">
            {resultType === 'won' ? `🎉 You won slot #${slotPosition}!` :
             resultType === 'consolation' ? 'Almost! All correct!' :
             'Better luck tomorrow'}
          </h2>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
            {resultType === 'won' ? 'You answered all 5 correctly and claimed a winner slot!' :
             resultType === 'consolation' ? 'All correct, but winner slots were already filled.' :
             'You missed one or more questions. Keep studying theatre!'}
          </p>
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
          <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Score</p>
            <p className="text-2xl font-bold font-serif text-white mt-1">{score}<span className="text-zinc-500">/5</span></p>
          </div>
          <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Points</p>
            <p className="text-2xl font-bold font-serif text-amber-400 mt-1">+{pointsAwarded}</p>
          </div>
          <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Streak</p>
            <p className="text-2xl font-bold font-serif text-orange-400 mt-1">🔥{newStreakCount}</p>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 rounded-xl px-5 py-2.5 text-center w-full max-w-sm">
          <p className="text-xs text-zinc-400">Total Balance: <span className="text-amber-400 font-bold">{newPointsBalance} pts</span></p>
        </div>

        {/* Answer review — shown immediately using local data */}
        <div className="w-full max-w-lg">
          <AnswerReview questions={reviewQuestions} answers={answers} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full max-w-sm flex-wrap">
          <button
            onClick={handleBackToHub}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-bold px-6 py-3.5 rounded-2xl hover:bg-zinc-100 transition-all text-xs uppercase tracking-widest active:scale-95 shadow-lg"
          >
            Back to Hub <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <ShareButton score={score} pointsAwarded={pointsAwarded} slotPosition={slotPosition} resultType={resultType} />
        </div>
      </div>
    );
  }

  // ── VOIDED SCREEN ──
  if (sessionState === 'voided') {
    return (
      <div className="w-full flex flex-col items-center gap-6 text-center py-12">
        <div className="w-20 h-20 rounded-[24px] bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="h-9 w-9 text-red-400" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-white">Session Voided</h2>
          <p className="text-zinc-400 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
            Your session was voided because you left the quiz tab. You cannot retry today.
          </p>
        </div>
        <button
          onClick={handleBackToHub}
          className="bg-zinc-900 text-white border border-white/10 font-bold px-8 py-3.5 rounded-2xl hover:bg-zinc-800 transition-all text-xs uppercase tracking-widest"
        >
          Back to Quiz Hub
        </button>
      </div>
    );
  }

  // ── ERROR SCREEN ──
  if (sessionState === 'error') {
    return (
      <div className="w-full flex flex-col items-center gap-6 text-center py-12">
        <div className="w-20 h-20 rounded-[24px] bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="h-9 w-9 text-red-400" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-white">Submission Error</h2>
          <p className="text-zinc-400 text-sm mt-2 max-w-sm mx-auto">{errorMsg}</p>
        </div>
        <button onClick={handleBackToHub} className="bg-zinc-900 text-white border border-white/10 font-bold px-8 py-3.5 rounded-2xl hover:bg-zinc-800 transition-all text-xs uppercase tracking-widest">
          Back
        </button>
      </div>
    );
  }

  // ── SUBMITTING ──
  if (sessionState === 'submitting') {
    return (
      <div className="w-full flex flex-col items-center gap-4 py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center animate-pulse">
          <CheckCircle className="h-7 w-7 text-amber-400" />
        </div>
        <p className="text-white font-bold font-serif text-xl">Evaluating answers…</p>
        <p className="text-zinc-500 text-sm">Claiming your slot if you got them all right!</p>
      </div>
    );
  }

  // ── ACTIVE QUESTION ──
  return (
    <div className="w-full flex flex-col gap-6 max-w-2xl mx-auto">
      <FocusGuard active={isSessionActive} onVoid={handleVoid} />

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full flex-1 transition-all ${
              i < currentQuestionIndex ? 'bg-red-500' :
              i === currentQuestionIndex ? 'bg-amber-500' :
              'bg-zinc-800'
            }`}
          />
        ))}
      </div>

      {/* Timer */}
      <QuestionTimer key={currentQuestionIndex} onExpire={handleTimerExpire} />

      {/* Question Card */}
      <QuestionCard
        key={`${currentQuestionIndex}-${currentQuestion.id}`}
        question={currentQuestion}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
