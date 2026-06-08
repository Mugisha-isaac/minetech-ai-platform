'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, MessageSquare, Database, LayoutDashboard } from 'lucide-react';

const links = [
  { href: '/',        label: 'Overview',    icon: LayoutDashboard },
  { href: '/triage',  label: 'Triage',      icon: AlertTriangle },
  { href: '/chat',    label: 'Knowledge AI', icon: MessageSquare },
  { href: '/kb',      label: 'Knowledge Base', icon: Database },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-mine-900 border-r border-mine-300/15 sidebar-noise flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-mine-300/10">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mine-300/30 to-mine-400/20 border border-mine-300/40 flex items-center justify-center group-hover:border-mine-300/60 transition-colors">
            <div className="w-3.5 h-3.5 rounded-full bg-mine-300 group-hover:bg-mine-200 transition-colors" />
          </div>
          <span className="font-display text-mine-200 text-lg font-semibold tracking-wide group-hover:text-mine-100 transition-colors">MineTech</span>
        </div>
        <p className="text-mine-500 text-xs mt-2 font-mono tracking-widest uppercase">AI Operations</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/' && path.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-mine-300/15 to-mine-300/5 text-mine-100 border border-mine-300/25 shadow-lg shadow-mine-300/5'
                  : 'text-mine-500 hover:text-mine-300 hover:bg-mine-800/40 hover:border border-transparent hover:border-mine-300/15'
              }`}>
              <Icon size={16} className={`transition-colors ${active ? 'text-mine-300' : ''}`} />
              <span className="font-medium">{label}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-mine-300 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Model status indicator */}
      <div className="p-4 border-t border-mine-300/10">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-mono">qwen2.5:1.5b</span>
          </div>
          <p className="text-emerald-400/60 text-xs mt-1 font-mono">via Ollama</p>
        </div>
      </div>
    </aside>
  );
}
