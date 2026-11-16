import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExternalLink, FolderOpen, Play, Trash2, X, Download } from 'lucide-react';
import type { AppRuntimeState } from '../types';
import { formatBytes, formatRelativeTime } from '../services/storage';
import { pickBestAsset } from '../services/githubUpdater';

interface Props {
  state: AppRuntimeState;
  onClose: () => void;
  onInstall: (version: string) => void;
  onOpen: (version?: string) => void;
  onSetActive: (version: string) => void;
  onUninstall: (version: string) => void;
  onOpenFolder: () => void;
  onOpenRepo: () => void;
}

export const AppDetailsModal: React.FC<Props> = ({
  state,
  onClose,
  onInstall,
  onOpen,
  onSetActive,
  onUninstall,
  onOpenFolder,
  onOpenRepo,
}) => {
  const { app, install, remote, updateAvailable } = state;
  const latest = remote?.version || null;
  const [selected, setSelected] = useState<string>(install.activeVersion || install.installedVersions[install.installedVersions.length - 1]?.version || latest || '');
  const installed = install.installedVersions;
  const selectedInstalled = installed.find((v) => v.version === selected);
  const bestAsset = useMemo(() => (remote ? pickBestAsset(remote.assets) : undefined), [remote]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div
        className="w-full max-w-4xl max-h-[85vh] bg-card border border-border rounded-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4 bg-[#101319]">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-semibold">{app.name}</h2>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded border border-border text-muted">{app.category.toUpperCase()} · {app.language}</span>
              {updateAvailable && latest && <span className="font-mono text-[11px] px-2 py-0.5 rounded border border-lemon/40 text-lemon">UPDATE AVAILABLE → v{latest}</span>}
            </div>
            <p className="text-sm text-muted mt-1">{app.description}</p>
            <div className="mt-2 text-[11px] font-mono text-muted flex gap-4 flex-wrap">
              <span>Repo: {app.repoOwner}/{app.repoName}</span>
              <span>Latest: {latest ? `v${latest}` : '—'}</span>
              <span>Release size: {bestAsset ? formatBytes(bestAsset.size) : '—'}</span>
              <span>Published: {formatRelativeTime(remote?.publishedAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onOpenRepo} className="px-3 py-2 rounded-md border border-border hover:border-lime/40 hover:text-lime text-sm inline-flex items-center gap-2">
              <ExternalLink size={15} /> GitHub ↗
            </button>
            <button onClick={onClose} className="p-2 rounded-md border border-border hover:bg-[#1A1F27] text-muted hover:text-text">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr]">
          <div className="border-r border-border p-4 overflow-y-auto bg-[#0F1115]">
            <div className="mb-4">
              <div className="text-xs font-mono text-muted mb-2 uppercase tracking-wider">Versions installées</div>
              {installed.length === 0 ? (
                <div className="text-sm text-muted border border-dashed border-border rounded-md p-3">Aucune version installée localement.</div>
              ) : (
                <div className="space-y-2">
                  {installed.slice().reverse().map((v) => (
                    <button
                      key={v.version}
                      onClick={() => setSelected(v.version)}
                      className={`w-full text-left p-2.5 rounded-md border transition ${
                        selected === v.version ? 'border-lime/50 bg-[#151922]' : 'border-border hover:border-[#2A303B]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">v{v.version}</span>
                        {install.activeVersion === v.version && <span className="text-[10px] font-mono text-lime">ACTIVE</span>}
                      </div>
                      <div className="text-[11px] text-muted mt-1">Installé {formatRelativeTime(v.installedAt)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {selectedInstalled ? (
                <>
                  <button onClick={() => onOpen(selected)} className="w-full px-3 py-2 rounded-md bg-lime text-black font-semibold inline-flex items-center justify-center gap-2">
                    <Play size={15} /> Ouvrir v{selected}
                  </button>
                  {install.activeVersion !== selected && (
                    <button onClick={() => onSetActive(selected)} className="w-full px-3 py-2 rounded-md border border-border hover:border-lime/40 text-sm">
                      Définir comme version active
                    </button>
                  )}
                  <button onClick={onOpenFolder} className="w-full px-3 py-2 rounded-md border border-border hover:bg-[#1A1F27] text-sm inline-flex items-center justify-center gap-2">
                    <FolderOpen size={15} /> Ouvrir le dossier
                  </button>
                  <button onClick={() => onUninstall(selected)} className="w-full px-3 py-2 rounded-md border border-red-500/30 text-red-300 hover:bg-red-500/10 text-sm inline-flex items-center justify-center gap-2">
                    <Trash2 size={15} /> Désinstaller v{selected}
                  </button>
                </>
              ) : latest ? (
                <button
                  onClick={() => onInstall(latest)}
                  disabled={!bestAsset}
                  className="w-full px-3 py-2 rounded-md bg-lime text-black font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download size={15} /> Installer v{latest}
                </button>
              ) : (
                <div className="text-sm text-muted">Aucune release distante détectée.</div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-border">
              <div className="text-xs font-mono text-muted mb-2 uppercase tracking-wider">Assets (dernière release)</div>
              {remote?.assets?.length ? (
                <ul className="space-y-1.5 text-xs">
                  {remote.assets.map((a) => (
                    <li key={a.name} className="flex items-center justify-between gap-2 border border-border rounded px-2 py-1.5 bg-[#121418]">
                      <span className="font-mono truncate" title={a.name}>{a.name}</span>
                      <span className="text-muted shrink-0">{formatBytes(a.size)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-muted">Aucun asset binaire publié.</div>
              )}
            </div>
          </div>

          <div className="p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Notes de version (GitHub)</h3>
              {remote?.htmlUrl && (
                <a href={remote.htmlUrl} target="_blank" rel="noreferrer" className="text-xs font-mono text-lime hover:underline inline-flex items-center gap-1">
                  Voir sur GitHub <ExternalLink size={12} />
                </a>
              )}
            </div>
            <div className="prose-invert text-sm leading-relaxed">
              {remote?.body ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{remote.body}</ReactMarkdown>
              ) : (
                <div className="text-muted border border-dashed border-border rounded-md p-4">
                  Aucune note de version disponible. Vérifiez les mises à jour ou consultez le dépôt GitHub.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
