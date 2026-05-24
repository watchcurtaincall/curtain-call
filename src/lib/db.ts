'use client';

import { MOCK_ARTISTS, MOCK_PRODUCTIONS, MOCK_REVIEWS } from './mock';
import { Artist, Production, Article } from './types';
import { createClient } from '@supabase/supabase-js';

const ARTISTS_KEY = 'curtain_call_artists';
const PRODUCTIONS_KEY = 'curtain_call_productions';
const ARTICLES_KEY = 'curtain_call_articles';
const PENDING_ARTISTS_KEY = 'curtain_pending_artists';
const PENDING_PLAYS_KEY = 'curtain_pending_plays';
const PENDING_ARTICLES_KEY = 'curtain_pending_articles';
const DECLINED_SUBMISSIONS_KEY = 'curtain_declined_submissions';
const PENDING_CRITICS_KEY = 'curtain_pending_critics';
const REVIEWS_KEY = 'curtain_call_reviews';

// ── SUPABASE CLIENT CONFIGURATION & fallback ──
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Initial Mock Articles fallback
const MOCK_ARTICLES: Article[] = [
  {
    id: 'art1',
    title: 'The Renaissance of Nigerian Historical Epics on Stage',
    excerpt: 'How directors like William Benson and Bolanle Austen-Peters are redefining how we consume pre-colonial African history.',
    date: 'May 18, 2026',
    author: 'Curtain Call Editorial',
    imageUrl: '/images/kings_horseman_poster.png'
  },
  {
    id: 'art2',
    title: 'Interview: Joshua Alabi on Directing WATERSIDE',
    excerpt: 'The award-winning director breaks down the intense emotional process of staging the critically acclaimed two-hander.',
    date: 'May 12, 2026',
    author: 'Curtain Call Editorial',
    imageUrl: '/images/kurunmi_poster.png'
  },
  {
    id: 'art3',
    title: '5 Upcoming Premieres You Cannot Miss This Summer',
    excerpt: 'From satirical comedies to full-scale musicals, here is your definitive guide to the Lagos theatre season.',
    date: 'May 05, 2026',
    author: 'Curtain Call Editorial',
    imageUrl: '/images/baba_segi_poster.png'
  }
];

// ── DATABASE TRANSLATION MAPPERS (camelCase to snake_case) ──

const mapProductionToDb = (p: any) => ({
  id: p.id,
  title: p.title,
  synopsis: p.synopsis,
  genre: p.genre,
  runtime: p.runtime || '120 mins',
  venue: p.venue,
  status: p.status,
  poster_url: p.posterUrl,
  critic_score: p.criticScore,
  audience_score: p.audienceScore,
  total_reviews: p.totalReviews,
  gallery_images: p.galleryImages || [],
  submitter_email: p.submitterEmail || null,
  curation_status: p.curationStatus || 'Approved',
  cast_and_crew: p.castAndCrew || [],
  show_date: p.showDate || null,
  decline_reason: p.declineReason || null
});

const mapProductionFromDb = (row: any) => ({
  id: row.id,
  title: row.title,
  synopsis: row.synopsis,
  genre: row.genre,
  runtime: row.runtime,
  venue: row.venue,
  status: row.status,
  posterUrl: row.poster_url,
  criticScore: row.critic_score,
  audienceScore: row.audience_score ? parseFloat(row.audience_score) : null,
  totalReviews: row.total_reviews,
  galleryImages: row.gallery_images || [],
  submitterEmail: row.submitter_email,
  curationStatus: row.curation_status,
  castAndCrew: row.cast_and_crew || [],
  showDate: row.show_date,
  declineReason: row.decline_reason || null
});

const mapArtistToDb = (a: any) => ({
  id: a.id,
  name: a.name,
  role_type: a.roleType,
  headshot_url: a.headshotUrl,
  bio: a.bio || '',
  date_of_birth: a.dateOfBirth || null,
  social_links: a.socialLinks || {},
  submitter_email: a.submitterEmail || null,
  curation_status: a.curationStatus || 'Approved',
  is_deceased: a.isDeceased || false,
  date_of_death: a.dateOfDeath || null,
  decline_reason: a.declineReason || null
});

const mapArtistFromDb = (row: any) => ({
  id: row.id,
  name: row.name,
  roleType: row.role_type,
  headshotUrl: row.headshot_url,
  bio: row.bio,
  dateOfBirth: row.date_of_birth,
  socialLinks: row.social_links || {},
  submitterEmail: row.submitter_email,
  curationStatus: row.curation_status,
  isDeceased: row.is_deceased,
  dateOfDeath: row.date_of_death,
  declineReason: row.decline_reason || null
});

const mapArticleToDb = (art: any) => ({
  id: art.id,
  title: art.title,
  excerpt: art.excerpt,
  date: art.date,
  author: art.author,
  image_url: art.imageUrl,
  content: art.content || '',
  submitter_email: art.submitterEmail || null,
  curation_status: art.curationStatus || 'Approved',
  decline_reason: art.declineReason || null
});

const mapArticleFromDb = (row: any) => ({
  id: row.id,
  title: row.title,
  excerpt: row.excerpt,
  date: row.date,
  author: row.author,
  imageUrl: row.image_url,
  content: row.content,
  submitterEmail: row.submitter_email,
  curationStatus: row.curation_status,
  declineReason: row.decline_reason || null
});

const mapCriticAppToDb = (c: any) => ({
  id: c.id,
  name: c.name,
  email: c.email,
  publication: c.publication || '',
  link1: c.link1 || '',
  link2: c.link2 || '',
  file_name: c.fileName || '',
  curation_status: c.curationStatus || 'Pending',
  timestamp: c.timestamp || new Date().toLocaleDateString()
});

const mapCriticAppFromDb = (row: any) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  publication: row.publication,
  link1: row.link1,
  link2: row.link2,
  fileName: row.file_name,
  curationStatus: row.curation_status,
  timestamp: row.timestamp
});

const mapReviewToDb = (r: any) => ({
  id: r.id,
  production_id: r.productionId,
  author: r.author,
  rating: r.rating,
  content: r.content,
  type: r.type,
  headline: r.headline || '',
  date: r.date || 'Recently'
});

const mapReviewFromDb = (row: any) => ({
  id: row.id,
  productionId: row.production_id,
  author: row.author,
  rating: row.rating,
  content: row.content,
  type: row.type,
  headline: row.headline,
  date: row.date
});

// ── BACKGROUND CLOUD REPLICATION ENGINE ──

const syncToCloud = async (table: string, dbItem: any) => {
  if (!supabase) return;
  try {
    const { error } = await supabase.from(table).upsert(dbItem);
    if (error) console.error(`[Supabase Sync] Upsert failed for table ${table}:`, error);
  } catch (err) {
    console.error(`[Supabase Sync] Server error on ${table}:`, err);
  }
};

const deleteFromCloud = async (table: string, id: string) => {
  if (!supabase) return;
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) console.error(`[Supabase Sync] Delete failed for table ${table}:`, error);
  } catch (err) {
    console.error(`[Supabase Sync] Delete server error on ${table}:`, err);
  }
};

// ── HYBRID DATABASE MANAGER LAYER ──

export function calculateDynamicStatus(showDateStr?: string, initialStatus?: string): 'Currently Showing' | 'Coming Soon' | 'Past Production' | 'Recently Concluded' {
  if (!showDateStr) {
    return (initialStatus as any) || 'Currently Showing';
  }
  
  const showDate = new Date(showDateStr);
  showDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (showDate > today) {
    return 'Coming Soon';
  } else if (showDate.getTime() === today.getTime()) {
    return 'Currently Showing';
  } else {
    const diffTime = today.getTime() - showDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 10) {
      return 'Recently Concluded';
    } else {
      return 'Past Production';
    }
  }
}

export const ClientDB = {
  // ── EMAIL TRANSACTIONAL NOTIFICATION UTILITY ──
  async sendEmail(to: string, subject: string, html: string): Promise<any> {
    if (typeof window === 'undefined') return { success: true };
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html }),
      });
      const data = await response.json();
      
      const logs = JSON.parse(localStorage.getItem('cc_email_logs') || '[]');
      const newLog = {
        id: data.data?.id || `email_log_${Date.now()}`,
        to,
        subject,
        html,
        timestamp: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString(),
        simulated: data.simulated || false
      };
      localStorage.setItem('cc_email_logs', JSON.stringify([newLog, ...logs].slice(0, 100)));
      
      return data;
    } catch (error) {
      console.error('[ClientDB.sendEmail Error]:', error);
      return { error };
    }
  },

  getEmailLogs() {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('cc_email_logs') || '[]');
  },

  clearEmailLogs() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('cc_email_logs');
  },

  // ── ARTISTS DATABASE ──
  getArtists(): Artist[] {
    if (typeof window === 'undefined') return MOCK_ARTISTS;
    const stored = localStorage.getItem(ARTISTS_KEY);
    if (!stored) {
      localStorage.setItem(ARTISTS_KEY, JSON.stringify(MOCK_ARTISTS));
      return MOCK_ARTISTS;
    }
    return JSON.parse(stored);
  },

  getArtistById(id: string): Artist | undefined {
    const artists = this.getArtists();
    return artists.find(a => a.id === id);
  },

  saveArtist(artist: Artist): void {
    if (typeof window === 'undefined') return;
    const artists = this.getArtists();
    const index = artists.findIndex(a => a.id === artist.id);
    let updated;
    if (index !== -1) {
      updated = [...artists];
      updated[index] = artist;
    } else {
      const nameExists = artists.some(a => a.name.toLowerCase() === artist.name.toLowerCase());
      if (nameExists) return;
      updated = [...artists, artist];
    }
    localStorage.setItem(ARTISTS_KEY, JSON.stringify(updated));

    // Sync in background to cloud
    syncToCloud('artists', mapArtistToDb(artist));
  },

  deleteArtist(id: string): void {
    if (typeof window === 'undefined') return;
    const artists = this.getArtists();
    const updated = artists.filter(a => a.id !== id);
    localStorage.setItem(ARTISTS_KEY, JSON.stringify(updated));

    // Sync delete
    deleteFromCloud('artists', id);
  },

  // ── PRODUCTIONS DATABASE ──
  getProductions(): Production[] {
    if (typeof window === 'undefined') return MOCK_PRODUCTIONS;
    const stored = localStorage.getItem(PRODUCTIONS_KEY);
    let list: Production[];
    if (!stored) {
      localStorage.setItem(PRODUCTIONS_KEY, JSON.stringify(MOCK_PRODUCTIONS));
      list = MOCK_PRODUCTIONS;
    } else {
      list = JSON.parse(stored);
    }
    return list.map((p: any) => {
      if (p.showDate) {
        p.status = calculateDynamicStatus(p.showDate, p.status);
      }
      return p;
    });
  },

  getProductionById(id: string): Production | undefined {
    const productions = this.getProductions();
    return productions.find(p => p.id === id);
  },

  saveProduction(production: Production): void {
    if (typeof window === 'undefined') return;
    const productions = this.getProductions();
    const index = productions.findIndex(p => p.id === production.id);
    let updated;
    if (index !== -1) {
      updated = [...productions];
      updated[index] = production;
    } else {
      const titleExists = productions.some(p => p.title.toLowerCase() === production.title.toLowerCase());
      if (titleExists) return;
      updated = [...productions, production];
    }
    localStorage.setItem(PRODUCTIONS_KEY, JSON.stringify(updated));

    // Sync to cloud
    syncToCloud('productions', mapProductionToDb(production));
  },

  deleteProduction(id: string): void {
    if (typeof window === 'undefined') return;
    const productions = this.getProductions();
    const updated = productions.filter(p => p.id !== id);
    localStorage.setItem(PRODUCTIONS_KEY, JSON.stringify(updated));

    // Sync delete
    deleteFromCloud('productions', id);
  },

  // ── EDITORIAL / BLOG DATABASE ──
  getArticles(): Article[] {
    if (typeof window === 'undefined') return MOCK_ARTICLES;
    const stored = localStorage.getItem(ARTICLES_KEY);
    if (!stored) {
      localStorage.setItem(ARTICLES_KEY, JSON.stringify(MOCK_ARTICLES));
      return MOCK_ARTICLES;
    }
    return JSON.parse(stored);
  },

  saveArticle(article: Article): void {
    if (typeof window === 'undefined') return;
    const articles = this.getArticles();
    const updated = [article, ...articles];
    localStorage.setItem(ARTICLES_KEY, JSON.stringify(updated));

    // Sync to cloud
    syncToCloud('articles', mapArticleToDb(article));
  },

  // ── CMS PENDING SUBMISSIONS QUEUE ──
  getPendingArtists(): Artist[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(PENDING_ARTISTS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  submitArtist(artist: Artist): void {
    if (typeof window === 'undefined') return;
    const pending = this.getPendingArtists();
    const submission = { ...artist, curationStatus: 'Pending' as const };
    const updated = [...pending, submission];
    localStorage.setItem(PENDING_ARTISTS_KEY, JSON.stringify(updated));

    // Sync to cloud
    syncToCloud('artists', mapArtistToDb(submission));
  },

  approveArtist(id: string): void {
    if (typeof window === 'undefined') return;
    const pending = this.getPendingArtists();
    const artist = pending.find(a => a.id === id);
    if (artist) {
      const approved = { ...artist, curationStatus: 'Approved' as const };
      this.saveArtist(approved);
      const filtered = pending.filter(a => a.id !== id);
      localStorage.setItem(PENDING_ARTISTS_KEY, JSON.stringify(filtered));
    }
  },

  rejectArtist(id: string, reason?: string): void {
    if (typeof window === 'undefined') return;
    const pending = this.getPendingArtists();
    const artist = pending.find(a => a.id === id);
    if (artist) {
      const declined = { 
        ...artist, 
        curationStatus: 'Declined' as const,
        declineReason: reason || 'Does not meet our current curatorial guidelines.'
      };
      this.saveDeclinedSubmission(declined);
      const filtered = pending.filter(a => a.id !== id);
      localStorage.setItem(PENDING_ARTISTS_KEY, JSON.stringify(filtered));

      // Sync status
      syncToCloud('artists', mapArtistToDb(declined));
    }
  },

  getPendingPlays(): Production[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(PENDING_PLAYS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  submitPlay(play: Production): void {
    if (typeof window === 'undefined') return;
    const pending = this.getPendingPlays();
    const submission = { ...play, curationStatus: 'Pending' as const };
    const updated = [...pending, submission];
    localStorage.setItem(PENDING_PLAYS_KEY, JSON.stringify(updated));

    // Sync
    syncToCloud('productions', mapProductionToDb(submission));
  },

  approvePlay(id: string): void {
    if (typeof window === 'undefined') return;
    const pending = this.getPendingPlays();
    const play = pending.find(p => p.id === id);
    if (play) {
      const approved = { ...play, curationStatus: 'Approved' as const };
      this.saveProduction(approved);
      const filtered = pending.filter(p => p.id !== id);
      localStorage.setItem(PENDING_PLAYS_KEY, JSON.stringify(filtered));
    }
  },

  rejectPlay(id: string, reason?: string): void {
    if (typeof window === 'undefined') return;
    const pending = this.getPendingPlays();
    const play = pending.find(p => p.id === id);
    if (play) {
      const declined = { 
        ...play, 
        curationStatus: 'Declined' as const,
        declineReason: reason || 'Does not meet our current curatorial guidelines.'
      };
      this.saveDeclinedSubmission(declined);
      const filtered = pending.filter(p => p.id !== id);
      localStorage.setItem(PENDING_PLAYS_KEY, JSON.stringify(filtered));

      // Sync status
      syncToCloud('productions', mapProductionToDb(declined));
    }
  },

  // ── PENDING ARTICLES / BLOGS ──
  getPendingArticles(): Article[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(PENDING_ARTICLES_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  submitPendingArticle(article: Article): void {
    if (typeof window === 'undefined') return;
    const pending = this.getPendingArticles();
    const submission = { ...article, curationStatus: 'Pending' as const };
    const updated = [...pending, submission];
    localStorage.setItem(PENDING_ARTICLES_KEY, JSON.stringify(updated));

    // Sync
    syncToCloud('articles', mapArticleToDb(submission));
  },

  approveArticle(id: string): void {
    if (typeof window === 'undefined') return;
    const pending = this.getPendingArticles();
    const article = pending.find(a => a.id === id);
    if (article) {
      const approved = { ...article, curationStatus: 'Approved' as const };
      this.saveArticle(approved);
      const filtered = pending.filter(a => a.id !== id);
      localStorage.setItem(PENDING_ARTICLES_KEY, JSON.stringify(filtered));
    }
  },

  rejectArticle(id: string, reason?: string): void {
    if (typeof window === 'undefined') return;
    const pending = this.getPendingArticles();
    const article = pending.find(a => a.id === id);
    if (article) {
      const declined = { 
        ...article, 
        curationStatus: 'Declined' as const,
        declineReason: reason || 'Does not meet our current curatorial guidelines.'
      };
      this.saveDeclinedSubmission(declined);
      const filtered = pending.filter(a => a.id !== id);
      localStorage.setItem(PENDING_ARTICLES_KEY, JSON.stringify(filtered));

      // Sync status
      syncToCloud('articles', mapArticleToDb(declined));
    }
  },

  // ── DECLINED SUBMISSIONS STORAGE ──
  getDeclinedSubmissions(): any[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(DECLINED_SUBMISSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveDeclinedSubmission(item: any): void {
    if (typeof window === 'undefined') return;
    const declined = this.getDeclinedSubmissions();
    const updated = [...declined, item];
    localStorage.setItem(DECLINED_SUBMISSIONS_KEY, JSON.stringify(updated));
  },

  // ── PENDING VERIFIED CRITICS QUEUE ──
  getPendingCritics(): any[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(PENDING_CRITICS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  submitCriticApplication(app: any): void {
    if (typeof window === 'undefined') return;
    const pending = this.getPendingCritics();
    const newApp = { ...app, id: `critic_app_${Date.now()}`, curationStatus: 'Pending', timestamp: new Date().toLocaleDateString() };
    const updated = [...pending, newApp];
    localStorage.setItem(PENDING_CRITICS_KEY, JSON.stringify(updated));

    // Sync to cloud
    syncToCloud('critic_applications', mapCriticAppToDb(newApp));
  },

  approveCriticApplication(id: string): void {
    if (typeof window === 'undefined') return;
    const pending = this.getPendingCritics();
    const app = pending.find(a => a.id === id);
    if (app) {
      this.addApprovedCriticEmail(app.email);

      const approvedApp = { ...app, curationStatus: 'Approved' };
      const filtered = pending.filter(a => a.id !== id);
      localStorage.setItem(PENDING_CRITICS_KEY, JSON.stringify(filtered));

      // Sync approved app status to cloud
      syncToCloud('critic_applications', mapCriticAppToDb(approvedApp));
    }
  },

  rejectCriticApplication(id: string): void {
    if (typeof window === 'undefined') return;
    const pending = this.getPendingCritics();
    const app = pending.find(a => a.id === id);
    if (app) {
      const declined = { ...app, curationStatus: 'Declined' };
      this.saveDeclinedSubmission(declined);
      const filtered = pending.filter(a => a.id !== id);
      localStorage.setItem(PENDING_CRITICS_KEY, JSON.stringify(filtered));

      // Sync declined critic app status
      syncToCloud('critic_applications', mapCriticAppToDb(declined));
    }
  },

  // ── APPROVED CRITICS WHITELIST ──
  isApprovedCritic(email: string): boolean {
    if (typeof window === 'undefined') return false;
    const defaultApproved = [
      'critic@example.com',
      'editor@example.com',
      'verify@example.com',
      'adaeze@example.com'
    ];
    const stored = localStorage.getItem('curtain_approved_critic_emails');
    const list = stored ? JSON.parse(stored) : defaultApproved;
    return list.includes(email.toLowerCase());
  },

  addApprovedCriticEmail(email: string): void {
    if (typeof window === 'undefined') return;
    const defaultApproved = [
      'critic@example.com',
      'editor@example.com',
      'verify@example.com',
      'adaeze@example.com'
    ];
    const stored = localStorage.getItem('curtain_approved_critic_emails');
    const list = stored ? JSON.parse(stored) : defaultApproved;
    if (!list.includes(email.toLowerCase())) {
      const updated = [...list, email.toLowerCase()];
      localStorage.setItem('curtain_approved_critic_emails', JSON.stringify(updated));

      // Sync email whitelist
      if (supabase) {
        supabase.from('approved_critics').upsert({ email: email.toLowerCase() })
          .then(({ error }) => {
            if (error) console.error('[Supabase Sync] Whitelist save failed:', error);
          });
      }
    }
  },

  // ── REVIEWS STORAGE & DYNAMIC SCORE COMPUTATION ──
  getReviews(): any[] {
    if (typeof window === 'undefined') return MOCK_REVIEWS;
    const stored = localStorage.getItem(REVIEWS_KEY);
    if (!stored) {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(MOCK_REVIEWS));
      return MOCK_REVIEWS;
    }
    return JSON.parse(stored);
  },

  saveReview(review: any): void {
    if (typeof window === 'undefined') return;
    const reviews = this.getReviews();
    const newReview = { ...review, id: `rev_${Date.now()}`, date: 'Recently' };
    const updated = [newReview, ...reviews];
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));

    // Sync review to cloud
    syncToCloud('reviews', mapReviewToDb(newReview));

    // Recalculate production score
    const productionId = review.productionId;
    const productions = this.getProductions();
    const production = productions.find(p => p.id === productionId);
    if (production) {
      const prodReviews = updated.filter(r => r.productionId === productionId);
      const critics = prodReviews.filter(r => r.type === 'Critic');
      const audience = prodReviews.filter(r => r.type === 'Audience');

      if (critics.length > 0) {
        const sum = critics.reduce((acc, r) => acc + r.rating, 0);
        production.criticScore = Math.round(sum / critics.length);
      }
      if (audience.length > 0) {
        const sum = audience.reduce((acc, r) => acc + r.rating, 0);
        production.audienceScore = parseFloat(((sum / audience.length) / 10).toFixed(1));
      }
      production.totalReviews = prodReviews.length;
      this.saveProduction(production); // This will automatically sync production updates to cloud
    }
  },

  // ── CLIENT-SIDE IMAGE COMPRESSION (STEP-DOWN QUALITY) ──
  compressImage(file: File, maxDimension: number = 800, quality: number = 0.5): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image resource'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read upload file'));
      reader.readAsDataURL(file);
    });
  }
};

// ── CLOUD PULL AND CACHE SYNC MECHANISM ──
export const syncFromSupabase = async () => {
  if (!supabase) return;
  try {
    // 1. Pull productions
    const { data: prods } = await supabase.from('productions').select('*');
    if (prods) {
      const mapped = prods.map(mapProductionFromDb);
      const approved = mapped.filter(p => p.curationStatus === 'Approved');
      const pending = mapped.filter(p => p.curationStatus === 'Pending');
      
      localStorage.setItem(PRODUCTIONS_KEY, JSON.stringify(approved));
      localStorage.setItem(PENDING_PLAYS_KEY, JSON.stringify(pending));
    }

    // 2. Pull artists
    const { data: arts } = await supabase.from('artists').select('*');
    if (arts) {
      const mapped = arts.map(mapArtistFromDb);
      const approved = mapped.filter(a => a.curationStatus === 'Approved');
      const pending = mapped.filter(a => a.curationStatus === 'Pending');
      
      localStorage.setItem(ARTISTS_KEY, JSON.stringify(approved));
      localStorage.setItem(PENDING_ARTISTS_KEY, JSON.stringify(pending));
    }

    // 3. Pull articles
    const { data: articles } = await supabase.from('articles').select('*');
    if (articles) {
      const mapped = articles.map(mapArticleFromDb);
      const approved = mapped.filter(a => a.curationStatus === 'Approved');
      const pending = mapped.filter(a => a.curationStatus === 'Pending');

      localStorage.setItem(ARTICLES_KEY, JSON.stringify(approved));
      localStorage.setItem(PENDING_ARTICLES_KEY, JSON.stringify(pending));
    }

    // 4. Pull reviews
    const { data: revs } = await supabase.from('reviews').select('*');
    if (revs) {
      const mapped = revs.map(mapReviewFromDb);
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(mapped));
    }

    // 5. Pull critic applications
    const { data: apps } = await supabase.from('critic_applications').select('*');
    if (apps) {
      const mapped = apps.map(mapCriticAppFromDb);
      const pending = mapped.filter(a => a.curationStatus === 'Pending');
      localStorage.setItem(PENDING_CRITICS_KEY, JSON.stringify(pending));
    }

    // 6. Pull approved critic emails whitelist
    const { data: whitelist } = await supabase.from('approved_critics').select('email');
    if (whitelist) {
      const emails = whitelist.map(w => w.email.toLowerCase());
      localStorage.setItem('curtain_approved_critic_emails', JSON.stringify(emails));
    }

    console.log('[Curtain Call Database] Sync successfully completed with Supabase cloud!');
  } catch (err) {
    console.error('[Supabase Sync] Pull error:', err);
  }
};

// Auto-trigger background cloud sync pull in client context
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncFromSupabase();
  }, 1000);
}
