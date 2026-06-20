import * as https from 'https';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UpstreamSource, UPSTREAM_SOURCES } from './upstreamSources';
import { UpstreamState, readState, writeState } from './stateStore';

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

async function fetchJson<T = unknown>(url: string): Promise<T> {
  const text = await fetchText(url);
  return JSON.parse(text) as T;
}

export interface UpdateCheck {
  source: UpstreamSource;
  hasUpdate: boolean;
  latestSha: string;
  lastSha: string;
  latestMessage?: string;
}

export async function checkOne(source: UpstreamSource, state: UpstreamState): Promise<UpdateCheck> {
  const url = `https://api.github.com/repos/${source.owner}/${source.name}/commits/${source.branch}`;
  const data = await fetchJson<{ sha: string; commit?: { message?: string } }>(url);
  const latestSha = data.sha;
  const lastSha = state[source.id]?.lastSha ?? '';
  return {
    source,
    hasUpdate: latestSha !== lastSha,
    latestSha,
    lastSha,
    latestMessage: data.commit?.message,
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
    const url = `https://raw.githubusercontent.com/${source.owner}/${source.name}/${source.branch}/${file}`;
    try {
      const content = await fetchText(url);
      const target = path.join(root, '.brain', 'upstream', source.id, file);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, content, 'utf8');
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

export async function applyAll(checks: UpdateCheck[], root: string): Promise<string[]> {
  const all: string[] = [];
  for (const c of checks.filter(x => x.hasUpdate)) {
    all.push(...await applyOne(c.source, root, c.latestSha));
  }
  return all;
}
