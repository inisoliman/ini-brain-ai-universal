import * as fs from 'fs/promises';
import * as path from 'path';
import { MemoryEntry, MemoryKind, MemorySearchResult, ProjectMemoryProfile } from './types';

const memoryKinds: MemoryKind[] = ['fact', 'decision', 'preference', 'bug', 'workflow', 'session', 'note'];

export class MemoryStore {
  private readonly file: string;

  constructor(private readonly root: string) {
    this.file = path.join(root, '.brain', 'memories.json');
  }

  async save(input: {
    content: string;
    kind?: MemoryKind;
    files?: string[];
    concepts?: string[];
    importance?: number;
    source?: MemoryEntry['source'];
    confidence?: number;
    expiresAt?: string;
    pinned?: boolean;
    origin?: string;
  }): Promise<MemoryEntry> {
    if (!input.content.trim()) throw new Error('Memory content must not be empty.');
    return this.transaction(memories => {
    const now = new Date().toISOString();
    const entry: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      kind: input.kind && memoryKinds.includes(input.kind) ? input.kind : 'note',
      content: input.content.trim(),
      files: input.files || [],
      concepts: input.concepts || [],
      importance: clamp(input.importance || 7, 1, 10),
      source: input.source || 'manual',
      confidence: clampDecimal(input.confidence ?? 1, 0, 1),
      expiresAt: validIsoDate(input.expiresAt) ? input.expiresAt : undefined,
      pinned: input.pinned === true,
      origin: cleanOrigin(input.origin) || 'local',
      createdAt: now,
      updatedAt: now,
      accessCount: 0
    };
    memories.push(entry);
    return { entries: memories, result: entry };
    });
  }

  async search(query: string, limit = 10): Promise<MemorySearchResult[]> {
    return this.transaction(entries => {
      const queryTokens = tokenize(query);
      const now = new Date().toISOString();
      const results = entries
        .filter(entry => !isExpired(entry, now) || entry.pinned)
        .map(entry => scoreEntry(entry, queryTokens))
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      const ids = new Set(results.map(result => result.entry.id));
      return {
        entries: results.length ? entries.map(entry => ids.has(entry.id) ? { ...entry, accessCount: entry.accessCount + 1, updatedAt: now } : entry) : undefined,
        result: results
      };
    });
  }

  async buildContext(task: string, budgetChars = 5000): Promise<string> {
    const results = await this.search(task, 12);
    const lines = results.map(result => formatMemoryLine(result.entry));
    const text = lines.join('\n');
    return text.length <= budgetChars ? text : `${text.slice(0, budgetChars)}\n<!-- memory context truncated -->`;
  }

  async list(limit = 20): Promise<MemoryEntry[]> {
    const entries = await this.readAll();
    return entries
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, Math.max(1, Math.min(50, Math.floor(limit))));
  }

  async listAll(): Promise<MemoryEntry[]> {
    return this.readAll();
  }

  async replaceAll(entries: MemoryEntry[]): Promise<void> {
    await this.transaction(() => ({ entries: validateEntries(entries), result: undefined }));
  }

  async buildProfile(): Promise<ProjectMemoryProfile> {
    const entries = await this.readAll();
    return {
      generatedAt: new Date().toISOString(),
      totalMemories: entries.length,
      topConcepts: topConcepts(entries.flatMap(entry => entry.concepts)),
      topFiles: topFiles(entries.flatMap(entry => entry.files)),
      importantDecisions: entries.filter(entry => entry.kind === 'decision').sort((a, b) => b.importance - a.importance).slice(0, 10),
      recentMemories: entries.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 10)
    };
  }

  /** Read, transform and atomically commit under the shared exclusive lock. */
  async transaction<T>(update: (entries: MemoryEntry[]) => { entries?: MemoryEntry[]; result: T }): Promise<T> {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const lock = `${this.file}.lock`;
    const deadline = Date.now() + 5000;
    let handle: fs.FileHandle;
    for (;;) {
      try {
        handle = await fs.open(lock, 'wx', 0o600);
        break;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        // Windows may report delete-pending exclusive-create contention as EPERM.
        if (code !== 'EEXIST' && !(process.platform === 'win32' && (code === 'EPERM' || code === 'EACCES'))) throw error;
        if (Date.now() >= deadline) throw new Error('Memory store lock contention: stop all writers before recovering an abandoned memories.json.lock.');
        await new Promise(resolve => setTimeout(resolve, 15 + Math.floor(Math.random() * 20)));
      }
    }
    try {
      await handle.writeFile(JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));
      const outcome = update(await this.readAll());
      if (outcome.entries !== undefined) await this.writeAll(validateEntries(outcome.entries));
      return outcome.result;
    } finally {
      // Never age-evict locks: even a very old lock can have a live owner.
      try { await handle.close(); } finally { await fs.unlink(lock); }
    }
  }

  private async readAll(): Promise<MemoryEntry[]> {
    let text: string;
    try {
      text = await fs.readFile(this.file, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
    return validateEntries(JSON.parse(text));
  }

  private async writeAll(entries: MemoryEntry[]): Promise<void> {
    const temp = `${this.file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
    const handle = await fs.open(temp, 'wx', 0o600);
    try {
      await handle.writeFile(`${JSON.stringify(entries, null, 2)}\n`, 'utf8');
      await handle.sync();
      await handle.close();
      await fs.rename(temp, this.file);
    } finally {
      await handle.close();
      await fs.unlink(temp).catch(error => { if (error.code !== 'ENOENT') throw error; });
    }
  }
}

export function parseCsvList(value: string | undefined): string[] {
  return (value || '').split(',').map(item => item.trim()).filter(Boolean);
}

export function formatMemoryLine(entry: MemoryEntry): string {
  const refs = [
    entry.files.length ? `files=${entry.files.join(',')}` : '',
    entry.concepts.length ? `concepts=${entry.concepts.join(',')}` : ''
  ].filter(Boolean).join(' ');
  return `- [${entry.kind}/${entry.importance}] ${entry.content}${refs ? ` (${refs})` : ''}`;
}

export function tokenize(value: string): string[] {
  return value.toLowerCase().split(/[^a-z0-9_\u0600-\u06ff]+/i).filter(token => token.length > 1);
}

export function scoreEntry(entry: MemoryEntry, queryTokens: string[]): MemorySearchResult {
  const haystack = tokenize([entry.content, entry.kind, ...entry.files, ...entry.concepts].join(' '));
  const matches = [...new Set(queryTokens.filter(token => haystack.includes(token)))];
  return {
    entry,
    matches,
    score: matches.length * 10 + entry.importance + Math.min(entry.accessCount, 10) + Math.round((entry.confidence ?? 1) * 5) + (entry.pinned ? 3 : 0)
  };
}

export function isExpired(entry: MemoryEntry, nowIso = new Date().toISOString()): boolean {
  return Boolean(entry.expiresAt && entry.expiresAt < nowIso);
}

function normalizeMemoryEntry(value: unknown, index = 0): MemoryEntry | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<MemoryEntry>;
  if (typeof raw.content !== 'string' || !raw.content.trim()) return null;
  const now = new Date().toISOString();
  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : `mem_legacy_${index}`,
    kind: raw.kind && memoryKinds.includes(raw.kind) ? raw.kind : 'note',
    content: raw.content.trim(),
    files: Array.isArray(raw.files) ? raw.files.map(String).filter(Boolean) : [],
    concepts: Array.isArray(raw.concepts) ? raw.concepts.map(String).filter(Boolean) : [],
    importance: clamp(typeof raw.importance === 'number' ? raw.importance : 7, 1, 10),
    source: isMemorySource(raw.source) ? raw.source : 'manual',
    confidence: clampDecimal(typeof raw.confidence === 'number' ? raw.confidence : 1, 0, 1),
    expiresAt: validIsoDate(raw.expiresAt) ? raw.expiresAt : undefined,
    pinned: raw.pinned === true,
    origin: cleanOrigin(raw.origin) || 'legacy',
    createdAt: validIsoDate(raw.createdAt) ? raw.createdAt : now,
    updatedAt: validIsoDate(raw.updatedAt) ? raw.updatedAt : (validIsoDate(raw.createdAt) ? raw.createdAt : now),
    accessCount: clamp(typeof raw.accessCount === 'number' ? raw.accessCount : 0, 0, Number.MAX_SAFE_INTEGER)
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function clampDecimal(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isMemorySource(value: unknown): value is MemoryEntry['source'] {
  return typeof value === 'string' && ['manual', 'ai', 'agent', 'system'].includes(value);
}

function validIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function cleanOrigin(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 120) : undefined;
}

function validateEntries(value: unknown): MemoryEntry[] {
  if (!Array.isArray(value)) throw new Error('Invalid memory store: expected an array. Original data was not changed.');
  return value.map((entry, index) => {
    const normalized = normalizeMemoryEntry(entry, index);
    if (!normalized) throw new Error(`Invalid memory entry at index ${index}. Original data was not changed.`);
    return normalized;
  });
}

function countValues(values: string[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
}

function topConcepts(values: string[]): Array<{ concept: string; count: number }> {
  return countValues(values).map(([concept, count]) => ({ concept, count }));
}

function topFiles(values: string[]): Array<{ file: string; count: number }> {
  return countValues(values).map(([file, count]) => ({ file, count }));
}
