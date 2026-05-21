'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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
  login: () => void;
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
    if (saved === 'true') setUser(MOCK_USER);
  }, []);

  const login = () => {
    setUser(MOCK_USER);
    localStorage.setItem('cc_authed', 'true');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cc_authed');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
