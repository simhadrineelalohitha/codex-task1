'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CheckSquare, Plus, FolderKanban, LogOut, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {}
    }

    const fetchNotifs = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch('/api/notifications', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {}
    };

    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('Marked notifications as read');
    } catch (err) {}
  };

  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'POST' });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-zinc-100 text-sm tracking-wide">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <CheckSquare className="w-4 h-4" />
          </div>
          <span>TaskPulse</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <span className="text-xs font-semibold text-zinc-200">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-zinc-800/60 pt-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-6">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setShowNotifs(false);
                        if (n.link) router.push(n.link);
                      }}
                      className={`p-2.5 rounded-lg cursor-pointer text-xs hover:bg-zinc-800/70 transition-colors ${
                        !n.isRead ? 'bg-indigo-950/20 text-indigo-200 font-medium' : 'text-zinc-400'
                      }`}
                    >
                      <p>{n.message}</p>
                      <span className="text-[10px] text-zinc-500 mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-zinc-800">
          <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-semibold uppercase border border-indigo-500/40">
            {user?.name ? user.name.slice(0, 2) : 'SC'}
          </div>
          <span className="text-xs text-zinc-300 font-medium hidden sm:inline">{user?.name || 'Sarah Connor'}</span>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-900 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
