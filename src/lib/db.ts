'use client';

import { MOCK_ARTISTS, MOCK_PRODUCTIONS, MOCK_REVIEWS } from './mock';
import { Artist, Production, Article } from './types';
import { mapProductionFromDb } from './dbMapper';
import { getWelcomeNewsletterHtml, getCriticApprovedHtml, getCriticApplicationRejectedHtml } from '@/lib/quiz/emailTemplates';
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
const USER_BANK_DETAILS_KEY = 'curtain_user_bank_details';

// Memory storage fallback for private browsing modes or restricted environments
const memoryDb: Record<string, string> = {};
const localStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn(`[Storage Fallback] Failed to getItem for key "${key}":`, e);
      return memoryDb[key] || null;
    }
  },
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[Storage Fallback] Failed to setItem for key "${key}":`, e);
      memoryDb[key] = value;
    }
  },
  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[Storage Fallback] Failed to removeItem for key "${key}":`, e);
      delete memoryDb[key];
    }
  }
};

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
export const MOCK_ARTICLES: Article[] = [
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

// Clean slug generator — "Saro: The Musical!" → "saro-the-musical"
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')                      // decompose accented chars
    .replace(/[\u0300-\u036f]/g, '')        // strip accent marks
    .replace(/[^a-z0-9\s-]/g, '')          // keep letters, digits, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-')                  // spaces → hyphens
    .replace(/-+/g, '-')                   // collapse multiple hyphens
    .substring(0, 80);                     // max 80 chars
}

// Ensure slug is unique among existing productions (add -2, -3 suffix if needed)
export function ensureUniqueSlug(baseSlug: string, existingProductions: { id: string; slug?: string }[], currentId?: string): string {
  const others = existingProductions.filter(p => p.id !== currentId);
  let candidate = baseSlug;
  let counter = 2;
  while (others.some(p => (p.slug || '') === candidate)) {
    candidate = `${baseSlug}-${counter++}`;
  }
  return candidate;
}

const mapProductionToDb = (p: any) => {
  const gallery = [...(p.galleryImages || [])];
  if (p.ticketTiers) {
    gallery.push(JSON.stringify({ __ticketTiers: p.ticketTiers }));
  }
  if (p.productionType) {
    gallery.push(JSON.stringify({ __productionType: p.productionType }));
  }
  if (p.showTime) {
    gallery.push(JSON.stringify({ __showTime: p.showTime }));
  }
  if (p.isProducerManaged !== undefined) {
    gallery.push(JSON.stringify({ __isProducerManaged: p.isProducerManaged }));
  }
  if (p.externalTicketUrl) {
    gallery.push(JSON.stringify({ __externalTicketUrl: p.externalTicketUrl }));
  }
  if (p.eventType) {
    gallery.push(JSON.stringify({ __eventType: p.eventType }));
  }
  if (p.customEventType) {
    gallery.push(JSON.stringify({ __customEventType: p.customEventType }));
  }
  if (p.dates && p.dates.length > 0) {
    gallery.push(JSON.stringify({ __dates: p.dates }));
  }
  return {
    id: p.id,
    title: p.title,
    event_type: p.eventType || 'Theatre',
    custom_event_type: p.customEventType || null,
    synopsis: p.synopsis,
    genre: p.genre,
    runtime: p.runtime || '120 mins',
    venue: p.venue,
    status: p.status === 'Coming Soon' || p.status === 'Draft' ? 'Coming Soon' : (p.status === 'Past Productions' ? 'Past Production' : p.status),
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
    created_at: p.createdAt || new Date().toISOString(),
    slug: p.slug || null
  };
};

// mapProductionFromDb is imported from ./dbMapper

const mapArtistToDb = (a: any) => ({
  id: a.id,
  name: a.name,
  role_type: a.roleType,
  headshot_url: a.headshotUrl,
  bio: a.bio || '',
  date_of_birth: a.dateOfBirth || null,
  social_links: {
    ...(a.socialLinks || {}),
    __scenography: a.scenography || [],
    __career: a.career || '',
    __style: a.style || '',
    __achievements: a.achievements || [],
    __awards: a.awards || []
  },
  submitter_email: a.submitterEmail || null,
  curation_status: a.curationStatus || 'Approved',
  is_deceased: a.isDeceased || false,
  date_of_death: a.dateOfDeath || null,
  decline_reason: a.declineReason || null,
  hits: a.hits || 0,
  created_at: a.createdAt || new Date().toISOString()
});

const mapArtistFromDb = (row: any) => {
  const social = row.social_links || {};
  const socialLinks = { ...social };
  delete socialLinks.__scenography;
  delete socialLinks.__career;
  delete socialLinks.__style;
  delete socialLinks.__achievements;
  delete socialLinks.__awards;

  let parsedCreatedAt = row.created_at || null;
  if (!parsedCreatedAt) {
    const match = row.id?.match(/(\d{10,})/);
    if (match) {
      try {
        const timestamp = parseInt(match[0], 10);
        if (!isNaN(timestamp) && timestamp > 0) {
          const scaleTimestamp = timestamp < 9999999999 ? timestamp * 1000 : timestamp;
          parsedCreatedAt = new Date(scaleTimestamp).toISOString();
        }
      } catch (e) {
        // ignore
      }
    }
  }

  return {
    id: row.id,
    name: row.name,
    roleType: row.role_type,
    headshotUrl: row.headshot_url,
    bio: row.bio,
    dateOfBirth: row.date_of_birth,
    socialLinks,
    submitterEmail: row.submitter_email,
    curationStatus: row.curation_status,
    isDeceased: row.is_deceased,
    dateOfDeath: row.date_of_death,
    declineReason: row.decline_reason || null,
    hits: row.hits || 0,
    createdAt: parsedCreatedAt,
    scenography: social.__scenography || [],
    career: social.__career || '',
    style: social.__style || '',
    achievements: social.__achievements || [],
    awards: social.__awards || [],
  };
};

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
  decline_reason: art.declineReason || null,
  views: art.views || 0
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
  declineReason: row.decline_reason || null,
  views: row.views || 0
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

const mapTicketToDb = (t: any) => ({
  id: t.id,
  production_id: t.productionId,
  production_title: t.productionTitle,
  buyer_email: t.buyerEmail,
  tier: t.tier,
  price: t.price,
  reference: t.reference,
  gate_pass: t.gatePass,
  date: t.date,
  timestamp: t.timestamp
});

const mapTicketFromDb = (row: any) => ({
  id: row.id,
  productionId: row.production_id || row.productionId,
  productionTitle: row.production_title || row.productionTitle,
  buyerEmail: row.buyer_email || row.buyerEmail,
  tier: row.tier,
  price: Number(row.price) || 0,
  reference: row.reference,
  gatePass: row.gate_pass || row.gatePass,
  date: row.date,
  timestamp: Number(row.timestamp) || Date.now()
});

const mapWithdrawalToDb = (w: any) => ({
  id: w.id,
  email: w.email,
  amount: w.amount,
  bank_name: w.bankName || w.bank_name,
  account_number: w.accountNumber || w.account_number,
  account_name: w.accountName || w.account_name,
  status: w.status,
  timestamp: w.timestamp
});

const mapWithdrawalFromDb = (row: any) => ({
  id: row.id,
  email: row.email,
  amount: Number(row.amount) || 0,
  bankName: row.bank_name || row.bankName,
  accountNumber: row.account_number || row.accountNumber,
  accountName: row.account_name || row.accountName,
  status: row.status,
  timestamp: row.timestamp
});

// ── BACKGROUND CLOUD REPLICATION ENGINE ──

const syncToCloud = async (table: string, dbItem: any): Promise<void> => {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (supabase) {
      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes?.data?.session?.access_token;
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch('/api/sync-data', {
      method: 'POST',
      headers,
      body: JSON.stringify({ table, dbItem })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error || res.statusText || 'Sync failed';
      console.error(`[API Sync] Upsert failed for table ${table}:`, errMsg);
      throw new Error(errMsg);
    }
  } catch (err) {
    console.error(`[API Sync] Server error on ${table}:`, err);
    throw err;
  }
};

const deleteFromCloud = async (table: string, id: string) => {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (supabase) {
      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes?.data?.session?.access_token;
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch('/api/sync-data', {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ table, id })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error || res.statusText || 'Delete failed';
      console.error(`[API Sync] Delete failed for table ${table}:`, errMsg);
      throw new Error(errMsg);
    }
  } catch (err) {
    console.error(`[API Sync] Delete server error on ${table}:`, err);
    throw err;
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
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (supabase) {
        const sessionRes = await supabase.auth.getSession();
        const token = sessionRes?.data?.session?.access_token;
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers,
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
  async subscribeToNewsletter(email: string): Promise<{ success: boolean; message: string; alreadySubscribed?: boolean }> {
    if (typeof window === 'undefined') return { success: false, message: 'Server-side call' };
    const key = 'curtain_newsletter_subscribers';
    const emailLower = email.toLowerCase().trim();
    
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    if (current.includes(emailLower)) {
      return { success: true, message: 'Already subscribed', alreadySubscribed: true };
    }
    
    try {
      // Sync to Supabase securely via admin-data bypass API and check database whitelists
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (supabase) {
        const sessionRes = await supabase.auth.getSession();
        const token = sessionRes?.data?.session?.access_token;
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/admin-data', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'subscriber',
          data: { email: emailLower }
        })
      });

      if (!res.ok) {
        console.error('[Admin Bypass Sync] Newsletter save failed:', res.statusText);
        return { success: false, message: 'Subscription failed' };
      }

      const resData = await res.json();
      if (resData.alreadySubscribed) {
        // Safe-heal cache in visitor storage
        if (!current.includes(emailLower)) {
          current.push(emailLower);
          localStorage.setItem(key, JSON.stringify(current));
        }
        return { success: true, message: 'Already subscribed', alreadySubscribed: true };
      }

      current.push(emailLower);
      localStorage.setItem(key, JSON.stringify(current));

      // Send Welcome Email ONLY for brand new newsletter subscriptions
      const subject = "Welcome to Curtain Call | The Front Row Seat";
      const htmlContent = getWelcomeNewsletterHtml(emailLower);

      this.sendEmail(emailLower, subject, htmlContent).catch(err => {
        console.error('Failed to dispatch welcome email:', err);
      });

      return { success: true, message: 'Subscribed successfully', alreadySubscribed: false };
    } catch (err: any) {
      console.error('[subscribeToNewsletter] error:', err);
      return { success: false, message: err.message || 'Subscription failed' };
    }
  },

  unsubscribeNewsletter(email: string): void {
    if (typeof window === 'undefined') return;
    const key = 'curtain_newsletter_subscribers';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = current.filter((item: any) => {
      const itemEmail = typeof item === 'string' ? item : item.email;
      return itemEmail.toLowerCase() !== email.toLowerCase();
    });
    localStorage.setItem(key, JSON.stringify(updated));

    const performDelete = async () => {
      try {
        const headers: Record<string, string> = {};
        if (supabase) {
          const sessionRes = await supabase.auth.getSession();
          const token = sessionRes?.data?.session?.access_token;
          if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        await fetch(`/api/admin-data?type=subscriber&email=${encodeURIComponent(email)}`, {
          method: 'DELETE',
          headers
        });
      } catch (err) {
        console.error('[ClientDB] Failed to delete subscriber:', err);
      }
    };
    performDelete();
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
    const profileToSave = {
      ...profile,
      username: profile.username || (profile.handle && !profile.handle.startsWith('@') ? profile.handle : undefined)
    };
    if (exists) {
      updated = current.map((p: any) => p.email.toLowerCase() === profile.email.toLowerCase() ? { ...p, ...profileToSave } : p);
    } else {
      updated.push(profileToSave);
    }
    localStorage.setItem(key, JSON.stringify(updated));

    // Sync to Supabase securely via admin-data bypass API
    const performSave = async () => {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (supabase) {
          const sessionRes = await supabase.auth.getSession();
          const token = sessionRes?.data?.session?.access_token;
          if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/admin-data', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            type: 'signup',
            data: {
              email: profile.email.toLowerCase(),
              name: profile.name,
              handle: profileToSave.username || profileToSave.handle || null,
              location: profile.location || null,
              joinDate: profile.joinDate || 'May 2026',
              isVerified: profile.isVerified ?? true,
              verificationCode: profile.verificationCode || null
            }
          })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error('[Admin Bypass Sync] Profile save failed:', errData);
        }
      } catch (err) {
        console.error('[Admin Bypass Sync] Fetch error:', err);
      }
    };
    performSave();
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

    const performDelete = async () => {
      try {
        const headers: Record<string, string> = {};
        if (supabase) {
          const sessionRes = await supabase.auth.getSession();
          const token = sessionRes?.data?.session?.access_token;
          if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        await fetch(`/api/admin-data?type=signup&email=${encodeURIComponent(email)}`, {
          method: 'DELETE',
          headers
        });
      } catch (err) {
        console.error('[ClientDB] Failed to delete profile signup:', err);
      }
    };
    performDelete();
  },

  // ── ARTISTS DATABASE ──
  getArtists(): Artist[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(ARTISTS_KEY);
    let list: Artist[];
    if (!stored) {
      localStorage.setItem(ARTISTS_KEY, JSON.stringify([]));
      list = [];
    } else {
      list = JSON.parse(stored);
      let migrated = false;
      list = list.map((artist: any) => {
        const mockMatch = MOCK_ARTISTS.find(m => m.id === artist.id);
        if (mockMatch) {
          let updated = false;
          const artistWithMock = { ...artist };
          if (mockMatch.career && !artist.career) {
            artistWithMock.career = mockMatch.career;
            updated = true;
          }
          if (mockMatch.style && !artist.style) {
            artistWithMock.style = mockMatch.style;
            updated = true;
          }
          if (mockMatch.achievements && mockMatch.achievements.length > 0 && (!artist.achievements || artist.achievements.length === 0)) {
            artistWithMock.achievements = mockMatch.achievements;
            updated = true;
          }
          if (updated) {
            migrated = true;
            return artistWithMock;
          }
        }
        return artist;
      });
      if (migrated) {
        localStorage.setItem(ARTISTS_KEY, JSON.stringify(list));
      }
    }
    
    // Ensure all artists dynamically have an SEO slug generated from their name
    const sanitized = list.map((a: any) => {
      if (!a.slug) {
        a.slug = generateSlug(a.name);
      }
      return a;
    });

    // Enforce high-precision newest-first sorting as the default returned order!
    return sortItemsByDateAdded(sanitized);
  },

  getArtistById(id: string): Artist | undefined {
    const artists = this.getArtists();
    return artists.find(a => a.id === id) || artists.find(a => a.slug === id);
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
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(PRODUCTIONS_KEY);
    let list: Production[];
    if (!stored) {
      localStorage.setItem(PRODUCTIONS_KEY, JSON.stringify([]));
      list = [];
    } else {
      list = JSON.parse(stored);
    }
    const mapped = list.map((p: any) => {
      // Dynamic Sanitizer: Ensure all plays always have a valid, clean SEO slug
      if (!p.slug) {
        p.slug = generateSlug(p.title);
      }

      // Dynamic Sanitizer: Recalculate status dynamically based on showDate
      p.status = calculateDynamicStatus(p.showDate, p.status);

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

    return sortItemsByDateAdded(mapped);
  },

  getProductionById(id: string): Production | undefined {
    if (!id) return undefined;
    const productions = this.getProductions();
    // Match by id first, then by slug (enables clean URL routing) case-insensitively
    let found = productions.find(p => p.id.toLowerCase() === id.toLowerCase()) || 
                productions.find(p => p.slug?.toLowerCase() === id.toLowerCase());
    if (!found) {
      // Fallback: If URL doesn't contain the timestamp but the ID does
      found = productions.find(p => p.id.toLowerCase().startsWith(id.toLowerCase() + '-'));
    }
    return found;
  },

  async saveProduction(production: Production): Promise<void> {
    if (typeof window === 'undefined') return;
    const productions = this.getProductions();
    const index = productions.findIndex(p => p.id === production.id);
    let updated;
    if (index !== -1) {
      updated = [...productions];
      updated[index] = production;
    } else {
      const duplicateIndex = productions.findIndex(p => p.title.toLowerCase() === production.title.toLowerCase());
      if (duplicateIndex !== -1) {
        updated = [...productions];
        updated[duplicateIndex] = production;
      } else {
        updated = [...productions, production];
      }
    }
    localStorage.setItem(PRODUCTIONS_KEY, JSON.stringify(updated));

    // Sync to cloud
    await syncToCloud('productions', mapProductionToDb(production));
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
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(ARTICLES_KEY);
    let list: Article[];
    if (!stored) {
      localStorage.setItem(ARTICLES_KEY, JSON.stringify([]));
      list = [];
    } else {
      list = JSON.parse(stored);
    }
    
    // Dynamically calculate read time
    const mapped = list.map((a: any) => {
      if (!a.readTime) {
        if (a.content) {
          const words = a.content.trim().split(/\s+/).length;
          const minutes = Math.max(1, Math.ceil(words / 200));
          a.readTime = `${minutes} min read`;
        } else {
          a.readTime = '5 min read';
        }
      }
      return a;
    });
    
    return sortItemsByDateAdded(mapped);
  },

  saveArticle(article: Article): void {
    if (typeof window === 'undefined') return;
    const articles = this.getArticles();
    const index = articles.findIndex(a => a.id === article.id);
    let updated;
    if (index !== -1) {
      updated = [...articles];
      updated[index] = article;
    } else {
      updated = [article, ...articles];
    }
    localStorage.setItem(ARTICLES_KEY, JSON.stringify(updated));

    // Sync to cloud
    syncToCloud('articles', mapArticleToDb(article));
  },

  deleteArticle(id: string): void {
    if (typeof window === 'undefined') return;
    const articles = this.getArticles();
    const updated = articles.filter(a => a.id !== id);
    localStorage.setItem(ARTICLES_KEY, JSON.stringify(updated));

    // Sync delete
    deleteFromCloud('articles', id);
  },

  incrementArticleView(id: string): void {
    if (typeof window === 'undefined') return;
    const articles = this.getArticles();
    const index = articles.findIndex(a => a.id === id);
    if (index !== -1) {
      const updated = [...articles];
      updated[index] = { ...updated[index], views: (updated[index].views || 0) + 1 };
      localStorage.setItem(ARTICLES_KEY, JSON.stringify(updated));
      // Sync to cloud (so other users see the updated view count eventually)
      syncToCloud('articles', mapArticleToDb(updated[index]));
    }
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

    // Trigger in-app notification
    if (artist.submitterEmail) {
      this.addNotification(artist.submitterEmail, {
        type: 'system',
        title: 'Artist Profile Submitted! 🎭',
        body: `Your submission for "${artist.name}" was received and is pending curatorial review.`
      });
    }
  },

  approveArtist(id: string): void {
    if (typeof window === 'undefined') return;
    const pending = this.getPendingArtists();
    const artist = pending.find(a => a.id === id);
    if (artist) {
      const approved = { 
        ...artist, 
        curationStatus: 'Approved' as const,
        createdAt: artist.createdAt || new Date().toISOString()
      };
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

    // Trigger in-app notification
    if (play.submitterEmail) {
      this.addNotification(play.submitterEmail, {
        type: 'system',
        title: 'Playbill Listing Submitted! 🎭',
        body: `Your stage playbill "${play.title}" has been successfully queued for curatorial review.`
      });
    }
  },

  approvePlay(id: string): void {
    if (typeof window === 'undefined') return;
    const pending = this.getPendingPlays();
    const play = pending.find(p => p.id === id);
    if (play) {
      const approved = { 
        ...play, 
        curationStatus: 'Approved' as const,
        slug: play.slug || generateSlug(play.title),
        createdAt: play.createdAt || new Date().toISOString()
      };
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

    // Trigger in-app notification
    if (article.submitterEmail) {
      this.addNotification(article.submitterEmail, {
        type: 'system',
        title: 'Chronicle Article Drafted! ✍️',
        body: `Your draft "${article.title}" has been submitted and queued for editorial board review.`
      });
    }
  },

  updatePendingArticle(article: Article): void {
    if (typeof window === 'undefined') return;
    const pending = this.getPendingArticles();
    const index = pending.findIndex(a => a.id === article.id);
    if (index !== -1) {
      const updated = [...pending];
      updated[index] = article;
      localStorage.setItem(PENDING_ARTICLES_KEY, JSON.stringify(updated));
      syncToCloud('articles', mapArticleToDb(article));
    }
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

    // Trigger in-app notification
    if (app.email) {
      this.addNotification(app.email, {
        type: 'critic',
        title: 'Application Received! 🛡️',
        body: 'Your Verified Critic application has been submitted and is pending curatorial review.'
      });
    }
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
      const welcomeHtml = getCriticApprovedHtml(app.name, app.email);
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
      const rejectionHtml = getCriticApplicationRejectedHtml();
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

  updateReview(updatedReview: any): void {
    if (typeof window === 'undefined') return;
    const reviews = this.getReviews();
    const index = reviews.findIndex(r => r.id === updatedReview.id);
    if (index === -1) return;

    const updated = [...reviews];
    updated[index] = { ...updated[index], ...updatedReview };
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));

    // Sync review to cloud
    syncToCloud('reviews', mapReviewToDb(updated[index]));

    // Recalculate production score
    const productionId = updated[index].productionId;
    const productions = this.getProductions();
    const production = productions.find(p => p.id === productionId);
    if (production) {
      const prodReviews = updated.filter(r => r.productionId === productionId);
      const critics = prodReviews.filter(r => r.type === 'Critic');
      const audience = prodReviews.filter(r => r.type === 'Audience');

      if (critics.length > 0) {
        const sum = critics.reduce((acc, r) => acc + r.rating, 0);
        production.criticScore = Math.round(sum / critics.length);
      } else {
        production.criticScore = null;
      }
      if (audience.length > 0) {
        const sum = audience.reduce((acc, r) => acc + r.rating, 0);
        production.audienceScore = parseFloat(((sum / audience.length) / 10).toFixed(1));
      } else {
        production.audienceScore = null;
      }
      production.totalReviews = prodReviews.length;
      this.saveProduction(production); // This will automatically sync production updates to cloud
    }
  },

  // ── WITHDRAWALS DATABASE ──
  getWithdrawals(): any[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('curtain_withdrawals');
    return stored ? JSON.parse(stored).map(mapWithdrawalFromDb) : [];
  },

  // ── USER BANK DETAILS ──
  getUserBankDetails(email: string): { bankCode: string; bankName: string; accountNumber: string; accountName: string } | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(USER_BANK_DETAILS_KEY);
    if (!stored) return null;
    const allProfiles = JSON.parse(stored);
    return allProfiles[email.toLowerCase()] || null;
  },

  saveUserBankDetails(email: string, details: { bankCode: string; bankName: string; accountNumber: string; accountName: string }): void {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(USER_BANK_DETAILS_KEY);
    const allProfiles = stored ? JSON.parse(stored) : {};
    allProfiles[email.toLowerCase()] = details;
    localStorage.setItem(USER_BANK_DETAILS_KEY, JSON.stringify(allProfiles));
  },

  submitWithdrawal(req: any): void {
    if (typeof window === 'undefined') return;
    const current = this.getWithdrawals();
    const updated = [req, ...current];
    localStorage.setItem('curtain_withdrawals', JSON.stringify(updated));

    // Sync to cloud withdrawals table
    syncToCloud('withdrawals', mapWithdrawalToDb(req));

    // Trigger in-app notification
    if (req.email) {
      this.addNotification(req.email, {
        type: 'system',
        title: 'Withdrawal Requested 💸',
        body: `Your withdrawal request of ₦${req.amount.toLocaleString()} to ${req.bankName} is pending admin approval.`
      });
    }
  },

  approveWithdrawal(id: string): void {
    if (typeof window === 'undefined') return;
    const current = this.getWithdrawals();
    const updated = current.map(w => w.id === id ? { ...w, status: 'Approved' } : w);
    localStorage.setItem('curtain_withdrawals', JSON.stringify(updated));

    const req = updated.find(w => w.id === id);
    if (req) {
      syncToCloud('withdrawals', mapWithdrawalToDb(req));

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
      syncToCloud('withdrawals', mapWithdrawalToDb(req));

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

  // ── QUIZ CASH CREDITS ──
  getQuizCashCredits(): any[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('curtain_quiz_cash_credits');
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
      const notifBody = `1 ${ticket.tier} ticket sold for "${prod.title}". Net: ₦${netEarnings.toLocaleString()} (Commission: ₦${commission.toLocaleString()}).`;
      
      this.addNotification(prod.submitterEmail, {
        type: 'ticket_sale',
        title: 'New ticket sale 🎟️',
        body: notifBody
      });

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px; border-radius: 24px; border: 1px solid #27272a; max-width: 600px; margin: 0 auto;">
          <h2 style="font-size: 24px; font-weight: bold; color: #ffffff; text-align: center;">New Ticket Sale 🎟️</h2>
          <div style="height: 2px; width: 80px; background-color: #dc2626; margin: 15px auto 25px;"></div>
          <p style="font-size: 15px; color: #d4d4d8; line-height: 1.6; text-align: center;">
            Great news! You just sold a ticket for <strong>${prod.title}</strong>.
          </p>
          <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 25px; margin: 30px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-size: 12px; color: #71717a;">Tier</td>
                <td style="padding: 8px 0; font-size: 14px; color: #ffffff; text-align: right; font-weight: bold;">${ticket.tier}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 12px; color: #71717a;">Gross Amount</td>
                <td style="padding: 8px 0; font-size: 14px; color: #ffffff; text-align: right; font-weight: bold;">₦${Number(ticket.price).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 12px; color: #71717a;">Commission (5%)</td>
                <td style="padding: 8px 0; font-size: 14px; color: #ef4444; text-align: right; font-weight: bold;">- ₦${commission.toLocaleString()}</td>
              </tr>
              <tr style="border-top: 1px dashed #27272a;">
                <td style="padding: 16px 0 8px; font-size: 13px; color: #a1a1aa; font-weight: bold;">Net Earnings</td>
                <td style="padding: 16px 0 8px; font-size: 16px; color: #22c55e; text-align: right; font-weight: bold;">₦${netEarnings.toLocaleString()}</td>
              </tr>
            </table>
          </div>
          <div style="text-align: center;">
            <a href="https://curtaincall.com.ng/creator" style="display: inline-block; background-color: #ffffff; color: #000000; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 12px; font-size: 14px;">View Dashboard</a>
          </div>
        </div>
      `;

      this.sendEmail(prod.submitterEmail, `New Ticket Sale: ${prod.title} 🎟️`, emailHtml).catch(console.error);
    }

    // Sync to cloud tickets table
    syncToCloud('tickets', mapTicketToDb(newTicket));
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
  },

  async uploadImage(file: File, maxDimension: number = 800, quality: number = 0.5): Promise<string> {
    const compressed = await this.compressImage(file, maxDimension, quality);
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64: compressed,
        filename: file.name,
        mimeType: file.type || 'image/jpeg'
      })
    });
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.url;
  }
};

// ── CLOUD PULL AND CACHE SYNC MECHANISM ──
export const syncFromSupabase = async (force = false) => {
  if (typeof window === 'undefined') return;

  // Caching/Throttling Policy: Prevent aggressive Supabase query costs/egress by checking if we synced recently
  if (!force) {
    const lastSyncStr = localStorage.getItem('cc_last_sync_time');
    if (lastSyncStr) {
      const lastSync = parseInt(lastSyncStr, 10);
      const now = Date.now();
      if (!isNaN(lastSync) && now - lastSync < 15000) { // 15 seconds cache TTL
        console.log('[Supabase Sync] Cache hit (last sync < 15s ago). Skipping cloud network request.');
        // Still fire event so components know they can read from localStorage
        window.dispatchEvent(new Event('cc-db-synced'));
        return;
      }
    }
  }

  let email = '';
  let isAdmin = false;
  try {
    const savedUser = localStorage.getItem('cc_authed_user');
    if (savedUser) {
      email = JSON.parse(savedUser).email || '';
      isAdmin = email.toLowerCase() === 'watchcurtaincall@gmail.com';
    }
  } catch (e) {}

  try {
    console.log('[Curtain Call Database] Starting high-speed parallel sync with Supabase cloud...');
    // Only use cache-busting timestamp on forced syncs, allowing CDN caching on normal syncs
    const publicUrl = force 
      ? `/api/sync-data?type=public&t=${Date.now()}` 
      : `/api/sync-data?type=public`;
    
    const privateUrl = email
      ? (force 
          ? `/api/sync-data?type=private&email=${encodeURIComponent(email)}&t=${Date.now()}`
          : `/api/sync-data?type=private&email=${encodeURIComponent(email)}`)
      : null;

    let authHeaders: Record<string, string> | undefined = undefined;
    if (supabase && privateUrl) {
      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes?.data?.session?.access_token;
      if (token) {
        authHeaders = { 'Authorization': `Bearer ${token}` };
      }
    }

    const fetchPromises: Promise<any>[] = [
      fetch(publicUrl, force ? { cache: 'no-store' } : undefined).then(r => r.ok ? r.json() : null)
    ];
    if (privateUrl) {
      fetchPromises.push(
        fetch(privateUrl, {
          cache: force ? 'no-store' : undefined,
          headers: authHeaders
        }).then(r => r.ok ? r.json() : null)
      );
    }

    const [publicRes, privateRes] = await Promise.all(fetchPromises);

    if (!publicRes) {
      console.error('[Supabase Sync] Public sync fetch failed');
      return;
    }

    const privateSyncSuccess = !privateUrl || privateRes !== null;
    if (privateUrl && !privateSyncSuccess) {
      console.warn('[Supabase Sync] Private sync failed (unauthorized or server error). Stale/local private data will be preserved.');
    }

    const combinedData = {
      productions: [
        ...(publicRes.productions || []),
        ...(privateRes?.productions || [])
      ],
      artists: [
        ...(publicRes.artists || []),
        ...(privateRes?.artists || [])
      ],
      articles: [
        ...(publicRes.articles || []),
        ...(privateRes?.articles || [])
      ],
      reviews: publicRes.reviews || [],
      approvedCritics: publicRes.approvedCritics || [],
      criticApplications: privateRes?.criticApplications || [],
      withdrawals: privateRes?.withdrawals || [],
      tickets: privateRes?.tickets || [],
      notifications: privateRes?.notifications || [],
      subscribers: privateRes?.subscribers || [],
      profiles: privateRes?.profiles || [],
      userProfile: privateRes?.userProfile || null,
      quizCashCredits: privateRes?.quizCashCredits || []
    };

    const data = combinedData;

    // 1. Process Productions
    if (data.productions) {
      const mappedRemote = data.productions.map(mapProductionFromDb);
      const approved = mappedRemote.filter((p: any) => p.curationStatus === 'Approved');
      
      const currentLocal = JSON.parse(localStorage.getItem(PRODUCTIONS_KEY) || '[]');
      const drafts = currentLocal.filter((p: any) => p.status === 'Draft');

      // createdAt Merge Policy: if the remote production is missing createdAt (e.g. old DB rows),
      // fall back to the locally cached value or derive it from the ID's embedded timestamp.
      const mergedApproved = approved.map((remoteProd: any) => {
        if (!remoteProd.createdAt) {
          const localProd = currentLocal.find((lp: any) => lp.id === remoteProd.id);
          if (localProd?.createdAt) {
            return { ...remoteProd, createdAt: localProd.createdAt };
          }
          // Derive from ID (e.g. 'the-regent-1748217143085' or 'direct_play_1748217143085')
          const match = remoteProd.id?.match(/\d{10,}/);
          if (match) {
            const ts = parseInt(match[0], 10);
            const ms = ts < 9999999999 ? ts * 1000 : ts;
            return { ...remoteProd, createdAt: new Date(ms).toISOString() };
          }
        }
        return remoteProd;
      });

      // Preserve locally-saved producer events that haven't been confirmed in cloud yet
      const localProducerPublished = currentLocal.filter((lp: any) => {
        // Keep any non-draft local production not yet in the remote approved list
        if (lp.status === 'Draft') return false;
        const inRemote = mergedApproved.some((rp: any) => rp.id === lp.id);
        return !inRemote;
      });

      localStorage.setItem(PRODUCTIONS_KEY, JSON.stringify([...mergedApproved, ...localProducerPublished, ...drafts]));
      
      if (privateSyncSuccess) {
        if (isAdmin) {
          const pendingRemote = mappedRemote.filter((p: any) => p.curationStatus === 'Pending');
          localStorage.setItem(PENDING_PLAYS_KEY, JSON.stringify(pendingRemote));
        } else {
          const cleanEmail = email ? email.toLowerCase() : '';
          const pendingRemote = mappedRemote.filter((p: any) => 
            p.curationStatus === 'Pending' && 
            p.submitterEmail && 
            p.submitterEmail.toLowerCase() === cleanEmail
          );
          
          const localPending = JSON.parse(localStorage.getItem(PENDING_PLAYS_KEY) || '[]');
          const unsynced = localPending.filter((lp: any) => !mappedRemote.some((rp: any) => rp.id === lp.id));
          for (const req of unsynced) {
            console.log('[Two-Way Sync] Uploading unsynced local pending play:', req.id);
            await syncToCloud('productions', mapProductionToDb(req));
          }
          const finalPending = [...unsynced, ...pendingRemote];
          localStorage.setItem(PENDING_PLAYS_KEY, JSON.stringify(finalPending));
        }
      }
    }

    // 2. Process Artists
    if (data.artists) {
      const mappedRemote = data.artists.map(mapArtistFromDb);
      const approved = mappedRemote.filter((a: any) => a.curationStatus === 'Approved');
      
      // Hits Max Merge Policy to prevent view count rollbacks
      const localArtists = JSON.parse(localStorage.getItem(ARTISTS_KEY) || '[]');
      const mergedApproved = approved.map((remoteArtist: any) => {
        const localArtist = localArtists.find((la: any) => la.id === remoteArtist.id);
        if (localArtist) {
          return {
            ...remoteArtist,
            hits: Math.max(localArtist.hits || 0, remoteArtist.hits || 0)
          };
        }
        return remoteArtist;
      });
      localStorage.setItem(ARTISTS_KEY, JSON.stringify(mergedApproved));
      
      if (privateSyncSuccess) {
        if (isAdmin) {
          const pendingRemote = mappedRemote.filter((a: any) => a.curationStatus === 'Pending');
          localStorage.setItem(PENDING_ARTISTS_KEY, JSON.stringify(pendingRemote));
        } else {
          const cleanEmail = email ? email.toLowerCase() : '';
          const pendingRemote = mappedRemote.filter((a: any) => 
            a.curationStatus === 'Pending' && 
            a.submitterEmail && 
            a.submitterEmail.toLowerCase() === cleanEmail
          );
          
          const localPending = JSON.parse(localStorage.getItem(PENDING_ARTISTS_KEY) || '[]');
          const unsynced = localPending.filter((la: any) => !mappedRemote.some((ra: any) => ra.id === la.id));
          for (const req of unsynced) {
            console.log('[Two-Way Sync] Uploading unsynced local pending artist:', req.id);
            await syncToCloud('artists', mapArtistToDb(req));
          }
          const finalPending = [...unsynced, ...pendingRemote];
          localStorage.setItem(PENDING_ARTISTS_KEY, JSON.stringify(finalPending));
        }
      }
    }

    // 3. Process Articles
    if (data.articles) {
      const currentLocalArticles = JSON.parse(localStorage.getItem(ARTICLES_KEY) || '[]');
      const mappedRemote = data.articles.map((row: any) => {
        const mapped = mapArticleFromDb(row);
        if (row.views === undefined) {
           const local = currentLocalArticles.find((a: any) => a.id === row.id);
           if (local && local.views !== undefined) mapped.views = local.views;
        }
        return mapped;
      });
      const approved = mappedRemote.filter((a: any) => a.curationStatus === 'Approved');

      localStorage.setItem(ARTICLES_KEY, JSON.stringify(approved));
      
      if (privateSyncSuccess) {
        if (isAdmin) {
          const pendingRemote = mappedRemote.filter((a: any) => a.curationStatus === 'Pending');
          localStorage.setItem(PENDING_ARTICLES_KEY, JSON.stringify(pendingRemote));
        } else {
          const cleanEmail = email ? email.toLowerCase() : '';
          const pendingRemote = mappedRemote.filter((a: any) => 
            a.curationStatus === 'Pending' && 
            a.submitterEmail && 
            a.submitterEmail.toLowerCase() === cleanEmail
          );
          
          const localPending = JSON.parse(localStorage.getItem(PENDING_ARTICLES_KEY) || '[]');
          const unsynced = localPending.filter((la: any) => !mappedRemote.some((ra: any) => ra.id === la.id));
          for (const req of unsynced) {
            console.log('[Two-Way Sync] Uploading unsynced local pending article:', req.id);
            await syncToCloud('articles', mapArticleToDb(req));
          }
          const finalPending = [...unsynced, ...pendingRemote];
          localStorage.setItem(PENDING_ARTICLES_KEY, JSON.stringify(finalPending));
        }
      }
    }

    // 4. Process Reviews
    if (data.reviews) {
      const mapped = data.reviews.map(mapReviewFromDb);
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(mapped));
    }

    // 5. Process Critic Applications
    if (data.criticApplications && privateSyncSuccess) {
      const mapped = data.criticApplications.map(mapCriticAppFromDb);
      
      if (isAdmin) {
        const pending = mapped.filter((a: any) => a.curationStatus === 'Pending');
        localStorage.setItem(PENDING_CRITICS_KEY, JSON.stringify(pending));
      } else {
        const cleanEmail = email ? email.toLowerCase() : '';
        const pending = mapped.filter((a: any) => a.curationStatus === 'Pending' && a.email && a.email.toLowerCase() === cleanEmail);
        localStorage.setItem(PENDING_CRITICS_KEY, JSON.stringify(pending));
      }
    }

    // 6. Process Whitelist approved critics
    if (data.approvedCritics) {
      const defaultApproved = [
        'critic@example.com',
        'editor@example.com',
        'verify@example.com',
        'adaeze@example.com'
      ];
      const merged = Array.from(new Set([...defaultApproved, ...data.approvedCritics.map((e: string) => e.toLowerCase())]));
      localStorage.setItem('curtain_approved_critic_emails', JSON.stringify(merged));
    }

    // 7. Pull & Sync Withdrawals (Two-Way Self-Healing Sync)
    if (data.withdrawals && privateSyncSuccess) {
      const localWithdrawals = JSON.parse(localStorage.getItem('curtain_withdrawals') || '[]').map(mapWithdrawalFromDb);
      const mappedRemote = data.withdrawals.map(mapWithdrawalFromDb);
      
      // Find local withdrawals that aren't on the server yet
      const unsynced = localWithdrawals.filter((lw: any) => !mappedRemote.some((rw: any) => rw.id === lw.id));
      
      for (const req of unsynced) {
        console.log('[Two-Way Sync] Uploading unsynced local withdrawal request:', req.id);
        await syncToCloud('withdrawals', mapWithdrawalToDb(req));
      }
      
      let finalRemote = mappedRemote;
      if (!isAdmin) {
        const cleanEmail = email ? email.toLowerCase() : '';
        finalRemote = mappedRemote.filter((w: any) => w.email && w.email.toLowerCase() === cleanEmail);
      }
      
      localStorage.setItem('curtain_withdrawals', JSON.stringify([...unsynced, ...finalRemote]));
    }

    // 8. Pull & Sync Tickets (Two-Way Self-Healing Sync)
    if (data.tickets && privateSyncSuccess) {
      const mappedRemote = data.tickets.map(mapTicketFromDb);
      const localTickets = JSON.parse(localStorage.getItem('curtain_tickets') || '[]').map(mapTicketFromDb);
      
      // Find local tickets that are not present in remote database
      const unsynced = localTickets.filter((lt: any) => !mappedRemote.some((rt: any) => rt.id === lt.id || rt.reference === lt.reference));
      
      for (const tkt of unsynced) {
        console.log('[Two-Way Sync] Uploading unsynced local ticket purchase:', tkt.id);
        await syncToCloud('tickets', mapTicketToDb(tkt));
      }
      
      let finalRemote = mappedRemote;
      if (!isAdmin) {
        const cleanEmail = email ? email.toLowerCase() : '';
        const userPlayIds = (data.productions || [])
          .filter((p: any) => p.submitter_email && p.submitter_email.toLowerCase() === cleanEmail)
          .map((p: any) => p.id);
        
        finalRemote = mappedRemote.filter((t: any) => 
          (t.buyerEmail && t.buyerEmail.toLowerCase() === cleanEmail) ||
          userPlayIds.includes(t.productionId)
        );
      }
      
      const finalTickets = [ ...unsynced, ...finalRemote ];
      localStorage.setItem('curtain_tickets', JSON.stringify(finalTickets));
    }

    // Process Quiz Cash Credits
    if (data.quizCashCredits && privateSyncSuccess) {
      localStorage.setItem('curtain_quiz_cash_credits', JSON.stringify(data.quizCashCredits));
    }

    // 9. Process Notifications
    if (data.notifications && privateSyncSuccess) {
      localStorage.setItem('curtain_notifications', JSON.stringify(data.notifications));
    } else if (!email) {
      localStorage.removeItem('curtain_notifications');
    }

    // 10. Process Admin-only data
    if (isAdmin) {
      if (privateSyncSuccess) {
        if (data.subscribers) {
          localStorage.setItem('curtain_newsletter_subscribers', JSON.stringify(data.subscribers));
        }
        if (data.profiles) {
          localStorage.setItem('curtain_user_profiles', JSON.stringify(data.profiles));
        }
        if (data.productions) {
          const pendingPlays = data.productions.map(mapProductionFromDb).filter((p: any) => p.curationStatus === 'Pending');
          localStorage.setItem(PENDING_PLAYS_KEY, JSON.stringify(pendingPlays));
        }
        if (data.artists) {
          const pendingArtists = data.artists.map(mapArtistFromDb).filter((a: any) => a.curationStatus === 'Pending');
          localStorage.setItem(PENDING_ARTISTS_KEY, JSON.stringify(pendingArtists));
        }
        if (data.articles) {
          const pendingArticles = data.articles.map(mapArticleFromDb).filter((a: any) => a.curationStatus === 'Pending');
          localStorage.setItem(PENDING_ARTICLES_KEY, JSON.stringify(pendingArticles));
        }
        if (data.criticApplications) {
          const pendingCritics = data.criticApplications.map(mapCriticAppFromDb).filter((c: any) => c.curationStatus === 'Pending');
          localStorage.setItem(PENDING_CRITICS_KEY, JSON.stringify(pendingCritics));
        }
      }
    } else {
      // Security/Privacy: completely clear signups/subscribers lists for non-admin users!
      localStorage.removeItem('curtain_user_profiles');
      localStorage.removeItem('curtain_newsletter_subscribers');
    }

    localStorage.setItem('cc_last_sync_time', Date.now().toString());
    console.log('[Curtain Call Database] Unified sync successfully completed with Supabase cloud in one round-trip!');
  } catch (err) {
    console.error('[Supabase Sync] Pull error:', err);
  } finally {
    window.dispatchEvent(new Event('cc-db-synced'));
  }
};

// Auto-trigger background cloud sync pull in client context
if (typeof window !== 'undefined') {
  syncFromSupabase();

  // Revalidate database sync on tab focus or visibility changes
  let focusThrottleTimer = 0;
  const handleFocus = () => {
    if (document.visibilityState === 'visible') {
      const now = Date.now();
      // Add a client-side throttle to avoid double-firing focus events in under 5 seconds
      if (now - focusThrottleTimer > 5000) {
        focusThrottleTimer = now;
        console.log('[Database] Tab focus/visibility detected. Triggering background revalidation sync...');
        syncFromSupabase().catch(err => console.error('[Database] Focus revalidation failed:', err));
      }
    }
  };

  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleFocus);
}

// Robust, high-precision sorting utility to order plays, artists, and articles by date added descending (newest first)
export function sortItemsByDateAdded<T extends { id: string; createdAt?: string | null }>(items: T[]): T[] {
  // Pre-build an index map so UUID-fallback scoring uses the ORIGINAL array order
  const indexMap = new Map<T, number>(items.map((item, i) => [item, i]));

  const getScore = (item: T): number => {
    // 1. If createdAt is present and valid, use its timestamp
    if (item.createdAt) {
      const parsedTime = new Date(item.createdAt).getTime();
      if (!isNaN(parsedTime) && parsedTime > 0) return parsedTime;
    }

    // 2. Parse timestamp from dynamic custom IDs like 'pending_play_1779...', 'direct_play_1779...'
    const match = item.id.match(/\d{10,}/);
    if (match) {
      const ts = parseInt(match[0], 10);
      // Scale 10-digit Unix seconds to milliseconds
      return ts < 9999999999 ? ts * 1000 : ts;
    }

    // 3. Extract number from mock IDs like 'p1'..'p10', 'a1'..'a10', etc.
    const mockMatch = item.id.match(/^[a-z](\d+)$/i);
    if (mockMatch) {
      // Place mock items just above the bottom — newer mocks have higher numbers
      return 1000000000000 + parseInt(mockMatch[1], 10) * 1000;
    }

    // 4. For UUID-style IDs (Supabase-generated), use original array position as proxy for
    //    insertion order (data arrives ordered by created_at DESC from server).
    //    Assign a very recent score minus the array index so first in array = newest.
    const arrayIndex = indexMap.get(item) ?? 0;
    return Date.now() - arrayIndex * 10;
  };

  return [...items].sort((a, b) => getScore(b) - getScore(a));
}

// Strip HTML tags helper to prevent raw tags from showing in previews
export function stripHtml(html?: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}
