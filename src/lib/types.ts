export type ProductionStatus = 'Currently Showing' | 'Coming Soon' | 'Past Production' | 'Recently Concluded';

export interface Artist {
  id: string;
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
}

export interface Production {
  id: string;
  title: string;
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
  ticketTiers?: { id: string; name: string; price: string; capacity: string }[];
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  imageUrl: string;
  content?: string;
  submitterEmail?: string;
  curationStatus?: 'Pending' | 'Approved' | 'Declined';
}


