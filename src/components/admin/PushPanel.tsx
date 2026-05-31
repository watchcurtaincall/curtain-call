'use client';

import { useState } from 'react';
import { Send, BellRing, Link as LinkIcon, Lock } from 'lucide-react';

export function AdminPushNotificationsPanel() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body || !adminSecret) return;

    setStatus('sending');
    setMessage('');

    try {
      const res = await fetch('/api/admin/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, url, adminSecret }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(`Successfully sent push notification to ${data.count} subscribed devices!`);
        setTitle('');
        setBody('');
        setUrl('');
      } else {
        setStatus('error');
        setMessage(`Error: ${data.error || 'Failed to send'}`);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(`Network error: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-up">
      <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col gap-4 border-b border-white/5 pb-5 mb-6">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <BellRing className="h-5 w-5 text-red-500" /> Broadcast Push Notification
          </h2>
          <p className="text-zinc-500 text-xs">
            Send an instant native notification to all users who have opted-in on their mobile devices or desktop browsers.
          </p>
        </div>

        <form onSubmit={handleBroadcast} className="flex flex-col gap-5 max-w-2xl relative z-10">
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Notification Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. New Review Published!"
              className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Message Body</label>
            <textarea
              required
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="e.g. Check out our latest review of The Lion King playing at Terra Kulture..."
              className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 min-h-[100px] transition-colors resize-y"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <LinkIcon className="h-3 w-3" /> Target URL (Optional)
            </label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="e.g. /editorial/the-lion-king-review"
              className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
            />
            <p className="text-[10px] text-zinc-500">Where the user is redirected when they tap the notification.</p>
          </div>

          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Lock className="h-3 w-3 text-red-400" /> Admin Authentication
            </label>
            <input
              type="password"
              required
              value={adminSecret}
              onChange={e => setAdminSecret(e.target.value)}
              placeholder="Enter CRON_SECRET to authorize push"
              className="w-full bg-zinc-950/50 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {status !== 'idle' && (
            <div className={`p-4 rounded-xl text-xs font-medium border ${
              status === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
              status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}>
              {status === 'sending' ? 'Dispatching push notifications...' : message}
            </div>
          )}

          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={status === 'sending'}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-red-900/20"
            >
              <Send className="h-4 w-4" /> 
              {status === 'sending' ? 'Sending...' : 'Broadcast Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
