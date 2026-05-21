'use client';

import { useState } from 'react';
import Link from "next/link";
import { Search, User, Menu, X } from "lucide-react";
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

const NAV_LINKS = [
  { href: '/discovery', label: 'Discovery' },
  { href: '/plays', label: 'Plays' },
  { href: '/critics', label: 'Critics' },
  { href: '/editorial', label: 'Editorial' },
  { href: '/artists', label: 'Artists' },
  { href: '/submit', label: 'Submit' },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const close = () => { setIsMenuOpen(false); setIsSearchOpen(false); };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-zinc-950 border-b border-white/[0.07]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* Logo */}
            {!isSearchOpen && (
              <Link href="/" onClick={close} className="shrink-0">
                <span className="font-serif text-xl font-bold tracking-tight text-white">
                  Curtain Call
                </span>
              </Link>
            )}

            {/* Desktop nav */}
            {!isSearchOpen && (
              <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
                {NAV_LINKS.map(({ href, label }) => {
                  const active = pathname === href || pathname.startsWith(href + '/');
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`relative py-1 transition-colors ${
                        active ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {label}
                      {active && (
                        <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-red-600 rounded-t-full" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Mobile search input */}
            {isSearchOpen && (
              <form action="/discovery" className="flex-1 flex items-center">
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="search"
                    name="q"
                    autoFocus
                    placeholder="Search plays, artists…"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20"
                  />
                </div>
              </form>
            )}

            {/* Right actions */}
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              {/* Desktop search */}
              {!isSearchOpen && (
                <form action="/discovery" className="hidden md:flex relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                  <input
                    type="search"
                    name="q"
                    placeholder="Search…"
                    className="bg-zinc-900 border border-white/8 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 transition-all w-44 focus:w-56"
                  />
                </form>
              )}

              {/* Mobile: search icon */}
              <button
                className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                onClick={() => { setIsSearchOpen(s => !s); setIsMenuOpen(false); }}
                aria-label="Search"
              >
                {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </button>

              {/* Sign in / avatar — desktop */}
              {user ? (
                <Link
                  href="/profile"
                  className="hidden md:flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 px-3 py-2 rounded-xl transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-[10px] font-bold text-white">
                    {user.avatar}
                  </div>
                  <span className="text-sm font-medium text-white">{user.name.split(' ')[0]}</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hidden md:flex items-center gap-2 text-sm font-medium text-white bg-white/8 hover:bg-white/14 px-4 py-2 rounded-xl transition-colors whitespace-nowrap border border-white/10"
                >
                  <User className="h-4 w-4" />
                  Sign In
                </Link>
              )}

              {/* Hamburger — mobile */}
              <button
                className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                onClick={() => { setIsMenuOpen(s => !s); setIsSearchOpen(false); }}
                aria-label="Menu"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-zinc-950/98 backdrop-blur-xl flex flex-col">
          <nav className="flex flex-col px-6 pt-8 gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className={`py-4 text-2xl font-serif font-bold border-b border-white/5 transition-colors ${
                    active ? 'text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="px-6 mt-auto pb-12 pt-8">
            <Link
              href="/login"
              onClick={close}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-white text-black font-bold text-base hover:bg-zinc-100 transition-colors"
            >
              <User className="h-5 w-5" />
              Sign In
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
