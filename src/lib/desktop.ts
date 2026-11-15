import type { AppInstallState } from '../types';

export const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function getAllInstallStates(): Promise<Record<string, AppInstallState>> {
  if (!isTauri()) {
    try {
      return JSON.parse(localStorage.getItem('llastudio.installs.mock') || '{}');
    } catch {
      return {};
    }
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<Record<string, AppInstallState>>('get_all_install_states');
}

export async function getInstallState(appId: string): Promise<AppInstallState> {
  if (!isTauri()) {
    const all = await getAllInstallStates();
    return all[appId] || { installedVersions: [], activeVersion: null };
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<AppInstallState>('get_install_state', { appId });
}

export async function setActiveVersion(appId: string, version: string): Promise<AppInstallState> {
  if (!isTauri()) {
    const all = await getAllInstallStates();
    const state = all[appId] || { installedVersions: [], activeVersion: null };
    state.activeVersion = version;
    all[appId] = state;
    localStorage.setItem('llastudio.installs.mock', JSON.stringify(all));
    return state;
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<AppInstallState>('set_active_version', { appId, version });
}

export async function openExternal(url: string): Promise<void> {
  if (!isTauri()) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('open_external', { url });
}

export async function openPath(path: string): Promise<void> {
  if (!isTauri()) {
    alert(`Open folder is available in the desktop app.\nPath: ${path}`);
    return;
  }
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('open_path', { path });
}

export async function launchApp(appId: string, version?: string): Promise<void> {
  if (!isTauri()) {
    alert(`Launch is available in the desktop app.\nApp: ${appId}${version ? ` v${version}` : ''}`);
    return;
  }
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('launch_app', { appId, version: version ?? null });
}

export async function uninstallVersion(appId: string, version: string): Promise<AppInstallState> {
  if (!isTauri()) {
    const all = await getAllInstallStates();
    const state = all[appId] || { installedVersions: [], activeVersion: null };
    state.installedVersions = state.installedVersions.filter((v) => v.version !== version);
    if (state.activeVersion === version) {
      state.activeVersion = state.installedVersions[state.installedVersions.length - 1]?.version ?? null;
    }
    all[appId] = state;
    localStorage.setItem('llastudio.installs.mock', JSON.stringify(all));
    return state;
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<AppInstallState>('uninstall_version', { appId, version });
}

export async function downloadAndInstall(
  appId: string,
  version: string,
  url: string,
  fileName: string,
): Promise<AppInstallState> {
  if (!isTauri()) {
    // Browser mock install for UI development/demo
    const all = await getAllInstallStates();
    const state = all[appId] || { installedVersions: [], activeVersion: null };
    state.installedVersions = [
      ...state.installedVersions.filter((v) => v.version !== version),
      { version, path: `mock://${appId}/${fileName}`, installedAt: new Date().toISOString() },
    ];
    state.activeVersion = version;
    all[appId] = state;
    localStorage.setItem('llastudio.installs.mock', JSON.stringify(all));
    return state;
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<AppInstallState>('download_and_install', { appId, version, url, fileName });
}

export type DownloadProgressEvent = {
  appId: string;
  version: string;
  downloaded: number;
  total?: number | null;
  percent?: number | null;
  done: boolean;
  path?: string | null;
  error?: string | null;
};

export async function listenDownloadProgress(
  handler: (payload: DownloadProgressEvent) => void,
): Promise<() => void> {
  if (!isTauri()) return () => {};
  const { listen } = await import('@tauri-apps/api/event');
  const unlisten = await listen<DownloadProgressEvent>('download-progress', (event) => handler(event.payload));
  return unlisten;
}
