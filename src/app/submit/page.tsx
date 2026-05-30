'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { ClientDB } from '@/lib/db';
import { Upload, CheckCircle2, User, Drama, Sparkles, BookOpen, Plus, X, Calendar, Image as ImageIcon, FileText, ArrowLeft, Mail, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import RichTextEditor from '@/components/RichTextEditor';

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
  }, [user, router]);



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

  useEffect(() => {
    if (isSubmitted && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [isSubmitted]);

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

  // Stageography submission states
  const [scenography, setScenography] = useState<{ productionId: string; productionTitle: string; role: string }[]>([]);
  const [stageSearchQ, setStageSearchQ] = useState('');
  const [stageRole, setStageRole] = useState('');
  const [stageSelected, setStageSelected] = useState<{ id: string; title: string } | null>(null);

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
    showDate: '',
    showTime: '',
    runtime: '120 mins',
    productionType: 'Professional' as 'Student' | 'Professional',
    externalTicketUrl: ''
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
    author: user?.name || '',
  });
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [blogLimitMessage, setBlogLimitMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      setMakerForm(prev => ({ ...prev, email: prev.email || user.email }));
      setPlayForm(prev => ({ ...prev, email: prev.email || user.email }));
      setBlogForm(prev => ({ ...prev, email: prev.email || user.email, author: prev.author || user.name || '' }));
    }
  }, [user]);

  // Check article limits
  useEffect(() => {
    if (activeTab === 'blog') {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const allArticles = [...ClientDB.getArticles(), ...ClientDB.getPendingArticles()];
      
      const articlesThisMonth = allArticles.filter(a => {
        const date = new Date(a.date || Date.now());
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });

      const globalCount = articlesThisMonth.length;
      const userCount = articlesThisMonth.filter(a => a.submitterEmail === user?.email).length;

      if (globalCount >= 10) {
        setBlogLimitMessage("We have reached our platform submission limit of 10 articles for this month. Please try again next month.");
      } else if (userCount >= 3) {
        setBlogLimitMessage("You have reached your personal submission limit of 3 articles for this month. Please try again next month.");
      } else {
        setBlogLimitMessage(null);
      }
    }
  }, [activeTab, user]);

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
      dateOfBirth: makerForm.dob || undefined,
      scenography: scenography || [],
      submitterEmail: makerForm.email || user?.email || 'guest@curtaincall.com',
      curationStatus: 'Pending' as const,
      createdAt: new Date().toISOString(),
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

    const playSlug = playForm.title
      ? playForm.title.toLowerCase().replace(/[^a-z0-9_ ]/g, '').trim().replace(/\s+/g, '-')
      : undefined;

    const newPlay = {
      id: `pending_play_${Date.now()}`,
      title: playForm.title,
      slug: playSlug,
      createdAt: new Date().toISOString(),
      synopsis: playForm.synopsis,
      genre: 'Drama',
      runtime: playForm.runtime || '120 mins',
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
      showTime: playForm.showTime || undefined,
      castAndCrew: castMembers.length > 0 ? castMembers : undefined,
      productionType: playForm.productionType,
      externalTicketUrl: playForm.externalTicketUrl || undefined
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
      id: `${blogForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${Date.now().toString().slice(-4)}`,
      title: blogForm.title,
      excerpt: blogForm.excerpt,
      content: blogForm.content,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      author: blogForm.author || (blogForm.email ? blogForm.email.split('@')[0] : 'Contributor'),
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
                  showDate: '',
                  showTime: '',
                  runtime: '120 mins',
                  productionType: 'Professional',
                  externalTicketUrl: ''
                });
                setBlogForm({ title: '', category: 'Critique', excerpt: '', content: '', email: user?.email || '', author: user?.name || '' });
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
    <div className="container mx-auto px-4 py-16 min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Sleek Spotlight Glow Dots */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-red-900/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-red-950/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="text-center max-w-xl mx-auto mb-12 relative z-10">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight leading-tight">Submit to Curtain Call</h1>
        <p className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-lg mx-auto">
          Help build a verified repository for African theatre. Submit theatrical details, register theatremakers, or upload article drafts for archival cataloging.
        </p>

        {/* Tab Controls */}
        <div className="flex bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-1 mt-8 max-w-lg mx-auto shadow-2xl relative">
          <button
            onClick={() => setActiveTab('maker')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'maker' ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg shadow-red-900/20' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <User className="h-3.5 w-3.5 shrink-0" /> Add Profile
          </button>
          <button
            onClick={() => setActiveTab('play')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'play' ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg shadow-red-900/20' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Drama className="h-3.5 w-3.5 shrink-0" /> Add Play
          </button>
          <button
            onClick={() => setActiveTab('blog')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'blog' ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg shadow-red-900/20' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 shrink-0" /> Submit Article
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 md:p-10 shadow-2xl">
          
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

              {/* ── STAGEOGRAPHY BUILDER ── */}
              <div className="flex flex-col gap-3 pt-3 border-t border-white/5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1 h-3.5 bg-red-600 rounded-full inline-block" />
                  Stageography (Optional)
                </label>
                <p className="text-[11px] text-zinc-500 leading-relaxed -mt-1.5">
                  Search for works this artist has done on our platform.
                </p>

                {/* Helpful Tip Box */}
                <div className="bg-zinc-950 border border-white/5 rounded-2xl p-4 flex gap-3 items-start">
                  <Sparkles className="h-4 w-4 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    <span className="font-bold text-white">Tip:</span> Can't find the play in the search below? You can submit the play first on our platform so you can select it here!
                  </p>
                </div>

                {/* Added credits list */}
                {scenography.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {scenography.map((credit, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-zinc-950 border border-white/5 rounded-xl px-3 py-2.5 gap-2 animate-fade-up">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{credit.productionTitle}</p>
                          <span className="text-[9px] bg-red-600/20 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider inline-block mt-1 font-sans">{credit.role}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setScenography(scenography.filter((_, i) => i !== idx));
                          }}
                          className="text-zinc-500 hover:text-red-400 transition-colors p-1.5 shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search & Add Interface */}
                <div className="flex flex-col gap-2 bg-zinc-950/40 border border-white/5 rounded-2xl p-4">
                  {!stageSelected ? (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search plays on Curtain Call..."
                        value={stageSearchQ}
                        onChange={e => setStageSearchQ(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 placeholder:text-zinc-600 transition-all"
                      />
                      {stageSearchQ.trim().length > 0 && (
                        (() => {
                          const allProds = ClientDB.getProductions().filter(p => p.curationStatus === 'Approved' || !p.curationStatus);
                          const filteredProds = allProds.filter(p => p.title.toLowerCase().includes(stageSearchQ.toLowerCase())).slice(0, 5);
                          return (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden z-20 shadow-2xl animate-fade-up">
                              {filteredProds.length > 0 ? (
                                filteredProds.map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setStageSelected({ id: p.id, title: p.title });
                                      setStageSearchQ('');
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors border-b border-white/5 last:border-0 flex items-center justify-between"
                                  >
                                    <span className="font-bold truncate">{p.title}</span>
                                    <span className="text-[9px] text-zinc-500 shrink-0 font-mono uppercase bg-zinc-950/50 px-1.5 py-0.5 rounded border border-white/5">{p.genre}</span>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-xs text-zinc-500 font-mono">
                                  No approved plays found matching &quot;{stageSearchQ}&quot;
                                </div>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between bg-zinc-950 border border-red-500/20 rounded-xl px-3 py-2">
                        <p className="text-xs font-bold text-white truncate flex-1">{stageSelected.title}</p>
                        <button
                          type="button"
                          onClick={() => setStageSelected(null)}
                          className="text-zinc-500 hover:text-white ml-2 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="What was their role? (e.g. Lead Actor, Director)"
                          value={stageRole}
                          onChange={e => setStageRole(e.target.value)}
                          className="flex-1 bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 placeholder:text-zinc-600 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!stageSelected || !stageRole.trim()) return;
                            const isDuplicate = scenography.some(c => c.productionId === stageSelected.id);
                            if (!isDuplicate) {
                              setScenography([...scenography, {
                                productionId: stageSelected.id,
                                productionTitle: stageSelected.title,
                                role: stageRole.trim()
                              }]);
                            }
                            setStageRole('');
                            setStageSelected(null);
                          }}
                          disabled={!stageRole.trim()}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1 shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Playwright</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wole Soyinka"
                    value={playForm.playwright}
                    onChange={e => setPlayForm({ ...playForm, playwright: e.target.value })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                  {(() => {
                    const allArtists = ClientDB.getArtists();
                    const matchingSuggestions = playForm.playwright.trim()
                      ? allArtists.filter(a => 
                          a.name.toLowerCase().includes(playForm.playwright.toLowerCase()) &&
                          a.name.toLowerCase() !== playForm.playwright.toLowerCase()
                        )
                      : [];
                    
                    if (matchingSuggestions.length === 0) return null;

                    return (
                      <div className="absolute top-[100%] left-0 w-full bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-20 mt-1 max-h-36 overflow-y-auto [scrollbar-width:none]">
                        {matchingSuggestions.map(artist => (
                          <div
                            key={artist.id}
                            onClick={() => setPlayForm({ ...playForm, playwright: artist.name })}
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Director</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bolanle Austen-Peters"
                    value={playForm.director}
                    onChange={e => setPlayForm({ ...playForm, director: e.target.value })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                  {(() => {
                    const allArtists = ClientDB.getArtists();
                    const matchingSuggestions = playForm.director.trim()
                      ? allArtists.filter(a => 
                          a.name.toLowerCase().includes(playForm.director.toLowerCase()) &&
                          a.name.toLowerCase() !== playForm.director.toLowerCase()
                        )
                      : [];
                    
                    if (matchingSuggestions.length === 0) return null;

                    return (
                      <div className="absolute top-[100%] left-0 w-full bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-20 mt-1 max-h-36 overflow-y-auto [scrollbar-width:none]">
                        {matchingSuggestions.map(artist => (
                          <div
                            key={artist.id}
                            onClick={() => setPlayForm({ ...playForm, director: artist.name })}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Production Type</label>
                  <select
                    value={playForm.productionType}
                    onChange={e => setPlayForm({ ...playForm, productionType: e.target.value as any })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  >
                    <option value="Professional">Professional Production</option>
                    <option value="Student">Student Production</option>
                  </select>
                </div>
              </div>

              {(playForm.status === 'Coming Soon' || playForm.status === 'Currently Showing') && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span>External Ticket Link</span>
                    <span className="text-[9px] bg-zinc-800 text-zinc-500 border border-white/5 px-1.5 py-0.5 rounded font-mono">Optional</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://paystack.com/buy/your-show-tickets"
                    value={playForm.externalTicketUrl}
                    onChange={e => setPlayForm({ ...playForm, externalTicketUrl: e.target.value })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-zinc-600"
                  />
                  <p className="text-[10px] text-zinc-600 leading-relaxed">
                    If you sell tickets on a third-party platform (Paystack, Eventbrite, etc.), paste the link here. A &quot;Get Tickets&quot; button will appear on your production page. This link disappears automatically once the show date has passed.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                    {playForm.status === 'Coming Soon' ? 'Upcoming Date' : playForm.status === 'Past Production' ? 'When did it happen?' : 'Show Date'}
                  </label>
                  <input
                    type="date"
                    value={playForm.showDate}
                    onChange={e => setPlayForm({ ...playForm, showDate: e.target.value })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors [color-scheme:dark]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Show Time</label>
                  <input
                    type="time"
                    value={playForm.showTime || ''}
                    onChange={e => setPlayForm({ ...playForm, showTime: e.target.value })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors [color-scheme:dark]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Play Length / Runtime</label>
                  <input
                    type="text"
                    placeholder="e.g. 120 mins"
                    value={playForm.runtime}
                    onChange={e => setPlayForm({ ...playForm, runtime: e.target.value })}
                    className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
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

              {/* Dynamic Cast & Crew Credits Builder */}
              <div className="flex flex-col gap-3 bg-zinc-950/40 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Cast & Crew Credits</label>
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
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold">Artist's Name</label>
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
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold">Role / Character Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sidi / Lead Actress"
                      value={newMemberRole}
                      onChange={e => setNewMemberRole(e.target.value)}
                      className="bg-zinc-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold">Group</label>
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
            <div className="flex flex-col gap-6 animate-fade-up">
              {blogLimitMessage ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center shadow-inner flex flex-col items-center justify-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif font-bold text-white text-xl">Submissions Closed for Now</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">{blogLimitMessage}</p>
                </div>
              ) : (
                <form onSubmit={handleBlogSubmit} className="flex flex-col gap-6">
                  <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-red-500" />
                <h3 className="font-serif font-bold text-white text-lg">Submit a Blog / Chronicle</h3>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed -mt-3 mb-1">
                Submit an in-depth interview, theatrical review, or chronicle for our Editorial section.
              </p>

              {/* Editorial Rewards Banner */}
              <div className="bg-zinc-950/60 border border-red-500/20 rounded-2xl p-5 shadow-inner backdrop-blur-md relative overflow-hidden flex flex-col gap-3">
                <div className="absolute top-0 right-0 bg-red-500/10 text-red-400 font-mono text-[9px] uppercase tracking-wider font-bold px-3 py-1 rounded-bl-xl border-l border-b border-red-500/10">
                  Creator Incentive Program
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-red-500/10 rounded-xl text-red-500 shrink-0 mt-0.5">
                    <span className="font-serif text-lg font-bold">₦</span>
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-bold font-serif mb-1">Earn ₦2,000 Per Approved Article</h4>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      We value premium theatrical journalism. Submitting your chronicle draft has clear benefits:
                    </p>
                  </div>
                </div>
                <ul className="text-xs text-zinc-500 space-y-2 border-t border-white/5 pt-3 pl-2 mt-1">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                    <span><strong>₦2,000 Cash:</strong> Credited straight to your Creator Hub wallet on approval.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                    <span><strong>Instant Dispatch:</strong> Get notified instantly via email to review your funds and withdraw.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                    <span><strong>Interactive Curation:</strong> If rejected, you'll receive detailed notes so you can edit and resubmit!</span>
                  </li>
                </ul>
              </div>

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
                <RichTextEditor
                  value={blogForm.content}
                  onChange={content => setBlogForm({ ...blogForm, content })}
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
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Author / Submitter Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={blogForm.author}
                  onChange={e => setBlogForm({ ...blogForm, author: e.target.value })}
                  className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
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
          )}

        </div>
      </div>
    </div>
  );
}
