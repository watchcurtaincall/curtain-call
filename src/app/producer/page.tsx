'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { ClientDB, syncFromSupabase } from '@/lib/db';
import { Production } from '@/lib/types';
import { ProductionCard } from '@/components/shared/ProductionCard';
import {
  Drama, Wallet, QrCode, ArrowLeft, ArrowUpRight, TrendingUp, Plus,
  X, CheckCircle, Circle, AlertCircle, Trash2, PenSquare, Eye,
  ShieldCheck, FileText, Calendar, MapPin, Clock, ArrowRight, User, Settings
} from 'lucide-react';
import { WithdrawModal } from '@/components/producer/WithdrawModal';
import Link from 'next/link';

export default function ProducerDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [allPlays, setAllPlays] = useState<Production[]>([]);
  const [syncCount, setSyncCount] = useState(0);

  const isPlayProducerManaged = (p: any) => {
    return p.isProducerManaged === true || p.ticketTiers !== undefined || p.status === 'Draft';
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSync = () => setSyncCount(prev => prev + 1);
    window.addEventListener('cc-db-synced', handleSync);
    
    // Background pull database sync on page mount
    syncFromSupabase();

    return () => {
      window.removeEventListener('cc-db-synced', handleSync);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    setAllPlays(ClientDB.getProductions());
  }, [user, syncCount]);

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
    
    const dbTickets = ClientDB.getTickets();
    const dbWithdrawals = ClientDB.getWithdrawals();
    
    const userTickets = dbTickets.filter(t => userPlayIds.includes(t.productionId));
    const grossEarnings = userTickets.reduce((acc, t) => acc + t.price, 0);
    const totalEarned = grossEarnings * 0.95; // 5% fee deducted
    
    const userWithdrawals = dbWithdrawals.filter(w => w.email.toLowerCase() === user.email.toLowerCase());
    const approvedWithdrawals = userWithdrawals.filter(w => w.status === 'Approved');
    const totalWithdrawn = approvedWithdrawals.reduce((acc, w) => acc + w.amount, 0);
    
    const pendingWithdrawals = userWithdrawals.filter(w => w.status === 'Pending');
    const totalPending = pendingWithdrawals.reduce((acc, w) => acc + w.amount, 0);
    
    const available = Math.max(0, totalEarned - totalWithdrawn - totalPending);
    
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

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl animate-pulse">
          <Wallet className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-white">Producer Dashboard Access Restricted</h1>
        <p className="text-zinc-500 text-sm max-w-sm leading-relaxed">
          Please sign in to access listed productions, admissions scanners, and audience wallet metrics.
        </p>
        <Link href="/login" className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-zinc-100 transition-all shadow-lg text-xs uppercase tracking-wider">
          Sign In as Producer
        </Link>
      </div>
    );
  }

  const userPlays = allPlays.filter(p => p.submitterEmail?.toLowerCase() === user.email.toLowerCase());
  const userPlayIds = userPlays.map(p => p.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-red-950/10 via-red-900/5 to-transparent pointer-events-none z-0 blur-[120px]" />
      
      {showWithdraw && <WithdrawModal availableBalance={walletMetrics.available} onClose={() => { setShowWithdraw(false); setSyncCount(c => c+1); }} />}

      <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl pt-8">
        
        {/* Breadcrumb Navigation Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <Link href="/profile" className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors bg-zinc-900/50 border border-white/5 px-4 py-2 rounded-xl backdrop-blur-md self-start shrink-0">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Go to Profile Dashboard</span>
          </Link>

          <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider self-start flex items-center gap-1.5 shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" /> Producer Curation Account
          </span>
        </div>

        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-r from-zinc-900/40 via-zinc-950/80 to-zinc-950/90 p-6 sm:p-8 lg:p-10 mb-10 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-lg font-serif font-bold text-white shrink-0 shadow-xl border border-red-500/20">
                {user.avatar}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-white">Welcome, {user.name.split(' ')[0]}</h1>
                <p className="text-xs text-zinc-400 mt-1">Manage your shows, sales, and wallets</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/create" className="flex items-center gap-1.5 bg-white text-black hover:bg-zinc-200 font-bold px-4 py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider shadow-lg active:scale-98">
                <Plus className="h-4 w-4 stroke-[2.5]" /> Create Show
              </Link>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: WALLET & REVENUE ── */}
        <div className="mb-12">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-5 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-emerald-500 rounded-full" />
            Wallet & Revenue
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Wallet Panel card */}
            <div className="lg:col-span-1 bg-zinc-900 border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden self-start">
              <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full blur-[60px] pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-serif font-bold text-white text-base">Wallet Available</h3>
                </div>
                <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/25 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Verified
                </span>
              </div>

              <div className="mb-6">
                <p className="text-xs text-zinc-500 mb-1">Available Payout Balance</p>
                <p className="text-4xl font-serif font-bold text-white">
                  ₦{walletMetrics.available.toLocaleString()}.<span className="text-2xl text-zinc-500">00</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-1 mb-0.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    <p className="text-[10px] text-zinc-500 font-medium">Total Revenue</p>
                  </div>
                  <p className="text-base font-bold font-serif text-white">₦{walletMetrics.totalEarned.toLocaleString()}</p>
                </div>
                <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-1 mb-0.5">
                    <ArrowUpRight className="h-3.5 w-3.5 text-blue-400" />
                    <p className="text-[10px] text-zinc-500 font-medium">Withdrawn</p>
                  </div>
                  <p className="text-base font-bold font-serif text-white">₦{walletMetrics.withdrawn.toLocaleString()}</p>
                </div>
              </div>

              <button
                onClick={() => setShowWithdraw(true)}
                disabled={walletMetrics.available <= 0}
                className="w-full bg-white hover:bg-zinc-100 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold py-3.5 rounded-xl transition-all text-xs uppercase tracking-wider active:scale-[0.98]"
              >
                Withdraw to Bank Account
              </button>
            </div>

            {/* Transaction Logs */}
            <div className="lg:col-span-2 bg-zinc-900 border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-650/5 rounded-full blur-[80px] pointer-events-none" />
              <h3 className="font-serif font-bold text-lg text-white mb-4">Admissions Payout & Transactions Feed</h3>
              
              <div className="flex flex-col divide-y divide-white/5 max-h-[260px] overflow-y-auto pr-2 [scrollbar-width:none]">
                {walletMetrics.transactions.length === 0 ? (
                  <div className="text-center py-16 text-zinc-550 font-mono text-xs">
                    No payment deposits or payout history logged on Curtain Call.
                  </div>
                ) : (
                  walletMetrics.transactions.map((tx, idx) => (
                    <div key={idx} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-4">
                      <div>
                        <p className="text-sm font-sans font-medium text-white leading-snug">{tx.label}</p>
                        <p className="text-xs text-zinc-550 font-mono mt-1 font-semibold">{tx.date}</p>
                      </div>
                      <span className={`text-sm font-bold shrink-0 font-serif ${tx.positive ? 'text-emerald-450' : 'text-zinc-400'}`}>
                        {tx.amount}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ── SECTION 2: DOSSIER & SHOWS CATALOG ── */}
        <div className="flex flex-col gap-8 mb-12 border-t border-white/5 pt-10">
          
          {/* Active Plays */}
          <div>
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-red-600 rounded-full" />
              Active Productions
            </h3>
            {allPlays.filter(p => p.submitterEmail === user.email && isPlayProducerManaged(p) && (p.status === 'Currently Showing' || p.status === 'Coming Soon')).length === 0 ? (
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-12 text-center text-zinc-500 text-sm max-w-lg mx-auto">
                <Drama className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                <p className="font-semibold text-zinc-400">No active plays listed</p>
                <p className="text-xs text-zinc-600 mt-1 max-w-xs mx-auto">Create a show listing and activate custom ticket tiers to start selling admissions.</p>
                <Link href="/create" className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider mt-5">
                  <Plus className="h-3.5 w-3.5" /> Add First Playbill
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
                {allPlays.filter(p => p.submitterEmail === user.email && isPlayProducerManaged(p) && (p.status === 'Currently Showing' || p.status === 'Coming Soon')).map(p => (
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
                        onClick={() => handleEndShow(p.id)}
                        className="flex-1 bg-zinc-900/80 hover:bg-red-950/20 text-zinc-400 hover:text-red-455 border border-white/5 hover:border-red-500/35 font-bold py-2 rounded-xl transition-all text-[10px] tracking-wider uppercase flex items-center justify-center gap-1"
                      >
                        End Show
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drafts */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-zinc-700 rounded-full" />
              Drafts & Unfinished Playbills
            </h3>
            {allPlays.filter(p => p.submitterEmail === user.email && isPlayProducerManaged(p) && p.status === 'Draft').length === 0 ? (
              <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-6 text-center text-zinc-650 text-xs max-w-sm mx-auto">
                No playbill drafts saved.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
                {allPlays.filter(p => p.submitterEmail === user.email && isPlayProducerManaged(p) && p.status === 'Draft').map(p => (
                  <div key={p.id} className="flex flex-col gap-2 bg-zinc-900/20 border border-white/5 p-3 rounded-2xl relative group/card">
                    <div className="flex-1">
                      <ProductionCard production={p} />
                    </div>
                    <div className="flex gap-2 mt-1 shrink-0">
                      <Link
                        href={`/create?edit=${p.id}`}
                        className="flex-1 bg-zinc-900/80 hover:bg-white/10 text-zinc-350 hover:text-white border border-white/5 font-bold py-2 rounded-xl transition-all text-[10px] tracking-wider uppercase text-center flex items-center justify-center gap-1"
                      >
                        <PenSquare className="h-3 w-3 text-red-400" /> Resume
                      </Link>
                      <button
                        onClick={() => handleDeleteDraft(p.id)}
                        className="flex-1 bg-zinc-900/80 hover:bg-red-950/20 text-red-400 hover:text-red-450 border border-white/5 hover:border-red-500/35 font-bold py-2 rounded-xl transition-all text-[10px] tracking-wider uppercase flex items-center justify-center gap-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Concluded */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-zinc-800 rounded-full" />
              Past & Concluded Productions
            </h3>
            {allPlays.filter(p => p.submitterEmail === user.email && isPlayProducerManaged(p) && (p.status === 'Past Production' || p.status === 'Recently Concluded')).length === 0 ? (
              <div className="bg-zinc-900/10 border border-white/5 rounded-2xl p-6 text-center text-zinc-655 text-xs max-w-sm mx-auto">
                No past productions registered.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
                {allPlays.filter(p => p.submitterEmail === user.email && isPlayProducerManaged(p) && (p.status === 'Past Production' || p.status === 'Recently Concluded')).map(p => (
                  <div key={p.id} className="flex flex-col gap-2 bg-zinc-900/20 border border-white/5 p-3 rounded-2xl">
                    <div className="flex-1">
                      <ProductionCard production={p} />
                    </div>
                    <Link
                      href={`/create?edit=${p.id}`}
                      className="w-full bg-zinc-900/80 hover:bg-white/10 text-zinc-350 hover:text-white border border-white/5 font-bold py-2 rounded-xl transition-all text-[10px] tracking-wider uppercase text-center flex items-center justify-center gap-1 mt-1 shrink-0"
                    >
                      <PenSquare className="h-3.5 w-3.5 text-red-400" /> Edit Specs
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── SECTION 3: GATE TICKET SCANNER ── */}
        <div className="border-t border-white/5 pt-10">
          <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-red-650 rounded-full animate-pulse" />
            Gate Pass Admissions Terminal
          </h3>
          <ProfileScannerTab userEmail={user.email} />
        </div>

      </div>
    </div>
  );
}

// ── QR/Code Gate Scanner Component ──
function ProfileScannerTab({ userEmail }: { userEmail: string }) {
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    status: 'Approved' | 'Duplicate' | 'Invalid';
    ticket?: any;
    message: string;
    timestamp: number;
  } | null>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);

  const allPlays = ClientDB.getProductions();
  const userPlays = allPlays.filter(p => p.submitterEmail?.toLowerCase() === userEmail.toLowerCase());
  const userPlayIds = userPlays.map(p => p.id);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('curtain_checked_in_tickets');
      if (stored) {
        try {
          setScanHistory(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const saveScanHistory = (history: any[]) => {
    setScanHistory(history);
    if (typeof window !== 'undefined') {
      localStorage.setItem('curtain_checked_in_tickets', JSON.stringify(history));
    }
  };

  const handleValidate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const inputClean = scanInput.trim().toUpperCase();
    if (!inputClean) return;

    const allTickets = ClientDB.getTickets();
    const matchedTicket = allTickets.find(t => 
      (t.gatePass && t.gatePass.toUpperCase() === inputClean) || 
      (t.reference && t.reference.toUpperCase() === inputClean)
    );

    const now = Date.now();
    let result: any = null;

    if (matchedTicket) {
      const belongsToProducer = userPlayIds.includes(matchedTicket.productionId) || userEmail.toLowerCase() === 'watchcurtaincall@gmail.com';
      
      if (!belongsToProducer) {
        result = {
          status: 'Invalid',
          message: `UNAUTHORIZED ACCESS: This pass belongs to another producer's event. Access denied.`,
          timestamp: now
        };
      } else {
        const isAlreadyCheckedIn = scanHistory.some(h => h.status === 'Approved' && h.ticket?.id === matchedTicket.id);

        if (isAlreadyCheckedIn) {
          result = {
            status: 'Duplicate',
            ticket: matchedTicket,
            message: `DUPLICATE WARNING: Pass already scanned.`,
            timestamp: now
          };
        } else {
          result = {
            status: 'Approved',
            ticket: matchedTicket,
            message: `APPROVED: Welcome! Access granted.`,
            timestamp: now
          };
        }
      }
    } else {
      result = {
        status: 'Invalid',
        message: `INVALID TICKET: No match found for "${inputClean}".`,
        timestamp: now
      };
    }

    setScanResult(result);

    const newHistoryItem = {
      id: `scan_${now}_${Math.random().toString(36).substr(2, 4)}`,
      ticket: matchedTicket,
      input: inputClean,
      checkedInAt: now,
      status: result.status
    };

    saveScanHistory([newHistoryItem, ...scanHistory]);
    setScanInput('');
  };

  const scopedHistory = scanHistory.filter(h => 
    userEmail.toLowerCase() === 'watchcurtaincall@gmail.com' || 
    (h.ticket && userPlayIds.includes(h.ticket.productionId)) ||
    (!h.ticket && h.status === 'Invalid')
  );

  return (
    <div className="flex flex-col gap-8 animate-fade-up max-w-7xl">
      <style>{`
        @keyframes scanline {
          0% { top: 0%; opacity: 0.3; }
          50% { top: 100%; opacity: 1; }
          100% { top: 0%; opacity: 0.3; }
        }
        .scanline-effect {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: #ef4444;
          box-shadow: 0 0 15px #ef4444, 0 0 5px #ef4444;
          animation: scanline 3.5s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      {/* Quick Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-[40px] pointer-events-none" />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Checked In</span>
          <span className="text-2xl md:text-3xl font-serif font-bold text-green-400 block mt-1">
            {scopedHistory.filter(h => h.status === 'Approved').length}
          </span>
          <span className="text-[9px] font-mono text-zinc-650 block mt-1">Admitted guest count</span>
        </div>

        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-[40px] pointer-events-none" />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Tickets Sold</span>
          <span className="text-2xl md:text-3xl font-serif font-bold text-red-400 block mt-1">
            {ClientDB.getTickets().filter(t => userPlayIds.includes(t.productionId) || userEmail.toLowerCase() === 'watchcurtaincall@gmail.com').length}
          </span>
          <span className="text-[9px] font-mono text-zinc-655 block mt-1">Total platform tickets sold</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Verification Scanner Form */}
        <div className="lg:col-span-5 bg-zinc-900 border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-red-650/5 rounded-full blur-[60px] pointer-events-none" />
          
          <div className="border-b border-white/5 pb-4 mb-5 text-center">
            <h4 className="font-serif font-bold text-white text-base">Gate Pass Validator</h4>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">Admissions verification terminal</p>
          </div>



          <form onSubmit={handleValidate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block font-bold">Gate Pass/Ref ID</label>
              <input
                type="text"
                required
                placeholder="e.g. TKT_1716766465"
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                className="bg-zinc-950 border border-white/5 focus:border-red-500 rounded-xl px-4 py-3.5 text-center text-sm text-white font-mono uppercase tracking-wider focus:outline-none transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-white hover:bg-zinc-100 text-black font-bold py-3.5 rounded-xl transition-all text-xs uppercase tracking-wider active:scale-98"
            >
              Verify Admissions
            </button>
          </form>

          {/* Result Alert overlay */}
          {scanResult && (
            <div className={`mt-5 p-4 rounded-2xl border flex items-start gap-3 animate-scale-up ${
              scanResult.status === 'Approved' ? 'bg-green-500/10 border-green-500/20 text-green-300' :
              scanResult.status === 'Duplicate' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
              'bg-red-500/10 border-red-500/20 text-red-300'
            }`}>
              {scanResult.status === 'Approved' ? <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-green-400" /> : <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />}
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-bold uppercase tracking-wider">{scanResult.status} Check-In</p>
                <p className="mt-1 leading-relaxed">{scanResult.message}</p>
                
                {scanResult.ticket && (
                  <div className="mt-2.5 bg-zinc-950/60 border border-white/5 rounded-xl p-3 font-mono text-[10px] text-zinc-400 flex flex-col gap-1">
                    <div className="flex justify-between"><span className="text-zinc-650">Guest:</span> <span className="font-sans font-semibold text-white truncate max-w-[150px]">{scanResult.ticket.buyerEmail}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-650">Show:</span> <span className="text-zinc-300 truncate max-w-[150px]">{scanResult.ticket.productionTitle}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-650">Tier:</span> <span className="text-red-400 font-bold uppercase">{scanResult.ticket.tier}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-650">Price:</span> <span className="text-white font-bold">₦{scanResult.ticket.price.toLocaleString()}</span></div>
                  </div>
                )}
              </div>
              <button onClick={() => setScanResult(null)} className="text-zinc-500 hover:text-white transition-colors shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Live Scans History */}
        <div className="lg:col-span-7 bg-zinc-900 border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden self-stretch">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px] pointer-events-none" />
          <h4 className="font-serif font-bold text-white text-base mb-4">Admissions Log Feed (Real-time)</h4>
          
          <div className="flex flex-col divide-y divide-white/5 max-h-[500px] overflow-y-auto pr-2">
            {scopedHistory.length === 0 ? (
              <div className="text-center py-16 text-zinc-550 font-mono text-xs">
                No scan history records found.
              </div>
            ) : (
              scopedHistory.map((h, idx) => (
                <div key={idx} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      h.status === 'Approved' ? 'bg-green-500/10 border-green-500/25 text-green-400' :
                      h.status === 'Duplicate' ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' :
                      'bg-red-500/10 border-red-500/25 text-red-450'
                    }`}>
                      {h.status === 'Approved' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-xs text-white leading-tight font-semibold">
                        {h.ticket ? `${h.ticket.productionTitle} (${h.ticket.tier})` : `Invalid Entry Match`}
                      </p>
                      <p className="text-[10px] text-zinc-550 font-mono mt-0.5">
                        Code: {h.input} · Submitter: {h.ticket?.buyerEmail || 'Guest'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-550 shrink-0 font-medium">
                    {new Date(h.checkedInAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
