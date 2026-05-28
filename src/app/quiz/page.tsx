'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { QuizStatus, QuizQuestion } from '@/lib/types';
import { QuizSession } from '@/components/quiz/QuizSession';
import { StreakBadge } from '@/components/quiz/StreakBadge';
import {
  Trophy, Users, Clock, Lock, Flame, Zap,
  RefreshCw, AlertTriangle, ChevronRight, Star,
  BookOpen, CheckCircle, Share2, Copy, Check
} from 'lucide-react';
import Link from 'next/link';

type PageState = 'loading' | 'unauthenticated' | 'idle' | 'starting' | 'active' | 'done' | 'error';

interface SlotEntry {
  position: number;
  userId: string;
  claimedAt: string;
}

// ── Share Result Button ──────────────────────────────────────
function ShareResultButton({ score, pointsAwarded, slotPosition, hasWon, streakCount }: {
  score: number;
  pointsAwarded: number;
  slotPosition?: number;
  hasWon: boolean;
  streakCount: number;
}) {
  const [copied, setCopied] = useState(false);

  const buildShareText = () => {
    const lines: string[] = [];
    lines.push('🎭 Curtain Call — Daily Theatre Quiz');
    lines.push('');

    if (hasWon && slotPosition) {
      lines.push(`🏆 I scored ${score}/5 and claimed Winner Slot #${slotPosition}!`);
    } else if (score === 5) {
      lines.push(`⭐ I scored a perfect ${score}/5!`);
    } else {
      lines.push(`🎬 I scored ${score}/5 on today's quiz.`);
    }

    if (streakCount > 1) {
      lines.push(`🔥 ${streakCount}-day streak`);
    }

    if (pointsAwarded > 0) {
      lines.push(`💰 +${pointsAwarded} points earned`);
    }

    lines.push('');
    lines.push('Think you can beat me? Take the quiz 👇');
    lines.push('https://curtaincall.com.ng/quiz');

    return lines.join('\n');
  };

  const handleShare = async () => {
    const text = buildShareText();

    // Use native Web Share API if available (mobile)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // User cancelled or share failed — fall through to copy
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Last resort: prompt
      prompt('Copy your result:', text);
    }
  };

  return (
    <div className="flex gap-2 mt-1">
      <button
        onClick={handleShare}
        className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-bold px-6 py-3 rounded-2xl transition-all text-xs uppercase tracking-widest active:scale-95 shadow-lg shadow-amber-900/30"
      >
        <Share2 className="h-4 w-4" />
        Share Result
      </button>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(buildShareText());
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          } catch {}
        }}
        className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl border text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${
          copied
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-zinc-900 border-white/10 text-zinc-300 hover:border-white/20'
        }`}
      >
        {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy</>}
      </button>
    </div>
  );
}

export default function QuizPage() {
  const { user, isInitializing } = useAuth();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [status, setStatus] = useState<QuizStatus | null>(null);
  const [slots, setSlots] = useState<SlotEntry[]>([]);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch status ──────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/quiz/status?userId=${encodeURIComponent(user.id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load quiz status');
      setStatus(data);
      setPageState(prev => prev === 'loading' ? 'idle' : prev);
    } catch (err: any) {
      setErrorMsg(err.message);
      setPageState(prev => prev === 'loading' ? 'error' : prev);
    }
  }, [user]);

  const fetchSlots = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/quiz/slots?date=${today}`);
      const data = await res.json();
      if (res.ok) setSlots(data.slots ?? []);
    } catch { /* non-critical */ }
  }, []);

  const fetchPoints = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/quiz/status?userId=${encodeURIComponent(user.id)}`);
      const data = await res.json();

    } catch { /* non-critical */ }
  }, [user]);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { setPageState('unauthenticated'); return; }
    fetchStatus();
    fetchSlots();
    fetchPoints();
  }, [user, isInitializing, fetchStatus, fetchSlots, fetchPoints]);

  // Poll slots every 30s while idle
  useEffect(() => {
    if (pageState !== 'idle') return;
    pollerRef.current = setInterval(() => { fetchSlots(); fetchStatus(); }, 30_000);
    return () => { if (pollerRef.current) clearInterval(pollerRef.current); };
  }, [pageState, fetchSlots, fetchStatus]);

  // ── Start attempt ─────────────────────────────────────────
  const handleStart = async () => {
    if (!user || !status?.questionsReady) return;
    setPageState('starting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/quiz/attempt/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start quiz');
      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setPageState('active');
    } catch (err: any) {
      setErrorMsg(err.message);
      setPageState('error');
    }
  };

  // ── Session complete ──────────────────────────────────────
  const handleComplete = useCallback(() => {
    setPageState('done');
    fetchStatus();
    fetchSlots();
    fetchPoints();
  }, [fetchStatus, fetchSlots, fetchPoints]);

  // ── UNAUTHENTICATED ───────────────────────────────────────
  if (pageState === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          <div className="w-20 h-20 rounded-[24px] bg-red-950/40 border border-red-500/10 flex items-center justify-center">
            <Lock className="h-9 w-9 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-white">Sign in to play</h1>
            <p className="text-zinc-400 text-sm mt-2">The Daily Quiz is exclusive to Curtain Call members.</p>
          </div>
          <Link href="/login" className="bg-white text-black font-bold px-8 py-3.5 rounded-2xl hover:bg-zinc-200 transition-all text-xs uppercase tracking-widest">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // ── LOADING ───────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center animate-pulse">
            <Zap className="h-7 w-7 text-amber-400" />
          </div>
          <p className="text-white font-serif font-bold text-lg">Loading quiz…</p>
        </div>
      </div>
    );
  }

  // ── ERROR ─────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-5 text-center max-w-sm">
          <div className="w-16 h-16 rounded-[20px] bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-white">Something went wrong</h2>
            <p className="text-zinc-400 text-sm mt-2">{errorMsg}</p>
          </div>
          <button onClick={() => { setPageState('loading'); fetchStatus(); }} className="bg-zinc-900 border border-white/10 text-white font-bold px-6 py-3 rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-2 text-xs uppercase tracking-widest">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ── ACTIVE SESSION ────────────────────────────────────────
  if (pageState === 'active' && attemptId && user) {
    return (
      <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/10 via-zinc-950 to-red-950/10 pointer-events-none" />
        <div className="relative container mx-auto px-4 py-12 max-w-2xl">
          <QuizSession
            attemptId={attemptId}
            userId={user.id}
            questions={questions}
            onComplete={handleComplete}
          />
        </div>
      </div>
    );
  }

  // ── IDLE / DONE / STARTING ────────────────────────────────
  const attempt = status?.userAttempt;
  const hasAttempted = attempt && attempt.status !== 'none';
  const hasWon = attempt?.resultType === 'won';
  const isVoided = attempt?.status === 'voided';
  const slotsLeft = status?.slotsRemaining ?? 10;
  const questionsReady = status?.questionsReady ?? false;
  const streakCount = status?.streakCount ?? 0;
  const totalSlots = status?.totalSlots ?? 10;

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-900/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[400px] h-[300px] bg-red-950/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative container mx-auto px-4 py-10 max-w-4xl">

        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 animate-fade-down">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5 text-amber-400" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-white">Daily Theatre Quiz</h1>
            </div>
            <p className="text-zinc-500 text-sm">5 questions · 5s each · {totalSlots} winner slots</p>
          </div>
          <div className="self-start md:self-auto">
            <StreakBadge count={streakCount} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── MAIN CARD ── */}
          <div className="lg:col-span-2 flex flex-col gap-5 animate-fade-up">

            {/* Status/CTA card */}
            <div className="relative bg-zinc-900/60 border border-white/5 rounded-3xl overflow-hidden p-6 sm:p-8">
              <div className="absolute top-0 right-0 w-60 h-60 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

              {/* No questions yet */}
              {!questionsReady && !hasAttempted && (
                <div className="flex flex-col items-center gap-5 text-center py-4">
                  <div className="w-16 h-16 rounded-[20px] bg-zinc-800 border border-white/5 flex items-center justify-center shrink-0">
                    <Clock className="h-8 w-8 text-zinc-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif font-bold text-white">Quiz not ready yet</h2>
                    <p className="text-zinc-400 text-sm mt-1.5 max-w-sm mx-auto">Check back soon — the quiz typically goes live at midnight.</p>
                  </div>
                </div>
              )}

              {/* Ready to play */}
              {questionsReady && !hasAttempted && (
                <div className="flex flex-col items-center gap-6 text-center py-4">
                  <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-amber-500 to-yellow-400 border border-amber-300/20 flex items-center justify-center shadow-2xl shadow-amber-900/40 shrink-0">
                    <Zap className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-white">Today's Quiz is Live!</h2>
                    <p className="text-zinc-400 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                      Answer all 5 questions to earn 200 points.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap justify-center text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-400" /> 5 Questions</span>
                    <span className="text-zinc-700">·</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-blue-400" /> 5s Each</span>
                    <span className="text-zinc-700">·</span>
                    <span className="flex items-center gap-1.5 text-red-400"><Trophy className="h-3.5 w-3.5" /> {slotsLeft} Slots Left</span>
                  </div>

                  {slotsLeft === 0 ? (
                    <div className="bg-zinc-800/60 border border-white/5 rounded-2xl px-6 py-3 text-sm text-zinc-400 flex items-center gap-2">
                      <Users className="h-4 w-4 text-zinc-500" /> All winner slots have been claimed today
                    </div>
                  ) : (
                    <button
                      id="start-quiz-btn"
                      onClick={handleStart}
                      disabled={pageState === 'starting'}
                      className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:from-zinc-700 disabled:to-zinc-700 disabled:text-zinc-500 text-black font-bold px-10 py-4 rounded-2xl transition-all text-sm uppercase tracking-widest active:scale-95 shadow-lg shadow-amber-900/30 flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                      {pageState === 'starting' ? (
                        <><RefreshCw className="h-4 w-4 animate-spin" /> Starting…</>
                      ) : (
                        <>Start Quiz <ChevronRight className="h-4 w-4 stroke-[3]" /></>
                      )}
                    </button>
                  )}
                  <p className="text-zinc-600 text-xs">⚠️ Switching tabs will void your session</p>
                </div>
              )}

              {/* Already completed */}
              {hasAttempted && attempt?.status === 'completed' && (
                <div className="flex flex-col items-center gap-5 text-center py-4">
                  <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0 ${hasWon ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-zinc-800 border border-white/5'}`}>
                    {hasWon ? <Trophy className="h-8 w-8 text-amber-400" /> : <CheckCircle className="h-8 w-8 text-zinc-400" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-serif font-bold text-white">
                      {hasWon ? `🏆 You won slot #${attempt.slotPosition}!` :
                       attempt.resultType === 'consolation' ? '⭐ All correct — consolation awarded' :
                       'You completed today\'s quiz'}
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1.5">
                      Score: <span className="text-white font-bold">{attempt.score}/5</span> · Points earned: <span className="text-amber-400 font-bold">+{attempt.pointsAwarded}</span>
                    </p>
                    <p className="text-zinc-600 text-xs mt-2">Come back tomorrow for another chance!</p>
                  </div>
                  <ShareResultButton
                    score={attempt.score ?? 0}
                    pointsAwarded={attempt.pointsAwarded ?? 0}
                    slotPosition={attempt.slotPosition}
                    hasWon={hasWon ?? false}
                    streakCount={streakCount}
                  />
                </div>
              )}

              {/* Voided */}
              {isVoided && (
                <div className="flex flex-col items-center gap-5 text-center py-4">
                  <div className="w-16 h-16 rounded-[20px] bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-8 w-8 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif font-bold text-white">Session Voided</h2>
                    <p className="text-zinc-400 text-sm mt-1.5 max-w-sm mx-auto">Your session was voided because you left the tab. You cannot retry today.</p>
                  </div>
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <BookOpen className="h-4 w-4 text-zinc-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">How It Works</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: <BookOpen className="h-5 w-5 text-blue-400"/>, title: '5 Questions', desc: 'Covering Nigerian theatre, Shakespeare, and more.' },
                  { icon: <Zap className="h-5 w-5 text-amber-400"/>, title: '5s Per Question', desc: 'Answer fast. Running out of time counts as wrong.' },
                  { icon: <Trophy className="h-5 w-5 text-yellow-400"/>, title: '10 Winner Slots', desc: 'First 10 people to answer all correctly win bonus points.' },
                  { icon: <AlertTriangle className="h-5 w-5 text-red-400"/>, title: 'No Tab Switching', desc: 'Leaving the tab instantly voids your session.' },
                ].map(item => (
                  <div key={item.title} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="flex flex-col gap-5 animate-fade-up">

            {/* Slots leaderboard */}
            <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <h3 className="text-sm font-bold text-white">Today's Winners</h3>
              </div>
              {slots.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-600 text-xs">No winners yet. Be first!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {slots.map(slot => (
                    <div key={slot.position} className="flex items-center gap-3 p-3 bg-zinc-950/60 rounded-2xl border border-white/5">
                      <span className="text-amber-400 font-black font-mono text-sm w-5 text-center">#{slot.position}</span>
                      <span className="text-zinc-400 text-xs font-mono truncate flex-1">
                        {slot.userId === user?.id ? <span className="text-amber-400 font-bold">You! 🏆</span> : `${slot.userId.slice(0, 8)}…`}
                      </span>
                      <span className="text-zinc-600 text-[10px] shrink-0">
                        {new Date(slot.claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {totalSlots - slots.length > 0 && (
                    <p className="text-center text-zinc-600 text-xs mt-2">
                      {totalSlots - slots.length} slot{totalSlots - slots.length !== 1 ? 's' : ''} remaining
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Streak info */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="h-4 w-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Streak Milestones</h3>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { days: 7, icon: <Flame className="h-4 w-4 text-orange-400"/>, label: '7-Day Streak', pts: '+500 pts' },
                  { days: 30, icon: <Star className="h-4 w-4 text-yellow-400"/>, label: '30-Day Streak', pts: '+1500 pts' },
                  { days: 100, icon: <Trophy className="h-4 w-4 text-amber-400"/>, label: '100-Day Streak', pts: '+5000 pts' },
                ].map(m => (
                  <div key={m.days} className={`flex items-center justify-between p-3 rounded-xl border ${streakCount >= m.days ? 'bg-amber-500/5 border-amber-500/20' : 'bg-zinc-950/40 border-white/5'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${streakCount >= m.days ? 'bg-amber-500/20' : 'bg-zinc-900'}`}>
                        {m.icon}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{m.label}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold ${streakCount >= m.days ? 'text-amber-400' : 'text-zinc-600'}`}>{m.pts}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
