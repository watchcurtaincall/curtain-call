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
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    })
  : null;

// Initial Mock Articles fallback
// Initial Mock Articles fallback
const MOCK_ARTICLES: Article[] = [
  {
    id: 'art1',
    title: 'The Renaissance of Nigerian Historical Epics on Stage',
    excerpt: 'How directors like William Benson and Bolanle Austen-Peters are redefining how we consume pre-colonial African history.',
    date: 'May 18, 2026',
    author: 'Curtain Call Editorial',
    imageUrl: '/images/kings_horseman_poster.png',
    content: "Pre-colonial West African history is a rich tapestry of folklore, battle epics, and complex political states. For decades, standard theatrical curricula relied heavily on westernized plays. However, a major renaissance is sweeping through contemporary stage halls in cities like Lagos and Abuja. Master curators and directors are breathing new life into local legends, utilizing native dialogue, live traditional drumming, and glassmorphic multimedia sets to reconstruct historical spectacles.\n\nLeading the charge are directors Wole Benson and Bolanle Austen-Peters, who have staged massive blockbusters such as Oba Ovonramwen and Death and the King's Horseman. These epics are no longer treated as static schoolbook readings. They are reimagined as dynamic, musical, and high-editorial stage spectacles. Audiences are flocking to experience the dramatic weight of pre-colonial empires, political intrigues, and the struggles of kings and spiritual leaders who stood against colonial incursions.\n\nThis renaissance has also ignited a wave of local archiving and digital documentation, ensuring that these theatrical feats are preserved for curators and theatremakers across the globe. Through Curtain Call, we continue to document this living history."
  },
  {
    id: 'art2',
    title: 'Interview: Joshua Alabi on Directing WATERSIDE',
    excerpt: 'The award-winning director breaks down the intense emotional process of staging the critically acclaimed two-hander.',
    date: 'May 12, 2026',
    author: 'Curtain Call Editorial',
    imageUrl: '/images/kurunmi_poster.png',
    content: "Joshua Alabi's latest stage production, WATERSIDE, has taken the Nigerian theatre scene by storm. In this behind-the-curtain interview, the award-winning director breaks down the intense emotional journey, casting choices, and creative processes behind the two-hander.\n\n'WATERSIDE is a play about boundaries—both environmental and psychological,' Alabi notes. Set against the backdrop of a coastal fishing community, the play follows two estranged childhood friends who reunite under challenging circumstances. The set features a stunning, minimalist dock surrounded by a thin layer of reflective water, reflecting the characters' volatile psychological states.\n\n'We wanted the audience to feel the wetness, the cold, and the isolation,' Alabi explains. Staging a play that requires actors to perform in water presents massive technical difficulties, from sound capture to body temperature regulation. The technical team designed special waterproof body mics and warm air blowers under the stage to keep the cast safe during long performances.\n\nUltimately, Alabi believes the success of WATERSIDE lies in its raw, unfiltered exploration of regional lore: 'Our stories deserve this level of physical dedication. I hope curators across Africa take the leap to build bolder stages.'"
  },
  {
    id: 'art3',
    title: '5 Upcoming Premieres You Cannot Miss This Summer',
    excerpt: 'From satirical comedies to full-scale musicals, here is your definitive guide to the Lagos theatre season.',
    date: 'May 05, 2026',
    author: 'Curtain Call Editorial',
    imageUrl: '/images/baba_segi_poster.png',
    content: "As the summer season approaches, the Lagos and Abuja theatrical schedules are packing a punch. From dark satirical comedies to full-scale modern musicals, the upcoming lineup showcases the absolute best of our theatrical archives and fresh voices.\n\nHere are the top 5 premieres curated by our editorial board that you must experience live:\n\n1. **The Lion and the Jewel (Reimagined)** - A high-editorial, multimedia musical spin on Wole Soyinka's classic comedy. Set to premiere at the Terra Kulture Arena.\n\n2. **Kurunmi's Last Stand** - An intense historical tragedy depicting the final days of the legendary Yoruba general. It features massive traditional war dances and powerful live drums.\n\n3. **Satire on Broad Street** - A sharp, fast-paced political comedy dissecting financial ambitions in the heart of Lagos' commercial capital.\n\n4. **Whispers of the Lagoon** - A beautiful, sensory-rich romance play set in a delta fishing community, utilizing local dialects and stunning water designs.\n\n5. **Curtains Rise: The Musical** - A full-scale ensemble celebrating the history of Nigerian musical theatre from the early travelling troupes to today's global arenas.\n\nTickets for these anticipated shows are selling fast. Make sure to claim your seats early on Curtain Call!"
  }
];

// ── DATABASE TRANSLATION MAPPERS (camelCase to snake_case) ──

const mapProductionToDb = (p: any) => {
  const gallery = [...(p.galleryImages || [])];
  if (p.ticketTiers) {
    gallery.push(JSON.stringify({ __ticketTiers: p.ticketTiers }));
  }
  return {
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
    gallery_images: gallery,
    submitter_email: p.submitterEmail || null,
    curation_status: p.curationStatus || 'Approved',
    cast_and_crew: p.castAndCrew || [],
    show_date: p.showDate || null,
    decline_reason: p.declineReason || null,
    created_at: p.createdAt || null
  };
};

const mapProductionFromDb = (row: any) => {
  const galleryImages: string[] = [];
  let ticketTiers: any[] = [];
  
  if (row.gallery_images && Array.isArray(row.gallery_images)) {
    row.gallery_images.forEach((item: any) => {
      if (typeof item === 'string' && item.startsWith('{"__ticketTiers":')) {
        try {
          const parsed = JSON.parse(item);
          ticketTiers = parsed.__ticketTiers;
        } catch (e) {
          // ignore
        }
      } else {
        galleryImages.push(item);
      }
    });
  }

  return {
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
    galleryImages,
    submitterEmail: row.submitter_email,
    curationStatus: row.curation_status,
    castAndCrew: row.cast_and_crew || [],
    showDate: row.show_date,
    declineReason: row.decline_reason || null,
    ticketTiers: ticketTiers.length > 0 ? ticketTiers : undefined,
    createdAt: row.created_at || null
  };
};

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
  decline_reason: a.declineReason || null,
  hits: a.hits || 0,
  created_at: a.createdAt || null
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
  declineReason: row.decline_reason || null,
  hits: row.hits || 0,
  createdAt: row.created_at || null
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

const syncToCloud = async (table: string, dbItem: any): Promise<void> => {
  if (!supabase) return;
  try {
    const { error } = await supabase.from(table).upsert(dbItem);
    if (error) {
      console.error(`[Supabase Sync] Upsert failed for table ${table}:`, error);
      // Self-Healing Schema Fallback: If column does not exist in remote schema, strip it and retry
      if (error.code === 'PGRST204' && error.message && error.message.includes('schema cache')) {
        const match = error.message.match(/Could not find the '([^']+)' column/);
        if (match && match[1]) {
          const colName = match[1];
          console.warn(`[Supabase Sync Fallback] Stripping missing column '${colName}' and retrying upsert...`);
          const stripped = { ...dbItem };
          delete stripped[colName];
          return await syncToCloud(table, stripped);
        }
      }
    }
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

export function calculateDynamicStatus(showDateStr?: string, initialStatus?: string): 'Currently Showing' | 'Coming Soon' | 'Past Production' | 'Recently Concluded' | 'Draft' {
  if (initialStatus === 'Draft') {
    return 'Draft';
  }
  if (!showDateStr) {
    return (initialStatus as any) || 'Currently Showing';
  }
  
  const parts = showDateStr.split('-');
  let showDate: Date;
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    showDate = new Date(year, month, day);
  } else {
    showDate = new Date(showDateStr);
  }
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

  // ── NEWSLETTER SUBSCRIPTION ENGINE ──
  subscribeToNewsletter(email: string): { success: boolean; message: string } {
    if (typeof window === 'undefined') return { success: false, message: 'Server-side call' };
    const key = 'curtain_newsletter_subscribers';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    if (current.includes(email.toLowerCase())) {
      return { success: true, message: 'Already subscribed' };
    }
    
    current.push(email.toLowerCase());
    localStorage.setItem(key, JSON.stringify(current));

    // Sync to Supabase
    if (supabase) {
      supabase.from('newsletter_subscribers').upsert({ email: email.toLowerCase() })
        .then(({ error }) => {
          if (error) console.error('[Supabase Sync] Newsletter save failed:', error);
        });
    }

    // Send Welcome Email
    const subject = "Welcome to Curtain Call | The Front Row Seat";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px; border-radius: 24px; border: 1px solid #27272a; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="font-size: 24px; font-weight: bold; color: #ffffff; font-family: Georgia, serif;">Curtain Call Editorial</span>
          <div style="height: 2px; width: 60px; background-color: #dc2626; margin: 15px auto 0;"></div>
        </div>
        
        <h2 style="font-size: 20px; font-weight: bold; color: #ffffff; text-align: center; font-family: Georgia, serif; margin-bottom: 15px;">Welcome to The Front Row Seat!</h2>
        
        <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; text-align: center; margin-bottom: 25px;">
          You have successfully subscribed to the premium Curtain Call weekly theatre newsletter.
        </p>
        
        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 25px;">
          <p style="font-size: 13px; color: #f4f4f5; font-weight: bold; margin: 0 0 5px;">Your Subscribed Email:</p>
          <code style="font-size: 13px; color: #22c55e; font-family: monospace;">${email}</code>
        </div>
        
        <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center;">
          Get ready for weekly ticket exclusives, interview features, curated reviews, and show listings straight from our cultural editors.
        </p>
        
        <div style="border-top: 1px solid #27272a; margin-top: 30px; padding-top: 20px; text-align: center;">
          <p style="font-size: 10px; color: #71717a; margin: 0;">
            Curtain Call Ltd · 10 Glover Road, Ikoyi, Lagos
          </p>
        </div>
      </div>
    `;

    this.sendEmail(email, subject, htmlContent).catch(err => {
      console.error('Failed to dispatch welcome email:', err);
    });

    return { success: true, message: 'Subscribed successfully' };
  },

  unsubscribeNewsletter(email: string): void {
    if (typeof window === 'undefined') return;
    const key = 'curtain_newsletter_subscribers';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = current.filter((e: string) => e.toLowerCase() !== email.toLowerCase());
    localStorage.setItem(key, JSON.stringify(updated));

    fetch(`/api/admin-data?type=subscriber&email=${encodeURIComponent(email)}`, {
      method: 'DELETE'
    }).catch(err => {
      console.error('[ClientDB] Failed to delete subscriber:', err);
    });
  },

  getNewsletterSubscribers(): string[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('curtain_newsletter_subscribers') || '[]');
  },

  // ── USER PROFILES / SIGNUPS ENGINE ──
  saveProfile(profile: any): void {
    if (typeof window === 'undefined') return;
    const key = 'curtain_user_profiles';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const exists = current.find((p: any) => p.email.toLowerCase() === profile.email.toLowerCase());
    let updated = [...current];
    if (exists) {
      updated = current.map((p: any) => p.email.toLowerCase() === profile.email.toLowerCase() ? { ...p, ...profile } : p);
    } else {
      updated.push(profile);
    }
    localStorage.setItem(key, JSON.stringify(updated));

    if (supabase) {
      supabase.from('profiles').upsert({
        email: profile.email.toLowerCase(),
        name: profile.name,
        handle: profile.handle || null,
        location: profile.location || null,
        join_date: profile.joinDate || 'May 2026',
        is_verified: profile.isVerified ?? true,
        verification_code: profile.verificationCode || null
      }).then(({ error }) => {
        if (error) console.error('[Supabase Sync] Profile save failed:', error);
      });
    }
  },

  getSignups(): any[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('curtain_user_profiles') || '[]');
  },

  deleteSignup(email: string): void {
    if (typeof window === 'undefined') return;
    const key = 'curtain_user_profiles';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = current.filter((p: any) => p.email.toLowerCase() !== email.toLowerCase());
    localStorage.setItem(key, JSON.stringify(updated));

    fetch(`/api/admin-data?type=signup&email=${encodeURIComponent(email)}`, {
      method: 'DELETE'
    }).catch(err => {
      console.error('[ClientDB] Failed to delete profile signup:', err);
    });
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
      // Dynamic Sanitizer: If this is a custom play (ID is not p1..p10 mock format),
      // dynamically recalculate or preserve critic and audience scores from the reviews list
      const isMock = p.id && /^p\d+$/.test(p.id);
      if (!isMock) {
        const storedReviews = localStorage.getItem('curtain_call_reviews');
        const reviewsList = storedReviews ? JSON.parse(storedReviews) : [];
        const prodReviews = reviewsList.filter((r: any) => r.productionId === p.id);
        
        if (prodReviews.length > 0) {
          const critics = prodReviews.filter((r: any) => r.type && r.type.toLowerCase() === 'critic');
          const audience = prodReviews.filter((r: any) => r.type && r.type.toLowerCase() === 'audience');
          
          if (critics.length > 0) {
            const sum = critics.reduce((acc: number, r: any) => acc + r.rating, 0);
            p.criticScore = Math.round(sum / critics.length);
          } else {
            p.criticScore = null;
          }
          
          if (audience.length > 0) {
            const sum = audience.reduce((acc: number, r: any) => acc + r.rating, 0);
            p.audienceScore = parseFloat(((sum / audience.length) / 10).toFixed(1));
          } else {
            p.audienceScore = null;
          }
          p.totalReviews = prodReviews.length;
        }
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

      // Trigger notification
      if (artist.submitterEmail) {
        this.addNotification(artist.submitterEmail, {
          type: 'system',
          title: 'Theatremaker Profile Approved! 🎉',
          body: `Your submitted profile for "${artist.name}" has been approved and is now live in the directory.`
        });
      }
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

      // Trigger notification
      if (artist.submitterEmail) {
        this.addNotification(artist.submitterEmail, {
          type: 'system',
          title: 'Theatremaker Profile Declined ⚠',
          body: `Your submitted profile for "${artist.name}" was declined: ${reason || 'Does not meet guidelines.'}`
        });
      }
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

      // Trigger notification
      if (play.submitterEmail) {
        this.addNotification(play.submitterEmail, {
          type: 'system',
          title: 'Playbill Listing Approved! 🎉',
          body: `Your playbill listing for "${play.title}" has been approved and is now live on Curtain Call.`
        });
      }
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

      // Trigger notification
      if (play.submitterEmail) {
        this.addNotification(play.submitterEmail, {
          type: 'system',
          title: 'Playbill Listing Declined ⚠',
          body: `Your playbill listing for "${play.title}" was declined: ${reason || 'Does not meet guidelines.'}`
        });
      }
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

      // Trigger notification
      if (article.submitterEmail) {
        this.addNotification(article.submitterEmail, {
          type: 'system',
          title: 'Chronicle Draft Approved! ✍️',
          body: `Your opinion piece/chronicle "${article.title}" has been approved and published to the feed.`
        });
      }
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

      // Trigger notification
      if (article.submitterEmail) {
        this.addNotification(article.submitterEmail, {
          type: 'system',
          title: 'Chronicle Draft Declined ⚠',
          body: `Your chronicle draft "${article.title}" was declined: ${reason || 'Does not meet guidelines.'}`
        });
      }
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

      // 1. Add in-app notification
      this.addNotification(app.email, {
        type: 'critic',
        title: 'Verified Critic Approved! 🎭',
        body: 'Congratulations! Your Verified Critic status has been approved. You can now post official ratings.'
      });

      // 2. Dispatch congratulatory email
      const welcomeHtml = `
        <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px; border-radius: 24px; border: 1px solid #27272a; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 24px; font-weight: bold; color: #ffffff; font-family: Georgia, serif;">Curtain Call Curation</span>
            <div style="height: 2px; width: 60px; background-color: #dc2626; margin: 15px auto 0;"></div>
          </div>
          <h2 style="font-size: 20px; font-weight: bold; color: #ffffff; text-align: center; font-family: Georgia, serif; margin-bottom: 15px;">Congratulations, ${app.name}!</h2>
          <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; text-align: center; margin-bottom: 25px;">
            Your application to become a **Verified Critic** has been approved by the Curtain Call curation board!
          </p>
          <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 25px;">
            <p style="font-size: 13px; color: #f4f4f5; font-weight: bold; margin: 0 0 5px;">Verified Email Account:</p>
            <code style="font-size: 13px; color: #22c55e; font-family: monospace;">${app.email}</code>
          </div>
          <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center;">
            You can now post official professional scores and reviews across the plays archive.
          </p>
        </div>
      `;
      this.sendEmail(app.email, 'Curtain Call: Verified Critic Approved! 🎭', welcomeHtml).catch(err => {
        console.error('[Sync] Failed to send critic approval email:', err);
      });

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

      // 1. Add in-app notification
      this.addNotification(app.email, {
        type: 'system',
        title: 'Critic Application Status 🎭',
        body: 'We have reviewed your application and are unable to verify your critic status at this time.'
      });

      // 2. Dispatch email rejection
      const rejectionHtml = `
        <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px; border-radius: 24px; border: 1px solid #27272a; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 24px; font-weight: bold; color: #ffffff; font-family: Georgia, serif;">Curtain Call Curation</span>
            <div style="height: 2px; width: 60px; background-color: #dc2626; margin: 15px auto 0;"></div>
          </div>
          <h2 style="font-size: 20px; font-weight: bold; color: #ffffff; text-align: center; font-family: Georgia, serif; margin-bottom: 15px;">Hello, ${app.name}</h2>
          <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; text-align: center; margin-bottom: 25px;">
            Thank you for applying to be a Verified Critic. After reviewing your application, we are unable to approve your critic status at this time.
          </p>
        </div>
      `;
      this.sendEmail(app.email, 'Curtain Call: Critic Application Status 🎭', rejectionHtml).catch(err => {
        console.error('[Sync] Failed to send critic rejection email:', err);
      });

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

      // Sync email whitelist via secure backend API (bypassing browser RLS)
      fetch('/api/approved-critics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      }).catch(err => {
        console.error('[ClientDB] Failed to sync approved critic email to server:', err);
      });
    }
  },

  removeApprovedCriticEmail(email: string): void {
    if (typeof window === 'undefined') return;
    const defaultApproved = [
      'critic@example.com',
      'editor@example.com',
      'verify@example.com',
      'adaeze@example.com'
    ];
    const stored = localStorage.getItem('curtain_approved_critic_emails');
    const list = stored ? JSON.parse(stored) : defaultApproved;
    const updated = list.filter((e: string) => e.toLowerCase() !== email.toLowerCase());
    localStorage.setItem('curtain_approved_critic_emails', JSON.stringify(updated));

    // Sync deletion via secure backend API (bypassing browser RLS)
    fetch('/api/approved-critics', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase() })
    }).catch(err => {
      console.error('[ClientDB] Failed to remove approved critic email from server:', err);
    });
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

  // ── WITHDRAWALS DATABASE ──
  getWithdrawals(): any[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('curtain_withdrawals');
    return stored ? JSON.parse(stored) : [];
  },

  submitWithdrawal(req: any): void {
    if (typeof window === 'undefined') return;
    const current = this.getWithdrawals();
    const updated = [req, ...current];
    localStorage.setItem('curtain_withdrawals', JSON.stringify(updated));

    // Sync to cloud withdrawals table
    syncToCloud('withdrawals', req);
  },

  approveWithdrawal(id: string): void {
    if (typeof window === 'undefined') return;
    const current = this.getWithdrawals();
    const updated = current.map(w => w.id === id ? { ...w, status: 'Approved' } : w);
    localStorage.setItem('curtain_withdrawals', JSON.stringify(updated));

    const req = updated.find(w => w.id === id);
    if (req) {
      syncToCloud('withdrawals', req);

      // Trigger notification to the withdrawer!
      this.addNotification(req.email, {
        type: 'system',
        title: 'Withdrawal Approved! 💸',
        body: `Your withdrawal of ₦${req.amount.toLocaleString()} to ${req.bankName} has been approved and successfully processed.`
      });
    }
  },

  rejectWithdrawal(id: string, reason?: string): void {
    if (typeof window === 'undefined') return;
    const current = this.getWithdrawals();
    const updated = current.map(w => w.id === id ? { ...w, status: 'Declined', declineReason: reason || 'Information mismatch.' } : w);
    localStorage.setItem('curtain_withdrawals', JSON.stringify(updated));

    const req = updated.find(w => w.id === id);
    if (req) {
      syncToCloud('withdrawals', req);

      // Trigger notification to the withdrawer!
      this.addNotification(req.email, {
        type: 'system',
        title: 'Withdrawal Declined ⚠',
        body: `Your withdrawal of ₦${req.amount.toLocaleString()} was declined: ${reason || 'Information mismatch.'}`
      });
    }
  },

  // ── TICKETS DATABASE ──
  getTickets(): any[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('curtain_tickets');
    return stored ? JSON.parse(stored) : [];
  },

  purchaseTicket(ticket: any): void {
    if (typeof window === 'undefined') return;
    const current = this.getTickets();
    const newTicket = {
      ...ticket,
      id: ticket.id || `tkt_${Date.now()}`,
      timestamp: ticket.timestamp || Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    const updated = [newTicket, ...current];
    localStorage.setItem('curtain_tickets', JSON.stringify(updated));

    // Find the production to get the submitter's email
    const prod = this.getProductionById(ticket.productionId);
    if (prod && prod.submitterEmail) {
      // Trigger a notification to the producer!
      const commission = ticket.price * 0.05;
      const netEarnings = ticket.price - commission;
      this.addNotification(prod.submitterEmail, {
        type: 'ticket_sale',
        title: 'New ticket sale 🎟️',
        body: `1 ${ticket.tier} ticket sold for "${prod.title}". Net: ₦${netEarnings.toLocaleString()} (Commission: ₦${commission.toLocaleString()}).`
      });
    }

    // Sync to cloud tickets table
    syncToCloud('tickets', newTicket);
  },

  // ── NOTIFICATIONS DATABASE ──
  getNotifications(email: string): any[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('curtain_notifications');
    let list = stored ? JSON.parse(stored) : [];
    
    // Fallback for adaeze@example.com if empty
    if (list.length === 0 && email.toLowerCase() === 'adaeze@example.com') {
      const adaezeNotifs = [
        {
          id: 'n1', email: 'adaeze@example.com', type: 'ticket_sale' as const, read: false,
          title: 'New ticket sale',
          body: '2 General tickets sold for Motherland The Musical – Jun 14.',
          time: '10 min ago', timestamp: Date.now() - 10 * 60 * 1000
        },
        {
          id: 'n2', email: 'adaeze@example.com', type: 'ticket_sale' as const, read: false,
          title: 'New ticket sale',
          body: '1 VIP ticket sold for Motherland The Musical – Jun 15.',
          time: '43 min ago', timestamp: Date.now() - 43 * 60 * 1000
        },
        {
          id: 'n3', email: 'adaeze@example.com', type: 'badge' as const, read: false,
          title: 'Badge Unlocked',
          body: 'You unlocked the "Voice of the Stage" badge for writing 10 reviews.',
          time: '2 hours ago', timestamp: Date.now() - 2 * 60 * 60 * 1000
        },
        {
          id: 'n4', email: 'adaeze@example.com', type: 'review' as const, read: true,
          title: 'New review on your production',
          body: 'Sarah K. gave WATERSIDE a 10/10 — "Mind-blowing performance."',
          time: '1 day ago', timestamp: Date.now() - 24 * 60 * 60 * 1000
        },
        {
          id: 'n5', email: 'adaeze@example.com', type: 'critic' as const, read: true,
          title: 'Critic review posted',
          body: 'The Lagos Review gave WATERSIDE 92% — "A brilliant exploration of Niger Delta folklore."',
          time: '2 days ago', timestamp: Date.now() - 48 * 60 * 60 * 1000
        },
        {
          id: 'n6', email: 'adaeze@example.com', type: 'system' as const, read: true,
          title: 'Payout processed',
          body: '₦42,800 has been sent to your GT Bank account ending in 4821.',
          time: '6 days ago', timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000
        }
      ];
      localStorage.setItem('curtain_notifications', JSON.stringify(adaezeNotifs));
      return adaezeNotifs;
    }
    
    return list.filter((n: any) => n.email.toLowerCase() === email.toLowerCase());
  },

  addNotification(email: string, notif: { type: 'ticket_sale' | 'badge' | 'review' | 'system' | 'critic'; title: string; body: string }): void {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('curtain_notifications');
    const list = stored ? JSON.parse(stored) : [];
    const newNotif = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      read: false,
      time: 'Just now',
      timestamp: Date.now()
    };
    const updated = [newNotif, ...list];
    localStorage.setItem('curtain_notifications', JSON.stringify(updated));

    // Custom dispatch to trigger UI sync
    window.dispatchEvent(new Event('cc-db-synced'));

    // Sync to cloud via secure API endpoint
    fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNotif)
    }).catch(err => {
      console.error('[ClientDB] Failed to save notification to cloud:', err);
    });
  },

  markNotificationAsRead(id: string): void {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('curtain_notifications');
    if (!stored) return;
    const list = JSON.parse(stored);
    const updated = list.map((n: any) => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem('curtain_notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('cc-db-synced'));

    // Sync to cloud via secure API endpoint
    fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
      method: 'PUT'
    }).catch(err => {
      console.error('[ClientDB] Failed to update notification read status:', err);
    });
  },

  markAllNotificationsAsRead(email: string): void {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('curtain_notifications');
    if (!stored) return;
    const list = JSON.parse(stored);
    const updated = list.map((n: any) => n.email.toLowerCase() === email.toLowerCase() ? { ...n, read: true } : n);
    localStorage.setItem('curtain_notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('cc-db-synced'));

    // Sync to cloud via secure API endpoint
    fetch(`/api/notifications?allForEmail=${encodeURIComponent(email)}`, {
      method: 'PUT'
    }).catch(err => {
      console.error('[ClientDB] Failed to mark all notifications as read:', err);
    });
  },

  // ── ARTIST HITS TRACKING ──
  incrementArtistHits(id: string): void {
    if (typeof window === 'undefined') return;
    const artists = this.getArtists();
    const index = artists.findIndex(a => a.id === id);
    if (index !== -1) {
      const artist = artists[index];
      const updatedArtist = {
        ...artist,
        hits: (artist.hits || 0) + 1
      };
      const updatedList = [...artists];
      updatedList[index] = updatedArtist;
      localStorage.setItem(ARTISTS_KEY, JSON.stringify(updatedList));

      // Replicate to cloud
      syncToCloud('artists', mapArtistToDb(updatedArtist));
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
    const { data: prods } = await supabase.from('productions').select('*').neq('id', 'cache_bust_' + Date.now());
    if (prods) {
      const mapped = prods.map(mapProductionFromDb);
      const approved = mapped.filter(p => p.curationStatus === 'Approved');
      const pending = mapped.filter(p => p.curationStatus === 'Pending');
      
      const currentLocal = JSON.parse(localStorage.getItem(PRODUCTIONS_KEY) || '[]');
      const drafts = currentLocal.filter((p: any) => p.status === 'Draft');
      localStorage.setItem(PRODUCTIONS_KEY, JSON.stringify([...approved, ...drafts]));
      localStorage.setItem(PENDING_PLAYS_KEY, JSON.stringify(pending));
    }

    // 2. Pull artists
    const { data: arts } = await supabase.from('artists').select('*').neq('id', 'cache_bust_' + Date.now());
    if (arts) {
      const mapped = arts.map(mapArtistFromDb);
      const approved = mapped.filter(a => a.curationStatus === 'Approved');
      const pending = mapped.filter(a => a.curationStatus === 'Pending');
      
      localStorage.setItem(ARTISTS_KEY, JSON.stringify(approved));
      localStorage.setItem(PENDING_ARTISTS_KEY, JSON.stringify(pending));
    }

    // 3. Pull articles
    const { data: articles } = await supabase.from('articles').select('*').neq('id', 'cache_bust_' + Date.now());
    if (articles) {
      const mapped = articles.map(mapArticleFromDb);
      const approved = mapped.filter(a => a.curationStatus === 'Approved');
      const pending = mapped.filter(a => a.curationStatus === 'Pending');

      localStorage.setItem(ARTICLES_KEY, JSON.stringify(approved));
      localStorage.setItem(PENDING_ARTICLES_KEY, JSON.stringify(pending));
    }

    // 4. Pull reviews
    const { data: revs } = await supabase.from('reviews').select('*').neq('id', 'cache_bust_' + Date.now());
    if (revs) {
      const mapped = revs.map(mapReviewFromDb);
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(mapped));
    }

    // 5. Pull critic applications
    const { data: apps } = await supabase.from('critic_applications').select('*').neq('id', 'cache_bust_' + Date.now());
    if (apps) {
      const mapped = apps.map(mapCriticAppFromDb);
      const pending = mapped.filter(a => a.curationStatus === 'Pending');
      localStorage.setItem(PENDING_CRITICS_KEY, JSON.stringify(pending));
    }

    // 6. Pull approved critic emails whitelist via secure API route (bypassing browser RLS)
    try {
      const res = await fetch('/api/approved-critics');
      if (res.ok) {
        const emails = await res.json();
        const defaultApproved = [
          'critic@example.com',
          'editor@example.com',
          'verify@example.com',
          'adaeze@example.com'
        ];
        const merged = Array.from(new Set([...defaultApproved, ...emails.map((e: string) => e.toLowerCase())]));
        localStorage.setItem('curtain_approved_critic_emails', JSON.stringify(merged));
      }
    } catch (e) {
      console.error('[Supabase Sync] Failed to fetch approved critics from API:', e);
    }

    // 7. Pull withdrawals
    try {
      const { data: withdrawals } = await supabase.from('withdrawals').select('*').neq('id', 'cache_bust_' + Date.now());
      if (withdrawals) {
        localStorage.setItem('curtain_withdrawals', JSON.stringify(withdrawals));
      }
    } catch (e) {
      // ignore
    }

    // 8. Pull tickets
    try {
      const { data: tickets } = await supabase.from('tickets').select('*').neq('id', 'cache_bust_' + Date.now());
      if (tickets) {
        localStorage.setItem('curtain_tickets', JSON.stringify(tickets));
      }
    } catch (e) {
      // ignore
    }

    // 9. Pull notifications for currently logged in user
    try {
      const savedUser = localStorage.getItem('cc_authed_user');
      if (savedUser) {
        const email = JSON.parse(savedUser).email || '';
        if (email) {
          const res = await fetch(`/api/notifications?email=${encodeURIComponent(email)}`);
          if (res.ok) {
            const notifications = await res.json();
            localStorage.setItem('curtain_notifications', JSON.stringify(notifications));
          }
        }
      } else {
        localStorage.removeItem('curtain_notifications');
      }
    } catch (e) {
      // ignore
    }

    // 10. Pull profiles & newsletter subscribers ONLY if the logged in user is the administrator
    let isAdmin = false;
    try {
      const savedUser = localStorage.getItem('cc_authed_user');
      if (savedUser) {
        const email = JSON.parse(savedUser).email || '';
        isAdmin = email.toLowerCase() === 'watchcurtaincall@gmail.com';
      }
    } catch (e) {}

    if (isAdmin) {
      try {
        const res = await fetch('/api/admin-data');
        if (res.ok) {
          const { subscribers, signups } = await res.json();
          if (subscribers) {
            localStorage.setItem('curtain_newsletter_subscribers', JSON.stringify(subscribers));
          }
          if (signups) {
            localStorage.setItem('curtain_user_profiles', JSON.stringify(signups));
          }
        }
      } catch (e) {
        console.error('[Supabase Sync] Failed to fetch admin subscribers/signups data:', e);
      }
    } else {
      // Security/Privacy: clear signups/subscribers for non-admin users!
      localStorage.removeItem('curtain_user_profiles');
      localStorage.removeItem('curtain_newsletter_subscribers');
    }

    console.log('[Curtain Call Database] Sync successfully completed with Supabase cloud!');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cc-db-synced'));
    }
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

// Robust, high-precision sorting utility to order plays and artists by date added descending (newest first)
export function sortItemsByDateAdded<T extends { id: string; createdAt?: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    // 1. Compare by createdAt timestamp if available
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB) {
      return timeB - timeA; // Newer first
    }
    
    // 2. Fallback: Parse timestamp from dynamic custom IDs like 'pending_play_1779...'
    const matchA = a.id.match(/\d{10,}/);
    const matchB = b.id.match(/\d{10,}/);
    if (matchA && matchB) {
      return parseInt(matchB[0], 10) - parseInt(matchA[0], 10);
    }
    if (matchA) return -1; // custom items with timestamp go before mock items
    if (matchB) return 1;
    
    // 3. Stable lexicographical fallback (mock items p10, p9, etc.)
    return b.id.localeCompare(a.id);
  });
}
