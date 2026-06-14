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
  }): Promise<MemoryEntry> {
    const memories = await this.readAll();
    const now = new Date().toISOString();
    const entry: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      kind: input.kind && memoryKinds.includes(input.kind) ? input.kind : 'note',
      content: input.content.trim(),
      files: input.files || [],
      concepts: input.concepts || [],
      importance: clamp(input.importance || 7, 1, 10),
      source: input.source || 'manual',
      createdAt: now,
      updatedAt: now,
      accessCount: 0
    };
    memories.push(entry);
    await this.writeAll(memories);
    return entry;
  }

  async search(query: string, limit = 10): Promise<MemorySearchResult[]> {
    const queryTokens = tokenize(query);
    const results = (await this.readAll())
      .map(entry => scoreEntry(entry, queryTokens))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    if (results.length) {
      const ids = new Set(results.map(result => result.entry.id));
      const updated = (await this.readAll()).map(entry => ids.has(entry.id) ? { ...entry, accessCount: entry.accessCount + 1, updatedAt: new Date().toISOString() } : entry);
      await this.writeAll(updated);
    }
    return results;
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

  private async readAll(): Promise<MemoryEntry[]> {
    try {
      const parsed = JSON.parse(await fs.readFile(this.file, 'utf8')) as MemoryEntry[];
      return Array.isArray(parsed) ? parsed.filter(isMemoryEntry) : [];
    } catch {
      return [];
    }
  }

  private async writeAll(entries: MemoryEntry[]): Promise<void> {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
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
    score: matches.length * 10 + entry.importance + Math.min(entry.accessCount, 10)
  };
}

function isMemoryEntry(value: unknown): value is MemoryEntry {
  return Boolean(value) && typeof value === 'object' && typeof (value as MemoryEntry).id === 'string' && typeof (value as MemoryEntry).content === 'string';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value)));
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
