'use client';

import { useState, useEffect } from 'react';
import {
  X, User, Mail, MapPin, AtSign, Bell, Lock,
  Eye, EyeOff, Shield, Trash2, ChevronRight, Check, Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

interface SettingsPanelProps { onClose: () => void; }
type Section = 'main' | 'profile' | 'notifications' | 'password' | 'privacy' | 'danger';

const inputCls = 'w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/25 transition-colors';

function SettingField({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
        {icon && <span className="text-zinc-600">{icon}</span>}{label}
      </label>
      {children}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${on ? 'bg-red-600' : 'bg-zinc-700'}`}>
      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [section, setSection] = useState<Section>('main');
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('Theatre lover. Culture archivist.');
  const [location, setLocation] = useState('Lagos, Nigeria');
  const [handle, setHandle] = useState('@adaeze_obi');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({ ticketSales: true, reviews: true, badges: true, payouts: true, newsletter: false });
  const [privacy, setPrivacy] = useState({ publicProfile: true, showWatchlist: false, showReviews: true, showRatings: true });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => setVisible(true));
    return () => { document.body.style.overflow = ''; };
  }, []);

  const close = () => { setVisible(false); setTimeout(onClose, 300); };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePwSave = async () => {
    setPwSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setPwSaving(false); setPwSaved(true);
    setCurrentPw(''); setNewPw('');
    setTimeout(() => setPwSaved(false), 2500);
  };

  const menuItems = [
    { id: 'profile' as Section,       label: 'Edit Profile',             Icon: User,   desc: 'Name, bio, location, handle' },
    { id: 'notifications' as Section, label: 'Notification Preferences', Icon: Bell,   desc: 'Control what alerts you receive' },
    { id: 'password' as Section,      label: 'Change Password',          Icon: Lock,   desc: 'Update your account password' },
    { id: 'privacy' as Section,       label: 'Privacy',                  Icon: Shield, desc: 'Profile visibility & data' },
    { id: 'danger' as Section,        label: 'Danger Zone',              Icon: Trash2, desc: 'Delete or deactivate account' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={close} />
      <div className={`absolute right-0 top-0 bottom-0 w-full max-w-sm bg-zinc-950 border-l border-white/8 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2">
            {section !== 'main' && (
              <button onClick={() => setSection('main')} className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors text-xs font-medium">← Back</button>
            )}
            <h2 className="font-serif font-bold text-white text-lg">
              {section === 'main' ? 'Settings' : menuItems.find(m => m.id === section)?.label}
            </h2>
          </div>
          <button onClick={close} className="p-2 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">

          {section === 'main' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 bg-zinc-900 border border-white/5 rounded-2xl p-4 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm font-bold text-white shrink-0">{user?.avatar}</div>
                <div><p className="text-sm font-semibold text-white">{user?.name}</p><p className="text-xs text-zinc-500">{user?.email}</p></div>
              </div>
              {menuItems.map(({ id, label, Icon, desc }) => (
                <button key={id} onClick={() => setSection(id)}
                  className={`flex items-center gap-3 w-full p-4 rounded-2xl border transition-all text-left hover:bg-white/[0.03] ${id === 'danger' ? 'border-red-900/30 bg-red-950/20' : 'border-white/5 bg-zinc-900'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${id === 'danger' ? 'bg-red-500/10 border-red-500/20' : 'bg-zinc-800 border-white/8'}`}>
                    <Icon className={`h-4 w-4 ${id === 'danger' ? 'text-red-400' : 'text-zinc-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${id === 'danger' ? 'text-red-400' : 'text-white'}`}>{label}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-600 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {section === 'profile' && (
            <div className="flex flex-col gap-4">
              <SettingField label="Full Name" icon={<User className="h-4 w-4" />}>
                <input value={name} onChange={e => setName(e.target.value)} className={inputCls} />
              </SettingField>
              <SettingField label="Handle" icon={<AtSign className="h-4 w-4" />}>
                <input value={handle} onChange={e => setHandle(e.target.value)} className={inputCls} />
              </SettingField>
              <SettingField label="Location" icon={<MapPin className="h-4 w-4" />}>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Country" className={inputCls} />
              </SettingField>
              <SettingField label="Bio">
                <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={160} rows={3} className={`${inputCls} resize-none`} />
                <p className="text-[11px] text-zinc-600 mt-1 text-right">{bio.length}/160</p>
              </SettingField>
              <SettingField label="Email" icon={<Mail className="h-4 w-4" />}>
                <input value={user?.email || ''} disabled className={`${inputCls} opacity-40 cursor-not-allowed`} />
                <p className="text-[11px] text-zinc-600 mt-1">Email changes require re-verification</p>
              </SettingField>
              <button onClick={handleSave} disabled={saving}
                className="w-full bg-white text-black font-bold py-3.5 rounded-2xl hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : saved ? <><Check className="h-4 w-4" />Saved!</> : 'Save Changes'}
              </button>
            </div>
          )}

          {section === 'notifications' && (
            <div className="flex flex-col gap-3">
              {([
                { key: 'ticketSales', label: 'Ticket Sales',        desc: 'When someone buys a ticket to your production' },
                { key: 'reviews',     label: 'Reviews',             desc: 'When your production receives a new review'    },
                { key: 'badges',      label: 'Badges & Points',     desc: 'When you unlock a badge or milestone'          },
                { key: 'payouts',     label: 'Payouts',             desc: 'When a payout is processed to your account'   },
                { key: 'newsletter',  label: 'Curtain Call Updates', desc: 'Weekly editorial picks and platform news'      },
              ] as { key: keyof typeof notifPrefs; label: string; desc: string }[]).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-zinc-900 border border-white/5 rounded-2xl">
                  <div><p className="text-sm font-semibold text-white">{label}</p><p className="text-xs text-zinc-500 mt-0.5 max-w-[190px] leading-snug">{desc}</p></div>
                  <Toggle on={notifPrefs[key]} onToggle={() => setNotifPrefs(p => ({ ...p, [key]: !p[key] }))} />
                </div>
              ))}
            </div>
          )}

          {section === 'password' && (
            <div className="flex flex-col gap-4">
              <SettingField label="Current Password">
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Current password" className={`${inputCls} pr-10`} />
                  <button onClick={() => setShowPw(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </SettingField>
              <SettingField label="New Password">
                <input type={showPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 8 characters" className={inputCls} />
                {newPw.length > 0 && newPw.length < 8 && <p className="text-xs text-red-500 mt-1">Must be at least 8 characters</p>}
                {newPw.length >= 8 && <div className="flex gap-1 mt-1.5">{['Length ✓','Uppercase ✓','Number ✓'].map(s => <span key={s} className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">{s}</span>)}</div>}
              </SettingField>
              <button onClick={handlePwSave} disabled={!currentPw || newPw.length < 8 || pwSaving}
                className="w-full bg-white text-black font-bold py-3.5 rounded-2xl hover:bg-zinc-100 transition-colors disabled:opacity-30 flex items-center justify-center gap-2 mt-2">
                {pwSaving ? <><Loader2 className="h-4 w-4 animate-spin" />Updating…</> : pwSaved ? <><Check className="h-4 w-4" />Updated!</> : 'Update Password'}
              </button>
            </div>
          )}

          {section === 'privacy' && (
            <div className="flex flex-col gap-3">
              {([
                { key: 'publicProfile',  label: 'Public Profile',      desc: 'Anyone can view your profile and reviews' },
                { key: 'showWatchlist',  label: 'Show Watchlist',       desc: 'Others can see your watchlist'            },
                { key: 'showReviews',    label: 'Show Review History',  desc: 'Your reviews are visible to all users'    },
                { key: 'showRatings',    label: 'Show Ratings',         desc: 'Your star ratings are publicly visible'   },
              ] as { key: keyof typeof privacy; label: string; desc: string }[]).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-zinc-900 border border-white/5 rounded-2xl">
                  <div><p className="text-sm font-semibold text-white">{label}</p><p className="text-xs text-zinc-500 mt-0.5 max-w-[190px] leading-snug">{desc}</p></div>
                  <Toggle on={privacy[key]} onToggle={() => setPrivacy(p => ({ ...p, [key]: !p[key] }))} />
                </div>
              ))}
            </div>
          )}

          {section === 'danger' && (
            <div className="flex flex-col gap-4">
              <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-5">
                <p className="text-sm text-red-400 leading-relaxed">These actions are permanent and cannot be undone.</p>
              </div>
              <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-white">Deactivate Account</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Hides your profile temporarily. Reactivate by logging back in.</p>
                <button className="w-full bg-zinc-800 border border-white/10 text-white font-medium py-3 rounded-xl hover:bg-zinc-700 transition-colors text-sm">Deactivate Account</button>
              </div>
              <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-5 flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-red-400">Delete Account</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Permanently deletes all your data. This cannot be reversed.</p>
                <button className="w-full bg-red-600/20 border border-red-600/40 text-red-400 font-medium py-3 rounded-xl hover:bg-red-600/30 transition-colors text-sm">Delete My Account</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
