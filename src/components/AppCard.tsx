import React, { useMemo, useState } from 'react';
import {
  ExternalLink,
  FolderOpen,
  MoreHorizontal,
  Play,
  Download,
  Trash2,
  Layers,
} from 'lucide-react';
import type { AppRuntimeState, ViewMode } from '../types';
import { formatBytes, formatRelativeTime } from '../services/storage';
import { pickBestAsset } from '../services/githubUpdater';

interface AppCardProps {
  state: AppRuntimeState;
  viewMode: ViewMode;
  onOpenDetails: () => void;
  onInstall: (version: string) => void;
  onUpdate: (version: string) => void;
  onOpenApp: () => void;
  onOpenRepo: () => void;
  onOpenFolder: () => void;
  onUninstall: () => void;
}

const tagStyles: Record<string, string> = {
  Lemon: 'text-lemon border-lemon/30 bg-lemon/5',
  Lime: 'text-lime border-lime/30 bg-lime/5',
  Acid: 'text-black border-transparent bg-lime',
};

export const AppCard: React.FC<AppCardProps> = ({
  state,
  viewMode,
  onOpenDetails,
  onInstall,
  onUpdate,
  onOpenApp,
  onOpenRepo,
  onOpenFolder,
  onUninstall,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { app, install, remote, updateAvailable, download } = state;
  const activeVersion = install.activeVersion || install.installedVersions[install.installedVersions.length - 1]?.version || null;
  const isInstalled = !!activeVersion;
  const latestVersion = remote?.version || null;
  const bestAsset = useMemo(() => (remote ? pickBestAsset(remote.assets) : undefined), [remote]);
  const releaseSize = bestAsset?.size ? formatBytes(bestAsset.size) : remote?.source === 'tag' ? 'Archive' : '—';
  const lastUpdated = remote?.publishedAt || install.installedVersions[install.installedVersions.length - 1]?.installedAt || null;
  const progress = Math.max(0, Math.min(100, download?.percent ?? 0));

  const headerVersion = (
    <div className="font-mono text-[11px] flex items-center gap-2">
      {isInstalled ? (
        updateAvailable && latestVersion ? (
          <span className="text-lemon">
            v{activeVersion} <span className="text-muted">→</span> v{latestVersion}
          </span>
        ) : (
          <span className="text-muted">v{activeVersion}</span>
        )
      ) : latestVersion ? (
        <span className="text-muted">v{latestVersion} available</span>
      ) : (
        <span className="text-muted">Not installed</span>
      )}
    </div>
  );

  const actionArea = () => {
    if (download?.inProgress) {
      return (
        <div className="w-full">
          <div className="flex items-center justify-between text-xs font-mono text-muted mb-1">
            <span>{updateAvailable ? 'Updating' : 'Installing'} v{download.targetVersion || latestVersion}</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-none bg-[#0B0C0E] border border-border overflow-hidden">
            <div className="h-full bg-lime transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      );
    }

    if (!isInstalled) {
      return (
        <button
          onClick={() => latestVersion && onInstall(latestVersion)}
          disabled={!latestVersion || !bestAsset}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#1A1F27] border border-border hover:border-lime/40 hover:text-lime text-sm font-medium disabled:opacity-50"
          title={!bestAsset ? 'No downloadable asset found for this OS in latest release' : 'Install latest version'}
        >
          <Download size={15} /> INSTALL{latestVersion ? ` v${latestVersion}` : ''}
        </button>
      );
    }

    if (updateAvailable && latestVersion) {
      return (
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <span className="inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded border border-lemon/50 px-2 py-1 font-mono text-[10px] tracking-wide text-lemon">
            UPDATE AVAILABLE
          </span>
          <div className="flex flex-wrap gap-2 sm:flex-1 sm:justify-end">
            <button
              onClick={onOpenApp}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-[#151922] hover:border-lime/40 hover:text-lime text-sm"
            >
              <Play size={14} /> OPEN v{activeVersion}
            </button>
            <button
              onClick={() => onUpdate(latestVersion)}
              disabled={!bestAsset}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-lemon text-black font-semibold text-sm hover:brightness-110 disabled:opacity-50"
            >
              <Download size={14} /> UPDATE TO v{latestVersion}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenApp}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-[#151922] hover:bg-lime hover:text-black hover:border-lime font-semibold text-sm transition"
        >
          <Play size={14} /> OPEN
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 rounded-md border border-border bg-[#151922] hover:border-[#2A303B] text-muted hover:text-text"
            title="More actions"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 bottom-full mb-2 w-52 rounded-md border border-border bg-[#121418] z-20 overflow-hidden"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button onClick={() => { setMenuOpen(false); onOpenDetails(); }} className="w-full px-3 py-2 text-left text-sm hover:bg-[#1A1F27] flex items-center gap-2">
                <Layers size={14} /> Choisir une version / Détails
              </button>
              <button onClick={() => { setMenuOpen(false); onOpenFolder(); }} className="w-full px-3 py-2 text-left text-sm hover:bg-[#1A1F27] flex items-center gap-2">
                <FolderOpen size={14} /> Ouvrir le dossier
              </button>
              <button onClick={() => { setMenuOpen(false); onUninstall(); }} className="w-full px-3 py-2 text-left text-sm hover:bg-red-500/10 text-red-300 flex items-center gap-2">
                <Trash2 size={14} /> Désinstaller
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (viewMode === 'list') {
    return (
      <div className="group border border-border bg-card rounded-lg px-4 py-3 hover:border-[#2f3542] transition flex items-center gap-4">
        <button onClick={onOpenDetails} className="w-11 h-11 rounded-md bg-[#0B0C0E] border border-border flex items-center justify-center text-lime font-mono font-bold shrink-0 hover:border-lime/40">
          {app.name.slice(0, 2).toUpperCase()}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            {headerVersion}
            <button onClick={onOpenRepo} className="font-mono text-[11px] text-muted hover:text-lime inline-flex items-center gap-1">
              GITHUB <ExternalLink size={12} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={onOpenDetails} className="font-semibold hover:text-lime transition text-left">{app.name}</button>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${tagStyles[app.category]}`}>{app.category.toUpperCase()}</span>
            <span className="text-xs text-muted truncate">{app.description}</span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-muted flex gap-4 flex-wrap">
            <span>Last updated: {formatRelativeTime(lastUpdated)}</span>
            <span>Release size: {releaseSize}</span>
            <span>{app.language}</span>
          </div>
        </div>
        <div className="shrink-0">{actionArea()}</div>
      </div>
    );
  }

  return (
    <div className="group border border-border bg-card rounded-lg p-4 hover:border-[#3A4150] transition flex flex-col min-h-[250px]">
      <div className="flex items-start justify-between gap-2 mb-3">
        {headerVersion}
        <button onClick={onOpenRepo} className="font-mono text-[11px] text-muted hover:text-lime inline-flex items-center gap-1 shrink-0">
          GITHUB <ExternalLink size={12} />
        </button>
      </div>
      <div className="flex items-start gap-3 mb-3">
        <button
          onClick={onOpenDetails}
          className="w-12 h-12 rounded-md bg-[#0B0C0E] border border-border flex items-center justify-center text-lime font-mono font-bold text-lg hover:border-lime/40 transition shrink-0"
        >
          {app.name.slice(0, 2).toUpperCase()}
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={onOpenDetails} className="font-semibold text-base leading-tight hover:text-lime text-left">
              {app.name}
            </button>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${tagStyles[app.category]}`}>
              {app.category.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-muted mt-1 line-clamp-2">{app.description}</p>
        </div>
      </div>
      <div className="mt-auto">
        <div className="text-[11px] font-mono text-muted flex flex-wrap gap-x-4 gap-y-1 mb-4">
          <span>Last updated: {formatRelativeTime(lastUpdated)}</span>
          <span>Release size: {releaseSize}</span>
        </div>
        <div className="flex items-end justify-between gap-2 min-h-[40px]">{actionArea()}</div>
      </div>
    </div>
  );
};
