'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClientDB } from './db';

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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cc_authed');
    const savedUser = localStorage.getItem('cc_authed_user');
    if (saved === 'true') {
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(MOCK_USER);
      }
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
      
      // Auto-approve as approved critic on login
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
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cc_authed');
    localStorage.removeItem('cc_authed_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
