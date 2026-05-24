'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, User, FileText, Link2, Upload, ArrowLeft, CheckCircle, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';

import { ClientDB } from '@/lib/db';
import { useAuth } from '@/lib/AuthContext';

type Step = 'form' | 'submitting' | 'success';

export default function ApplyToCriticPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    publication: '',
    link1: '',
    link2: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-zinc-950">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center animate-pulse">
          <Lock className="h-7 w-7 text-zinc-500" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-white text-center">Sign in to apply as a critic</h1>
        <p className="text-zinc-400 text-sm max-w-sm text-center leading-relaxed">
          You must be authenticated to apply to our verified critic programme. This locks your credentials dynamically to your verified email profile.
        </p>
        <Link href="/login" className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-zinc-100 transition-colors mt-2">
          Sign In
        </Link>
      </div>
    );
  }

  const isValid =
    form.fullName.trim().length > 2 &&
    form.email.includes('@') &&
    (files.length >= 1 || form.link1.trim().length > 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setStep('submitting');

    ClientDB.submitCriticApplication({
      name: form.fullName,
      email: form.email,
      publication: form.publication,
      link1: form.link1,
      link2: form.link2,
      fileName: files[0]?.name || ''
    });

    await new Promise(r => setTimeout(r, 1800));
    setStep('success');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).slice(0, 2);
    setFiles(prev => [...prev, ...dropped].slice(0, 2));
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-3">Application Received</h1>
          <p className="text-zinc-400 text-base leading-relaxed mb-8">
            Thank you for applying to join the Curtain Call verified critics programme. Your application is under review — we&apos;ll be in touch via email shortly.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-zinc-100 transition-colors"
          >
            Back to Discovery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <Link
          href="/critics"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Critics Hub
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Apply to be a Critic</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Join our panel of verified theatre journalists and critics. All applications are reviewed by the Curtain Call editorial team.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Your full name"
                value={form.fullName}
                onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                placeholder="name@example.com"
                value={form.email}
                disabled
                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-sm text-zinc-500 cursor-not-allowed focus:outline-none"
                required
              />
            </div>
            <p className="text-[10px] text-red-500 font-mono">Verified Email Locked</p>
          </div>

          {/* Publication */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Publication / Outlet <span className="text-zinc-600 normal-case font-normal">(optional)</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="e.g. The Guardian, BusinessDay Arts"
                value={form.publication}
                onChange={e => setForm(p => ({ ...p, publication: e.target.value }))}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-zinc-600 uppercase tracking-wider">Sample Reviews</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <p className="text-xs text-zinc-500 -mt-3">
            Provide at least 1 sample review — either upload a PDF/doc or paste a link to a published review.
          </p>

          {/* File Upload */}
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/20'
            }`}
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              multiple
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={e => {
                const selected = Array.from(e.target.files || []).slice(0, 2);
                setFiles(selected);
              }}
            />
            <Upload className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
            {files.length > 0 ? (
              <div className="space-y-1">
                {files.map((f, i) => (
                  <p key={i} className="text-sm text-white font-medium">{f.name}</p>
                ))}
              </div>
            ) : (
              <>
                <p className="text-sm text-zinc-400 font-medium">Drop files here or click to browse</p>
                <p className="text-xs text-zinc-600 mt-1">PDF or Word — up to 2 files</p>
              </>
            )}
          </div>

          {/* OR */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-zinc-600">or paste links</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Links */}
          {[
            { key: 'link1', label: 'Review Link 1' },
            { key: 'link2', label: 'Review Link 2 (optional)' },
          ].map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</label>
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="url"
                  placeholder="https://publication.com/review"
                  value={form[key as 'link1' | 'link2']}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
            </div>
          ))}

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || step === 'submitting'}
            className="w-full mt-2 bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {step === 'submitting' ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
            ) : (
              'Submit Application'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
