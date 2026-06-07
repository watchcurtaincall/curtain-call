'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Search, User, Menu, X, Ticket, Coins, TrendingUp, QrCode, ArrowRight, Trophy } from "lucide-react";
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { ClientDB } from '@/lib/db';

const NAV_LINKS = [
  { href: '/discovery', label: 'Discovery' },
  { href: '/tickets', label: 'Box Office' },
  { href: '/plays', label: 'Archive' },
  { href: '/critics', label: 'Critics' },
  { href: '/editorial', label: 'Editorial' },
  { href: '/artists', label: 'Artists' },
  { href: '#sell-tickets', label: 'Create Event' },
  { href: '/submit', label: 'Submit' },
];

interface SuggestionItem {
  id: string;
  title: string;
  type: 'play' | 'person' | 'editorial';
  link: string;
  subtitle?: string;
}

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isSellTicketsOpen, setIsSellTicketsOpen] = useState(false);
  const close = () => { setIsMenuOpen(false); setIsSearchOpen(false); setSearchVal(''); setShowSuggestions(false); };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (searchVal.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const q = searchVal.toLowerCase();
    const matches: SuggestionItem[] = [];

    // Query plays/productions
    try {
      const plays = ClientDB.getProductions();
      plays.forEach(p => {
        if (p.title.toLowerCase().includes(q) || p.genre.toLowerCase().includes(q)) {
          matches.push({
            id: p.id,
            title: p.title,
            type: 'play',
            link: `/productions/${p.slug || p.id}`,
            subtitle: p.genre
          });
        }
      });
    } catch (e) {
      console.error(e);
    }

    // Query artists/makers
    try {
      const artists = ClientDB.getArtists();
      artists.forEach(a => {
        if (a.name.toLowerCase().includes(q) || a.roleType.toLowerCase().includes(q)) {
          matches.push({
            id: a.id,
            title: a.name,
            type: 'person',
            link: `/artists/${a.slug || a.id}`,
            subtitle: a.roleType
          });
        }
      });
    } catch (e) {
      console.error(e);
    }

    // Query articles/editorial
    try {
      const articles = ClientDB.getArticles();
      articles.forEach(art => {
        if (art.title.toLowerCase().includes(q) || art.excerpt.toLowerCase().includes(q)) {
          matches.push({
            id: art.id,
            title: art.title,
            type: 'editorial',
            link: `/editorial`,
            subtitle: art.author || 'Editorial'
          });
        }
      });
    } catch (e) {
      console.error(e);
    }

    setSuggestions(matches.slice(0, 8));
  }, [searchVal]);

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
                      onClick={(e) => {
                        if (href === '#sell-tickets') {
                          e.preventDefault();
                          if (user) {
                            router.push('/create');
                          } else {
                            setIsSellTicketsOpen(true);
                          }
                        }
                      }}
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
              <div className="flex-1 flex items-center relative">
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  <input
                    type="search"
                    autoFocus
                    placeholder="Search plays, artists…"
                    value={searchVal}
                    onChange={e => {
                      setSearchVal(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col p-2 animate-fade-up">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider px-3 py-1.5 border-b border-white/5 mb-1 text-left">
                        Suggestions
                      </div>
                      <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto">
                        {suggestions.map(item => (
                          <Link
                            key={item.id}
                            href={item.link}
                            onClick={() => {
                              setShowSuggestions(false);
                              setSearchVal('');
                            }}
                            className="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-xl transition-all group text-left"
                          >
                            <div className="flex flex-col flex-1 min-w-0 pr-2">
                              <span className="text-xs font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                                {item.title}
                              </span>
                              {item.subtitle && (
                                <span className="text-[10px] text-zinc-500 truncate mt-0.5">
                                  {item.subtitle}
                                </span>
                              )}
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 border ${
                              item.type === 'play' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                              item.type === 'person' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            }`}>
                              {item.type === 'play' ? 'Play' : item.type === 'person' ? 'Maker' : 'Editorial'}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Right actions */}
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              {/* Desktop search */}
              {!isSearchOpen && (
                <div className="hidden md:flex relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors pointer-events-none" />
                  <input
                    type="search"
                    placeholder="Search…"
                    value={searchVal}
                    onChange={e => {
                      setSearchVal(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="bg-zinc-900 border border-white/8 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 transition-all w-44 focus:w-64"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-zinc-950/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col p-2 animate-fade-up">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider px-3 py-1.5 border-b border-white/5 mb-1 text-left">
                        Live Database Suggestions
                      </div>
                      <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto">
                        {suggestions.map(item => (
                          <Link
                            key={item.id}
                            href={item.link}
                            onClick={() => {
                              setShowSuggestions(false);
                              setSearchVal('');
                            }}
                            className="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-xl transition-all group text-left"
                          >
                            <div className="flex flex-col flex-1 min-w-0 pr-2">
                              <span className="text-xs font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                                {item.title}
                              </span>
                              {item.subtitle && (
                                <span className="text-[10px] text-zinc-500 truncate mt-0.5">
                                  {item.subtitle}
                                </span>
                              )}
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 border ${
                              item.type === 'play' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                              item.type === 'person' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            }`}>
                              {item.type === 'play' ? 'Play' : item.type === 'person' ? 'Maker' : 'Editorial'}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile: search icon */}
              <button
                className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                onClick={() => { setIsSearchOpen(s => !s); setIsMenuOpen(false); }}
                aria-label="Search"
              >
                {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </button>

              {/* Daily Quiz Gold CTA Button */}
              <Link
                href="/quiz"
                className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold px-4 py-2 rounded-xl transition-all text-xs uppercase tracking-wider active:scale-95 shadow-md shadow-amber-900/20 whitespace-nowrap"
              >
                <Trophy className="h-3.5 w-3.5" />
                Daily Quiz
              </Link>

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
                  href={`/login?redirect=${pathname}`}
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
          <nav className="flex flex-col px-6 pt-6 gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={(e) => {
                    if (href === '#sell-tickets') {
                      e.preventDefault();
                       if (user) {
                         router.push('/create');
                       } else {
                        setIsSellTicketsOpen(true);
                      }
                      setIsMenuOpen(false);
                    } else {
                      close();
                    }
                  }}
                  className={`py-2.5 text-lg font-serif font-bold border-b border-white/5 transition-colors ${
                    active ? 'text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="px-6 mt-auto pb-6 pt-4 flex flex-col gap-4">
            <Link
              href="/quiz"
              onClick={close}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-base hover:from-amber-400 hover:to-yellow-300 transition-colors shadow-lg shadow-amber-900/20"
            >
              <Trophy className="h-5 w-5" />
              Daily Theatre Quiz
            </Link>

            {user ? (
              <div className="flex flex-col gap-4">
                <Link
                  href="/profile"
                  onClick={close}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-zinc-800 text-white border border-white/10 font-bold text-base hover:bg-zinc-700 transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                    {user.avatar}
                  </div>
                  My Profile ({user.name.split(' ')[0]})
                </Link>
                <button
                  onClick={() => {
                    logout();
                    close();
                  }}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-red-600/10 text-red-500 border border-red-600/20 font-bold text-base hover:bg-red-600/20 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href={`/login?redirect=${pathname}`}
                onClick={close}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-white text-black font-bold text-base hover:bg-zinc-100 transition-colors"
              >
                <User className="h-5 w-5" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
      {/* ── SELL TICKETS INFORMATIONAL PROMOTIONAL MODAL ── */}
      {isSellTicketsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setIsSellTicketsOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-zinc-950/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-up overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/5 rounded-full blur-[60px] pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center">
                  <Ticket className="h-4 w-4 text-red-500" />
                </div>
                <h3 className="font-serif font-bold text-lg text-white">Create Event</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSellTicketsOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              <div className="text-center sm:text-left">
                <h4 className="font-serif text-2xl font-bold text-white leading-tight">
                  Maximize Event Earnings with Curtain Call 🎭
                </h4>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                  List your theatrical stage plays, curate multiple custom ticket tiers, process secure local payments via Paystack, and track gate admissions in real-time.
                </p>
              </div>

              {/* Feature grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: Coins,
                    title: "Flat 5% Commission",
                    desc: "Free registration and setup. No hidden charges. Keep 95% of all admissions sales."
                  },
                  {
                    icon: TrendingUp,
                    title: "Multi-Tiered Tickets",
                    desc: "Create VIP, General, Patron, or early bird tiers with custom pricing and seat limits."
                  },
                  {
                    icon: QrCode,
                    title: "Gate Ticket Scanner",
                    desc: "Producers scan guest admissions vouchers at the hall entry using a smartphone camera."
                  },
                  {
                    icon: User,
                    title: "Audience Analytics",
                    desc: "Track real-time signups, ticket purchase histories, and withdrawal details instantly."
                  }
                ].map((f, idx) => {
                  const IconComp = f.icon;
                  return (
                    <div key={idx} className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-red-400 border border-white/5 shrink-0 animate-pulse">
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-xs font-bold text-white font-sans uppercase tracking-wide">{f.title}</h5>
                        <p className="text-[11px] text-zinc-500 leading-normal mt-1">{f.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={() => setIsSellTicketsOpen(false)}
                  className="flex-1 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold py-3.5 rounded-xl transition-all text-xs uppercase tracking-wider"
                >
                  Close & Explore
                </button>
                <Link
                  href="/login?redirect=/create"
                  onClick={() => setIsSellTicketsOpen(false)}
                  className="flex-1 bg-white hover:bg-zinc-100 text-black font-bold py-3.5 rounded-xl transition-all text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow-xl shadow-white/5"
                >
                  Get Started Now <ArrowRight className="h-3.5 w-3.5 animate-pulse" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
