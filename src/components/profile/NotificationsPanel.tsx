'use client';

import { useState, useEffect } from 'react';
import { X, Ticket, Award, Star, ShieldCheck, Bell, Check } from 'lucide-react';
import { ClientDB } from '@/lib/db';
import { useAuth } from '@/lib/AuthContext';

interface Notification {
  id: string;
  type: 'ticket_sale' | 'badge' | 'review' | 'system' | 'critic';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = []; // Cleared in favor of real DB records

const ICON_MAP = {
  ticket_sale: { Icon: Ticket,     color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  badge:       { Icon: Award,      color: 'text-amber-400',  bg: 'bg-green-500/10 border-amber-500/20' }, // Mapping color
  review:      { Icon: Star,       color: 'text-blue-400',   bg: 'bg-blue-500/10  border-blue-500/20'  },
  critic:      { Icon: ShieldCheck,color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20'},
  system:      { Icon: Bell,       color: 'text-zinc-400',   bg: 'bg-zinc-800     border-white/10'     },
};

interface NotificationsPanelProps {
  onClose: () => void;
}

export function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Notification[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    setNotes(ClientDB.getNotifications(user.email));
  }, [user]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => setVisible(true));
    return () => { document.body.style.overflow = ''; };
  }, []);

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const markAllRead = () => {
    if (!user) return;
    ClientDB.markAllNotificationsAsRead(user.email);
    setNotes(n => n.map(x => ({ ...x, read: true })));
  };

  const markRead = (id: string) => {
    ClientDB.markNotificationAsRead(id);
    setNotes(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  };

  const unreadCount = notes.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={close}
      />

      {/* Panel — slides in from right */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-full max-w-sm bg-zinc-950 border-l border-white/8 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <div>
            <h2 className="font-serif font-bold text-white text-lg">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-xs text-zinc-500 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 transition-colors"
              >
                <Check className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
            <button onClick={close} className="p-2 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Bell className="h-10 w-10 text-zinc-700" />
              <p className="text-zinc-500 text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notes.map(note => {
                const { Icon, color, bg } = ICON_MAP[note.type];
                return (
                  <button
                    key={note.id}
                    onClick={() => markRead(note.id)}
                    className={`w-full text-left flex gap-3 px-5 py-4 transition-colors hover:bg-white/[0.03] ${!note.read ? 'bg-white/[0.02]' : ''}`}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 mt-0.5 ${bg}`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold leading-snug ${note.read ? 'text-zinc-300' : 'text-white'}`}>
                          {note.title}
                        </p>
                        {!note.read && (
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{note.body}</p>
                      <p className="text-[11px] text-zinc-700 mt-1.5">{note.time}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/8 shrink-0">
          <p className="text-xs text-zinc-600 text-center">Notification preferences can be managed in Settings</p>
        </div>
      </div>
    </div>
  );
}
