'use client';

import { useState, useCallback, useRef } from 'react';
import { QuizQuestion } from '@/lib/types';
import { QuestionCard } from './QuestionCard';
import { QuestionTimer } from './QuestionTimer';
import { FocusGuard } from './FocusGuard';
import { CheckCircle, AlertTriangle, Trophy, Star, Zap } from 'lucide-react';

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

export function QuizSession({ attemptId, userId, questions, onComplete }: QuizSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [sessionState, setSessionState] = useState<'active' | 'voided' | 'submitting' | 'result' | 'error'>('active');
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
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

  // ── RESULT SCREEN ──
  if (sessionState === 'result' && submitResult) {
    const { resultType, score, pointsAwarded, slotPosition, newStreakCount, newPointsBalance } = submitResult;
    return (
      <div className="w-full flex flex-col items-center gap-8 animate-fade-up">
        <div className={`w-24 h-24 rounded-[28px] flex items-center justify-center shadow-2xl ${
          resultType === 'won' ? 'bg-gradient-to-br from-amber-500 to-yellow-400 border-2 border-amber-300/40' :
          resultType === 'consolation' ? 'bg-gradient-to-br from-blue-600 to-blue-500 border-2 border-blue-400/30' :
          'bg-gradient-to-br from-zinc-700 to-zinc-800 border-2 border-white/10'
        }`}>
          {resultType === 'won' ? <Trophy className="h-11 w-11 text-white drop-shadow-lg" /> :
           resultType === 'consolation' ? <Star className="h-11 w-11 text-white drop-shadow-lg" /> :
           <Zap className="h-11 w-11 text-zinc-400" />}
        </div>

        <div className="text-center flex flex-col gap-2">
          <h2 className="text-3xl font-serif font-bold text-white">
            {resultType === 'won' ? `🎉 You won slot #${slotPosition}!` :
             resultType === 'consolation' ? 'Almost! All correct!' :
             'Better luck tomorrow'}
          </h2>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
            {resultType === 'won' ? 'You answered all 5 questions correctly and claimed a winner slot!' :
             resultType === 'consolation' ? 'All answers were correct, but the winner slots were already filled.' :
             'You missed one or more questions. Keep studying theatre!'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-lg">
          <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 text-center">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Score</p>
            <p className="text-2xl font-bold font-serif text-white mt-1">{score}<span className="text-zinc-500">/5</span></p>
          </div>
          <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 text-center">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Points</p>
            <p className="text-2xl font-bold font-serif text-amber-400 mt-1">+{pointsAwarded}</p>
          </div>
          <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 text-center col-span-2 sm:col-span-1">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Streak</p>
            <p className="text-2xl font-bold font-serif text-orange-400 mt-1">🔥 {newStreakCount}</p>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl px-6 py-3 text-center">
          <p className="text-xs text-zinc-400">Total Balance: <span className="text-amber-400 font-bold">{newPointsBalance} pts</span></p>
        </div>

        <button
          onClick={onComplete}
          className="mt-2 bg-white text-black font-bold px-8 py-3.5 rounded-2xl hover:bg-zinc-200 transition-all text-xs uppercase tracking-widest active:scale-95 shadow-lg"
        >
          Back to Quiz Hub
        </button>
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
          onClick={onComplete}
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
        <button onClick={onComplete} className="bg-zinc-900 text-white border border-white/10 font-bold px-8 py-3.5 rounded-2xl hover:bg-zinc-800 transition-all text-xs uppercase tracking-widest">
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
