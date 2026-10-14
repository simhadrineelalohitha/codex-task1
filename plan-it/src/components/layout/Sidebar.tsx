'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderKanban, CheckSquare, Users, Settings, Plus } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { label: 'Workspaces', href: '/dashboard', icon: FolderKanban },
  ];

  return (
    <aside className="w-56 border-r border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="space-y-6">
        <div>
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3">
            Navigation
          </span>
          <nav className="mt-2 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4 text-indigo-400" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400">
        <p className="font-semibold text-zinc-300">TaskPulse v1.0</p>
        <p className="mt-0.5 text-zinc-500">Real-time collaborative kanban with SQLite & Socket.IO</p>
      </div>
    </aside>
  );
}
