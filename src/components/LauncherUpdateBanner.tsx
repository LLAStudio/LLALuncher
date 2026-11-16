import React from 'react';
import { ArrowUpRight, Download, FileText, Sparkles, X } from 'lucide-react';
import type { RemoteReleaseInfo } from '../types';
import { formatRelativeTime } from '../services/storage';

interface Props {
  update: RemoteReleaseInfo;
  currentVersion: string;
  directDownload: boolean;
  onDismiss: () => void;
  onDetails: () => void;
  onDownload: () => void;
}

function summarize(body?: string, max = 180): string {
  if (!body) return 'Consultez les notes de version pour découvrir les changements.';
  const cleaned = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[#>*_`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 'Consultez les notes de version pour découvrir les changements.';
  return cleaned.length > max ? `${cleaned.slice(0, max).trim()}…` : cleaned;
}

export const LauncherUpdateBanner: React.FC<Props> = ({
  update,
  currentVersion,
  directDownload,
  onDismiss,
  onDetails,
  onDownload,
}) => {
  return (
    <div className="relative mb-4 overflow-hidden rounded-lg border border-lemon/40 bg-[#141610] shadow-glowLemon">
      <div className="absolute inset-y-0 left-0 w-1 bg-acid" />
      <div className="flex flex-col gap-3 py-3 pl-5 pr-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-acid text-black shadow-glowLemon">
            <Sparkles size={17} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-text">Nouvelle version du launcher disponible</span>
              <span className="rounded border border-lemon/40 bg-lemon/10 px-1.5 py-0.5 font-mono text-[10px] text-lemon">
                v{update.version}
              </span>
              <span className="font-mono text-[10px] text-muted">ACTUEL v{currentVersion}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-muted">{summarize(update.body)}</p>
            {update.publishedAt && (
              <p className="mt-1 font-mono text-[10px] text-muted/80">
                Publié {formatRelativeTime(update.publishedAt)}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
          <button
            onClick={onDetails}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-[#151922] px-2.5 py-2 text-xs text-muted transition hover:border-[#2A303B] hover:text-text"
            title="Lire les notes de version"
          >
            <FileText size={14} /> Notes
          </button>
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 rounded-md bg-acid px-3 py-2 text-xs font-semibold text-black transition hover:brightness-110"
          >
            {directDownload ? <Download size={14} /> : <ArrowUpRight size={14} />}
            {directDownload ? 'Mettre à jour' : 'Voir la release'}
          </button>
          <button
            onClick={onDismiss}
            className="rounded-md border border-border bg-[#151922] p-2 text-muted transition hover:bg-[#1A1F27] hover:text-text"
            title="Plus tard (masquer pour cette version)"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
