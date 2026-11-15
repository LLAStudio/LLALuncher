import semver from 'semver';
import type { CatalogApp, RemoteReleaseInfo, ReleaseAssetInfo, UpdateCacheEntry } from '../types';
import { cleanVersion, loadUpdateCache, saveUpdateCache } from './storage';

export type PlatformKind = 'windows' | 'macos' | 'linux' | 'unknown';

export function detectPlatform(): PlatformKind {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'macos';
  if (ua.includes('linux')) return 'linux';
  return 'unknown';
}

function platformAssetScore(name: string, platform: PlatformKind): number {
  const n = name.toLowerCase();
  if (platform === 'windows') {
    if (n.endsWith('.msi')) return 100;
    if (n.endsWith('.exe')) return 95;
    if (n.includes('windows') || n.includes('win')) return 80;
  }
  if (platform === 'macos') {
    if (n.endsWith('.dmg')) return 100;
    if (n.endsWith('.pkg')) return 90;
    if (n.includes('mac') || n.includes('darwin') || n.includes('osx')) return 80;
  }
  if (platform === 'linux') {
    if (n.endsWith('.appimage')) return 100;
    if (n.endsWith('.deb')) return 95;
    if (n.endsWith('.rpm')) return 90;
    if (n.includes('linux')) return 80;
  }
  // generic fallbacks
  if (n.endsWith('.zip') || n.endsWith('.tar.gz')) return 20;
  return 0;
}

export function pickBestAsset(assets: ReleaseAssetInfo[], platform: PlatformKind = detectPlatform()): ReleaseAssetInfo | undefined {
  if (!assets.length) return undefined;
  const scored = assets
    .map((a) => ({ a, score: platformAssetScore(a.name, platform) }))
    .sort((x, y) => y.score - x.score || y.a.size - x.a.size);
  if (scored[0].score > 0) return scored[0].a;
  return assets[0];
}

export function compareVersions(localVersion: string | null | undefined, remoteVersion: string | null | undefined): number {
  const l = semver.coerce(cleanVersion(localVersion || '0.0.0'));
  const r = semver.coerce(cleanVersion(remoteVersion || '0.0.0'));
  if (!l || !r) return 0;
  if (semver.gt(r, l)) return 1;
  if (semver.lt(r, l)) return -1;
  return 0;
}

export function isUpdateAvailable(localVersion: string | null | undefined, remoteVersion: string | null | undefined): boolean {
  return compareVersions(localVersion, remoteVersion) > 0;
}

async function ghFetch(url: string, token?: string): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token && token.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return fetch(url, { headers });
}

function mapAssets(raw: any[]): ReleaseAssetInfo[] {
  return (raw || []).map((a) => ({
    name: String(a.name ?? ''),
    browserDownloadUrl: String(a.browser_download_url ?? ''),
    size: Number(a.size ?? 0),
    contentType: a.content_type ? String(a.content_type) : undefined,
  }));
}

async function fetchLatestRelease(app: CatalogApp, token?: string): Promise<RemoteReleaseInfo | null> {
  const res = await ghFetch(`${app.apiReleasesUrl}/latest`, token);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub releases/latest error ${res.status}`);
  const data = await res.json();
  const tagName = String(data.tag_name ?? data.name ?? '').trim();
  if (!tagName) return null;
  return {
    tagName,
    version: cleanVersion(tagName),
    name: data.name ? String(data.name) : undefined,
    body: data.body ? String(data.body) : '',
    htmlUrl: data.html_url ? String(data.html_url) : app.repoUrl,
    publishedAt: data.published_at ? String(data.published_at) : undefined,
    assets: mapAssets(data.assets || []),
    source: 'release',
  };
}

async function fetchLatestTag(app: CatalogApp, token?: string): Promise<RemoteReleaseInfo | null> {
  const res = await ghFetch(`https://api.github.com/repos/${app.repoOwner}/${app.repoName}/tags?per_page=1`, token);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub tags error ${res.status}`);
  const data = (await res.json()) as any[];
  if (!Array.isArray(data) || data.length === 0) return null;
  const tag = data[0];
  const tagName = String(tag.name ?? '').trim();
  if (!tagName) return null;
  return {
    tagName,
    version: cleanVersion(tagName),
    name: tagName,
    body: 'Latest tag detected (no published GitHub release found).',
    htmlUrl: `${app.repoUrl}/releases/tag/${encodeURIComponent(tagName)}`,
    publishedAt: undefined,
    assets: tag.zipball_url
      ? [{ name: `${app.repoName}-${tagName}.zip`, browserDownloadUrl: String(tag.zipball_url), size: 0 }]
      : [],
    source: 'tag',
  };
}

async function fetchLatestCommit(app: CatalogApp, token?: string): Promise<RemoteReleaseInfo | null> {
  const repoRes = await ghFetch(`https://api.github.com/repos/${app.repoOwner}/${app.repoName}`, token);
  if (!repoRes.ok) throw new Error(`GitHub repo error ${repoRes.status}`);
  const repo = await repoRes.json();
  const branch = String(repo.default_branch || 'main');
  const commitsRes = await ghFetch(
    `https://api.github.com/repos/${app.repoOwner}/${app.repoName}/commits/${encodeURIComponent(branch)}`,
    token,
  );
  if (!commitsRes.ok) throw new Error(`GitHub commits error ${commitsRes.status}`);
  const commit = await commitsRes.json();
  const sha = String(commit.sha || '').slice(0, 7);
  if (!sha) return null;
  const date = commit.commit?.committer?.date || commit.commit?.author?.date;
  const version = date ? `0.0.0-${sha}` : `0.0.0-${sha}`;
  return {
    tagName: sha,
    version,
    name: `Commit ${sha}`,
    body: commit.commit?.message ? String(commit.commit.message) : 'Latest commit on default branch.',
    htmlUrl: commit.html_url ? String(commit.html_url) : app.repoUrl,
    publishedAt: date ? String(date) : undefined,
    assets: [],
    source: 'commit',
  };
}

export async function fetchRemoteReleaseInfo(app: CatalogApp, token?: string): Promise<RemoteReleaseInfo | null> {
  try {
    const latest = await fetchLatestRelease(app, token);
    if (latest) return latest;
  } catch (e) {
    // fall through to tags/commit on 404-like cases handled above; rethrow for hard errors below if needed
    if (!(e instanceof Error)) throw e;
    // continue to fallbacks
  }
  try {
    const tag = await fetchLatestTag(app, token);
    if (tag) return tag;
  } catch {
    // continue
  }
  try {
    const commit = await fetchLatestCommit(app, token);
    if (commit) return commit;
  } catch {
    // no-op
  }
  return null;
}

export async function checkAppUpdate(
  app: CatalogApp,
  token?: string,
): Promise<{ latest: RemoteReleaseInfo | null; cacheEntry: UpdateCacheEntry }> {
  const cache = loadUpdateCache();
  try {
    const latest = await fetchRemoteReleaseInfo(app, token);
    const entry: UpdateCacheEntry = {
      appId: app.id,
      checkedAt: new Date().toISOString(),
      latest,
      error: null,
    };
    cache[app.id] = entry;
    saveUpdateCache(cache);
    return { latest, cacheEntry: entry };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error while checking updates';
    const entry: UpdateCacheEntry = {
      appId: app.id,
      checkedAt: new Date().toISOString(),
      latest: cache[app.id]?.latest ?? null,
      error: message,
    };
    cache[app.id] = entry;
    saveUpdateCache(cache);
    return { latest: entry.latest ?? null, cacheEntry: entry };
  }
}

export async function checkAllUpdates(
  apps: CatalogApp[],
  token?: string,
  onProgress?: (appId: string) => void,
): Promise<Record<string, UpdateCacheEntry>> {
  const result: Record<string, UpdateCacheEntry> = { ...loadUpdateCache() };
  // sequential to be gentle with unauthenticated rate limits; token users could parallelize but keep simple/safe
  for (const app of apps) {
    onProgress?.(app.id);
    const { cacheEntry } = await checkAppUpdate(app, token);
    result[app.id] = cacheEntry;
  }
  return result;
}

export function getCachedLatest(appId: string): RemoteReleaseInfo | null | undefined {
  const cache = loadUpdateCache();
  return cache[appId]?.latest;
}

export function getLastCheckedAt(appId?: string): string | null {
  const cache = loadUpdateCache();
  if (appId) return cache[appId]?.checkedAt ?? null;
  const times = Object.values(cache)
    .map((e) => e.checkedAt)
    .filter(Boolean)
    .sort();
  return times.length ? times[times.length - 1] : null;
}
