'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import {
  ChevronRight, ChevronLeft, Check, MapPin, Calendar,
  Ticket, Upload, Plus, X, Clock, ArrowLeft, Banknote,
  Info, Loader2, CheckCircle, AlertCircle, ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { getBanks, resolveAccount, type Bank } from '@/lib/paystack';

// ─── Types ───────────────────────────────────────────────
interface ShowDate {
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
}

interface TicketTier {
  id: string;
  name: string;
  price: string;
  capacity: string;
}

interface FormData {
  title: string;
  genre: string;
  synopsis: string;
  venue: string;
  city: string;
  address: string;
  dates: ShowDate[];
  tiers: TicketTier[];
  accountName: string;
  accountNumber: string;
  bankName: string;
}

const GENRES = ['Musical', 'Drama', 'Comedy', 'Historical Epic', 'Spoken Word', 'Dance Theatre', 'Opera', 'Experimental'];
const CITIES  = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Other'];

const STEPS = ['Production Info', 'Schedule', 'Ticketing', 'Payout Setup', 'Review & Publish'];

const emptyTier = (): TicketTier => ({ id: crypto.randomUUID(), name: '', price: '', capacity: '' });

// ─── Mini date-picker helpers ────────────────────────────
function formatDate(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return new Date(+y, +m - 1, +day).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ─── Main Component ──────────────────────────────────────
export default function CreateProductionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [published, setPublished] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [resolvedName, setResolvedName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');

  useEffect(() => { getBanks().then(setBanks); }, []);

  const resolveAccount_ = useCallback(async (accNum: string, bank: Bank | null) => {
    if (accNum.length !== 10 || !bank) return;
    setResolving(true); setResolveError(''); setResolvedName('');
    try {
      const r = await resolveAccount(accNum, bank.code);
      setResolvedName(r.account_name);
      set('accountName', r.account_name);
    } catch {
      setResolveError('Could not verify account. Please check the details.');
    } finally { setResolving(false); }
  }, []);

  const [form, setForm] = useState<FormData>({
    title: '', genre: '', synopsis: '',
    venue: '', city: '', address: '',
    dates: [{ date: '', time: '19:00' }],
    tiers: [{ id: crypto.randomUUID(), name: 'General', price: '', capacity: '' }],
    accountName: '', accountNumber: '', bankName: '',
  });

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">Please sign in to create a production.</p>
        <Link href="/login" className="bg-white text-black font-bold px-6 py-3 rounded-xl">Sign In</Link>
      </div>
    );
  }

  const set = (key: keyof FormData, val: unknown) =>
    setForm(p => ({ ...p, [key]: val }));

  // Dates
  const addDate = () => set('dates', [...form.dates, { date: '', time: '19:00' }]);
  const removeDate = (i: number) => set('dates', form.dates.filter((_, idx) => idx !== i));
  const updateDate = (i: number, field: keyof ShowDate, val: string) => {
    const next = [...form.dates];
    next[i] = { ...next[i], [field]: val };
    set('dates', next);
  };

  // Tiers
  const addTier = () => set('tiers', [...form.tiers, emptyTier()]);
  const removeTier = (id: string) => set('tiers', form.tiers.filter(t => t.id !== id));
  const updateTier = (id: string, field: keyof TicketTier, val: string) => {
    set('tiers', form.tiers.map(t => t.id === id ? { ...t, [field]: val } : t));
  };

  const totalCapacity = form.tiers.reduce((s, t) => s + (parseInt(t.capacity) || 0), 0);
  const totalRevenuePotential = form.tiers.reduce((s, t) =>
    s + (parseFloat(t.price) || 0) * (parseInt(t.capacity) || 0), 0);

  const canNext = [
    form.title.length > 2 && form.genre && form.synopsis.length >= 30,
    form.dates.every(d => d.date && d.time) && form.venue && form.city,
    form.tiers.every(t => t.name && t.price && t.capacity),
    form.accountName && form.accountNumber.length >= 10 && form.bankName,
    true,
  ][step];

  const handlePublish = async () => {
    // Simulate API call
    await new Promise(r => setTimeout(r, 1800));
    setPublished(true);
  };

  if (published) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
          <Check className="h-9 w-9 text-green-500" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Production Published!</h1>
          <p className="text-zinc-400 text-sm max-w-sm">
            <strong className="text-white">{form.title}</strong> is now live on Curtain Call.
            Ticket sales will reflect in your wallet within minutes.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/profile" className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-zinc-100 transition-colors">
            Go to Dashboard
          </Link>
          <button
            onClick={() => { setPublished(false); setStep(0); setForm({ title: '', genre: '', synopsis: '', venue: '', city: '', address: '', dates: [{ date: '', time: '19:00' }], tiers: [{ id: crypto.randomUUID(), name: 'General', price: '', capacity: '' }], accountName: '', accountNumber: '', bankName: '' }); }}
            className="bg-zinc-900 border border-white/10 text-white px-6 py-3 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-white/5 sticky top-16 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/profile" className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-serif font-bold text-white">Create Production</h1>
            <p className="text-xs text-zinc-500">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex h-0.5 bg-zinc-800">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 transition-colors duration-300 ${i <= step ? 'bg-red-600' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-xl py-8">

        {/* ── STEP 0: Production Info ── */}
        {step === 0 && (
          <div className="flex flex-col gap-5 animate-fade-up">
            <Field label="Play Title">
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. WATERSIDE, Moremi The Musical"
                className={inputCls}
              />
            </Field>

            <Field label="Genre">
              <div className="flex flex-wrap gap-2">
                {GENRES.map(g => (
                  <button
                    key={g}
                    onClick={() => set('genre', g)}
                    type="button"
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      form.genre === g
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 text-zinc-400 border-white/10 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="About this Production" hint="Minimum 30 characters">
              <textarea
                value={form.synopsis}
                onChange={e => set('synopsis', e.target.value)}
                placeholder="Tell audiences what this production is about — the story, themes, what makes it unique…"
                rows={5}
                className={`${inputCls} resize-none`}
              />
              <p className={`text-xs mt-1 ${form.synopsis.length < 30 ? 'text-red-500/70' : 'text-green-500'}`}>
                {form.synopsis.length < 30 ? `${30 - form.synopsis.length} more characters needed` : 'Looks good ✓'}
              </p>
            </Field>

            <Field label="Poster / Banner">
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-white/25 transition-colors cursor-pointer relative">
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                <Upload className="h-7 w-7 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">Upload poster image</p>
                <p className="text-xs text-zinc-600 mt-1">JPG, PNG — recommended 2:3 ratio</p>
              </div>
            </Field>
          </div>
        )}

        {/* ── STEP 1: Schedule ── */}
        {step === 1 && (
          <div className="flex flex-col gap-5 animate-fade-up">
            <Field label="Venue Name">
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  value={form.venue}
                  onChange={e => set('venue', e.target.value)}
                  placeholder="e.g. Terra Kulture Arena, MUSON Centre"
                  className={`${inputCls} pl-10`}
                />
              </div>
            </Field>

            <Field label="City">
              <div className="flex flex-wrap gap-2">
                {CITIES.map(c => (
                  <button
                    key={c}
                    onClick={() => set('city', c)}
                    type="button"
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      form.city === c
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 text-zinc-400 border-white/10 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Full Address (optional)">
              <input
                value={form.address}
                onChange={e => set('address', e.target.value)}
                placeholder="Street address"
                className={inputCls}
              />
            </Field>

            <Field label="Show Dates & Times" hint="Select each individual day the show runs">
              <div className="flex flex-col gap-3">
                {form.dates.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                      <input
                        type="date"
                        value={d.date}
                        onChange={e => updateDate(i, 'date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className={`${inputCls} pl-10 [color-scheme:dark]`}
                      />
                    </div>
                    <div className="relative w-28 shrink-0">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                      <input
                        type="time"
                        value={d.time}
                        onChange={e => updateDate(i, 'time', e.target.value)}
                        className={`${inputCls} pl-9 [color-scheme:dark]`}
                      />
                    </div>
                    {form.dates.length > 1 && (
                      <button onClick={() => removeDate(i)} className="text-zinc-600 hover:text-red-400 transition-colors shrink-0">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Date chips preview */}
                {form.dates.some(d => d.date) && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {form.dates.filter(d => d.date).map((d, i) => (
                      <span key={i} className="text-[11px] bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full border border-white/10">
                        {formatDate(d.date)} · {d.time}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={addDate}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-400 transition-colors mt-1"
                >
                  <Plus className="h-4 w-4" /> Add another date
                </button>
              </div>
            </Field>
          </div>
        )}

        {/* ── STEP 2: Ticketing ── */}
        {step === 2 && (
          <div className="flex flex-col gap-5 animate-fade-up">
            <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4 flex gap-3">
              <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-zinc-400 leading-relaxed">
                Create one or more ticket tiers (e.g. General, VIP). Curtain Call charges a <strong className="text-white">5% platform fee</strong> on ticket sales — the remainder goes directly into your wallet.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {form.tiers.map((tier, idx) => (
                <div key={tier.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Tier {idx + 1}
                    </span>
                    {form.tiers.length > 1 && (
                      <button onClick={() => removeTier(tier.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Field label="Tier Name">
                    <input
                      value={tier.name}
                      onChange={e => updateTier(tier.id, 'name', e.target.value)}
                      placeholder="e.g. General, VIP, Early Bird"
                      className={inputCls}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Price (₦)">
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₦</span>
                        <input
                          type="number"
                          min="0"
                          value={tier.price}
                          onChange={e => updateTier(tier.id, 'price', e.target.value)}
                          placeholder="5,000"
                          className={`${inputCls} pl-7`}
                        />
                      </div>
                    </Field>
                    <Field label="Capacity">
                      <input
                        type="number"
                        min="1"
                        value={tier.capacity}
                        onChange={e => updateTier(tier.id, 'capacity', e.target.value)}
                        placeholder="150"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addTier}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-400 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add another tier
            </button>

            {/* Revenue preview */}
            {totalCapacity > 0 && (
              <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 mt-2">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Revenue Estimate</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-serif font-bold text-white">
                      ₦{(totalRevenuePotential * 0.95).toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-600 mt-0.5">Your payout (95%)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-serif font-bold text-zinc-400">
                      {totalCapacity.toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-600 mt-0.5">Total seats</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Payout ── */}
        {step === 3 && (
          <div className="flex flex-col gap-5 animate-fade-up">
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 mb-1">
              <div className="flex items-center gap-3 mb-1">
                <Banknote className="h-5 w-5 text-green-500" />
                <p className="text-sm font-semibold text-white">Where should we send your earnings?</p>
              </div>
              <p className="text-xs text-zinc-500 ml-8">Payouts processed via Paystack within 48 hours of each show date.</p>
            </div>

            {/* Bank selector */}
            <Field label="Bank">
              <div className="relative">
                <select
                  value={selectedBank?.code || ''}
                  onChange={e => {
                    const bank = banks.find(b => b.code === e.target.value) || null;
                    setSelectedBank(bank);
                    set('bankName', bank?.name || '');
                    if (form.accountNumber.length === 10) resolveAccount_(form.accountNumber, bank);
                  }}
                  className={`${inputCls} appearance-none pr-10`}
                >
                  <option value="">Select your bank</option>
                  {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              </div>
            </Field>

            {/* Account number + live resolution */}
            <Field label="Account Number">
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={form.accountNumber}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  set('accountNumber', val);
                  if (val.length === 10) resolveAccount_(val, selectedBank);
                  else { setResolvedName(''); setResolveError(''); }
                }}
                placeholder="10-digit account number"
                className={`${inputCls} font-mono tracking-widest`}
              />
              {resolving && (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="h-3.5 w-3.5 text-zinc-400 animate-spin" />
                  <span className="text-xs text-zinc-400">Verifying with Paystack…</span>
                </div>
              )}
              {resolvedName && !resolving && (
                <div className="flex items-center gap-2 mt-2 p-3 bg-green-500/8 border border-green-500/20 rounded-xl">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <div>
                    <p className="text-[11px] text-zinc-500">Account verified</p>
                    <p className="text-sm font-semibold text-white">{resolvedName}</p>
                  </div>
                </div>
              )}
              {resolveError && !resolving && (
                <div className="flex flex-col gap-3 mt-2">
                  <div className="flex items-center gap-2 p-3 bg-red-500/8 border border-red-500/20 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-xs text-red-400">{resolveError}</p>
                  </div>
                  <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-3">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                      Manual Account Name Entry
                    </label>
                    <input
                      type="text"
                      value={form.accountName}
                      onChange={e => {
                        set('accountName', e.target.value);
                      }}
                      placeholder="Enter the name on your bank account"
                      className={`${inputCls} text-xs`}
                    />
                    <p className="text-[9px] text-zinc-500 mt-1">
                      Auto-resolution is currently unavailable. You may manually type your account name to proceed.
                    </p>
                  </div>
                </div>
              )}
            </Field>

            <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 flex gap-3">
              <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your banking details are encrypted end-to-end via Paystack. Curtain Call never stores your bank credentials.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 4: Review & Publish ── */}
        {step === 4 && (
          <div className="flex flex-col gap-4 animate-fade-up">
            <ReviewRow label="Title" value={form.title} />
            <ReviewRow label="Genre" value={form.genre} />
            <ReviewRow label="Synopsis" value={form.synopsis} truncate />
            <ReviewRow label="Venue" value={`${form.venue}${form.city ? ', ' + form.city : ''}`} />
            <ReviewRow
              label="Show Dates"
              value={form.dates.filter(d => d.date).map(d => `${formatDate(d.date)} at ${d.time}`).join(' · ')}
            />
            <ReviewRow
              label="Ticket Tiers"
              value={form.tiers.map(t => `${t.name} — ₦${Number(t.price).toLocaleString()} × ${t.capacity}`).join('\n')}
              multiline
            />
            <ReviewRow label="Payout Account" value={`${form.bankName} · ${form.accountNumber}`} />

            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 mt-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Revenue Potential</p>
              <p className="text-3xl font-serif font-bold text-white">
                ₦{(totalRevenuePotential * 0.95).toLocaleString()}
              </p>
              <p className="text-xs text-zinc-600 mt-1">Estimated payout at full capacity across {form.dates.length} date{form.dates.length !== 1 ? 's' : ''}</p>
            </div>

            <button
              onClick={handlePublish}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-colors mt-2 flex items-center justify-center gap-2"
            >
              <Ticket className="h-5 w-5" />
              Publish Production
            </button>
            <p className="text-xs text-center text-zinc-600">
              By publishing you agree to Curtain Call&apos;s Producer Terms.
            </p>
          </div>
        )}

        {/* ── Navigation ── */}
        {step < 4 && (
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-5 py-3 bg-zinc-900 border border-white/10 text-white rounded-2xl hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-black font-bold rounded-2xl hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared sub-components ───────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-2">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</label>
        {hint && <span className="text-[11px] text-zinc-600">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value, truncate, multiline }: { label: string; value: string; truncate?: boolean; multiline?: boolean }) {
  return (
    <div className="flex gap-4 py-3 border-b border-white/5 last:border-0">
      <span className="text-xs text-zinc-500 uppercase tracking-wider w-28 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-white flex-1 ${truncate ? 'line-clamp-2' : ''} ${multiline ? 'whitespace-pre-line' : ''}`}>
        {value || <span className="text-zinc-600 italic">Not set</span>}
      </span>
    </div>
  );
}

const inputCls = 'w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/25 transition-colors';
