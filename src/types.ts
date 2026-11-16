export type AppCategory = 'Lemon' | 'Lime' | 'Acid';

export interface CatalogApp {
  id: string;
  name: string;
  repoUrl: string;
  repoOwner: string;
  repoName: string;
  apiReleasesUrl: string;
  category: AppCategory;
  language: string;
  description: string;
}

export interface ReleaseAssetInfo {
  name: string;
  browserDownloadUrl: string;
  size: number; // bytes
  contentType?: string;
}

export interface RemoteReleaseInfo {
  tagName: string; // e.g. v1.2.0
  version: string; // normalized without leading v
  name?: string;
  body?: string;
  htmlUrl?: string;
  publishedAt?: string;
  assets: ReleaseAssetInfo[];
  source: 'release' | 'tag' | 'commit';
}

export interface InstalledVersion {
  version: string;
  path: string;
  installedAt: string;
  size?: number;
}

export interface AppInstallState {
  installedVersions: InstalledVersion[];
  activeVersion?: string | null;
}

export interface UpdateCacheEntry {
  appId: string;
  checkedAt: string; // ISO
  latest?: RemoteReleaseInfo | null;
  error?: string | null;
  etag?: string | null;
}

export interface AppRuntimeState {
  app: CatalogApp;
  install: AppInstallState;
  remote?: RemoteReleaseInfo | null;
  updateAvailable: boolean;
  checking: boolean;
  error?: string | null;
  download?: {
    inProgress: boolean;
    percent?: number;
    downloaded?: number;
    total?: number;
    targetVersion?: string;
  };
}

export type NavSection = 'applications' | 'lemon' | 'lime' | 'installs' | 'releases';
export type SortMode = 'name' | 'recently-updated' | 'updates-first';
export type ViewMode = 'grid' | 'list';

export interface SettingsState {
  githubToken: string;
  autoCheckMinutes: number;
  checkLauncherUpdates: boolean;
  skippedLauncherVersion: string;
}

export interface LauncherUpdateCache {
  checkedAt: string;
  latest: RemoteReleaseInfo | null;
}
