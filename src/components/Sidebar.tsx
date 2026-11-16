import React from 'react';
import {
  Boxes,
  Citrus,
  Download,
  FlaskConical,
  Github,
  Layers3,
  RefreshCw,
  Settings,
  Sprout,
  Sparkles,
} from 'lucide-react';
import type { NavSection } from '../types';
import { APP_VERSION } from '../constants';
import { formatRelativeTime } from '../services/storage';

interface SidebarProps {
  active: NavSection;
  onChange: (section: NavSection) => void;
  lastCheckedAt: string | null;
  onCheckUpdates: () => void;
  checking: boolean;
  onOpenSettings: () => void;
}

const navItems: { id: NavSection; label: string; icon: React.ReactNode; tone?: string }[] = [
  { id: 'applications', label: 'Applications', icon: <Boxes size={18} /> },
  { id: 'lemon', label: 'Lemon', icon: <Citrus size={18} />, tone: 'text-lemon' },
  { id: 'lime', label: 'Lime', icon: <Sprout size={18} />, tone: 'text-lime' },
  { id: 'installs', label: 'Installs', icon: <Download size={18} /> },
  { id: 'releases', label: 'Releases', icon: <Sparkles size={18} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  active,
  onChange,
  lastCheckedAt,
  onCheckUpdates,
  checking,
  onOpenSettings,
}) => {
  return (
    <aside className="w-[240px] shrink-0 h-full bg-card border-r border-border flex flex-col">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-acid flex items-center justify-center text-black font-bold">
            <Layers3 size={18} />
          </div>
          <div>
            <div className="font-semibold tracking-wide text-text leading-tight">LLAStudio</div>
            <div className="text-[10px] font-mono tracking-[0.2em] text-muted mt-0.5">LEMON LIME ACID</div>
          </div>
        </div>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-md border text-sm transition-all ${
                isActive
                  ? 'bg-[#171A20] border-[#2A303B] text-text'
                  : 'border-transparent text-muted hover:text-text hover:bg-[#151922] hover:border-[#232938]'
              }`}
            >
              {isActive && <span className="absolute inset-y-1 left-0 w-0.5 bg-lime" />}
              <span className={item.tone || (isActive ? 'text-lime' : 'text-muted')}>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {item.id === 'lemon' && <FlaskConical size={14} className="ml-auto text-lemon/60" />}
              {item.id === 'lime' && <span className="ml-auto text-lime/60 text-xs font-mono">AI</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        <div className="rounded-md border border-border bg-[#0F1115] p-3">
          <div className="flex items-center gap-2 text-xs text-muted font-mono">
            <Github size={14} className="text-lime" />
            <span>Synced with ://github.com</span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-muted">
            {lastCheckedAt ? `CHECKED ${formatRelativeTime(lastCheckedAt).toUpperCase()} USING GITHUB API` : 'NOT CHECKED YET'}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 font-mono text-[10px] text-muted">
            <span>LAUNCHER</span>
            <span>v{APP_VERSION}</span>
          </div>
        </div>
        <button
          onClick={onCheckUpdates}
          disabled={checking}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border border-border bg-[#151922] hover:border-lime/40 hover:text-lime text-sm font-medium transition disabled:opacity-60"
        >
          <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
          {checking ? 'Checking...' : 'Check for Updates'}
        </button>
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-muted hover:text-text hover:bg-[#151922] border border-transparent hover:border-border text-sm transition"
        >
          <Settings size={16} /> Paramètres
        </button>
      </div>
    </aside>
  );
};
