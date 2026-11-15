import type { SettingsState, UpdateCacheEntry } from '../types';

const SETTINGS_KEY = 'llastudio.settings.v1';
const UPDATE_CACHE_KEY = 'llastudio.updateCache.v1';

export const defaultSettings: SettingsState = {
  githubToken: '',
  autoCheckMinutes: 30,
  checkLauncherUpdates: true,
};

export function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    return {
      ...defaultSettings,
      ...parsed,
      autoCheckMinutes: Math.max(5, Number(parsed.autoCheckMinutes ?? 30) || 30),
      checkLauncherUpdates:
        typeof parsed.checkLauncherUpdates === 'boolean'
          ? parsed.checkLauncherUpdates
          : defaultSettings.checkLauncherUpdates,
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: SettingsState): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadUpdateCache(): Record<string, UpdateCacheEntry> {
  try {
    const raw = localStorage.getItem(UPDATE_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, UpdateCacheEntry>;
  } catch {
    return {};
  }
}

export function saveUpdateCache(cache: Record<string, UpdateCacheEntry>): void {
  localStorage.setItem(UPDATE_CACHE_KEY, JSON.stringify(cache));
}

export function formatBytes(bytes?: number): string {
  if (bytes == null || Number.isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

export function formatRelativeTime(iso?: string | null): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return 'JUST NOW';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function cleanVersion(v?: string | null): string {
  if (!v) return '0.0.0';
  return v.trim().replace(/^v/i, '');
}
