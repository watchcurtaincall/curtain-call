import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://curtaincall.com.ng';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/plays`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/artists`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/editorial`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/quiz`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  try {
    let productions: any[] = [];
    
    if (supabase) {
      const { data } = await supabase.from('productions').select('id, slug, updated_at');
      if (data) productions = data;
    }

    if (productions.length === 0) {
      const { MOCK_PRODUCTIONS } = require('@/lib/mock');
      productions = MOCK_PRODUCTIONS;
    }

    productions.forEach((prod) => {
      routes.push({
        url: `${BASE_URL}/productions/${prod.slug || prod.id}`,
        lastModified: prod.updated_at ? new Date(prod.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });

  } catch (err) {
    console.error('Sitemap productions error:', err);
  }

  try {
    const { ClientDB } = await import('@/lib/db');
    // ClientDB works on server if using mock data fallbacks, but localStorage is not defined.
    // However, articles are hardcoded as a fallback array in db.ts if supabase fails. 
    // Wait, ClientDB uses localStorage and is marked 'use client'. We shouldn't use it in a server component.
  } catch (err) {
    // Ignore client side DB error
  }

  // To prevent errors from ClientDB on the server, we will just use the mock articles directly.
  try {
    // The articles are currently hardcoded in db.ts, so we'll just link the main ones for now.
    // A real app would fetch from Supabase.
    const articleIds = ['art1', 'art2', 'art3'];
    articleIds.forEach(id => {
      routes.push({
        url: `${BASE_URL}/editorial/${id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    });
  } catch(e) {}

  return routes;
}
