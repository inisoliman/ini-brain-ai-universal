import * as https from 'https';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UpstreamSource, UPSTREAM_SOURCES } from './upstreamSources';
import { UpstreamState, readState, writeState } from './stateStore';

type FetchText = (url: string) => Promise<string>;
export type UpstreamFetchSource = 'original' | 'mirror' | 'snapshot';

export interface FetchedUpstreamFile {
  file: string;
  content: string;
  source: UpstreamFetchSource;
  url?: string;
}

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'ini-brain-ai-updater/3.0' } }, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} ${url}`));
        return;
      }
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

async function fetchJson<T = unknown>(url: string, fetcher: FetchText = fetchText): Promise<T> {
  const text = await fetcher(url);
  return JSON.parse(text) as T;
}

export interface UpdateCheck {
  source: UpstreamSource;
  hasUpdate: boolean;
  latestSha: string;
  lastSha: string;
  latestMessage?: string;
  checkedFrom: UpstreamFetchSource;
}

export async function checkOne(
  source: UpstreamSource,
  state: UpstreamState,
  fetcher: FetchText = fetchText
): Promise<UpdateCheck> {
  const url = `https://api.github.com/repos/${source.owner}/${source.name}/commits/${source.branch}`;
  const data = await fetchJson<{ sha: string; commit?: { message?: string } }>(url, fetcher);
  const latestSha = data.sha;
  const lastSha = state[source.id]?.lastSha ?? '';
  return {
    source,
    hasUpdate: latestSha !== lastSha,
    latestSha,
    lastSha,
    latestMessage: data.commit?.message,
    checkedFrom: 'original',
  };
}

export async function checkAll(root: string): Promise<UpdateCheck[]> {
  const state = await readState(root);
  const checks: UpdateCheck[] = [];
  for (const source of UPSTREAM_SOURCES) {
    try {
      const check = await checkOne(source, state);
      state[source.id] = {
        ...state[source.id],
        lastCheck: new Date().toISOString(),
        lastSha: state[source.id]?.lastSha ?? '',
      };
      checks.push(check);
    } catch (e) {
      console.warn(`Failed to check ${source.id}:`, e);
    }
  }
  await writeState(root, state);
  return checks;
}

export async function applyOne(source: UpstreamSource, root: string, latestSha: string): Promise<string[]> {
  const written: string[] = [];
  for (const file of source.files) {
    try {
      const fetched = await fetchUpstreamFile(source, root, file);
      const target = path.join(root, '.brain', 'upstream', source.id, file);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, fetched.content, 'utf8');
      written.push(target);
    } catch (e) {
      console.warn(`Failed to fetch ${source.id}/${file}:`, e);
    }
  }
  const state = await readState(root);
  state[source.id] = {
    ...state[source.id],
    lastSha: latestSha,
    lastApply: new Date().toISOString(),
    lastCheck: new Date().toISOString(),
  };
  await writeState(root, state);
  return written;
}

export async function fetchUpstreamFile(
  source: UpstreamSource,
  root: string,
  file: string,
  fetcher: FetchText = fetchText
): Promise<FetchedUpstreamFile> {
  const originalUrl = `https://raw.githubusercontent.com/${source.owner}/${source.name}/${source.branch}/${file}`;
  const original = await tryFetch(originalUrl, fetcher);
  if (original !== undefined) {
    return { file, content: original, source: 'original', url: originalUrl };
  }

  const mirrorUrl = source.mirrorBaseUrl ? `${source.mirrorBaseUrl}/${file}` : '';
  if (mirrorUrl) {
    const mirror = await tryFetch(mirrorUrl, fetcher);
    if (mirror !== undefined) {
      return { file, content: mirror, source: 'mirror', url: mirrorUrl };
    }
  }

  const snapshot = await readSnapshotFile(source, root, file);
  if (snapshot !== undefined) {
    return { file, content: snapshot, source: 'snapshot' };
  }

  throw new Error(`No available upstream source for ${source.id}/${file}`);
}

async function tryFetch(url: string, fetcher: FetchText): Promise<string | undefined> {
  try {
    return await fetcher(url);
  } catch {
    return undefined;
  }
}

async function readSnapshotFile(source: UpstreamSource, root: string, file: string): Promise<string | undefined> {
  if (!source.snapshotRoot) return undefined;
  const packageRoot = path.resolve(__dirname, '..', '..');
  const candidates = [
    path.join(root, source.snapshotRoot, file),
    path.join(packageRoot, source.snapshotRoot, file)
  ];
  for (const candidate of candidates) {
    try {
      return await fs.readFile(candidate, 'utf8');
    } catch {
      // Try the next snapshot location.
    }
  }
  return undefined;
}

export async function applyAll(checks: UpdateCheck[], root: string): Promise<string[]> {
  const all: string[] = [];
  for (const c of checks.filter(x => x.hasUpdate)) {
    all.push(...await applyOne(c.source, root, c.latestSha));
  }
  return all;
}
