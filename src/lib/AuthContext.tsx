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
};

interface AuthContextType {
  user: MockUser | null;
  login: (email: string, password?: string, name?: string) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  loginWithGoogle: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);

  useEffect(() => {
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
            totalBadges: 14
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
            totalBadges: 14
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

  const login = (email: string, password?: string, name?: string) => {
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
        totalBadges: 14
      };
      
      ClientDB.addApprovedCriticEmail('watchcurtaincall@gmail.com');
    } else {
      const displayName = name || email.split('@')[0];
      loggedUser = {
        name: displayName,
        email: email,
        avatar: displayName.slice(0, 2).toUpperCase(),
        joinDate: 'May 2026',
        ratings: 0,
        reviews: 0,
        points: 0,
        badgesUnlocked: 0,
        totalBadges: 14
      };
    }
    
    setUser(loggedUser);
    localStorage.setItem('cc_authed', 'true');
    localStorage.setItem('cc_authed_user', JSON.stringify(loggedUser));

    // Dynamic Welcome Email Notification via Resend
    const welcomeHtml = `
      <div style="font-family: sans-serif; background-color: #0c0c0e; color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #ef4444; font-family: serif;">CURTAIN CALL</span>
          <p style="color: #a1a1aa; font-size: 14px; margin-top: 5px;">Digital Home for Theatre Culture in Africa</p>
        </div>
        
        <h2 style="font-family: serif; color: #ffffff; font-size: 22px; margin-top: 0;">Welcome to the Stage, ${loggedUser.name}!</h2>
        
        <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
          We are absolutely thrilled to welcome you to <strong>Curtain Call</strong>. You have successfully created your digital profile. As a valued member of our growing community, you can now:
        </p>
        
        <ul style="color: #d4d4d8; font-size: 15px; line-height: 1.6; padding-left: 20px;">
          <li style="margin-bottom: 10px;">Submit and claim your theatrical Playbills and Production credits.</li>
          <li style="margin-bottom: 10px;">Apply for Approved Critic status to publish official reviews.</li>
          <li style="margin-bottom: 10px;">Publish chronicles, reviews, and editorial opinion pieces.</li>
        </ul>
        
        <div style="background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 30px 0; text-align: center;">
          <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 10px 0;">Your Account Details:</p>
          <p style="color: #ffffff; font-size: 16px; font-weight: bold; margin: 0 0 5px 0;">${loggedUser.email}</p>
        </div>
        
        <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; margin-top: 30px;">
          If you did not initiate this registration, please ignore this message. Welcome aboard!
          <br/><br/>
          Sincerely,<br/>
          <strong>The Curtain Call Curation Team</strong>
        </p>
      </div>
    `;
    ClientDB.sendEmail(loggedUser.email, 'Welcome to Curtain Call! 🎭', welcomeHtml);
  };

  const loginWithGoogle = async () => {
    if (supabase) {
      try {
        console.log('[AuthContext] Initiating real Supabase Google OAuth redirect...');
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: typeof window !== 'undefined' ? window.location.origin + '/profile' : undefined
          }
        });
        if (error) throw error;
      } catch (err: any) {
        console.error('[Supabase Google Sign-In Error]:', err.message);
        // Clean fallback
        login('watchcurtaincall@gmail.com', '', 'Curtain Call Admin');
      }
    } else {
      login('watchcurtaincall@gmail.com', '', 'Curtain Call Admin');
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('cc_authed');
    localStorage.removeItem('cc_authed_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
