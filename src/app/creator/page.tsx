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
  ShieldCheck, FileText, Calendar, MapPin, Clock, ArrowRight, User, Settings, Sparkles, Flame, Check, Shield, Download, Banknote
} from 'lucide-react';
import { WithdrawModal } from '@/components/creator/WithdrawModal';
import Link from 'next/link';
import { LineChart, Line, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';

export default function CreatorDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [allPlays, setAllPlays] = useState<Production[]>([]);
  const [syncCount, setSyncCount] = useState(0);
  const [quizCredits, setQuizCredits] = useState(0);
  const [cashTransactions, setCashTransactions] = useState<any[]>([]);

  const isPlayProducerManaged = (p: any) => {
    return p.isProducerManaged === true || p.ticketTiers !== undefined || p.status === 'Draft';
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSync = () => setSyncCount(prev => prev + 1);
    window.addEventListener('cc-db-synced', handleSync);
    syncFromSupabase();
    return () => { window.removeEventListener('cc-db-synced', handleSync); };
  }, []);

  useEffect(() => {
    if (!user) return;
    setAllPlays(ClientDB.getProductions());
  }, [user, syncCount]);

  // Fetch quiz-to-cash credits for this producer
  useEffect(() => {
    if (!user) return;
    fetch(`/api/quiz/status?userId=${encodeURIComponent(user.id)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { 
        if (data) {
          setQuizCredits(data.cashCredits ?? 0); 
          setCashTransactions(data.cashTransactions ?? []);
        }
      })
      .catch(() => {});
  }, [user, syncCount]);

  // ── DYNAMIC WALLET CALCULATIONS ──
  const [walletMetrics, setWalletMetrics] = useState({
    available: 0,
    totalEarned: 0,
    withdrawn: 0,
    transactions: [] as any[],
    chartData: [] as any[]
  });
  const [salesModalPlayId, setSalesModalPlayId] = useState<string | null>(null);

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
    
    const available = Math.max(0, totalEarned + quizCredits - totalWithdrawn - totalPending);
    
    const quizTx = cashTransactions.map(tx => {
      let label = 'Quiz Points Converted to Cash';
      if (tx.source === 'article_approval') label = 'Editorial Submission Approved';
      else if (tx.source === 'streak_bonus') label = 'Quiz Streak Bonus';
      else if (tx.source === 'quiz_win') label = 'Quiz Earnings';
      
      return {
        label,
        amount: `+₦${tx.amount_naira.toLocaleString()}`,
        date: new Date(tx.created_at).toLocaleDateString(),
        positive: true,
        timestamp: new Date(tx.created_at).getTime(),
      };
    });

    const transactions = [
      ...quizTx,
      ...userTickets.map(t => ({
        label: `Ticket sale — ${t.productionTitle} (${t.tier}) (Net 95%)`,
        amount: `+₦${(t.price * 0.95).toLocaleString()}`,
        date: t.date || 'Recently',
        positive: true,
        timestamp: t.timestamp || 0,
      })),
      ...userWithdrawals.map(w => ({
        label: `Withdrawal to ${w.bankName} ····${w.accountNumber.slice(-4)}`,
        amount: `−₦${w.amount.toLocaleString()}`,
        date: w.timestamp ? w.timestamp.split(' ')[0] : 'Recently',
        positive: false,
        timestamp: w.id ? Number(w.id.replace('w_req_', '')) : 0,
      }))
    ].sort((a, b) => b.timestamp - a.timestamp);
    
    // Process transactions into chartData (last 14 days)
    const last14Days = [...Array(14)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toLocaleDateString(); // "M/D/YYYY" or local equivalent
    });

    const chartData = last14Days.map(dateStr => {
      const dayTxs = transactions.filter(tx => tx.positive && tx.date === dateStr);
      const earned = dayTxs.reduce((acc, tx) => acc + parseInt(tx.amount.replace(/[^0-9]/g, '') || '0'), 0);
      return { date: dateStr.split('/')[0] + '/' + dateStr.split('/')[1], earnings: earned };
    });
    
    setWalletMetrics({
      available,
      totalEarned: totalEarned + quizCredits,
      withdrawn: totalWithdrawn,
      transactions,
      chartData,
    });
  }, [user, allPlays, syncCount, quizCredits, cashTransactions]);

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

  const handleExportAttendees = (productionId: string, productionTitle: string) => {
    const allTickets = ClientDB.getTickets();
    const showTickets = allTickets.filter(t => t.productionId === productionId);

    if (showTickets.length === 0) {
      alert(`No attendees found for "${productionTitle}".`);
      return;
    }

    const headers = ['Ticket ID', 'Gate Pass Code', 'Reference', 'Tier', 'Price (NGN)', 'Purchase Date', 'Buyer Email'];
    const csvRows = [headers.join(',')];

    showTickets.forEach(t => {
      const row = [
        t.id,
        t.gatePass || '',
        t.reference || '',
        t.tier || '',
        t.price || 0,
        t.date || '',
        t.userEmail || ''
      ];
      const escapedRow = row.map(v => `"${String(v).replace(/"/g, '""')}"`);
      csvRows.push(escapedRow.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendees_${productionTitle.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="w-20 h-20 rounded-[24px] bg-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl animate-pulse">
          <Wallet className="h-9 w-9 text-red-500" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Creator Hub Access Restricted</h1>
        <p className="text-zinc-400 text-sm max-w-sm leading-relaxed">
          Please sign in to manage your productions, ticket scanners, and earnings.
        </p>
        <Link href="/login" className="bg-white text-black font-bold px-8 py-3.5 rounded-xl hover:bg-zinc-200 transition-all shadow-lg text-xs uppercase tracking-widest">
          Sign In as Creator
        </Link>
      </div>
    );
  }

  const userPlays = allPlays.filter(p => p.submitterEmail?.toLowerCase() === user.email.toLowerCase());
  const userPlayIds = userPlays.map(p => p.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 relative overflow-hidden">
      {/* Immersive cinematic background glows */}
      <div className="fixed top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-red-950/15 via-red-900/5 to-transparent pointer-events-none z-0 blur-[130px]" />
      <div className="fixed bottom-0 right-0 w-[450px] h-[450px] bg-emerald-950/5 rounded-full blur-[140px] pointer-events-none z-0 mix-blend-screen" />
      
      {showWithdraw && <WithdrawModal availableBalance={walletMetrics.available} onClose={() => { setShowWithdraw(false); setSyncCount(c => c+1); }} />}
      {salesModalPlayId && <SalesModal playId={salesModalPlayId} onClose={() => setSalesModalPlayId(null)} />}

      <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl pt-8 flex flex-col gap-12">
        
        {/* Navigation Breadcrumb & Premium Menu Trigger */}
        <div className="flex items-center justify-between">
          <Link href="/profile" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-all bg-zinc-900/50 backdrop-blur-md border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl">
            <ArrowLeft className="h-4 w-4 text-red-500" />
            <span>Go to dashboard</span>
          </Link>

          <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-widest font-mono">
            Creator Hub
          </span>
        </div>

        {/* Breathtaking Welcome Glass Card */}
        <div className="relative rounded-[32px] overflow-hidden border border-white/10 bg-gradient-to-r from-zinc-900/40 via-zinc-950/80 to-zinc-950/90 p-6 sm:p-8 lg:p-10 shadow-[0_24px_50px_rgba(0,0,0,0.65)] backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-2xl font-serif font-bold text-white shrink-0 shadow-xl border border-red-500/20 relative group overflow-hidden">
                <span className="relative z-10">{user.avatar}</span>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">Welcome back, {user.name}</h1>
                  <Sparkles className="h-5 w-5 text-amber-500 fill-amber-550/10" />
                </div>
                <p className="text-zinc-400 text-sm mt-1">Manage your productions, ticket scanners, and earnings.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/create" className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 font-bold px-5 py-3 rounded-2xl transition-all text-xs uppercase tracking-widest shadow-lg active:scale-95">
                <Plus className="h-4 w-4 stroke-[3]" /> Add New Show
              </Link>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: WALLET & REVENUE ── */}
        <div className="flex flex-col gap-6">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2.5">
            <span className="w-2 h-4 bg-emerald-500 rounded-full" />
            Wallet & Earnings Terminal
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Wallet Panel card (Col 5) */}
            <div className="lg:col-span-5 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 md:p-8 shadow-2xl relative overflow-hidden self-start flex flex-col gap-6">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif font-bold text-white text-base">Payout Balance</h3>
                </div>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-widest font-mono">
                  Verified Wallet
                </span>
              </div>

              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1.5">Available for instant withdrawal</p>
                <p className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight leading-none">
                  ₦{walletMetrics.available.toLocaleString()}<span className="text-lg text-zinc-500 font-normal">.00</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 mb-1 text-zinc-500">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <p className="text-[9px] font-bold uppercase tracking-wider">Gross Income</p>
                  </div>
                  <p className="text-lg font-bold font-serif text-white">₦{walletMetrics.totalEarned.toLocaleString()}</p>
                </div>
                <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 mb-1 text-zinc-500">
                    <ArrowUpRight className="h-4 w-4 text-blue-400" />
                    <p className="text-[9px] font-bold uppercase tracking-wider">Paid Out</p>
                  </div>
                  <p className="text-lg font-bold font-serif text-white">₦{walletMetrics.withdrawn.toLocaleString()}</p>
                </div>
              </div>

              <button
                onClick={() => setShowWithdraw(true)}
                disabled={walletMetrics.available <= 0}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:border-transparent text-white font-bold py-4 rounded-2xl transition-all text-xs uppercase tracking-widest active:scale-95 shadow-lg shadow-emerald-950/20 border border-emerald-400/20 cursor-pointer"
              >
                Withdraw payout to bank
              </button>

              {/* EARNINGS GRAPH */}
              <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4 h-48 w-full flex flex-col">
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-2">14-Day Earnings Trend</p>
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={walletMetrics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="date" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `₦${v >= 1000 ? (v/1000)+'k' : v}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}
                        itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
                        formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, 'Earnings']}
                        labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', marginBottom: '4px' }}
                      />
                      <Line type="monotone" dataKey="earnings" stroke="#34d399" strokeWidth={3} dot={{ r: 3, fill: '#09090b', stroke: '#34d399', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Transaction Logs (Col 7) */}
            <div className="lg:col-span-7 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 md:p-8 shadow-2xl relative overflow-hidden self-stretch flex flex-col gap-5">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-950/5 rounded-full blur-[80px] pointer-events-none" />
              
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Payout & Admissions Feed</h3>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1 font-bold">Real-time log of ticket revenue and payouts</p>
              </div>
              
              <div className="flex-1 flex flex-col divide-y divide-white/5 max-h-[290px] overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.05)_transparent]">
                {walletMetrics.transactions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-16 text-zinc-600 font-mono text-xs gap-2">
                    <FileText className="h-6 w-6 text-zinc-800" />
                    No payout or ticket sales records registered.
                  </div>
                ) : (
                  walletMetrics.transactions.map((tx, idx) => (
                    <div key={idx} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-4 group/tx">
                      <div>
                        <p className="text-sm font-sans font-medium text-white group-hover/tx:text-emerald-400 transition-colors leading-snug">{tx.label}</p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-1 font-bold uppercase tracking-wider">{tx.date}</p>
                      </div>
                      <span className={`text-sm font-bold shrink-0 font-serif ${tx.positive ? 'text-emerald-400' : 'text-zinc-400'}`}>
                        {tx.amount}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ── SECTION 2: SHOWS DOSSIER CATALOG ── */}
        <div className="flex flex-col gap-10 border-t border-white/5 pt-10">
          
          {/* Active Plays */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2.5">
              <span className="w-2 h-4 bg-red-600 rounded-full" />
              Active Productions
            </h3>
            {allPlays.filter(p => p.submitterEmail === user.email && isPlayProducerManaged(p) && (p.status === 'Currently Showing' || p.status === 'Coming Soon')).length === 0 ? (
              <div className="bg-zinc-900/20 border border-white/5 rounded-[32px] p-16 text-center text-zinc-500 text-sm max-w-xl mx-auto backdrop-blur-md flex flex-col gap-4 items-center">
                <Drama className="h-10 w-10 text-zinc-800 animate-pulse" />
                <div>
                  <p className="font-bold text-zinc-300">No active plays listed</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">Create a show listing and ticket tiers to start selling.</p>
                </div>
                <Link href="/create" className="inline-flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-2xl transition-all text-xs uppercase tracking-widest mt-2 hover:bg-zinc-200">
                  <Plus className="h-4 w-4 stroke-[3]" /> Add Show Listing
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
                {allPlays.filter(p => p.submitterEmail === user.email && isPlayProducerManaged(p) && (p.status === 'Currently Showing' || p.status === 'Coming Soon')).map(p => (
                  <div key={p.id} className="flex flex-col gap-3 bg-zinc-900/30 border border-white/5 p-3 rounded-[24px] relative hover:border-red-500/20 hover:shadow-2xl transition-all group/card">
                    <div className="flex-1">
                      <ProductionCard production={p} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1 shrink-0 z-10 relative">
                      <Link
                        href={`/create?edit=${p.id}`}
                        className="bg-zinc-950 border border-white/10 hover:bg-zinc-900 hover:border-red-500/30 text-zinc-300 hover:text-white font-bold py-2.5 rounded-xl transition-all text-[10px] tracking-widest uppercase text-center flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <PenSquare className="h-3 w-3 text-red-500" /> Edit
                      </Link>
                      <button
                        onClick={() => handleExportAttendees(p.id, p.title || 'Show')}
                        className="bg-zinc-950 border border-white/10 hover:bg-zinc-900 hover:border-blue-500/30 text-blue-400 hover:text-blue-300 font-bold py-2.5 rounded-xl transition-all text-[10px] tracking-widest uppercase flex items-center justify-center gap-1 cursor-pointer"
                        title="Export Attendees"
                      >
                        <Download className="h-3 w-3" /> Guests
                      </button>
                      <button
                        onClick={() => setSalesModalPlayId(p.id)}
                        className="bg-zinc-950 border border-white/10 hover:bg-emerald-950/20 hover:border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-bold py-2.5 rounded-xl transition-all text-[10px] tracking-widest uppercase flex items-center justify-center gap-1 cursor-pointer"
                        title="Sales Analytics"
                      >
                        <Banknote className="h-3 w-3" /> Sales
                      </button>
                      <button
                        onClick={() => handleEndShow(p.id)}
                        className="bg-zinc-950 border border-white/10 hover:bg-red-950/20 hover:border-red-500/30 text-zinc-400 hover:text-red-400 font-bold py-2.5 rounded-xl transition-all text-[10px] tracking-widest uppercase flex items-center justify-center gap-1 cursor-pointer"
                        title="End Show"
                      >
                        <Trash2 className="h-3 w-3" /> End
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drafts */}
          <div className="pt-8 border-t border-white/5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2.5">
              <span className="w-2 h-4 bg-zinc-700 rounded-full" />
              Unpublished Drafts
            </h3>
            {allPlays.filter(p => p.submitterEmail === user.email && isPlayProducerManaged(p) && p.status === 'Draft').length === 0 ? (
              <div className="bg-zinc-900/10 border border-white/5 rounded-2xl p-8 text-center text-zinc-600 text-xs max-w-sm mx-auto font-mono">
                No saved drafts in your archive.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
                {allPlays.filter(p => p.submitterEmail === user.email && isPlayProducerManaged(p) && p.status === 'Draft').map(p => (
                  <div key={p.id} className="flex flex-col gap-3 bg-zinc-900/30 border border-white/5 p-3 rounded-[24px] relative hover:border-white/20 transition-all group/card">
                    <div className="flex-1">
                      <ProductionCard production={p} />
                    </div>
                    <div className="flex gap-2 mt-1 shrink-0 z-10 relative">
                      <Link
                        href={`/create?edit=${p.id}`}
                        className="flex-1 bg-zinc-950 border border-white/10 hover:bg-zinc-900 text-zinc-300 hover:text-white font-bold py-2.5 rounded-xl transition-all text-[10px] tracking-widest uppercase text-center flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <PenSquare className="h-3 w-3 text-red-500" /> Resume
                      </Link>
                      <button
                        onClick={() => handleDeleteDraft(p.id)}
                        className="flex-1 bg-zinc-950 border border-white/10 hover:bg-red-950/20 hover:border-red-500/30 text-red-400 hover:text-red-300 font-bold py-2.5 rounded-xl transition-all text-[10px] tracking-widest uppercase flex items-center justify-center gap-1 cursor-pointer"
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
          <div className="pt-8 border-t border-white/5">
            <h3 className="text-xs font-bold text-zinc-550 uppercase tracking-widest mb-6 flex items-center gap-2.5">
              <span className="w-2 h-4 bg-zinc-800 rounded-full" />
              Concluded Shows & Archive
            </h3>
            {allPlays.filter(p => p.submitterEmail === user.email && isPlayProducerManaged(p) && (p.status === 'Past Production' || p.status === 'Recently Concluded')).length === 0 ? (
              <div className="bg-zinc-900/10 border border-white/5 rounded-2xl p-8 text-center text-zinc-650 text-xs max-w-sm mx-auto font-mono">
                No past productions registered.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
                {allPlays.filter(p => p.submitterEmail === user.email && isPlayProducerManaged(p) && (p.status === 'Past Production' || p.status === 'Recently Concluded')).map(p => (
                  <div key={p.id} className="flex flex-col gap-3 bg-zinc-900/30 border border-white/5 p-3 rounded-[24px]">
                    <div className="flex-1">
                      <ProductionCard production={p} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1 shrink-0 z-10 relative">
                      <Link
                        href={`/create?edit=${p.id}`}
                        className="bg-zinc-950 border border-white/10 hover:bg-zinc-900 text-zinc-300 hover:text-white font-bold py-2.5 rounded-xl transition-all text-[10px] tracking-widest uppercase text-center flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <PenSquare className="h-3 w-3 text-red-500" /> Edit Archive
                      </Link>
                      <button
                        onClick={() => handleExportAttendees(p.id, p.title || 'Show')}
                        className="bg-zinc-950 border border-white/10 hover:bg-zinc-900 hover:border-blue-500/30 text-blue-400 hover:text-blue-300 font-bold py-2.5 rounded-xl transition-all text-[10px] tracking-widest uppercase flex items-center justify-center gap-1 cursor-pointer"
                        title="Export Attendees"
                      >
                        <Download className="h-3 w-3" /> Guests
                      </button>
                      <button
                        onClick={() => setSalesModalPlayId(p.id)}
                        className="col-span-2 bg-zinc-950 border border-white/10 hover:bg-emerald-950/20 hover:border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-bold py-2.5 rounded-xl transition-all text-[10px] tracking-widest uppercase flex items-center justify-center gap-1 cursor-pointer"
                        title="Sales Analytics"
                      >
                        <Banknote className="h-3 w-3" /> View Archive Sales
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── SECTION 3: GATE TICKET SCANNER ── */}
        <div className="border-t border-white/5 pt-10">
          <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2.5">
            <span className="w-2 h-4 bg-red-600 rounded-full animate-pulse" />
            Live Admissions Terminal
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
            message: `DUPLICATE WARNING: Pass already scanned. Check-in rejected.`,
            timestamp: now
          };
        } else {
          result = {
            status: 'Approved',
            ticket: matchedTicket,
            message: `APPROVED: Welcome to the showcase! Admissions pass validated successfully.`,
            timestamp: now
          };
        }
      }
    } else {
      result = {
        status: 'Invalid',
        message: `INVALID TICKET: No matching record found for Admissions Code "${inputClean}".`,
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
    <div className="flex flex-col gap-8 animate-fade-up max-w-7xl relative z-10">
      
      {/* Immersive Admissions Scanner Styles */}
      <style>{`
        @keyframes scanline {
          0% { top: 0%; opacity: 0.1; }
          50% { top: 100%; opacity: 0.9; }
          100% { top: 0%; opacity: 0.1; }
        }
        .scanline-effect {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: #e50914;
          box-shadow: 0 0 10px #e50914, 0 0 4px #e50914;
          animation: scanline 4s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes radar-pulse {
          0% { transform: scale(0.95); opacity: 0.1; }
          50% { opacity: 0.25; }
          100% { transform: scale(1.05); opacity: 0.1; }
        }
        .radar-pulse-effect {
          animation: radar-pulse 3s infinite ease-in-out;
        }
      `}</style>

      {/* Quick Verified Admissions Statistics Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[100px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-[40px] pointer-events-none" />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">Admitted Guests</span>
          <span className="text-3xl font-serif font-bold text-green-400 block mt-2">
            {scopedHistory.filter(h => h.status === 'Approved').length}
          </span>
          <span className="text-[9px] font-mono text-zinc-600 block mt-1 font-semibold">Total verified admissions</span>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[100px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-[40px] pointer-events-none" />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">Tickets Issued</span>
          <span className="text-3xl font-serif font-bold text-red-500 block mt-2">
            {ClientDB.getTickets().filter(t => userPlayIds.includes(t.productionId) || userEmail.toLowerCase() === 'watchcurtaincall@gmail.com').length}
          </span>
          <span className="text-[9px] font-mono text-zinc-600 block mt-1 font-semibold">Platform tickets sold</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Verification Scanner Terminal Form (Col 5) */}
        <div className="lg:col-span-5 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-red-950/5 rounded-full blur-[60px] pointer-events-none" />
          
          <div className="border-b border-white/5 pb-4 mb-6 text-center">
            <h4 className="font-serif font-bold text-white text-base">Gate Pass Validator</h4>
            <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mt-1 font-bold">Admissions validation scanner terminal</p>
          </div>

          <form onSubmit={handleValidate} className="flex flex-col gap-4">
            {/* Immersive Scanner Radar Status Graphic - Clearly Marked as Status only */}
            <div className="relative w-full h-16 bg-zinc-950/80 border border-white/5 rounded-2xl flex items-center justify-between px-5 overflow-hidden shadow-inner group/radar mb-2">
              <div className="scanline-effect" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-9 h-9 rounded-xl border border-red-500/20 bg-red-550/5 flex items-center justify-center">
                  <QrCode className="h-4.5 w-4.5 text-red-500 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-zinc-300 font-bold uppercase tracking-wider block">
                    Radar Status Feed
                  </span>
                  <span className="text-[9px] font-mono text-red-500 uppercase tracking-widest font-bold animate-pulse mt-0.5 block">
                    Terminal Online · Ready
                  </span>
                </div>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
            </div>

            {/* Premium, High-Contrast, Bold Text Input Terminal Area */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                Type Admissions Code Below:
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="ENTER GATE CODE - CC-134..."
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  className="w-full bg-zinc-950/95 border-2 border-white/10 hover:border-red-500/30 focus:border-red-500 rounded-2xl px-5 py-4 text-center text-xs text-white font-mono uppercase tracking-widest focus:outline-none transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)] focus:shadow-[0_0_20px_rgba(229,9,20,0.15)] placeholder:text-zinc-600 placeholder:normal-case font-bold"
                />
              </div>
              <p className="text-[10px] text-zinc-500 font-sans leading-relaxed text-center mt-1">
                Click inside the black box above to type or paste the Guest Gate Pass Code.
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl transition-all text-xs uppercase tracking-widest active:scale-95 shadow-md shadow-white/5 cursor-pointer"
            >
              Verify Admissions
            </button>
          </form>

          {/* Result Alert overlay: highly elegant, floating inside validator */}
          {scanResult && (
            <div className={`mt-6 p-5 rounded-2xl border flex items-start gap-3.5 animate-fade-up ${
              scanResult.status === 'Approved' ? 'bg-green-500/10 border-green-500/20 text-green-300' :
              scanResult.status === 'Duplicate' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
              'bg-red-500/10 border-red-500/20 text-red-300'
            }`}>
              {scanResult.status === 'Approved' ? (
                <div className="w-8 h-8 rounded-lg bg-green-550/15 border border-green-500/35 flex items-center justify-center shrink-0">
                  <Check className="h-4 w-4 text-green-400 stroke-[3]" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-red-550/15 border border-red-500/35 flex items-center justify-center shrink-0">
                  <X className="h-4 w-4 text-red-400 stroke-[3]" />
                </div>
              )}
              
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-bold uppercase tracking-widest text-[10px]">{scanResult.status} Admissions check</p>
                <p className="mt-1 leading-relaxed text-zinc-300">{scanResult.message}</p>
                
                {scanResult.ticket && (
                  <div className="mt-4 bg-zinc-950/70 border border-white/5 rounded-xl p-3.5 font-mono text-[10px] text-zinc-400 flex flex-col gap-1.5 shadow-inner">
                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-zinc-600 uppercase tracking-widest font-bold">Guest Email</span> <span className="font-sans font-bold text-white truncate max-w-[170px]">{scanResult.ticket.buyerEmail}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-zinc-600 uppercase tracking-widest font-bold">Production</span> <span className="text-zinc-200 font-bold truncate max-w-[170px]">{scanResult.ticket.productionTitle}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-zinc-600 uppercase tracking-widest font-bold">Admissions Category</span> <span className="text-red-400 font-bold uppercase">{scanResult.ticket.tier}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-600 uppercase tracking-widest font-bold">Reference Code</span> <span className="text-white font-bold">{scanResult.ticket.gatePass || scanResult.ticket.reference}</span></div>
                  </div>
                )}
              </div>
              
              <button onClick={() => setScanResult(null)} className="text-zinc-500 hover:text-white transition-colors shrink-0 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Live Scans History (Col 7) */}
        <div className="lg:col-span-7 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 md:p-8 shadow-2xl relative overflow-hidden self-stretch flex flex-col gap-5">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-950/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div>
            <h4 className="font-serif font-bold text-white text-base">Admissions Verification Log</h4>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1 font-bold">Live check-in history feed of admitted theatregoers</p>
          </div>
          
          <div className="flex-1 flex flex-col divide-y divide-white/5 max-h-[480px] overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.05)_transparent]">
            {scopedHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-zinc-600 font-mono text-xs gap-2">
                <QrCode className="h-6 w-6 text-zinc-800" />
                Waiting for gate pass admissions scan events...
              </div>
            ) : (
              scopedHistory.map((h, idx) => (
                <div key={idx} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-4 group/h">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      h.status === 'Approved' ? 'bg-green-550/15 border-green-500/25 text-green-400' :
                      h.status === 'Duplicate' ? 'bg-amber-550/15 border-amber-500/25 text-amber-400' :
                      'bg-red-550/15 border-red-500/25 text-red-400'
                    }`}>
                      {h.status === 'Approved' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-xs text-white leading-tight font-bold group-hover/h:text-red-400 transition-colors">
                        {h.ticket ? `${h.ticket.productionTitle} · ${h.ticket.tier}` : `Invalid Pass Code`}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1 font-bold">
                        CODE: {h.input} · SUBMITTER: {h.ticket?.buyerEmail || 'Guest'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 shrink-0 font-bold bg-zinc-950 border border-white/5 px-2.5 py-1 rounded-lg">
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

// ── Sales Modal Component ──
function SalesModal({ playId, onClose }: { playId: string; onClose: () => void }) {
  const [play, setPlay] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);

  useEffect(() => {
    const prod = ClientDB.getProductionById(playId);
    if (!prod) return;
    setPlay(prod);
    
    const allTickets = ClientDB.getTickets();
    const showTickets = allTickets.filter(t => t.productionId === playId);
    
    const tiers = prod.ticketTiers || [];
    const data = tiers.map((tier: any) => {
      const soldTickets = showTickets.filter(t => t.tier === tier.name);
      return {
        name: tier.name,
        capacity: parseInt(tier.capacity) || 0,
        sold: soldTickets.length,
        revenue: soldTickets.reduce((acc, t) => acc + (t.price || 0), 0)
      };
    });
    setSalesData(data);
  }, [playId]);

  if (!play) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-950 border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(229,9,20,0.1)] relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600" />
        <div className="p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-white tracking-tight leading-tight">Sales Dashboard</h2>
              <p className="text-xs text-red-400 mt-1 uppercase tracking-widest font-mono font-bold truncate max-w-[280px]">
                {play.title}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {salesData.length === 0 ? (
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 text-center text-zinc-500 text-xs font-mono">
                No ticket tiers configured for this production.
              </div>
            ) : salesData.map((d, i) => {
              const percentage = d.capacity > 0 ? Math.min(100, Math.round((d.sold / d.capacity) * 100)) : 0;
              return (
                <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/5 group-hover:bg-red-500/50 transition-colors" />
                  <div className="flex justify-between items-end pl-2">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-widest">{d.name}</h4>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-0.5">Tickets Sold</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-serif font-bold text-zinc-200"><span className="text-white">{d.sold}</span> <span className="text-zinc-600 text-xs font-sans font-normal">/ {d.capacity}</span></p>
                      <p className="text-[10px] text-emerald-400 font-mono font-bold tracking-widest mt-0.5">₦{d.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden mt-1 pl-2">
                    <div className="h-full bg-red-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
