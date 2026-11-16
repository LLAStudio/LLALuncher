import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowUpRight, Download, ExternalLink, X } from 'lucide-react';
import type { RemoteReleaseInfo } from '../types';
import { formatRelativeTime } from '../services/storage';

interface Props {
  update: RemoteReleaseInfo;
  currentVersion: string;
  directDownload: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export const LauncherReleaseNotesModal: React.FC<Props> = ({
  update,
  currentVersion,
  directDownload,
  onClose,
  onDownload,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border bg-[#101319] px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">LLAStudio Launcher</h2>
              <span className="rounded border border-lemon/40 bg-lemon/10 px-2 py-0.5 font-mono text-[11px] text-lemon">
                v{update.version}
              </span>
              <span className="font-mono text-[11px] text-muted">actuel v{currentVersion}</span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-muted">
              {update.name || 'Notes de version'}
              {update.publishedAt ? ` · publié ${formatRelativeTime(update.publishedAt)}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-border p-2 text-muted transition hover:bg-[#1A1F27] hover:text-text"
            title="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="prose-invert flex-1 overflow-y-auto p-5 text-sm leading-relaxed">
          {update.body ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{update.body}</ReactMarkdown>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-muted">
              Aucune note de version fournie. Consultez la page GitHub de la release pour plus de détails.
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-[#101319] px-5 py-4">
          {update.htmlUrl ? (
            <a
              href={update.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-lime hover:underline"
            >
              Voir sur GitHub <ExternalLink size={12} />
            </a>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-border px-3 py-2 text-sm transition hover:bg-[#1A1F27]"
            >
              Fermer
            </button>
            <button
              onClick={onDownload}
              className="inline-flex items-center gap-2 rounded-md bg-acid px-3 py-2 text-sm font-semibold text-black transition hover:brightness-110"
            >
              {directDownload ? <Download size={15} /> : <ArrowUpRight size={15} />}
              {directDownload ? 'Télécharger la mise à jour' : 'Voir la release'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
