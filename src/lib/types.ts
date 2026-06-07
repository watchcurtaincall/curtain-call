export type ProductionStatus = 'Currently Showing' | 'Coming Soon' | 'Past Production' | 'Recently Concluded' | 'Draft';

export interface ArtistAward {
  title: string;
  category: string;
  year: string;
  status: 'won' | 'nominated' | 'lost';
}

export interface Artist {
  id: string;
  slug?: string;        // Clean URL slug e.g. "james-brown" — used as the URL path segment
  createdAt?: string;   // ISO timestamp for reliable newest-first sorting
  name: string;
  roleType: string;
  headshotUrl: string;
  bio?: string;
  dateOfBirth?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  submitterEmail?: string;
  curationStatus?: 'Pending' | 'Approved' | 'Declined';
  isDeceased?: boolean;
  dateOfDeath?: string;
  hits?: number;
  scenography?: { productionId: string; productionTitle: string; role: string }[];
  career?: string;
  style?: string;
  achievements?: string[];
  awards?: ArtistAward[];
}

export interface Production {
  id: string;
  slug?: string;        // Clean URL slug e.g. "saro-the-musical" — used as the URL path segment
  createdAt?: string;   // ISO timestamp for reliable newest-first sorting
  title: string;
  eventType?: 'Theatre' | 'Party' | 'Community' | 'Comedy' | 'Music' | 'Concert' | 'Festival' | 'Workshop' | 'Conference' | 'Exhibition' | 'Sports' | 'Other';
  customEventType?: string;
  productionType?: 'Student' | 'Professional';
  synopsis: string;
  genre: string;
  runtime: string;
  venue: string;
  status: ProductionStatus;
  posterUrl: string;
  criticScore: number | null; // e.g. 85 (percentage)
  audienceScore: number | null; // e.g. 8.5 (out of 10)
  totalReviews: number;
  galleryImages?: string[]; // Multiple photos uploaded by users / admins
  submitterEmail?: string;
  curationStatus?: 'Pending' | 'Approved' | 'Declined';
  castAndCrew?: { name: string; role: string; category: 'Creative' | 'Cast' | 'Technical' }[];
  showDate?: string; // YYYY-MM-DD
  showTime?: string; // HH:MM (24h or string format)
  isProducerManaged?: boolean;
  ticketTiers?: { id: string; name: string; price: string; capacity: string; description?: string }[];
  city?: string;
  address?: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  externalTicketUrl?: string;
}

export interface Article {
  id: string;
  createdAt?: string;   // ISO timestamp for reliable newest-first sorting
  title: string;
  excerpt: string;
  date: string;
  author: string;
  imageUrl: string;
  content?: string;
  readTime?: string;
  views?: number;
  submitterEmail?: string;
  curationStatus?: 'Pending' | 'Approved' | 'Declined';
}



// ── DAILY QUIZ TYPES ──

export type QuizResultType = 'won' | 'consolation' | 'failed' | 'voided' | 'redeemed';
export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuizBadge = '7_day' | '30_day' | '100_day';

// Client-facing question — correctAnswerIndex is intentionally omitted
export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];        // always 4 items
  difficulty: QuizDifficulty;
  index: number;            // 0-4
}

// Internal question shape stored in quiz_days (includes correct answer)
export interface QuizQuestionInternal extends QuizQuestion {
  correctAnswerIndex: number;  // 0-3
  theme: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizDate: string;
  status: 'pending' | 'completed' | 'voided';
  resultType?: QuizResultType;
  score?: number;
  pointsAwarded: number;
  slotPosition?: number;
  answers: Array<{ questionId: string; selectedIndex: number; elapsedMs: number }>;
  startedAt: string;
  completedAt?: string;
}

export interface QuizPointTransaction {
  id: string;
  userId: string;
  quizDate?: string;
  resultType: QuizResultType;
  pointsDelta: number;
  balanceAfter: number;
  createdAt: string;
}

export interface QuizStatus {
  quizDate: string;
  slotsRemaining: number;
  totalSlots: number;
  userAttempt: {
    status: 'none' | 'pending' | 'completed' | 'voided';
    score?: number;
    pointsAwarded?: number;
    slotPosition?: number;
    resultType?: QuizResultType;
  };
  streakCount: number;
  questionsReady: boolean;
}
