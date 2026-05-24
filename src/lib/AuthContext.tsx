'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClientDB, supabase } from './db';

export interface MockUser {
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  ratings: number;
  reviews: number;
  points: number;
  badgesUnlocked: number;
  totalBadges: number;
  handle?: string;
  bio?: string;
  location?: string;
}

const MOCK_USER: MockUser = {
  name: 'Adaeze Obi',
  email: 'adaeze@example.com',
  avatar: 'AO',
  joinDate: 'May 2024',
  ratings: 71,
  reviews: 133,
  points: 1010,
  badgesUnlocked: 6,
  totalBadges: 14,
  handle: 'adaeze_obi',
  bio: '',
  location: ''
};

interface AuthContextType {
  user: MockUser | null;
  login: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, password?: string, name?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: { name?: string; handle?: string; bio?: string; location?: string }) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  signUp: async () => {},
  logout: () => {},
  updateProfile: () => {},
});

// Helper to derive a clean default handle from user full name
const deriveHandle = (name: string, email: string): string => {
  const base = name || email.split('@')[0];
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9_ ]/g, '') // remove special characters
    .trim()
    .replace(/\s+/g, '_'); // replace spaces with underscores
  return '@' + (cleaned || 'user');
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('cc_authed');
    const savedUser = localStorage.getItem('cc_authed_user');
    if (saved === 'true' && savedUser) {
      setUser(JSON.parse(savedUser));
    }

    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const email = session.user.email || '';
          const name = session.user.user_metadata?.full_name || email.split('@')[0];
          const loggedUser = {
            name,
            email,
            avatar: name.slice(0, 2).toUpperCase(),
            joinDate: 'May 2026',
            ratings: 0,
            reviews: 0,
            points: 0,
            badgesUnlocked: 0,
            totalBadges: 14,
            handle: deriveHandle(name, email),
            bio: '',
            location: ''
          };
          setUser(loggedUser);
          localStorage.setItem('cc_authed', 'true');
          localStorage.setItem('cc_authed_user', JSON.stringify(loggedUser));
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          const email = session.user.email || '';
          const name = session.user.user_metadata?.full_name || email.split('@')[0];
          const loggedUser = {
            name,
            email,
            avatar: name.slice(0, 2).toUpperCase(),
            joinDate: 'May 2026',
            ratings: 0,
            reviews: 0,
            points: 0,
            badgesUnlocked: 0,
            totalBadges: 14,
            handle: deriveHandle(name, email),
            bio: '',
            location: ''
          };
          setUser(loggedUser);
          localStorage.setItem('cc_authed', 'true');
          localStorage.setItem('cc_authed_user', JSON.stringify(loggedUser));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('cc_authed');
          localStorage.removeItem('cc_authed_user');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string, password?: string) => {
    let loggedUser = MOCK_USER;
    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail === 'watchcurtaincall@gmail.com') {
      loggedUser = {
        name: 'Watch Curtain Call Admin',
        email: 'watchcurtaincall@gmail.com',
        avatar: 'WCC',
        joinDate: 'May 2026',
        ratings: 120,
        reviews: 88,
        points: 2500,
        badgesUnlocked: 10,
        totalBadges: 14,
        handle: '@watchcurtaincall',
        bio: 'Curtain Call Administrative Curation Board.',
        location: 'Lagos, Nigeria'
      };
      ClientDB.addApprovedCriticEmail('watchcurtaincall@gmail.com');
      setUser(loggedUser);
      localStorage.setItem('cc_authed', 'true');
      localStorage.setItem('cc_authed_user', JSON.stringify(loggedUser));
      return;
    }

    if (supabase && password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });
      if (error) throw error;
      
      if (data?.user) {
        const name = data.user.user_metadata?.full_name || cleanEmail.split('@')[0];
        loggedUser = {
          name,
          email: cleanEmail,
          avatar: name.slice(0, 2).toUpperCase(),
          joinDate: 'May 2026',
          ratings: 0,
          reviews: 0,
          points: 0,
          badgesUnlocked: 0,
          totalBadges: 14,
          handle: deriveHandle(name, cleanEmail),
          bio: '',
          location: ''
        };
      }
    } else {
      // Local Simulation Fallback
      if (cleanEmail === 'watchcurtaincall@gmail.com') {
        loggedUser = {
          name: 'Watch Curtain Call Admin',
          email: 'watchcurtaincall@gmail.com',
          avatar: 'WCC',
          joinDate: 'May 2026',
          ratings: 120,
          reviews: 88,
          points: 2500,
          badgesUnlocked: 10,
          totalBadges: 14,
          handle: '@watchcurtaincall',
          bio: 'Curtain Call Administrative Curation Board.',
          location: 'Lagos, Nigeria'
        };
        ClientDB.addApprovedCriticEmail('watchcurtaincall@gmail.com');
      } else {
        const displayName = cleanEmail.split('@')[0];
        loggedUser = {
          name: displayName,
          email: cleanEmail,
          avatar: displayName.slice(0, 2).toUpperCase(),
          joinDate: 'May 2026',
          ratings: 0,
          reviews: 0,
          points: 0,
          badgesUnlocked: 0,
          totalBadges: 14,
          handle: deriveHandle(displayName, cleanEmail),
          bio: '',
          location: ''
        };
      }
    }
    
    setUser(loggedUser);
    localStorage.setItem('cc_authed', 'true');
    localStorage.setItem('cc_authed_user', JSON.stringify(loggedUser));
  };

  const signUp = async (email: string, password?: string, name?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const displayName = name || email.split('@')[0];
    
    let loggedUser = {
      name: displayName,
      email: cleanEmail,
      avatar: displayName.slice(0, 2).toUpperCase(),
      joinDate: 'May 2026',
      ratings: 0,
      reviews: 0,
      points: 0,
      badgesUnlocked: 0,
      totalBadges: 14,
      handle: deriveHandle(displayName, cleanEmail),
      bio: '',
      location: ''
    };

    if (supabase && password) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: displayName
          }
        }
      });
      if (error) throw error;
      
      if (data?.user) {
        loggedUser.email = data.user.email || cleanEmail;
      }
    }

    setUser(loggedUser);
    localStorage.setItem('cc_authed', 'true');
    localStorage.setItem('cc_authed_user', JSON.stringify(loggedUser));

    // Send Welcome Email ONLY on new signups!
    const welcomeHtml = `
      <div style="font-family: sans-serif; background-color: #0c0c0e; color: #ffffff; padding: 40px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); max-width: 600px; margin: 0 auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <div style="text-align: center; margin-bottom: 35px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 20px;">
          <span style="font-size: 26px; font-weight: bold; letter-spacing: 3px; color: #ef4444; font-family: serif; text-transform: uppercase;">CURTAIN CALL</span>
          <p style="color: #a1a1aa; font-size: 11px; margin-top: 5px; text-transform: uppercase; letter-spacing: 1.5px;">The Front Row for African Theatre</p>
        </div>
        
        <h2 style="font-family: serif; color: #ffffff; font-size: 24px; margin-top: 0; text-align: center; font-weight: bold;">Welcome to the Stage, ${displayName}! 🎭</h2>
        
        <p style="color: #d4d4d8; font-size: 15px; line-height: 1.7; text-align: center;">
          We are absolutely thrilled to welcome you to the continent's premier digital home for theatre culture. You have successfully created your digital profile.
        </p>

        <div style="height: 1px; background: rgba(255,255,255,0.05); margin: 30px 0;"></div>
        
        <h3 style="font-family: serif; color: #ffffff; font-size: 18px; margin-top: 0; font-weight: bold;">🌟 What is Curtain Call?</h3>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
          Curtain Call is a premium living archive and database dedicated to preserving, amplifying, and reviewing regional African stages, playbills, opinion pieces, and theatremaker histories.
        </p>

        <h3 style="font-family: serif; color: #ffffff; font-size: 18px; margin-top: 0; font-weight: bold;">⚡ What can you do on the app?</h3>
        <ul style="color: #d4d4d8; font-size: 14px; line-height: 1.8; padding-left: 20px; margin-bottom: 30px;">
          <li style="margin-bottom: 12px;">🎟️ <strong>Buy & Manage Tickets</strong>: Discover live theatrical productions in your city, purchase gate entries securely via Paystack, and receive immediate admissions vouchers directly to your inbox.</li>
          <li style="margin-bottom: 12px;">📁 <strong>Claim/Submit Playbills</strong>: Submit and build your digital playbills, cast rosters, and crew directory credits directly from your producer dashboard.</li>
          <li style="margin-bottom: 12px;">✍️ <strong>Write Stage Chronicles</strong>: Publish opinion pieces, theatrical analyses, and essays to be featured on our main editorial chronicle feed.</li>
          <li style="margin-bottom: 12px;">✒️ <strong>Review Plays & Rate</strong>: Share your reviews as an audience member. If you are an active journalist or critic, apply for <strong>Verified Critic</strong> status to publish official grades!</li>
        </ul>
        
        <div style="background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 30px;">
          <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px 0;">Your Registered Account Email:</p>
          <code style="font-size: 14px; color: #22c55e; font-family: monospace; font-weight: bold; background: rgba(34,197,94,0.08); padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(34,197,94,0.15);">${cleanEmail}</code>
        </div>
        
        <p style="color: #a1a1aa; font-size: 12px; line-height: 1.6; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 25px; margin-top: 35px; text-align: center;">
          If you have any questions or need curator assistance with listing claims, simply reply directly to this email! Welcome aboard.
          <br/><br/>
          Sincerely,<br/>
          <strong>The Curtain Call Curation Board</strong>
        </p>
      </div>
    `;
    ClientDB.sendEmail(cleanEmail, 'Welcome to Curtain Call! 🎭', welcomeHtml).catch(err => {
      console.error('Welcome email delivery failed:', err);
    });
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('cc_authed');
    localStorage.removeItem('cc_authed_user');
  };

  const updateProfile = (updates: { name?: string; handle?: string; bio?: string; location?: string }) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      ...updates,
      avatar: (updates.name || user.name).slice(0, 2).toUpperCase()
    };
    setUser(updatedUser);
    localStorage.setItem('cc_authed_user', JSON.stringify(updatedUser));

    // Also trigger custom event to notify profile page
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cc-profile-updated'));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signUp, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
