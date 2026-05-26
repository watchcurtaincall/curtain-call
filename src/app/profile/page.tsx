'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useWatchlist } from '@/lib/WatchlistContext';
import { MOCK_PRODUCTIONS, MOCK_REVIEWS } from '@/lib/mock';
import { ProductionCard } from '@/components/shared/ProductionCard';
import { useRouter } from 'next/navigation';
import { ClientDB, syncFromSupabase } from '@/lib/db';
import { Production } from '@/lib/types';
import {
  Star, Bookmark, PenLine, Award, CheckCircle, Circle,
  LogOut, Settings, Bell, ChevronRight, Lock,
  PenSquare, Target, Ticket, Mic2, Drama,
  FileText, Trophy, Library, Zap, Users, Crown, Sparkles, Shield, ShieldCheck,
  Plus, Wallet, TrendingUp, ArrowUpRight, BookOpen, AlertCircle, Trash2,
  Search, X, Clapperboard, Calendar
} from 'lucide-react';
import { WithdrawModal } from '@/components/producer/WithdrawModal';
import { NotificationsPanel } from '@/components/profile/NotificationsPanel';
import { SettingsPanel } from '@/components/profile/SettingsPanel';
import { EditReviewModal } from '@/components/profile/EditReviewModal';
import Link from 'next/link';

type Tab = 'dashboard' | 'productions' | 'submissions' | 'reviews' | 'list' | 'badges' | 'stageography';

const ACTIVITY = [
  { text: 'Rated WATERSIDE 9/10',                         time: '2 days ago',  Icon: Star       },
  { text: 'Added Oba Ovonramwen to your list',             time: '5 days ago',  Icon: Bookmark   },
  { text: 'Wrote a review for Motherland The Musical',     time: '1 week ago',  Icon: PenLine    },
];

export default function ProfilePage() {
  const { user, logout, verifyCode, resendVerificationCode } = useAuth();
  const { watchlist } = useWatchlist();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const [allPlays, setAllPlays] = useState<Production[]>([]);
  const [syncCount, setSyncCount] = useState(0);
  const router = useRouter();

  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSync = () => setSyncCount(prev => prev + 1);
    window.addEventListener('cc-db-synced', handleSync);
    window.addEventListener('cc-profile-updated', handleSync);
    
    // Background pull database sync on page load/mount
    syncFromSupabase();

    return () => {
      window.removeEventListener('cc-db-synced', handleSync);
      window.removeEventListener('cc-profile-updated', handleSync);
    };
  }, []);

  useEffect(() => {
    setAllPlays(ClientDB.getProductions());
  }, [tab, syncCount]);

  // ── DYNAMIC WALLET CALCULATIONS ──
  const [walletMetrics, setWalletMetrics] = useState({
    available: 0,
    totalEarned: 0,
    withdrawn: 0,
    transactions: [] as any[]
  });

  useEffect(() => {
    if (!user) return;
    const userPlays = allPlays.filter(p => p.submitterEmail?.toLowerCase() === user.email.toLowerCase());
    const userPlayIds = userPlays.map(p => p.id);
    
    // Fetch real database records
    const dbTickets = ClientDB.getTickets();
    const dbWithdrawals = ClientDB.getWithdrawals();
    
    // Filter tickets sold for their plays
    const userTickets = dbTickets.filter(t => userPlayIds.includes(t.productionId));
    const grossEarnings = userTickets.reduce((acc, t) => acc + t.price, 0);
    const totalEarned = grossEarnings * 0.95; // 5% platform fee deducted
    
    // Filter withdrawals requested by them
    const userWithdrawals = dbWithdrawals.filter(w => w.email.toLowerCase() === user.email.toLowerCase());
    const approvedWithdrawals = userWithdrawals.filter(w => w.status === 'Approved');
    const totalWithdrawn = approvedWithdrawals.reduce((acc, w) => acc + w.amount, 0);
    
    const pendingWithdrawals = userWithdrawals.filter(w => w.status === 'Pending');
    const totalPending = pendingWithdrawals.reduce((acc, w) => acc + w.amount, 0);
    
    const available = Math.max(0, totalEarned - totalWithdrawn - totalPending);
    
    // Combine and sort transactions chronologically
    const transactions = [
      ...userTickets.map(t => ({
        label: `Ticket sale — ${t.productionTitle} (${t.tier}) (Net after 5% fee)`,
        amount: `+₦${(t.price * 0.95).toLocaleString()}`,
        date: t.date || 'Recently',
        positive: true,
        timestamp: t.timestamp || 0
      })),
      ...userWithdrawals.map(w => ({
        label: `Withdrawal to ${w.bankName} ····${w.accountNumber.slice(-4)}`,
        amount: `−₦${w.amount.toLocaleString()}`,
        date: w.timestamp ? w.timestamp.split(' ')[0] : 'Recently',
        positive: false,
        timestamp: w.id ? Number(w.id.replace('w_req_', '')) : 0
      }))
    ].sort((a, b) => b.timestamp - a.timestamp);
    
    setWalletMetrics({
      available,
      totalEarned,
      withdrawn: totalWithdrawn,
      transactions
    });
  }, [user, allPlays, syncCount]);

  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!user) return;
    const notifs = ClientDB.getNotifications(user.email);
    setUnreadNotifications(notifs.filter(n => !n.read).length);
  }, [user, syncCount]);

  const handleEndShow = (id: string) => {
    const play = allPlays.find(p => p.id === id);
    if (play) {
      const updatedPlay = {
        ...play,
        status: 'Recently Concluded' as const
      };
      ClientDB.saveProduction(updatedPlay);
      setSyncCount(prev => prev + 1);
    }
  };

  const handleDeleteDraft = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this draft? This action cannot be undone.')) {
      ClientDB.deleteProduction(id);
      setSyncCount(prev => prev + 1);
    }
  };

  // Pull and merge user submissions dynamically
  useEffect(() => {
    if (!user) return;
    const emailLower = user.email.toLowerCase();

    // 1. Pending Submissions
    const pendingArtists = ClientDB.getPendingArtists()
      .filter(a => a.submitterEmail?.toLowerCase() === emailLower)
      .map(item => ({ ...item, contentType: 'Theatremaker Profile', status: 'Pending', icon: Users }));

    const pendingPlays = ClientDB.getPendingPlays()
      .filter(p => p.submitterEmail?.toLowerCase() === emailLower)
      .map(item => ({ ...item, contentType: 'Playbill Listing', status: 'Pending', icon: Drama }));

    const pendingArticles = ClientDB.getPendingArticles()
      .filter(a => a.submitterEmail?.toLowerCase() === emailLower)
      .map(item => ({ ...item, contentType: 'Blog Draft', status: 'Pending', icon: BookOpen }));

    // 2. Approved Submissions
    const approvedArtists = ClientDB.getArtists()
      .filter(a => a.submitterEmail?.toLowerCase() === emailLower && a.curationStatus === 'Approved')
      .map(item => ({ ...item, contentType: 'Theatremaker Profile', status: 'Approved', icon: Users }));

    const approvedPlays = ClientDB.getProductions()
      .filter(p => p.submitterEmail?.toLowerCase() === emailLower && p.curationStatus === 'Approved' && p.isProducerManaged !== true)
      .map(item => ({ ...item, contentType: 'Playbill Listing', status: 'Approved', icon: Drama }));

    const approvedArticles = ClientDB.getArticles()
      .filter(a => a.submitterEmail?.toLowerCase() === emailLower && a.curationStatus === 'Approved')
      .map(item => ({ ...item, contentType: 'Blog Draft', status: 'Approved', icon: BookOpen }));

    // 3. Declined Submissions
    const declined = ClientDB.getDeclinedSubmissions()
      .filter(d => d.submitterEmail?.toLowerCase() === emailLower)
      .map(item => {
        let type = 'Theatremaker Profile';
        let icon = Users;
        if ('genre' in item) {
          type = 'Playbill Listing';
          icon = Drama;
        } else if ('excerpt' in item) {
          type = 'Blog Draft';
          icon = BookOpen;
        }
        return { ...item, contentType: type, status: 'Declined', icon };
      });

    // 4. Withdrawal Submissions
    const withdrawalsList = ClientDB.getWithdrawals()
      .filter(w => w.email.toLowerCase() === emailLower)
      .map(item => ({
        id: item.id || `w_${Date.now()}`,
        name: `Cash-out: ₦${item.amount.toLocaleString()} to ${item.bankName}`,
        title: `Cash-out: ₦${item.amount.toLocaleString()} to ${item.bankName}`,
        bio: `Account: ····${item.accountNumber.slice(-4)}`,
        contentType: 'Withdrawal Request',
        status: item.status, // 'Pending' | 'Approved' | 'Declined'
        declineReason: item.declineReason || null,
        icon: Wallet
      }));

    const merged = [
      ...pendingArtists, 
      ...pendingPlays, 
      ...pendingArticles, 
      ...approvedArtists, 
      ...approvedPlays, 
      ...approvedArticles, 
      ...declined,
      ...withdrawalsList
    ];
    setUserSubmissions(merged);
  }, [user, tab, syncCount]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center">
          <Lock className="h-7 w-7 text-zinc-500" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-white">Sign in to view your profile</h1>
        <Link href="/login" className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-zinc-100 transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  if (user && !user.isVerified) {
    const handleVerify = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!otpCode.trim()) return;
      
      setOtpError('');
      setOtpSuccess(false);
      try {
        const ok = await verifyCode(otpCode.trim());
        if (ok) {
          setOtpSuccess(true);
          
          // Trigger immediate database sync to pull newly verified critic whitelist!
          syncFromSupabase();
          
          setTimeout(() => {
            setSyncCount(prev => prev + 1);
          }, 1500);
        } else {
          setOtpError('Invalid 4-digit verification code. Please check your email or resend a new code.');
        }
      } catch (err) {
        setOtpError('Verification failed. Please try again.');
      }
    };

    const handleResend = async () => {
      if (resendTimer > 0) return;
      setResending(true);
      setOtpError('');
      try {
        await resendVerificationCode();
        setResendTimer(30);
      } catch (err) {
        setOtpError('Failed to resend code. Please try again.');
      } finally {
        setResending(false);
      }
    };

    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Spotlight Backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-950/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative w-full max-w-md bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8 animate-fade-down">
            <span className="font-serif text-2xl font-bold tracking-tight text-white block">Curtain Call</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mt-1">Front Row Authentication</span>
          </div>

          {otpSuccess ? (
            <div className="text-center py-8 animate-scale-up flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 shadow-lg">
                <CheckCircle className="h-8 w-8 animate-pulse" />
              </div>
              <h2 className="font-serif font-bold text-white text-xl mb-2">Account Verified!</h2>
              <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
                Welcome to the stage. Unlocking your profile dashboard...
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-fade-up">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-950/40 border border-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-6 w-6 text-red-500" />
                </div>
                <h2 className="font-serif font-bold text-white text-lg">Confirm your email address</h2>
                <p className="text-xs text-zinc-400 mt-2 px-2 leading-relaxed">
                  We sent a 4-digit verification code to <span className="text-zinc-200 font-bold font-mono">{user.email}</span>. Please enter it below to unlock the platform:
                  <br />
                  <span className="text-[11px] text-zinc-500 block mt-2">
                    ✉️ Don't see the email? Please **check your spam or junk folder**.
                  </span>
                </p>
              </div>

              <form onSubmit={handleVerify} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Enter 4-digit code"
                    value={otpCode}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setOtpCode(val);
                    }}
                    className="bg-zinc-950/80 border border-white/5 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 rounded-xl px-4 py-3.5 text-center text-2xl font-bold font-mono text-white tracking-[8px] placeholder:tracking-normal placeholder:text-sm placeholder:text-zinc-600 focus:outline-none transition-all shadow-inner"
                  />
                  {otpError && (
                    <span className="text-red-400 text-xs mt-1 text-center font-medium leading-snug flex items-center justify-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {otpError}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={otpCode.length < 4}
                  className="w-full bg-white hover:bg-zinc-100 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold py-3.5 rounded-xl transition-all text-xs uppercase tracking-wider shadow-lg active:scale-[0.98]"
                >
                  Verify Account
                </button>
              </form>

              <div className="flex items-center justify-between border-t border-white/5 pt-5 mt-2">
                <button
                  onClick={handleResend}
                  disabled={resendTimer > 0 || resending}
                  className="text-xs font-bold font-mono text-zinc-400 hover:text-white disabled:text-zinc-600 transition-colors uppercase tracking-wider"
                >
                  {resending ? 'Sending...' : resendTimer > 0 ? `Resend Code (${resendTimer}s)` : 'Resend Code'}
                </button>

                <button
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                  className="text-xs font-bold font-mono text-zinc-500 hover:text-red-400 transition-colors uppercase tracking-wider flex items-center gap-1"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </div>

              <div className="bg-zinc-950/30 border border-white/5 rounded-xl p-3.5 text-center mt-2">
                <span className="text-[11px] text-zinc-500 font-medium leading-relaxed block">
                  Didn't receive the code? Please check your <strong>Spam</strong> or <strong>Junk</strong> folder. If it is still missing, double-check your email or try resending the code.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const watchlistProductions = allPlays.filter(p => watchlist.includes(p.id));
  
  // Calculate dynamic user-specific reviews
  const dbReviews = ClientDB.getReviews();
  const userReviews = dbReviews.filter(r => 
    (r.submitterEmail && r.submitterEmail.toLowerCase() === user.email.toLowerCase()) || 
    r.author.toLowerCase() === user.name.toLowerCase() || 
    (user.email.toLowerCase() === 'adaeze@example.com' && r.type === 'Audience')
  );

  // Dynamic point system logic - attach points to each step
  const validatedDone = user.bio ? user.bio.trim().length > 0 : false; 
  const ratedCount = user.email === 'adaeze@example.com' ? user.ratings : userReviews.length;
  const reviewsCount = user.email === 'adaeze@example.com' ? user.reviews : userReviews.length;

  const ratedDone = ratedCount > 0;
  const reviewedDone = reviewsCount > 0;
  const watchlistDone = watchlist.length > 0;

  // Let's compute points dynamically based on the 4 steps of checklist
  const points = (validatedDone ? 150 : 0) + (ratedDone ? 200 : 0) + (reviewedDone ? 300 : 0) + (watchlistDone ? 350 : 0);

  // Max/highest points is 1k (1000)
  const progressPct = Math.min(100, Math.round((points / 1000) * 100));

  const dynamicChecklist = [
    { label: 'Validate your account (+150 PTS)',      done: validatedDone, points: 150 },
    { label: 'Rate some titles! (+200 PTS)',           done: ratedDone,     points: 200 },
    { label: 'Write a review (+300 PTS)',             done: reviewedDone,  points: 300 },
    { label: 'Add some titles to your list (+350 PTS)', done: watchlistDone, points: 350 },
  ];

  const dynamicBadges = [
    { id: 1,  name: 'First Review',       Icon: PenSquare,  desc: 'Write your first review',               points: 50,  unlocked: reviewsCount > 0,      color: 'text-violet-400 bg-violet-500/10 border-violet-500/25' },
    { id: 2,  name: 'First Rating',        Icon: Star,       desc: 'Rate your first production',            points: 50,  unlocked: ratedCount > 0,      color: 'text-amber-400 bg-amber-500/10 border-amber-500/25' },
    { id: 3,  name: "Critic's Eye",        Icon: Target,     desc: 'Rate 10 productions',                   points: 100, unlocked: ratedCount >= 10,     color: 'text-blue-400 bg-blue-500/10 border-blue-500/25' },
    { id: 4,  name: 'Season Ticket',       Icon: Ticket,     desc: 'Add 5 shows to watchlist',              points: 100, unlocked: watchlist.length >= 5, color: 'text-green-400 bg-green-500/10 border-green-500/25' },
    { id: 5,  name: 'Voice of the Stage',  Icon: Mic2,       desc: 'Write 10 reviews',                      points: 150, unlocked: reviewsCount >= 10,     color: 'text-pink-400 bg-pink-500/10 border-pink-500/25' },
    { id: 6,  name: 'Curtain Raiser',      Icon: Drama,      desc: 'Attend your first verified show',        points: 100, unlocked: ClientDB.getTickets().some(t => t.buyerEmail?.toLowerCase() === user.email.toLowerCase()), color: 'text-red-400 bg-red-500/10 border-red-500/25' },
    { id: 7,  name: 'Prolific Reviewer',   Icon: FileText,   desc: 'Write 50 reviews',                      points: 200, unlocked: reviewsCount >= 50,     color: 'text-orange-400 bg-orange-500/10 border-orange-500/25' },
    { id: 8,  name: 'Top Critic',          Icon: Trophy,     desc: 'Reach 500 points',                      points: 250, unlocked: points >= 500,        color: 'text-amber-500 bg-amber-500/10 border-amber-500/25' },
    { id: 9,  name: 'Cultural Archivist',  Icon: Library,    desc: 'Review historical productions',         points: 150, unlocked: reviewsCount >= 3,      color: 'text-sky-400 bg-sky-500/10 border-sky-500/25' },
    { id: 10, name: 'Trendsetter',         Icon: Zap,        desc: 'Review show in first week',             points: 150, unlocked: reviewsCount >= 5,      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25' },
    { id: 11, name: 'Social Stage',        Icon: Users,      desc: 'Get 10 followers',                      points: 100, unlocked: false,                  color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25' },
    { id: 12, name: 'Grand Reviewer',      Icon: Crown,      desc: 'Write 100 reviews',                     points: 300, unlocked: reviewsCount >= 100,    color: 'text-red-500 bg-red-500/10 border-red-500/25' },
    { id: 13, name: 'Patron of the Arts',  Icon: Sparkles,   desc: 'Reach 1000 points',                     points: 500, unlocked: points >= 1000,       color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
    { id: 14, name: 'Legend',              Icon: Shield,     desc: 'Complete all other badges',             points: 1000,unlocked: points >= 1000,       color: 'text-rose-500 bg-rose-500/10 border-rose-500/25' },
  ];

  const badgesUnlockedCount = dynamicBadges.filter(b => b.unlocked).length;

  // Tabs ordered Dashboard -> Production -> My Submissions
  const tabs: { id: Tab; label: string; Icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard',     label: 'Dashboard',      Icon: Star          },
    { id: 'productions',   label: 'Production',     Icon: Drama         },
    { id: 'submissions',   label: 'My Submissions', Icon: FileText      },
    { id: 'reviews',       label: 'My Reviews',     Icon: PenLine       },
    { id: 'list',          label: 'My List',        Icon: Bookmark      },
    { id: 'stageography',  label: 'Stageography',   Icon: Clapperboard  },
    { id: 'badges',        label: 'Badges',         Icon: Award         },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      {showWithdraw && <WithdrawModal availableBalance={walletMetrics.available} onClose={() => setShowWithdraw(false)} />}
      {showNotifs   && <NotificationsPanel onClose={() => setShowNotifs(false)} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      {editingReview && (
        <EditReviewModal
          review={editingReview}
          productionTitle={allPlays.find(p => p.id === editingReview.productionId)?.title || 'Unknown Production'}
          onClose={() => setEditingReview(null)}
          onSave={() => setSyncCount(prev => prev + 1)}
        />
      )}

      {/* Logout confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-xs bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl text-center animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <LogOut className="h-5 w-5 text-zinc-400" />
            </div>
            <h2 className="font-serif font-bold text-white text-lg mb-1">Sign out?</h2>
            <p className="text-sm text-zinc-500 mb-6">You&apos;ll need to sign in again to access your profile.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 bg-zinc-800 border border-white/10 text-white font-medium py-3 rounded-xl hover:bg-zinc-700 transition-colors text-sm">Cancel</button>
              <button onClick={() => { logout(); router.push('/'); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors text-sm">Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Profile Header ── */}
      <div className="bg-zinc-900 border-b border-white/5 animate-fade-down">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-lg font-serif">
                {user.avatar}
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-white">{user.name}</h1>
                {user.handle && <p className="text-red-400 text-xs font-mono mt-0.5">{user.handle}</p>}
                <p className="text-zinc-500 text-sm mt-0.5">Member since {user.joinDate}</p>
                {user.bio && <p className="text-zinc-400 text-xs mt-1.5 max-w-sm italic">"{user.bio}"</p>}
                <div className="flex items-center gap-1.5 mt-2">
                  {ClientDB.isApprovedCritic(user.email) ? (
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Verified Critic
                    </span>
                  ) : (
                    <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                      Audience
                    </span>
                  )}
                  {userSubmissions.length > 0 && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold flex items-center gap-1">
                      Contributor
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNotifs(true)}
                className="relative p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-zinc-400 hover:text-white"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-zinc-900" />
                )}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-zinc-400 hover:text-white"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="p-2.5 bg-zinc-800 hover:bg-red-900/40 rounded-xl transition-colors text-zinc-400 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: 'Ratings',   value: ratedCount      },
              { label: 'Watchlist', value: watchlist.length   },
              { label: 'Reviews',   value: reviewsCount       },
            ].map(stat => (
              <div key={stat.label} className="bg-zinc-800/60 rounded-2xl p-4 text-center border border-white/5">
                <div className="text-2xl font-bold text-white font-serif">{stat.value}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="container mx-auto px-4">
          <div className="flex border-t border-white/5 overflow-x-auto [scrollbar-width:none]">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors relative ${
                  tab === id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
                {tab === id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-t-full" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="container mx-auto px-4 py-8">

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div className="flex flex-col gap-5 animate-fade-up">

            {/* Points & Badges */}
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif font-bold text-white text-lg">Points & Badges</h2>
                <button onClick={() => setTab('badges')} className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1">
                  View all <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-white/5">
                  <div className="text-3xl font-serif font-bold text-white">{points.toLocaleString()}</div>
                  <div className="text-xs text-zinc-500 mt-1">Points</div>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-white/5">
                  <div className="text-3xl font-serif font-bold text-white">
                    {badgesUnlockedCount}<span className="text-lg text-zinc-500">/{dynamicBadges.length}</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Badges Unlocked</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-red-600 h-full rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="text-xs text-zinc-500 shrink-0">{progressPct}%</span>
              </div>
              <p className="text-xs text-zinc-600 mt-2">Carry out more activities to unlock more badges.</p>
            </div>
 
            {/* Checklist */}
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
              <h2 className="font-serif font-bold text-white text-lg mb-4">Profile Checklist</h2>
              <div className="flex flex-col gap-3">
                {dynamicChecklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {item.done
                      ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      : <Circle      className="h-5 w-5 text-zinc-600 shrink-0" />
                    }
                    <span className={`text-sm ${item.done ? 'text-zinc-500 line-through' : 'text-white'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
              <h2 className="font-serif font-bold text-white text-lg mb-4">Recent Activity</h2>
              <div className="flex flex-col divide-y divide-white/5">
                {ACTIVITY.map(({ text, time, Icon }, i) => (
                  <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 leading-snug">{text}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">{time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTION HUB */}
        {tab === 'productions' && (
          <div className="flex flex-col gap-8 animate-fade-up">
            
            {/* Top grid (Active Productions + Wallet) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Active list */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <h2 className="font-serif font-bold text-white text-lg">Production Hub</h2>
                    <p className="text-zinc-500 text-xs mt-0.5">Manage your dynamically listed theatrical stage plays.</p>
                  </div>
                  <Link href="/create" className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-xs uppercase tracking-widest shadow-lg shadow-red-950/20 hover:scale-[1.02] active:scale-[0.98] border border-white/10">
                    <Plus className="h-3.5 w-3.5" /> Add Production
                  </Link>
                </div>

                {/* Active Productions */}
                <div>
                  <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-red-600 rounded-full" />
                    Active Productions
                  </h3>
                  {allPlays.filter(p => p.submitterEmail === user.email && p.isProducerManaged === true && (p.status === 'Currently Showing' || p.status === 'Coming Soon')).length === 0 ? (
                    <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-8 text-center text-zinc-500 text-sm">
                      No active plays currently listed.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {allPlays.filter(p => p.submitterEmail === user.email && p.isProducerManaged === true && (p.status === 'Currently Showing' || p.status === 'Coming Soon')).map(p => (
                        <div key={p.id} className="flex flex-col gap-2 bg-zinc-900/20 border border-white/5 p-3 rounded-2xl">
                          <div className="flex-1">
                            <ProductionCard production={p} />
                          </div>
                          <div className="flex gap-2 mt-1 shrink-0">
                            <Link
                              href={`/create?edit=${p.id}`}
                              className="flex-1 bg-zinc-900/80 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 font-bold py-2 rounded-xl transition-all text-[10px] tracking-wider uppercase text-center flex items-center justify-center gap-1"
                            >
                              <PenSquare className="h-3 w-3 text-red-400" /> Edit
                            </Link>
                            <button
                              onClick={() => handleEndShow(p.id)}
                              className="flex-1 bg-zinc-900/80 hover:bg-red-950/20 text-zinc-400 hover:text-red-400 border border-white/5 hover:border-red-500/35 font-bold py-2 rounded-xl transition-all text-[10px] tracking-wider uppercase flex items-center justify-center gap-1"
                            >
                              End Show
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Drafts & Unfinished Works */}
                <div className="mt-8 pt-8 border-t border-white/5">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-zinc-600 rounded-full" />
                    Drafts & Unfinished Works
                  </h3>
                  {allPlays.filter(p => p.submitterEmail === user.email && p.isProducerManaged === true && p.status === 'Draft').length === 0 ? (
                    <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-8 text-center text-zinc-500 text-sm">
                      No drafts or unfinished works found.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {allPlays.filter(p => p.submitterEmail === user.email && p.isProducerManaged === true && p.status === 'Draft').map(p => (
                        <div key={p.id} className="flex flex-col gap-2 bg-zinc-900/20 border border-white/5 p-3 rounded-2xl relative group/card">
                          <div className="flex-1">
                            <ProductionCard production={p} />
                          </div>
                          <div className="flex gap-2 mt-1 shrink-0">
                            <Link
                              href={`/create?edit=${p.id}`}
                              className="flex-1 bg-zinc-900/80 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 font-bold py-2 rounded-xl transition-all text-[10px] tracking-wider uppercase text-center flex items-center justify-center gap-1"
                            >
                              <PenSquare className="h-3 w-3 text-red-400" /> Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteDraft(p.id)}
                              className="flex-1 bg-zinc-900/80 hover:bg-red-950/20 text-red-450 hover:text-red-400 border border-white/5 hover:border-red-500/35 font-bold py-2 rounded-xl transition-all text-[10px] tracking-wider uppercase flex items-center justify-center gap-1"
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Wallet Panel */}
              <div className="flex flex-col gap-4">
                <h2 className="font-serif font-bold text-white text-lg">My Producer Wallet</h2>
                
                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-green-500" />
                      <h3 className="font-serif font-bold text-white text-base">Wallet Earnings</h3>
                    </div>
                    <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                      Active
                    </span>
                  </div>

                  <div className="mb-6">
                    <p className="text-xs text-zinc-500 mb-1">Available Balance</p>
                    <p className="text-4xl font-serif font-bold text-white">₦{walletMetrics.available.toLocaleString()}.<span className="text-2xl text-zinc-500">00</span></p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-zinc-800/40 rounded-xl p-3 border border-white/5">
                      <div className="flex items-center gap-1 mb-0.5">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <p className="text-[10px] text-zinc-500">Total Earned</p>
                      </div>
                      <p className="text-lg font-bold font-serif text-white">₦{walletMetrics.totalEarned.toLocaleString()}</p>
                    </div>
                    <div className="bg-zinc-800/40 rounded-xl p-3 border border-white/5">
                      <div className="flex items-center gap-1 mb-0.5">
                        <ArrowUpRight className="h-3 w-3 text-blue-400" />
                        <p className="text-[10px] text-zinc-500">Withdrawn</p>
                      </div>
                      <p className="text-lg font-bold font-serif text-white">₦{walletMetrics.withdrawn.toLocaleString()}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowWithdraw(true)}
                    className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-all text-xs uppercase tracking-wider"
                  >
                    Withdraw to Bank Account
                  </button>
                </div>

                {/* Recent Transactions */}
                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                  <h3 className="font-serif font-bold text-white mb-4 text-sm">Recent Transactions (Last 7)</h3>
                  <div className="flex flex-col divide-y divide-white/5">
                    {walletMetrics.transactions.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-3 text-center">No transaction records found.</p>
                    ) : (
                      walletMetrics.transactions.slice(0, 7).map((tx, i) => (
                        <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                          <div>
                            <p className="text-xs text-white leading-tight">{tx.label}</p>
                            <p className="text-[10px] text-zinc-600 mt-0.5">{tx.date}</p>
                          </div>
                          <span className={`text-xs font-bold ${tx.positive ? 'text-green-400' : 'text-zinc-400'}`}>{tx.amount}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Administrative entry button (hidden except inside creator dashboard) */}
                <div className="bg-zinc-900 border border-red-900/10 rounded-2xl p-5 text-center flex flex-col gap-2">
                  <div className="text-xs text-zinc-500 font-medium">Administrator Curation Engine</div>
                  <Link
                    href="/admin"
                    className="w-full bg-zinc-800 border border-white/5 hover:border-red-600/30 text-zinc-300 hover:text-white font-bold py-2 rounded-xl transition-all text-xs"
                  >
                    Open Curation Board
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Section - Full Width Past Productions */}
            <div className="mt-8 pt-8 border-t border-white/5 w-full">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-zinc-700 rounded-full" />
                Past Productions
              </h3>
              {allPlays.filter(p => p.submitterEmail === user.email && p.isProducerManaged === true && (p.status === 'Past Production' || p.status === 'Recently Concluded')).length === 0 ? (
                <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-8 text-center text-zinc-500 text-sm">
                  No past/concluded plays registered.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {allPlays.filter(p => p.submitterEmail === user.email && p.isProducerManaged === true && (p.status === 'Past Production' || p.status === 'Recently Concluded')).map(p => (
                    <div key={p.id} className="flex flex-col gap-2 bg-zinc-900/20 border border-white/5 p-3 rounded-2xl">
                      <div className="flex-1">
                        <ProductionCard production={p} />
                      </div>
                      <Link
                        href={`/create?edit=${p.id}`}
                        className="w-full bg-zinc-900/80 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 font-bold py-2 rounded-xl transition-all text-[10px] tracking-wider uppercase text-center flex items-center justify-center gap-1 mt-1 shrink-0"
                      >
                        <PenSquare className="h-3.5 w-3.5 text-red-400" /> Edit Details
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* MY SUBMISSIONS */}
        {tab === 'submissions' && (
          <div className="flex flex-col gap-4 animate-fade-up max-w-4xl mx-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h2 className="font-serif font-bold text-white text-lg">Curation Status Tracker</h2>
                <p className="text-zinc-500 text-xs mt-0.5">Track your submitted theatremakers, playbills, and drafts.</p>
              </div>
              <Link href="/submit" className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl transition-all text-xs">
                <Plus className="h-3.5 w-3.5" /> Submit New
              </Link>
            </div>

            {userSubmissions.length === 0 ? (
              <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-500 mb-4">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="font-serif font-bold text-white text-lg mb-1">No Submissions Found</h3>
                <p className="text-zinc-500 text-sm max-w-sm leading-relaxed mb-6">
                  You haven&apos;t submitted any stage playbills, theatremaker profiles, or chronicle drafts yet. Contribute to begin!
                </p>
                <Link href="/submit" className="bg-white text-black font-bold px-5 py-2.5 rounded-xl hover:bg-zinc-200 transition-colors text-sm">
                  Submit Record
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {userSubmissions.map((sub, idx) => {
                  const SubIcon = sub.icon || FileText;
                  return (
                    <div key={idx} className="bg-zinc-900 border border-white/5 rounded-2xl p-5 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 border border-white/5 shrink-0">
                          <SubIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                            {sub.contentType}
                          </span>
                          <h3 className="font-serif font-bold text-white text-base mt-0.5 leading-tight">
                            {sub.name || sub.title}
                          </h3>
                          <p className="text-zinc-500 text-xs mt-1 line-clamp-1">
                            {sub.bio || sub.synopsis || sub.excerpt}
                          </p>
                          {sub.status === 'Declined' && sub.declineReason && (
                            <div className="mt-3 bg-red-950/20 border border-red-500/10 rounded-xl p-3 text-xs text-red-300/90 max-w-xl">
                              <span className="font-mono text-[9px] uppercase tracking-wider font-bold block mb-1 text-red-400">Curator Rejection Note:</span>
                              "{sub.declineReason}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        {sub.status === 'Pending' && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                            Pending
                          </span>
                        )}
                        {sub.status === 'Approved' && (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                            ✓ Approved & Live
                          </span>
                        )}
                        {sub.status === 'Declined' && (
                          <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                            ⚠ Declined
                          </span>
                        )}
                        <span className="text-[9px] text-zinc-600 font-mono mt-1">
                          ID: {sub.id.substring(0, 12)}...
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MY REVIEWS */}
        {tab === 'reviews' && (
          <div className="flex flex-col gap-4 animate-fade-up">
            {userReviews.length === 0 ? (
              <div className="text-center py-20">
                <PenLine className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">You haven&apos;t written any reviews yet.</p>
                <Link href="/discovery" className="text-red-500 text-sm mt-2 inline-block hover:underline">Find a production to review</Link>
              </div>
            ) : (
              userReviews.map(r => {
                const prod = allPlays.find(p => p.id === r.productionId);
                return (
                  <div key={r.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs text-zinc-500 mb-0.5">{r.date || 'Recently'}</p>
                          <h3 className="font-serif font-bold text-white text-base">{prod?.title || 'Unknown Production'}</h3>
                        </div>
                        <div className="flex items-center gap-1 bg-zinc-800 px-2.5 py-1 rounded-full text-sm font-bold text-white border border-white/5">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {parseFloat((r.rating / 10).toFixed(1))}
                        </div>
                      </div>
                      {r.headline && (
                        <h4 className="text-sm font-bold text-zinc-100 mb-1.5 font-sans">
                          {r.headline}
                        </h4>
                      )}
                      <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
                    </div>

                    <div className="flex justify-end mt-4 pt-3 border-t border-white/5">
                      <button
                        onClick={() => setEditingReview(r)}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 font-bold uppercase tracking-wider transition-colors"
                      >
                        <PenSquare className="h-3.5 w-3.5" /> Edit Review
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* MY LIST */}
        {tab === 'list' && (
          <div className="animate-fade-up">
            {watchlistProductions.length === 0 ? (
              <div className="text-center py-20">
                <Bookmark className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">Your watchlist is empty.</p>
                <Link href="/discovery" className="text-red-500 text-sm mt-2 inline-block hover:underline">Browse productions to add</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {watchlistProductions.map(p => (
                  <ProductionCard key={p.id} production={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* BADGES */}
        {tab === 'badges' && (
          <div className="animate-fade-up">
            <p className="text-sm text-zinc-500 mb-6">{badgesUnlockedCount} of {dynamicBadges.length} badges unlocked</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {dynamicBadges.map(({ id, name, Icon, desc, points: badgePoints, unlocked, color }) => (
                <div
                  key={id}
                  className={`rounded-2xl p-5 border flex flex-col items-center text-center gap-2.5 transition-all ${
                    unlocked ? `bg-zinc-900 border-white/10` : 'bg-zinc-900/40 border-white/5 opacity-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${unlocked ? color : 'bg-zinc-800 border-white/5'}`}>
                    {unlocked
                      ? <Icon className={`h-5 w-5 ${color.split(' ')[0]}`} />
                      : <Lock className="h-5 w-5 text-zinc-600" />
                    }
                  </div>
                  <div className="font-semibold text-sm text-white leading-snug">{name}</div>
                  <div className="text-xs text-zinc-500 leading-tight">{desc}</div>
                  <div className="text-[10px] text-zinc-600 font-semibold">{badgePoints} PTS</div>
                  {unlocked && (
                    <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-semibold">
                      Unlocked
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STAGEOGRAPHY */}
        {tab === 'stageography' && (
          <ProfileStageographyTab userEmail={user.email} />
        )}

      </div>
    </div>
  );
}

// ── Stageography Tab Component ──
function ProfileStageographyTab({ userEmail }: { userEmail: string }) {
  const [searchQ, setSearchQ] = useState('');
  const [selectedProd, setSelectedProd] = useState<{ id: string; title: string } | null>(null);
  const [roleInput, setRoleInput] = useState('');
  const [credits, setCredits] = useState<{ productionId: string; productionTitle: string; role: string }[]>([]);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Load the user's artist profile credits on mount
  useEffect(() => {
    const artists = ClientDB.getArtists();
    const match = artists.find(a => a.submitterEmail?.toLowerCase() === userEmail.toLowerCase());
    if (match) {
      setArtistId(match.id);
      setCredits(match.scenography || []);
    }
  }, [userEmail]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const allProductions = ClientDB.getProductions().filter(p => p.curationStatus === 'Approved' || !p.curationStatus);
  const filtered = searchQ.trim().length > 0
    ? allProductions.filter(p => p.title.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 8)
    : [];

  const handleAdd = () => {
    if (!selectedProd || !roleInput.trim() || !artistId) return;
    const isDup = credits.some(c => c.productionId === selectedProd.id);
    if (isDup) { showToast('This production is already in your stageography.'); return; }
    const updated = [...credits, { productionId: selectedProd.id, productionTitle: selectedProd.title, role: roleInput.trim() }];
    setCredits(updated);
    // Persist: find artist and save
    const artists = ClientDB.getArtists();
    const artist = artists.find(a => a.id === artistId);
    if (artist) {
      ClientDB.saveArtist({ ...artist, scenography: updated });
      showToast(`Added "${selectedProd.title}" to your stageography!`);
    }
    setSelectedProd(null);
    setRoleInput('');
    setSearchQ('');
  };

  const handleRemove = (prodId: string) => {
    const updated = credits.filter(c => c.productionId !== prodId);
    setCredits(updated);
    const artists = ClientDB.getArtists();
    const artist = artists.find(a => a.id === artistId);
    if (artist) {
      ClientDB.saveArtist({ ...artist, scenography: updated });
      showToast('Credit removed from your stageography.');
    }
  };

  if (!artistId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4 animate-fade-up">
        <Clapperboard className="h-10 w-10 text-zinc-700" />
        <h3 className="font-serif font-bold text-white text-lg">No Artist Profile Found</h3>
        <p className="text-zinc-500 text-sm max-w-sm leading-relaxed">
          Your Stageography is linked to your approved theatremaker profile. Submit an artist profile first and once approved, you can document your production credits here.
        </p>
        <Link href="/submit?tab=artist" className="text-sm font-bold text-red-500 hover:text-red-400 underline underline-offset-4 transition-colors">
          Submit Theatremaker Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-up">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 border border-white/10 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-2xl animate-fade-up">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h2 className="font-serif font-bold text-white text-2xl mb-1">My Stageography</h2>
        <p className="text-zinc-400 text-sm">Document your production credits — only works listed on Curtain Call can be added. This section is optional.</p>
      </div>

      {/* Add New Credit */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
        <h3 className="font-serif font-bold text-white text-base flex items-center gap-2">
          <Plus className="h-4 w-4 text-red-500" /> Add Production Credit
        </h3>

        {!selectedProd ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search for a production on Curtain Call..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full bg-zinc-950 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 placeholder:text-zinc-600"
            />
            {filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden z-20 shadow-2xl">
                {filtered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProd({ id: p.id, title: p.title }); setSearchQ(''); }}
                    className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors border-b border-white/5 last:border-0 flex items-center justify-between"
                  >
                    <span>{p.title}</span>
                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{p.status}</span>
                  </button>
                ))}
              </div>
            )}
            {searchQ.trim().length > 0 && filtered.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-zinc-900 border border-white/10 rounded-2xl px-4 py-4 text-sm text-zinc-500 z-20">
                No productions found matching &quot;{searchQ}&quot;
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between bg-zinc-950 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-sm font-bold text-white">{selectedProd.title}</p>
              <button onClick={() => setSelectedProd(null)} className="text-zinc-500 hover:text-white ml-3 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Your role (e.g. Director, Lead Actor, Stage Manager)"
                value={roleInput}
                onChange={e => setRoleInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                className="flex-1 bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 placeholder:text-zinc-600"
              />
              <button
                onClick={handleAdd}
                disabled={!roleInput.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Credits List */}
      <div>
        <h3 className="font-serif font-bold text-white text-lg mb-4 flex items-center gap-2">
          <Clapperboard className="h-5 w-5 text-red-500" />
          Your Production Credits ({credits.length})
        </h3>
        {credits.length === 0 ? (
          <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-10 text-center text-zinc-500 font-mono text-xs">
            No stageography credits added yet. Search for a production above to get started.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {credits.map((credit, idx) => {
              const prod = ClientDB.getProductions().find(p => p.id === credit.productionId);
              return (
                <div key={idx} className="bg-zinc-900/60 border border-white/5 hover:border-white/10 rounded-2xl p-4 flex items-center gap-4 transition-all group">
                  {prod?.posterUrl && (
                    <div className="relative w-12 h-16 rounded-xl overflow-hidden shrink-0 border border-white/5 bg-zinc-950">
                      <img src={prod.posterUrl} alt={credit.productionTitle} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-serif font-bold text-white text-sm truncate">{credit.productionTitle}</p>
                    <span className="inline-block mt-1 text-[10px] bg-red-600/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{credit.role}</span>
                  </div>
                  <button
                    onClick={() => handleRemove(credit.productionId)}
                    className="text-zinc-600 hover:text-red-400 transition-colors p-2 opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
