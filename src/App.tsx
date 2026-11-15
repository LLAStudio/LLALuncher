import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { AppCard } from './components/AppCard';
import { AppDetailsModal } from './components/AppDetailsModal';
import { SettingsModal } from './components/SettingsModal';
import { CATALOG_APPS } from './data/catalog';
import type { AppInstallState, AppRuntimeState, NavSection, SettingsState, SortMode, ViewMode } from './types';
import { loadSettings, saveSettings, loadUpdateCache, formatRelativeTime } from './services/storage';
import { checkAppUpdate, getLastCheckedAt, isUpdateAvailable, pickBestAsset } from './services/githubUpdater';
import {
  downloadAndInstall,
  getAllInstallStates,
  launchApp,
  listenDownloadProgress,
  openExternal,
  openPath,
  setActiveVersion,
  uninstallVersion,
  type DownloadProgressEvent,
} from './lib/desktop';

const emptyInstall: AppInstallState = { installedVersions: [], activeVersion: null };

function matchesSection(app: AppRuntimeState, section: NavSection): boolean {
  if (section === 'applications') return true;
  if (section === 'lemon') return app.app.category === 'Lemon';
  if (section === 'lime') return app.app.category === 'Lime';
  if (section === 'installs') return (app.install.installedVersions?.length || 0) > 0;
  if (section === 'releases') return !!app.remote || app.updateAvailable;
  return true;
}

export default function App() {
  const [section, setSection] = useState<NavSection>('applications');
  const [sortMode, setSortMode] = useState<SortMode>('updates-first');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState<SettingsState>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [installs, setInstalls] = useState<Record<string, AppInstallState>>({});
  const [cache, setCache] = useState(() => loadUpdateCache());
  const [checkingIds, setCheckingIds] = useState<Record<string, boolean>>({});
  const [downloads, setDownloads] = useState<Record<string, { inProgress: boolean; percent?: number; targetVersion?: string }>>({});
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [globalChecking, setGlobalChecking] = useState(false);

  const refreshInstalls = useCallback(async () => {
    try {
      const all = await getAllInstallStates();
      setInstalls(all || {});
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshInstalls();
  }, [refreshInstalls]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listenDownloadProgress((payload: DownloadProgressEvent) => {
      setDownloads((prev) => ({
        ...prev,
        [payload.appId]: {
          inProgress: !payload.done,
          percent: payload.percent ?? (payload.total ? (payload.downloaded / payload.total) * 100 : prev[payload.appId]?.percent),
          targetVersion: payload.version,
        },
      }));
      if (payload.done) {
        refreshInstalls();
        setTimeout(() => {
          setDownloads((prev) => {
            const next = { ...prev };
            delete next[payload.appId];
            return next;
          });
        }, 1200);
      }
    }).then((u) => (unlisten = u));
    return () => {
      if (unlisten) unlisten();
    };
  }, [refreshInstalls]);

  const runCheckForApp = useCallback(
    async (appId: string) => {
      const app = CATALOG_APPS.find((a) => a.id === appId);
      if (!app) return;
      setCheckingIds((p) => ({ ...p, [appId]: true }));
      try {
        const { cacheEntry } = await checkAppUpdate(app, settings.githubToken);
        setCache((prev) => ({ ...prev, [appId]: cacheEntry }));
      } finally {
        setCheckingIds((p) => ({ ...p, [appId]: false }));
      }
    },
    [settings.githubToken],
  );

  const runCheckAll = useCallback(async () => {
    setGlobalChecking(true);
    try {
      for (const app of CATALOG_APPS) {
        setCheckingIds((p) => ({ ...p, [app.id]: true }));
        try {
          const { cacheEntry } = await checkAppUpdate(app, settings.githubToken);
          setCache((prev) => ({ ...prev, [app.id]: cacheEntry }));
        } finally {
          setCheckingIds((p) => ({ ...p, [app.id]: false }));
        }
      }
    } finally {
      setGlobalChecking(false);
    }
  }, [settings.githubToken]);

  // Startup check
  useEffect(() => {
    runCheckAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic check
  useEffect(() => {
    const ms = Math.max(5, settings.autoCheckMinutes) * 60 * 1000;
    const id = window.setInterval(() => {
      runCheckAll();
    }, ms);
    return () => window.clearInterval(id);
  }, [runCheckAll, settings.autoCheckMinutes]);

  const runtimeStates: AppRuntimeState[] = useMemo(() => {
    return CATALOG_APPS.map((app) => {
      const install = installs[app.id] || emptyInstall;
      const remote = cache[app.id]?.latest ?? null;
      const active = install.activeVersion || install.installedVersions[install.installedVersions.length - 1]?.version || null;
      const updateAvailable = !!(active && remote && isUpdateAvailable(active, remote.version));
      return {
        app,
        install,
        remote,
        updateAvailable,
        checking: !!checkingIds[app.id],
        error: cache[app.id]?.error ?? null,
        download: downloads[app.id],
      };
    });
  }, [installs, cache, checkingIds, downloads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = runtimeStates.filter((s) => matchesSection(s, section));
    if (q) {
      list = list.filter(
        (s) =>
          s.app.name.toLowerCase().includes(q) ||
          s.app.description.toLowerCase().includes(q) ||
          s.app.category.toLowerCase().includes(q) ||
          s.app.language.toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortMode === 'name') return a.app.name.localeCompare(b.app.name);
      if (sortMode === 'updates-first') {
        if (a.updateAvailable !== b.updateAvailable) return a.updateAvailable ? -1 : 1;
        const ad = a.remote?.publishedAt || '';
        const bd = b.remote?.publishedAt || '';
        return bd.localeCompare(ad) || a.app.name.localeCompare(b.app.name);
      }
      // recently-updated
      const ad = a.remote?.publishedAt || a.install.installedVersions[a.install.installedVersions.length - 1]?.installedAt || '';
      const bd = b.remote?.publishedAt || b.install.installedVersions[b.install.installedVersions.length - 1]?.installedAt || '';
      return bd.localeCompare(ad) || a.app.name.localeCompare(b.app.name);
    });
    return sorted;
  }, [runtimeStates, section, search, sortMode]);

  const updatesCount = runtimeStates.filter((s) => s.updateAvailable).length;
  const lastCheckedAt = getLastCheckedAt();
  const selectedState = selectedAppId ? runtimeStates.find((s) => s.app.id === selectedAppId) || null : null;

  const handleInstall = async (appId: string, version: string) => {
    const state = runtimeStates.find((s) => s.app.id === appId);
    if (!state?.remote) return;
    const asset = pickBestAsset(state.remote.assets);
    if (!asset) {
      alert('Aucun asset téléchargeable trouvé pour votre OS dans la dernière release.');
      return;
    }
    setDownloads((p) => ({ ...p, [appId]: { inProgress: true, percent: 0, targetVersion: version } }));
    try {
      const newState = await downloadAndInstall(appId, version, asset.browserDownloadUrl, asset.name);
      setInstalls((p) => ({ ...p, [appId]: newState }));
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
      setDownloads((p) => {
        const next = { ...p };
        delete next[appId];
        return next;
      });
    }
  };

  const handleOpenApp = async (appId: string, version?: string) => {
    try {
      await launchApp(appId, version);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const handleOpenFolder = async (appId: string) => {
    const st = installs[appId];
    const ver = st?.activeVersion || st?.installedVersions[st.installedVersions.length - 1];
    if (!ver) return;
    const iv = st.installedVersions.find((v) => v.version === ver.version);
    if (!iv) return;
    const folder = iv.path.replace(/[/\\][^/\\]+$/, '');
    try {
      await openPath(folder || iv.path);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const handleUninstall = async (appId: string, version?: string) => {
    const st = installs[appId];
    const target = version || st?.activeVersion || st?.installedVersions[st.installedVersions.length - 1]?.version;
    if (!target) return;
    if (!confirm(`Désinstaller ${appId} v${target} ?`)) return;
    try {
      const next = await uninstallVersion(appId, target);
      setInstalls((p) => ({ ...p, [appId]: next }));
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const handleSetActive = async (appId: string, version: string) => {
    try {
      const next = await setActiveVersion(appId, version);
      setInstalls((p) => ({ ...p, [appId]: next }));
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const handleUpdateAll = async () => {
    const toUpdate = runtimeStates.filter((s) => s.updateAvailable && s.remote && !s.download?.inProgress);
    for (const s of toUpdate) {
      await handleInstall(s.app.id, s.remote!.version);
    }
  };

  const sectionTitle: Record<NavSection, string> = {
    applications: 'Applications',
    lemon: 'Lemon · Micro-utilities',
    lime: 'Lime · Visual Studios & AI',
    installs: 'Installs · Gestion des versions locales',
    releases: 'Releases · Flux des dernières sorties GitHub',
  };

  return (
    <div className="h-screen w-screen flex bg-bg text-text overflow-hidden">
      <Sidebar
        active={section}
        onChange={setSection}
        lastCheckedAt={lastCheckedAt}
        onCheckUpdates={runCheckAll}
        checking={globalChecking}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          updatesCount={updatesCount}
          onUpdateAll={handleUpdateAll}
          sortMode={sortMode}
          onSortChange={setSortMode}
          search={search}
          onSearchChange={setSearch}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <main className="flex-1 overflow-y-auto p-5 grid-bg">
          <div className="flex items-end justify-between mb-4 gap-4">
            <div>
              <h1 className="text-xl font-semibold">{sectionTitle[section]}</h1>
              <p className="text-sm text-muted mt-0.5 font-mono">
                {filtered.length} app{filtered.length > 1 ? 's' : ''} · {updatesCount} mise(s) à jour disponible(s)
                {lastCheckedAt ? ` · Sync ${formatRelativeTime(lastCheckedAt)}` : ''}
              </p>
            </div>
            {section === 'releases' && (
              <div className="text-xs font-mono text-muted border border-border rounded-md px-3 py-2 bg-[#121418]">
                Flux basé sur les dernières releases/tags/commits GitHub détectés.
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-10 text-center text-muted bg-card/40">
              Aucun résultat pour cette vue.
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
              {filtered.map((state) => (
                <AppCard
                  key={state.app.id}
                  state={state}
                  viewMode={viewMode}
                  onOpenDetails={() => setSelectedAppId(state.app.id)}
                  onInstall={(v) => handleInstall(state.app.id, v)}
                  onUpdate={(v) => handleInstall(state.app.id, v)}
                  onOpenApp={() => handleOpenApp(state.app.id)}
                  onOpenRepo={() => openExternal(state.app.repoUrl)}
                  onOpenFolder={() => handleOpenFolder(state.app.id)}
                  onUninstall={() => handleUninstall(state.app.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((state) => (
                <AppCard
                  key={state.app.id}
                  state={state}
                  viewMode={viewMode}
                  onOpenDetails={() => setSelectedAppId(state.app.id)}
                  onInstall={(v) => handleInstall(state.app.id, v)}
                  onUpdate={(v) => handleInstall(state.app.id, v)}
                  onOpenApp={() => handleOpenApp(state.app.id)}
                  onOpenRepo={() => openExternal(state.app.repoUrl)}
                  onOpenFolder={() => handleOpenFolder(state.app.id)}
                  onUninstall={() => handleUninstall(state.app.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {selectedState && (
        <AppDetailsModal
          state={selectedState}
          onClose={() => setSelectedAppId(null)}
          onInstall={(v) => handleInstall(selectedState.app.id, v)}
          onOpen={(v) => handleOpenApp(selectedState.app.id, v)}
          onSetActive={(v) => handleSetActive(selectedState.app.id, v)}
          onUninstall={(v) => handleUninstall(selectedState.app.id, v)}
          onOpenFolder={() => handleOpenFolder(selectedState.app.id)}
          onOpenRepo={() => openExternal(selectedState.app.repoUrl)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSave={(s) => {
            setSettings(s);
            saveSettings(s);
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}
