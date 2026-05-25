'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { ClientDB } from '@/lib/db';
import { Upload, CheckCircle2, User, Drama, Sparkles, BookOpen, Plus, X, Calendar, Image as ImageIcon, FileText, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type SubmitType = 'maker' | 'play' | 'blog';

export default function SubmitPortalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SubmitType>('maker');

  useEffect(() => {
    const isAuthed = localStorage.getItem('cc_authed') === 'true';
    if (!isAuthed) {
      router.push('/login?redirect=/submit');
      return;
    }
    if (user && !user.isVerified) {
      router.push('/profile');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.email) {
      setMakerForm(prev => ({ ...prev, email: prev.email || user.email }));
      setPlayForm(prev => ({ ...prev, email: prev.email || user.email }));
      setBlogForm(prev => ({ ...prev, email: prev.email || user.email }));
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as SubmitType;
      if (tabParam && ['maker', 'play', 'blog'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states - Artist / Theatremaker
  const [makerForm, setMakerForm] = useState({
    name: '',
    dob: '',
    discipline: 'Actor',
    customDiscipline: '',
    bio: '',
    email: user?.email || '',
  });
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null);
  const headshotInputRef = useRef<HTMLInputElement>(null);

  // Form states - Playbill / Document a Play
  const [playForm, setPlayForm] = useState({
    title: '',
    playwright: '',
    director: '',
    synopsis: '',
    venue: '',
    year: '2026',
    email: user?.email || '',
    status: 'Coming Soon' as 'Currently Showing' | 'Coming Soon' | 'Past Production',
    showDate: ''
  });
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Playbill Cast & Crew Builder states
  const [castMembers, setCastMembers] = useState<{ name: string; role: string; category: 'Creative' | 'Cast' | 'Technical' }[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberCategory, setNewMemberCategory] = useState<'Creative' | 'Cast' | 'Technical'>('Cast');

  const addCastMember = () => {
    if (!newMemberName.trim() || !newMemberRole.trim()) return;
    setCastMembers([
      ...castMembers,
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

  // Form states - Blog Submission
  const [blogForm, setBlogForm] = useState({
    title: '',
    category: 'Critique',
    excerpt: '',
    content: '',
    email: user?.email || '',
  });
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Compression helper for images
  const handleImageUpload = async (
    file: File,
    setPreview: (url: string | null) => void
  ) => {
    try {
      const compressed = await ClientDB.compressImage(file, 800, 0.6);
      setPreview(compressed);
    } catch (err) {
      console.error('Failed to compress image:', err);
    }
  };

  const handleHeadshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleImageUpload(e.target.files[0], setHeadshotPreview);
    }
  };

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleImageUpload(e.target.files[0], setPosterPreview);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleImageUpload(e.target.files[0], setCoverPreview);
    }
  };

  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newPreviews: string[] = [];
      for (const file of files) {
        try {
          const compressed = await ClientDB.compressImage(file, 800, 0.6);
          newPreviews.push(compressed);
        } catch (err) {
          console.error(err);
        }
      }
      setGalleryPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  // Submit Handlers
  const sendSubmissionEmail = async (email: string, itemName: string) => {
    if (!email) return;
    const html = `
      <div style="font-family: sans-serif; background-color: #0c0c0e; color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #ef4444; font-family: serif;">CURTAIN CALL</span>
          <p style="color: #a1a1aa; font-size: 14px; margin-top: 5px;">Digital Home for Theatre Culture in Africa</p>
        </div>
        
        <h2 style="font-family: serif; color: #ffffff; font-size: 22px; margin-top: 0;">Submission Received! 🎭</h2>
        
        <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
          Thank you for your submission of <strong>${itemName}</strong> to the Curtain Call digital platform!
        </p>
        
        <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
          Your submission has been successfully received and is currently in our **Curation Queue** pending evaluation. Our editorial team usually completes reviews within 24 to 48 hours.
        </p>
        
        <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; margin: 30px 0; text-align: center;">
          <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 5px 0;">Item Submitted:</p>
          <p style="color: #ffffff; font-size: 16px; font-weight: bold; margin: 0 0 5px 0;">${itemName}</p>
          <p style="color: #ef4444; font-size: 11px; text-transform: uppercase; font-weight: bold; tracking-wider: 1px; margin: 0;">Curation Status: Pending Review</p>
        </div>
        
        <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
          You will receive another email notification as soon as the curation team approves or updates your submission details!
        </p>
        
        <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; margin-top: 30px;">
          Thank you for contributing to African theatrical history archives!
          <br/><br/>
          Sincerely,<br/>
          <strong>The Curtain Call Curation Board</strong>
        </p>
      </div>
    `;
    await ClientDB.sendEmail(email, `Submission Received: "${itemName}" 🎭`, html);
  };

  const handleMakerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newArtist = {
      id: `pending_artist_${Date.now()}`,
      name: makerForm.name,
      roleType: makerForm.discipline === 'Other' ? makerForm.customDiscipline : makerForm.discipline,
      headshotUrl: headshotPreview || '',
      bio: makerForm.bio,
      submitterEmail: makerForm.email || user?.email || 'guest@curtaincall.com',
      curationStatus: 'Pending' as const,
    };

    setTimeout(() => {
      ClientDB.submitArtist(newArtist);
      sendSubmissionEmail(newArtist.submitterEmail, `Artist: ${newArtist.name}`);
      setLoading(false);
      setIsSubmitted(true);
    }, 1000);
  };

  const handlePlaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newPlay = {
      id: `pending_play_${Date.now()}`,
      title: playForm.title,
      synopsis: playForm.synopsis,
      genre: 'Drama',
      runtime: '120 mins',
      venue: playForm.venue,
      status: playForm.status,
      posterUrl: posterPreview || '',
      criticScore: null,
      audienceScore: null,
      totalReviews: 0,
      galleryImages: galleryPreviews,
      submitterEmail: playForm.email || user?.email || 'guest@curtaincall.com',
      curationStatus: 'Pending' as const,
      showDate: playForm.showDate || undefined,
      castAndCrew: castMembers.length > 0 ? castMembers : undefined
    };

    setTimeout(() => {
      ClientDB.submitPlay(newPlay);
      sendSubmissionEmail(newPlay.submitterEmail, `Stage Play: ${newPlay.title}`);
      setLoading(false);
      setIsSubmitted(true);
    }, 1000);
  };

  const handleBlogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newArticle = {
      id: `pending_article_${Date.now()}`,
      title: blogForm.title,
      excerpt: blogForm.excerpt,
      content: blogForm.content,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      author: blogForm.email ? blogForm.email.split('@')[0] : 'Contributor',
      imageUrl: coverPreview || '',
      submitterEmail: blogForm.email || user?.email || 'guest@curtaincall.com',
      curationStatus: 'Pending' as const,
    };

    setTimeout(() => {
      ClientDB.submitPendingArticle(newArticle);
      sendSubmissionEmail(newArticle.submitterEmail, `Chronicle Article: ${newArticle.title}`);
      setLoading(false);
      setIsSubmitted(true);
    }, 1000);
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-20 min-h-[80vh] flex items-center justify-center bg-zinc-950">
        <div className="w-full max-w-md bg-zinc-900 border border-white/5 rounded-3xl p-8 text-center shadow-2xl animate-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="font-serif font-bold text-white text-2xl mb-3">Submission Received</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            Thank you for helping us document and preserve African theatre culture. Your submission has been successfully routed to our curation queue. Administrators will review and publish it shortly!
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setIsSubmitted(false);
                setMakerForm({ name: '', dob: '', discipline: 'Actor', customDiscipline: '', bio: '', email: user?.email || '' });
                setPlayForm({
                  title: '',
                  playwright: '',
                  director: '',
                  synopsis: '',
                  venue: '',
                  year: '2026',
                  email: user?.email || '',
                  status: 'Coming Soon',
                  showDate: ''
                });
                setBlogForm({ title: '', category: 'Critique', excerpt: '', content: '', email: user?.email || '' });
                setHeadshotPreview(null);
                setPosterPreview(null);
                setCoverPreview(null);
                setGalleryPreviews([]);
              }}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors text-sm"
            >
              Submit Another Record
            </button>
            <Link
              href="/profile"
              className="w-full bg-zinc-800 text-zinc-300 font-bold py-3 rounded-xl hover:bg-zinc-700 transition-colors text-sm inline-block"
            >
              View Curation Status
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen bg-zinc-950">
      <div className="text-center max-w-xl mx-auto mb-10">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Submit to Curtain Call</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Help build a verified repository for African theatre. Submit theatrical details, register theatremakers, or upload article drafts for archival cataloging.
        </p>

        {/* Tab Controls */}
        <div className="flex bg-zinc-900 border border-white/5 rounded-2xl p-1 mt-8 max-w-lg mx-auto">
          <button
            onClick={() => setActiveTab('maker')}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'maker' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="h-3.5 w-3.5 shrink-0" /> Add Profile
          </button>
          <button
            onClick={() => setActiveTab('play')}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'play' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Drama className="h-3.5 w-3.5 shrink-0" /> Add Play
          </button>
          <button
            onClick={() => setActiveTab('blog')}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'blog' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 shrink-0" /> Submit Article
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
          
          {/* THEATREMAKER REGISTRATION */}
          {activeTab === 'maker' && (
            <form onSubmit={handleMakerSubmit} className="flex flex-col gap-6 animate-fade-up">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-red-500" />
                <h3 className="font-serif font-bold text-white text-lg">Join as a Theatremaker</h3>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed -mt-3 mb-2">
                Register yourself or another prominent artist in the official African Stageography directory.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Professional Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Temi Otedola"
                    value={makerForm.name}
                    onChange={e => setMakerForm({ ...makerForm, name: e.target.value })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-zinc-500" /> Date of Birth
                  </label>
                  <input
                    type="date"
                    required
                    value={makerForm.dob}
                    onChange={e => setMakerForm({ ...makerForm, dob: e.target.value })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Primary Discipline</label>
                  <select
                    value={makerForm.discipline}
                    onChange={e => setMakerForm({ ...makerForm, discipline: e.target.value })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  >
                    <option value="Actor">Actor</option>
                    <option value="Director">Director</option>
                    <option value="Playwright">Playwright</option>
                    <option value="Producer">Producer</option>
                    <option value="Stage Designer">Stage Designer</option>
                    <option value="Other">Other Discipline...</option>
                  </select>
                </div>
                {makerForm.discipline === 'Other' && (
                  <div className="flex flex-col gap-1.5 animate-fade-up">
                    <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Specify Discipline</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stage Manager"
                      value={makerForm.customDiscipline}
                      onChange={e => setMakerForm({ ...makerForm, customDiscipline: e.target.value })}
                      className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Artist Biography</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Summarize their training, highlight performances, or directorial highlights..."
                  value={makerForm.bio}
                  onChange={e => setMakerForm({ ...makerForm, bio: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-zinc-600 resize-none [scrollbar-width:none]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Profile Picture / Headshot</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={headshotInputRef}
                  onChange={handleHeadshotChange}
                  className="hidden"
                />
                
                {headshotPreview ? (
                  <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-white/10 shadow-lg group bg-zinc-950">
                    <Image
                      src={headshotPreview}
                      alt="Headshot Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setHeadshotPreview(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-black text-white hover:text-red-400 rounded-lg transition-all border border-white/10"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => headshotInputRef.current?.click()}
                    className="border border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-red-500/50 cursor-pointer transition-colors bg-zinc-950/50 flex flex-col items-center justify-center gap-2"
                  >
                    <Upload className="h-6 w-6 text-zinc-500" />
                    <span className="text-xs text-zinc-400">Upload portrait photo</span>
                    <span className="text-[10px] text-zinc-600 font-mono">Re-compressed on-the-fly to save space</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Submitter Email</label>
                <input
                  type="email"
                  required
                  placeholder="producer@example.com"
                  value={makerForm.email}
                  onChange={e => setMakerForm({ ...makerForm, email: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-900/20 text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Registering theatremaker...' : 'Submit Profile for Verification'}
              </button>
            </form>
          )}

          {/* DOCUMENT A PLAY */}
          {activeTab === 'play' && (
            <form onSubmit={handlePlaySubmit} className="flex flex-col gap-6 animate-fade-up">
              <div className="flex items-center gap-2 mb-2">
                <Drama className="h-5 w-5 text-red-500" />
                <h3 className="font-serif font-bold text-white text-lg">Document a Stage Production</h3>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed -mt-3 mb-2">
                List a play for archiving, enabling users and critics to write verified critiques and buy tickets.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Play Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Saro The Musical"
                    value={playForm.title}
                    onChange={e => setPlayForm({ ...playForm, title: e.target.value })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Playwright</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wole Soyinka"
                    value={playForm.playwright}
                    onChange={e => setPlayForm({ ...playForm, playwright: e.target.value })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Director</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bolanle Austen-Peters"
                    value={playForm.director}
                    onChange={e => setPlayForm({ ...playForm, director: e.target.value })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Venue Staged</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Terra Kulture, Lagos"
                    value={playForm.venue}
                    onChange={e => setPlayForm({ ...playForm, venue: e.target.value })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Synopsis / About</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide a detailed overview of the story, acts, and thematic conflicts..."
                  value={playForm.synopsis}
                  onChange={e => setPlayForm({ ...playForm, synopsis: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-zinc-600 resize-none [scrollbar-width:none]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Year Staged</label>
                  <input
                    type="number"
                    required
                    placeholder="2026"
                    value={playForm.year}
                    onChange={e => setPlayForm({ ...playForm, year: e.target.value })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Status</label>
                  <select
                    value={playForm.status}
                    onChange={e => setPlayForm({ ...playForm, status: e.target.value as any })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  >
                    <option value="Coming Soon">Coming Soon</option>
                    <option value="Currently Showing">Currently Showing</option>
                    <option value="Past Production">Past Production</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  {playForm.status === 'Coming Soon' ? 'Upcoming Premiere / Show Date' : playForm.status === 'Past Production' ? 'Show Date (When did the play happen?)' : 'Show Date'}
                </label>
                <input
                  type="date"
                  value={playForm.showDate}
                  onChange={e => setPlayForm({ ...playForm, showDate: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors [color-scheme:dark]"
                />
              </div>

              {/* Poster Upload Dropzone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Play Poster / Cover Image</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={posterInputRef}
                  onChange={handlePosterChange}
                  className="hidden"
                />
                
                {posterPreview ? (
                  <div className="relative w-36 aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-lg group bg-zinc-950">
                    <Image
                      src={posterPreview}
                      alt="Poster Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPosterPreview(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-black text-white hover:text-red-400 rounded-lg transition-all border border-white/10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => posterInputRef.current?.click()}
                    className="border border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-red-500/50 cursor-pointer transition-colors bg-zinc-950/50 flex flex-col items-center justify-center gap-2"
                  >
                    <Upload className="h-6 w-6 text-zinc-500" />
                    <span className="text-xs text-zinc-400">Drag & drop poster art or stage playbills</span>
                    <span className="text-[10px] text-zinc-600 font-mono">Re-compressed on-the-fly to save storage space</span>
                  </div>
                )}
              </div>

              {/* Multiple Gallery Photos Upload */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Production Gallery Photos</span>
                  <span className="text-[10px] text-zinc-500 font-mono lowercase">Multiple selection supported</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={galleryInputRef}
                  onChange={handleGalleryChange}
                  className="hidden"
                />

                <div
                  onClick={() => galleryInputRef.current?.click()}
                  className="border border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-red-500/50 cursor-pointer transition-colors bg-zinc-950/50 flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="h-6 w-6 text-zinc-500" />
                  <span className="text-xs text-zinc-400">Upload multiple stage production/cast snapshots</span>
                  <span className="text-[10px] text-zinc-600 font-mono">Will populate the dynamic play gallery automatically</span>
                </div>

                {galleryPreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3 animate-fade-up">
                    {galleryPreviews.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group bg-zinc-950">
                        <Image
                          src={img}
                          alt={`Gallery Preview ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setGalleryPreviews(galleryPreviews.filter((_, i) => i !== idx))}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/80 hover:bg-black text-white hover:text-red-400 rounded-md transition-all border border-white/5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Playbill Cast & Crew Builder */}
              <div className="flex flex-col gap-3 bg-zinc-950/40 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Dynamic Playbill Cast & Crew</label>
                  <span className="text-[9px] font-mono uppercase bg-zinc-900 border border-white/5 text-zinc-400 px-2 py-0.5 rounded">
                    {castMembers.length} Credits Added
                  </span>
                </div>

                {/* Added members preview */}
                {castMembers.length > 0 && (
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent] mb-2 animate-fade-up">
                    {castMembers.map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-zinc-950/80 border border-white/5 px-3 py-2 rounded-xl text-xs">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-zinc-500 uppercase tracking-widest">{member.category} — {member.role}</span>
                          <span className="text-white font-medium mt-0.5">{member.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCastMembers(castMembers.filter((_, i) => i !== idx))}
                          className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form to add single member */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1 relative">
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold">Member Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Joke Silva"
                      value={newMemberName}
                      onChange={e => {
                        const val = e.target.value;
                        setNewMemberName(val);
                        const match = ClientDB.getArtists().find(a => a.name.toLowerCase() === val.trim().toLowerCase());
                        if (match && match.roleType) {
                          setNewMemberRole(match.roleType);
                          const roleLow = match.roleType.toLowerCase();
                          if (roleLow.includes('director') || roleLow.includes('playwright') || roleLow.includes('producer') || roleLow.includes('designer')) {
                            setNewMemberCategory('Creative');
                          } else if (roleLow.includes('manager') || roleLow.includes('crew') || roleLow.includes('technical') || roleLow.includes('engineer')) {
                            setNewMemberCategory('Technical');
                          } else {
                            setNewMemberCategory('Cast');
                          }
                        }
                      }}
                      className="bg-zinc-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                    {(() => {
                      const allArtists = ClientDB.getArtists();
                      const matchingSuggestions = newMemberName.trim()
                        ? allArtists.filter(a => 
                            a.name.toLowerCase().includes(newMemberName.toLowerCase()) &&
                            a.name.toLowerCase() !== newMemberName.toLowerCase()
                          )
                        : [];
                      
                      if (matchingSuggestions.length === 0) return null;

                      return (
                        <div className="absolute top-[100%] left-0 w-full bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-20 mt-1 max-h-36 overflow-y-auto [scrollbar-width:none]">
                          {matchingSuggestions.map(artist => (
                            <div
                              key={artist.id}
                              onClick={() => {
                                setNewMemberName(artist.name);
                                if (artist.roleType) {
                                  setNewMemberRole(artist.roleType);
                                  const roleLow = artist.roleType.toLowerCase();
                                  if (roleLow.includes('director') || roleLow.includes('playwright') || roleLow.includes('producer') || roleLow.includes('designer')) {
                                    setNewMemberCategory('Creative');
                                  } else if (roleLow.includes('manager') || roleLow.includes('crew') || roleLow.includes('technical') || roleLow.includes('engineer')) {
                                    setNewMemberCategory('Technical');
                                  } else {
                                    setNewMemberCategory('Cast');
                                  }
                                }
                              }}
                              className="px-3 py-2 text-xs hover:bg-red-600 hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-0 flex items-center justify-between text-left"
                            >
                              <span className="font-medium text-white">{artist.name}</span>
                              <span className="text-[9px] text-zinc-400">{artist.roleType}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold">Billing Role</label>
                    <input
                      type="text"
                      placeholder="e.g. Lead Actress"
                      value={newMemberRole}
                      onChange={e => setNewMemberRole(e.target.value)}
                      className="bg-zinc-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold">Billing Group</label>
                    <div className="flex gap-2">
                      <select
                        value={newMemberCategory}
                        onChange={e => setNewMemberCategory(e.target.value as any)}
                        className="flex-1 bg-zinc-950 border border-white/5 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                      >
                        <option value="Cast">Cast (Actor)</option>
                        <option value="Creative">Creative (Director/Writer)</option>
                        <option value="Technical">Technical (Crew)</option>
                      </select>
                      <button
                        type="button"
                        onClick={addCastMember}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 rounded-lg transition-colors text-xs shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Submitter Email</label>
                <input
                  type="email"
                  required
                  placeholder="producer@example.com"
                  value={playForm.email}
                  onChange={e => setPlayForm({ ...playForm, email: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-900/20 text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Processing playbill specs...' : 'Submit Play details for Review'}
              </button>
            </form>
          )}

          {/* SUBMIT A BLOG / CHRONICLE */}
          {activeTab === 'blog' && (
            <form onSubmit={handleBlogSubmit} className="flex flex-col gap-6 animate-fade-up">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-red-500" />
                <h3 className="font-serif font-bold text-white text-lg">Submit a Blog / Chronicle</h3>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed -mt-3 mb-2">
                Submit an in-depth interview, theatrical review, or chronicle for our Editorial section.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Article Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Behind the Scenes of MUSON Centre's New Stageplay"
                  value={blogForm.title}
                  onChange={e => setBlogForm({ ...blogForm, title: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Category</label>
                <select
                  value={blogForm.category}
                  onChange={e => setBlogForm({ ...blogForm, category: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="Critique">Critique / Review</option>
                  <option value="Interview">Interview</option>
                  <option value="Chronicle">Chronicle / Essay</option>
                  <option value="History">Historical Archive</option>
                  <option value="Spotlight">Spotlight</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Summary / Excerpt</label>
                <input
                  type="text"
                  required
                  placeholder="A one-sentence engaging hook for discovery cards..."
                  value={blogForm.excerpt}
                  onChange={e => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Article Content / Draft</label>
                <textarea
                  required
                  rows={8}
                  placeholder="Write your editorial piece here... Markdown or plain text drafts are accepted."
                  value={blogForm.content}
                  onChange={e => setBlogForm({ ...blogForm, content: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-zinc-600 resize-none [scrollbar-width:none]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Cover Image / Banner</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={coverInputRef}
                  onChange={handleCoverChange}
                  className="hidden"
                />
                
                {coverPreview ? (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-lg group bg-zinc-950">
                    <Image
                      src={coverPreview}
                      alt="Cover Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setCoverPreview(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-black text-white hover:text-red-400 rounded-lg transition-all border border-white/10"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="border border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-red-500/50 cursor-pointer transition-colors bg-zinc-950/50 flex flex-col items-center justify-center gap-2"
                  >
                    <Upload className="h-6 w-6 text-zinc-500" />
                    <span className="text-xs text-zinc-400">Upload cover photo / theatrical snap</span>
                    <span className="text-[10px] text-zinc-600 font-mono">Re-compressed on-the-fly to save space</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Submitter Email</label>
                <input
                  type="email"
                  required
                  placeholder="writer@example.com"
                  value={blogForm.email}
                  onChange={e => setBlogForm({ ...blogForm, email: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-900/20 text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Submitting draft specs...' : 'Submit Draft for Editorial Review'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
