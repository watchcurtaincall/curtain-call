'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import {
  ChevronRight, ChevronLeft, Check, MapPin, Calendar,
  Ticket, Upload, Plus, X, Clock, ArrowLeft, Banknote,
  Info, Loader2, CheckCircle, AlertCircle, ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { getBanks, resolveAccount, type Bank } from '@/lib/paystack';
import { ClientDB } from '@/lib/db';
import { DateTimePickerModal } from '@/components/shared/DateTimePickerModal';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

// ─── Types ───────────────────────────────────────────────
interface ShowDate {
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM start time
  endTime?: string; // HH:MM end time (for non-theatre events)
}

interface TicketTier {
  id: string;
  name: string;
  price: string;
  capacity: string;
  description?: string;
}

interface CastCrewMember {
  name: string;
  role: string;
  category: 'Creative' | 'Cast' | 'Technical';
}

interface FormData {
  eventType?: string;
  customEventType?: string;
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
  bankCode: string;
  posterUrl: string;
  castAndCrew: CastCrewMember[];
}

const GENRES = ['Musical', 'Drama', 'Comedy', 'Historical Epic', 'Spoken Word', 'Dance Theatre', 'Opera', 'Experimental'];
const CITIES  = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Other'];

const STEPS = ['Event Info', 'Schedule', 'Ticketing', 'Payout Setup', 'Review & Publish'];

const emptyTier = (): TicketTier => ({ id: `tier-${Date.now()}-${Math.floor(Math.random()*1000)}`, name: '', price: '', capacity: '', description: '' });

// ─── Mini date-picker helpers ────────────────────────────
function formatDate(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return new Date(+y, +m - 1, +day).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ─── Main Component ──────────────────────────────────────
function CreateProductionForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [step, setStep] = useState(0);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [endTimePickerIndex, setEndTimePickerIndex] = useState<number | null>(null);
  const [published, setPublished] = useState(false);
  const [createdProductionId, setCreatedProductionId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [resolvedName, setResolvedName] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);


  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    const prod = ClientDB.getProductionById(createdProductionId);
    const link = `${window.location.origin}/shows/${prod?.slug || createdProductionId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => { getBanks().then(setBanks); }, []);



  const [form, setForm] = useState<FormData>({
    eventType: '',
    customEventType: '',
    title: '', genre: '', synopsis: '',
    venue: '', city: '', address: '',
    dates: [{ date: '', time: '19:00', endTime: '' }],
    tiers: [{ id: 'default-tier', name: 'General', price: '', capacity: '' }],
    accountName: '', accountNumber: '', bankName: '', bankCode: '',
    posterUrl: '',
    castAndCrew: [],
  });

  const set = useCallback((key: keyof FormData, val: unknown) => {
    setForm(p => ({ ...p, [key]: val }));
  }, []);

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
  }, [set]);

  // Edit Mode Loader
  useEffect(() => {
    if (editId && user) {
      const prod = ClientDB.getProductionById(editId) as any;
      if (prod) {
        if (prod.submitterEmail && user.email && prod.submitterEmail.toLowerCase() === user.email.toLowerCase()) {
          setIsEditMode(true);
          
          const isTiersArray = Array.isArray(prod.ticketTiers);
          const tiers = isTiersArray && prod.ticketTiers.length > 0 ? prod.ticketTiers.map((t: any) => ({
            id: t?.id || `tier-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            name: t?.name || '',
            price: t?.price ? String(t.price) : '',
            capacity: t?.capacity ? String(t.capacity) : '',
            description: t?.description || ''
          })) : [{ id: `tier-${Date.now()}-${Math.floor(Math.random()*1000)}`, name: 'General', price: '', capacity: '', description: '' }];

          const isDatesArray = Array.isArray(prod.dates);
          const dates = (isDatesArray && prod.dates.length > 0) ? prod.dates : (prod.showDate ? [{ date: prod.showDate, time: prod.showTime || '19:00', endTime: prod.endTime || '' }] : [{ date: '', time: '19:00', endTime: '' }]);

          setForm({
            eventType: prod.eventType || '',
            customEventType: '',
            title: prod.title || '',
            genre: prod.genre || '',
            synopsis: prod.synopsis || '',
            venue: prod.venue || '',
            city: prod.city || 'Lagos',
            address: prod.address || '',
            dates: dates,
            tiers: tiers,
            accountName: prod.accountName || '',
            accountNumber: prod.accountNumber || '',
            bankName: prod.bankName || '',
            bankCode: prod.bankCode || '',
            posterUrl: prod.posterUrl || '',
            castAndCrew: Array.isArray(prod.castAndCrew) ? prod.castAndCrew.filter(Boolean) : []
          });

          if (prod.bankName && banks.length > 0) {
            const bank = banks.find((b: any) => b.name.toLowerCase() === prod.bankName.toLowerCase()) || null;
            setSelectedBank(bank);
          }
          if (prod.accountName) {
            setResolvedName(prod.accountName);
          }
        } else {
          router.push('/profile');
        }
      }
    }
  }, [editId, user, router, banks]);

  // Load User Bank Details
  useEffect(() => {
    if (user && banks.length > 0) {
      const savedBank = ClientDB.getUserBankDetails(user.email);
      if (savedBank) {
        setForm(f => {
          if (!f.accountNumber) {
            return {
              ...f,
              accountName: savedBank.accountName,
              accountNumber: savedBank.accountNumber,
              bankName: savedBank.bankName,
              bankCode: savedBank.bankCode
            };
          }
          return f;
        });
        if (!selectedBank) {
          const bank = banks.find((b: any) => b.code === savedBank.bankCode || b.name.toLowerCase() === savedBank.bankName.toLowerCase()) || null;
          setSelectedBank(bank);
        }
        if (!resolvedName) {
          setResolvedName(savedBank.accountName);
        }
      }
    }
  }, [user, banks]);

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberCategory, setNewMemberCategory] = useState<'Creative' | 'Cast' | 'Technical'>('Cast');

  const addCastMember = () => {
    if (!newMemberName.trim() || !newMemberRole.trim()) return;
    set('castAndCrew', [
      ...(form.castAndCrew || []),
      {
        name: newMemberName.trim(),
        role: newMemberRole.trim(),
        category: newMemberCategory
      }
    ]);
    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberCategory('Cast');
  };

  const removeCastMember = (idx: number) => {
    set('castAndCrew', (form.castAndCrew || []).filter((_, i) => i !== idx));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await ClientDB.compressImage(file, 800, 0.6);
      setForm(prev => ({ ...prev, posterUrl: compressed }));
    } catch (err) {
      console.error('Failed to compress image:', err);
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">Please sign in to create an event.</p>
        <Link href="/login" className="bg-white text-black font-bold px-6 py-3 rounded-xl">Sign In</Link>
      </div>
    );
  }



  // Dates
  const addDate = () => set('dates', [...form.dates, { date: '', time: '19:00', endTime: '' }]);
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
    form.title.length > 2 && form.eventType && (form.eventType !== 'Other' || form.customEventType) && (form.eventType !== 'Theatre' || form.genre) && form.synopsis.length >= 30,
    form.dates.every(d => d.date && d.time) && form.venue && form.city,
    form.tiers.every(t => t.name && t.price && t.capacity),
    form.accountName && form.accountNumber.length >= 10 && form.bankName,
    true,
  ][step];

  const handlePublish = async () => {
    try {
      setIsDraftMode(false);
      const firstDate = form.dates[0]?.date || '';
      const firstTime = form.dates[0]?.time || '';
      const firstEndTime = form.dates[0]?.endTime || '';
      
      // Generate SEO-friendly slug
      const slug = (form.title || 'untitled')
        .toLowerCase()
        .replace(/[^a-z0-9_ ]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      const newPlayId = `${slug || 'play'}-${Date.now()}`;
      const targetId = isEditMode && editId ? editId : newPlayId;

      const existingProd = isEditMode && editId ? ClientDB.getProductionById(editId) : null;

      // Calculate runtime from start/end times for non-theatre events
      let computedRuntime = existingProd?.runtime || '120 mins';

      if (form.eventType && form.eventType !== 'Theatre' && firstTime && firstEndTime) {
        const [sh, sm] = firstTime.split(':').map(Number);
        const [eh, em] = firstEndTime.split(':').map(Number);
        const durationMins = (eh * 60 + em) - (sh * 60 + sm);
        if (durationMins > 0) computedRuntime = `${durationMins} mins`;
      }
      
      const newPlay = {
        id: targetId,
        eventType: (form.eventType === 'Other' ? form.customEventType : form.eventType) as any,
        title: form.title,
        slug: slug || undefined,
        createdAt: existingProd?.createdAt || new Date().toISOString(),
        synopsis: form.synopsis,
        genre: form.genre,
        runtime: computedRuntime,
        venue: form.venue,
        city: form.city || undefined,
        address: form.address || undefined,
        status: existingProd ? existingProd.status : ('Coming Soon' as const),
        posterUrl: form.posterUrl || '/images/default_poster.png',
        criticScore: existingProd ? existingProd.criticScore : null,
        audienceScore: existingProd ? existingProd.audienceScore : null,
        totalReviews: existingProd ? existingProd.totalReviews : 0,
        galleryImages: form.posterUrl ? [form.posterUrl] : [],
        submitterEmail: user?.email || '',
        curationStatus: 'Approved' as const,
        isProducerManaged: true,
        showDate: firstDate,
        showTime: firstTime || undefined,
        endTime: firstEndTime || undefined,
        dates: form.dates,
        ticketTiers: form.tiers.map(t => ({
          id: t.id,
          name: t.name,
          price: t.price,
          capacity: t.capacity,
          description: t.description || ''
        })),
        castAndCrew: form.castAndCrew || [],
        accountName: form.accountName || undefined,
        accountNumber: form.accountNumber || undefined,
        bankName: form.bankName || undefined,
      };

      ClientDB.saveProduction(newPlay);
      
      if (user?.email && form.accountNumber && form.bankCode) {
        ClientDB.saveUserBankDetails(user.email, {
          bankCode: form.bankCode,
          bankName: form.bankName,
          accountNumber: form.accountNumber,
          accountName: form.accountName
        });
      }

      setCreatedProductionId(targetId);
      setPublished(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to publish production:', err);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsDraftMode(true);
      const firstDate = form.dates[0]?.date || '';
      
      const slug = form.title
        ? form.title.toLowerCase().replace(/[^a-z0-9_ ]/g, '').trim().replace(/\s+/g, '-')
        : 'draft';
      const newPlayId = `${slug}-${Date.now()}`;
      const targetId = isEditMode && editId ? editId : newPlayId;

      const existingProd = isEditMode && editId ? ClientDB.getProductionById(editId) : null;
      
      const newPlay = {
        id: targetId,
        eventType: (form.eventType === 'Other' ? form.customEventType : form.eventType) as any,
        title: form.title || 'Untitled Draft',
        slug: slug || undefined,
        createdAt: existingProd?.createdAt || new Date().toISOString(),
        synopsis: form.synopsis || 'No synopsis added yet.',
        genre: form.genre || 'Drama',
        runtime: existingProd?.runtime || '120 mins',
        venue: form.venue || 'No venue set',
        status: 'Draft' as const,
        posterUrl: form.posterUrl || '',
        criticScore: existingProd ? existingProd.criticScore : null,
        audienceScore: existingProd ? existingProd.audienceScore : null,
        totalReviews: existingProd ? existingProd.totalReviews : 0,
        galleryImages: form.posterUrl ? [form.posterUrl] : [],
        submitterEmail: user?.email || '',
        curationStatus: 'Approved' as const, // Drafts are pre-approved but private
        isProducerManaged: true,
        showDate: firstDate || undefined,
        dates: form.dates,
        ticketTiers: form.tiers.map(t => ({
          id: t.id,
          name: t.name || 'General',
          price: t.price || '0',
          capacity: t.capacity || '0',
          description: t.description || ''
        })),
        castAndCrew: form.castAndCrew || [],
      };

      ClientDB.saveProduction(newPlay);

      if (user?.email && form.accountNumber && form.bankCode) {
        ClientDB.saveUserBankDetails(user.email, {
          bankCode: form.bankCode,
          bankName: form.bankName,
          accountNumber: form.accountNumber,
          accountName: form.accountName
        });
      }

      setCreatedProductionId(targetId);
      setPublished(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  };

  if (published) {
    const prod = ClientDB.getProductionById(createdProductionId);
    const playUrl = `/shows/${prod?.slug || createdProductionId}`;
    const ticketsUrl = `/tickets/${createdProductionId}`;
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-8 text-center bg-zinc-950">
        <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center animate-bounce">
          <Check className="h-9 w-9 text-green-500" />
        </div>
        
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2 tracking-tight">
            {isDraftMode ? 'Draft Saved!' : 'Event Published!'}
          </h1>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
            {isDraftMode ? (
              <>
                <strong className="text-white font-semibold">{form.title || 'Untitled Draft'}</strong> has been saved locally as a draft. You can manage, edit, or publish it under your dashboard Production Hub.
              </>
            ) : (
              <>
                <strong className="text-white font-semibold">{form.title}</strong> is now live on Curtain Call and listed under <strong className="text-white font-semibold">Coming Soon</strong>.
              </>
            )}
          </p>
        </div>

        {/* Premium Share Section - only show if NOT saved as a draft */}
        {!isDraftMode ? (
          <div className="w-full max-w-md bg-zinc-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-md flex flex-col gap-4 text-left shadow-2xl">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Share Your Production</h3>
          
          <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center gap-4">
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Public Playbill URL</span>
                <Link href={playUrl} target="_blank" className="text-sm text-red-500 hover:text-red-400 font-medium break-all flex items-center gap-1 mt-0.5">
                  /shows/{prod?.slug || createdProductionId}
                </Link>
              </div>
              <button
                onClick={handleCopyLink}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all flex items-center gap-1 shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-500" /> Copied!
                  </>
                ) : (
                  <>Copy Link</>
                )}
              </button>
            </div>
            
            <div className="border-t border-dashed border-white/5 my-1" />
            
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Direct Ticket Checkout</span>
              <Link href={ticketsUrl} target="_blank" className="text-sm text-zinc-200 hover:text-white font-medium break-all flex items-center gap-1 mt-0.5">
                /tickets/{createdProductionId}
              </Link>
            </div>
          </div>
        </div>
        ) : null}

        <div className="flex gap-3 w-full max-w-md">
          <Link href="/creator" className="flex-1 bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-100 transition-colors shadow-lg text-sm flex items-center justify-center">
            Go to Dashboard
          </Link>
          <button
            onClick={() => {
              setPublished(false);
              setStep(0);
              setForm({
                title: '',
                genre: '',
                synopsis: '',
                venue: '',
                city: '',
                address: '',
                dates: [{ date: '', time: '19:00' }],
                tiers: [{ id: 'default-tier', name: 'General', price: '', capacity: '' }],
                accountName: '',
                accountNumber: '',
                bankName: '',
                bankCode: '',
                posterUrl: '',
                castAndCrew: [],
              });
            }}
            className="flex-1 bg-zinc-900 border border-white/10 text-white font-bold py-4 rounded-2xl hover:bg-zinc-800 transition-colors text-sm"
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
          <button 
            onClick={() => {
              if (step > 0) {
                setStep(s => s - 1);
                window.scrollTo(0, 0);
              } else {
                router.back();
              }
            }}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-serif font-bold text-white">
              {isEditMode ? 'Edit Event' : 'Create Event'}
            </h1>
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

        {/* ── STEP 0: Event Info ── */}
        {step === 0 && (
          <div className="flex flex-col gap-5 animate-fade-up">
            <Field label="Event Type">
              {form.eventType ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full text-sm font-bold bg-white text-black border border-white"
                  >
                    {form.eventType}
                  </button>
                  <button
                    type="button"
                    onClick={() => { set('eventType', ''); set('customEventType', ''); set('genre', ''); }}
                    className="text-xs text-zinc-400 hover:text-white underline underline-offset-4"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {['Theatre', 'Art', 'Music', 'Party', 'Festival', 'Workshop', 'Community', 'Health', 'Wellness', 'Tech', 'Seminar', 'Religion', 'Comedy', 'Conference', 'Other'].map(type => (
                    <button
                      key={type}
                      onClick={() => { set('eventType', type); if(type !== 'Theatre') set('genre', type); set('customEventType', ''); }}
                      type="button"
                      className="px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all bg-zinc-900 text-zinc-400 border-white/10 hover:border-white/25 hover:text-white"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </Field>

            {form.eventType && (
              <>
                {form.eventType === 'Other' && (
                  <Field label="Custom Event Type">
                    <input
                      value={form.customEventType || ''}
                      onChange={e => set('customEventType', e.target.value)}
                      placeholder="Enter your event type"
                      className={inputCls}
                    />
                  </Field>
                )}

                <Field label={form.eventType === 'Theatre' ? "Play Title" : "Event Title"}>
                  <input
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    placeholder={form.eventType === 'Theatre' ? "e.g. WATERSIDE, Moremi The Musical" : "e.g. Lagos Carnival, Tech Connect 2026"}
                    className={inputCls}
                  />
                </Field>

                {form.eventType === 'Theatre' && (
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
                )}

                <Field label={form.eventType === 'Theatre' ? "About this Production" : "About this Event"} hint="Minimum 30 characters">
                  <div className="bg-white rounded-xl overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:bg-zinc-100 [&_.ql-container]:border-none [&_.ql-editor]:min-h-[150px] [&_.ql-editor]:text-black">
                    <ReactQuill
                      theme="snow"
                      value={form.synopsis}
                      onChange={val => set('synopsis', val === '<p><br></p>' ? '' : val)}
                      placeholder={form.eventType === 'Theatre' ? "Tell audiences what this production is about — the story, themes, what makes it unique…" : "Tell audiences what this event is about — what to expect, who it's for, and why they should attend…"}
                      modules={{
                        toolbar: [
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          ['link', 'clean']
                        ]
                      }}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${form.synopsis.length < 30 ? 'text-red-500/70' : 'text-green-500'}`}>
                    {form.synopsis.length < 30 ? `${30 - form.synopsis.length} more characters needed` : 'Looks good ✓'}
                  </p>
                </Field>

                <Field label="Poster / Banner">
                  {form.posterUrl ? (
                    <div className="relative group aspect-[2/3] w-48 mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.posterUrl}
                        alt="Poster Preview"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, posterUrl: '' }))}
                          className="bg-red-600/90 hover:bg-red-600 text-white font-bold p-2.5 rounded-full transition-colors flex items-center justify-center"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Remove Poster</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-white/25 transition-colors cursor-pointer relative bg-zinc-900/50 backdrop-blur-sm">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={uploading}
                      />
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2 py-4">
                          <Loader2 className="h-7 w-7 text-red-500 animate-spin" />
                          <p className="text-sm text-zinc-400">Processing high-fidelity file...</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-7 w-7 text-zinc-600 mx-auto mb-2" />
                          <p className="text-sm text-zinc-400">Upload poster image</p>
                          <p className="text-xs text-zinc-600 mt-1">JPG, PNG — recommended 2:3 ratio</p>
                        </>
                      )}
                    </div>
                  )}
                </Field>

                {form.eventType === 'Theatre' && (
                  <Field label="Cast & Crew (Playbill)">
                    <div className="flex flex-col gap-3 bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          value={newMemberName}
                          onChange={e => setNewMemberName(e.target.value)}
                          placeholder="Name (e.g. John Doe)"
                          className={inputCls}
                        />
                        <input
                          value={newMemberRole}
                          onChange={e => setNewMemberRole(e.target.value)}
                          placeholder="Role (e.g. Kurunmi, Director)"
                          className={inputCls}
                        />
                        <select
                          value={newMemberCategory}
                          onChange={e => setNewMemberCategory(e.target.value as any)}
                          className={`${inputCls} bg-zinc-950 text-white`}
                        >
                          <option value="Cast">Cast (Actor)</option>
                          <option value="Creative">Creative (Director, Writer)</option>
                          <option value="Technical">Technical (Lights, Sound)</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={addCastMember}
                        className="bg-white/10 hover:bg-white/15 text-white text-xs font-bold py-2.5 rounded-xl border border-white/5 transition-all"
                      >
                        Add Cast/Crew Member
                      </button>

                      {form.castAndCrew && form.castAndCrew.length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-2 max-h-40 overflow-y-auto pr-1">
                          {form.castAndCrew.map((member, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-zinc-950/60 border border-white/5 px-3 py-1.5 rounded-lg text-xs">
                              <div>
                                <strong className="text-white">{member.name}</strong>
                                <span className="text-zinc-400 font-medium"> as {member.role}</span>
                                <span className="text-[9px] text-red-400 uppercase tracking-widest font-mono ml-2">({member.category})</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCastMember(idx)}
                                className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Field>
                )}
              </>
            )}
          </div>
        )}

        {/* ── STEP 1: Schedule ── */}
        {step === 1 && (
          <div className="flex flex-col gap-5 animate-fade-up">
            <Field label="Event Address">
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  value={form.venue}
                  onChange={e => set('venue', e.target.value)}
                  placeholder="e.g. Terra Kulture Arena, Tiamiyu Savage St, Victoria Island"
                  className={`${inputCls} pl-10`}
                  autoComplete="street-address"
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

            <Field label="Show Date & Time" hint={form.eventType === 'Theatre' ? 'Select each individual day the show runs' : 'Date, start time, and end time'}>
              <div className="flex flex-col gap-3">
                {form.dates.map((d, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPickerIndex(i)}
                        className="flex-1 flex items-center justify-between bg-zinc-950 border border-white/5 hover:border-white/20 hover:bg-zinc-900 rounded-xl px-4 py-3 text-left transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">
                              {d.date ? formatDate(d.date) : 'Select date'}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-medium mt-0.5">
                              {d.time ? `Starts at ${d.time}` : 'Select time'}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-white transition-colors" />
                      </button>
                      {form.dates.length > 1 && (
                        <button onClick={() => removeDate(i)} className="p-3 bg-zinc-950 border border-white/5 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-zinc-900 hover:border-red-500/20 transition-all shrink-0">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {/* End Time — only for non-theatre events */}
                    {form.eventType && form.eventType !== 'Theatre' && (
                      <div className="flex items-center gap-2 pl-1">
                        <Clock className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <label className="text-[11px] text-zinc-500 uppercase tracking-wider font-bold w-16 shrink-0">End Time</label>
                        <button
                          type="button"
                          onClick={() => setEndTimePickerIndex(i)}
                          className="flex-1 flex items-center justify-center bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white hover:bg-zinc-800 focus:outline-none focus:border-white/25 transition-colors"
                        >
                          <span className="font-bold">{d.endTime || 'Select Time'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {pickerIndex !== null && (
                  <DateTimePickerModal
                    initialDate={form.dates[pickerIndex].date}
                    initialTime={form.dates[pickerIndex].time}
                    onClose={() => setPickerIndex(null)}
                    onConfirm={(date, time) => {
                      setForm(f => {
                        const next = [...f.dates];
                        next[pickerIndex] = { ...next[pickerIndex], date, time };
                        return { ...f, dates: next };
                      });
                    }}
                  />
                )}
                {endTimePickerIndex !== null && (
                  <DateTimePickerModal
                    hideDate
                    initialDate={form.dates[endTimePickerIndex].date || new Date().toISOString().split('T')[0]}
                    initialTime={form.dates[endTimePickerIndex].endTime || '19:00'}
                    onClose={() => setEndTimePickerIndex(null)}
                    onConfirm={(_, time) => {
                      setForm(f => {
                        const next = [...f.dates];
                        next[endTimePickerIndex] = { ...next[endTimePickerIndex], endTime: time };
                        return { ...f, dates: next };
                      });
                    }}
                  />
                )}

                {/* Date chips preview */}
                {form.dates.some(d => d.date) && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {form.dates.filter(d => d.date).map((d, i) => (
                      <span key={i} className="text-[11px] bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full border border-white/10">
                        {formatDate(d.date)} · {d.time}{d.endTime ? ` – ${d.endTime}` : ''}
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
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">Description / Perks (Optional)</label>
                    <textarea
                      value={tier.description || ''}
                      onChange={e => updateTier(tier.id, 'description', e.target.value)}
                      placeholder="e.g. Front row seating, complimentary drinks..."
                      className={`${inputCls} resize-none h-16`}
                    />
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
                    set('bankCode', bank?.code || '');
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
            {form.posterUrl && (
              <div className="aspect-[2/3] w-36 mx-auto rounded-xl overflow-hidden border border-white/10 shadow-lg mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.posterUrl} alt={form.title} className="w-full h-full object-cover" />
              </div>
            )}
            <ReviewRow label="Title" value={form.title} />
            <ReviewRow label="Genre" value={form.genre} />
            <ReviewRow 
              label="Synopsis" 
              value={<div dangerouslySetInnerHTML={{ __html: form.synopsis }} className="prose prose-invert prose-sm line-clamp-3" />} 
            />
            <ReviewRow label="Event Address" value={`${form.venue}${form.city ? ', ' + form.city : ''}`} />
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
              {form.eventType === 'Theatre' ? 'Publish Production' : 'Publish Event'}
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
                onClick={() => { setStep(s => s - 1); window.scrollTo(0, 0); }}
                className="flex items-center gap-2 px-5 py-3 bg-zinc-900 border border-white/10 text-white rounded-2xl hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}
            <button
              onClick={() => { setStep(s => s + 1); window.scrollTo(0, 0); }}
              disabled={!canNext}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-black font-bold rounded-2xl hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-5 py-3 bg-zinc-900 border border-white/10 hover:border-red-650/30 hover:bg-red-950/10 text-zinc-400 hover:text-red-400 rounded-2xl font-bold transition-all text-xs uppercase tracking-wider shrink-0"
            >
              Save Draft
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreateProductionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 font-mono text-xs">
        <span className="animate-pulse">Loading wizard...</span>
      </div>
    }>
      <CreateProductionForm />
    </Suspense>
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

function ReviewRow({ label, value, truncate, multiline }: { label: string; value: React.ReactNode; truncate?: boolean; multiline?: boolean }) {
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
