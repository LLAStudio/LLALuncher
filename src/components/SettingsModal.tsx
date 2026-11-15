import React, { useState } from 'react';
import { KeyRound, Save, X } from 'lucide-react';
import type { SettingsState } from '../types';

interface Props {
  settings: SettingsState;
  onClose: () => void;
  onSave: (settings: SettingsState) => void;
}

export const SettingsModal: React.FC<Props> = ({ settings, onClose, onSave }) => {
  const [token, setToken] = useState(settings.githubToken);
  const [minutes, setMinutes] = useState(settings.autoCheckMinutes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div className="w-full max-w-lg bg-card border border-border rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-[#101319]">
          <h2 className="font-semibold flex items-center gap-2"><KeyRound size={18} className="text-lime" /> Paramètres</h2>
          <button onClick={onClose} className="p-2 rounded-md border border-border hover:bg-[#1A1F27] text-muted hover:text-text"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">GitHub Personal Access Token (optionnel)</label>
            <p className="text-xs text-muted mb-2">Permet d'augmenter la limite de l'API GitHub (60 req/h sans token). Le token est stocké localement sur cet appareil.</p>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full bg-[#0F1115] border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-lime/40 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Vérification automatique des mises à jour</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={5}
                max={720}
                value={minutes}
                onChange={(e) => setMinutes(Math.max(5, Number(e.target.value) || 30))}
                className="w-28 bg-[#0F1115] border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-lime/40"
              />
              <span className="text-sm text-muted">minutes (min. 5)</span>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-border flex justify-end gap-2 bg-[#101319]">
          <button onClick={onClose} className="px-3 py-2 rounded-md border border-border hover:bg-[#1A1F27] text-sm">Annuler</button>
          <button
            onClick={() => onSave({ ...settings, githubToken: token.trim(), autoCheckMinutes: Math.max(5, minutes) })}
            className="px-3 py-2 rounded-md bg-acid text-black font-semibold text-sm inline-flex items-center gap-2 hover:brightness-110"
          >
            <Save size={15} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};
