import React, { useState } from 'react';
import { CheckCircle2, KeyRound, RefreshCw, Save, TriangleAlert, X } from 'lucide-react';
import type { SettingsState } from '../types';

export type LauncherCheckState = 'idle' | 'checking' | 'up-to-date' | 'update-available' | 'error';

interface Props {
  settings: SettingsState;
  onClose: () => void;
  onSave: (settings: SettingsState) => void;
  onCheckLauncherUpdate: () => void;
  launcherCheckState: LauncherCheckState;
}

const statusLabel: Record<LauncherCheckState, string | null> = {
  idle: null,
  checking: 'Vérification des releases GitHub…',
  'up-to-date': 'Le launcher est à jour.',
  'update-available': 'Nouvelle version détectée.',
  error: 'Vérification impossible (réseau ou limite GitHub).',
};

export const SettingsModal: React.FC<Props> = ({
  settings,
  onClose,
  onSave,
  onCheckLauncherUpdate,
  launcherCheckState,
}) => {
  const [token, setToken] = useState(settings.githubToken);
  const [minutes, setMinutes] = useState(settings.autoCheckMinutes);
  const [checkLauncherUpdates, setCheckLauncherUpdates] = useState(settings.checkLauncherUpdates);
  const label = statusLabel[launcherCheckState];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-[#101319] px-5 py-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <KeyRound size={18} className="text-lime" /> Paramètres
          </h2>
          <button
            onClick={onClose}
            className="rounded-md border border-border p-2 text-muted hover:bg-[#1A1F27] hover:text-text"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
          <div>
            <label className="mb-1 block text-sm font-medium">GitHub Personal Access Token (optionnel)</label>
            <p className="mb-2 text-xs text-muted">
              Permet d'augmenter la limite de l'API GitHub (60 req/h sans token). Le token est stocké localement sur cet appareil.
            </p>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full rounded-md border border-border bg-[#0F1115] px-3 py-2 font-mono text-sm outline-none focus:border-lime/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Vérification automatique des mises à jour</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={5}
                max={720}
                value={minutes}
                onChange={(e) => setMinutes(Math.max(5, Number(e.target.value) || 30))}
                className="w-28 rounded-md border border-border bg-[#0F1115] px-3 py-2 text-sm outline-none focus:border-lime/40"
              />
              <span className="text-sm text-muted">minutes (min. 5)</span>
            </div>
          </div>

          <div className="rounded-md border border-border bg-[#0F1115] p-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={checkLauncherUpdates}
                onChange={(e) => setCheckLauncherUpdates(e.target.checked)}
                className="mt-1 accent-[#39FF14]"
              />
              <div>
                <div className="text-sm font-medium">Vérifier les mises à jour du launcher au démarrage</div>
                <p className="mt-1 text-xs text-muted">
                  Affiche un message si une nouvelle release de LLAStudio Launcher est disponible sur GitHub.
                </p>
              </div>
            </label>

            <button
              onClick={onCheckLauncherUpdate}
              disabled={launcherCheckState === 'checking'}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-border bg-[#151922] px-3 py-2 text-xs font-medium transition hover:border-lime/40 hover:text-lime disabled:opacity-60"
            >
              <RefreshCw size={14} className={launcherCheckState === 'checking' ? 'animate-spin' : ''} />
              Vérifier maintenant
            </button>

            {label && (
              <div
                className={`mt-2 flex items-center gap-1.5 font-mono text-[11px] ${
                  launcherCheckState === 'error'
                    ? 'text-red-300'
                    : launcherCheckState === 'update-available'
                      ? 'text-lemon'
                      : 'text-muted'
                }`}
              >
                {launcherCheckState === 'error' && <TriangleAlert size={12} />}
                {(launcherCheckState === 'up-to-date' || launcherCheckState === 'update-available') && (
                  <CheckCircle2 size={12} />
                )}
                {launcherCheckState === 'checking' && <RefreshCw size={12} className="animate-spin" />}
                <span>{label}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-[#101319] px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-[#1A1F27]"
          >
            Annuler
          </button>
          <button
            onClick={() =>
              onSave({
                ...settings,
                githubToken: token.trim(),
                autoCheckMinutes: Math.max(5, minutes),
                checkLauncherUpdates,
              })
            }
            className="inline-flex items-center gap-2 rounded-md bg-acid px-3 py-2 text-sm font-semibold text-black hover:brightness-110"
          >
            <Save size={15} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};
