import { MemoryEntry, MemoryKind } from './types';
import { isExpired, tokenize, MemoryStore } from './memoryStore';

export interface MemoryCompactionOptions {
  dryRun?: boolean;
  now?: string;
}

export interface MemoryCompactionResult {
  dryRun: boolean;
  changed: boolean;
  wouldChange: boolean;
  totalBefore: number;
  totalAfter: number;
  expiredRemoved: number;
  duplicatesMerged: number;
  pinnedKept: number;
}

export interface MemoryStats {
  generatedAt: string;
  totalMemories: number;
  pinnedMemories: number;
  expiredMemories: number;
  byKind: Record<MemoryKind, number>;
  averageImportance: number;
  averageConfidence: number;
}

const SIMILARITY_THRESHOLD = 0.74;

export async function compactMemories(root: string, options: MemoryCompactionOptions = {}): Promise<MemoryCompactionResult> {
  const store = new MemoryStore(root);
  const before = await store.listAll();
  const now = options.now || new Date().toISOString();
  const active = before.filter(entry => !shouldRemoveExpired(entry, now));
  const deduped = mergeDuplicates(active);
  const summary = buildCompactionResult(before, deduped, Boolean(options.dryRun), now);
  if (!options.dryRun && summary.wouldChange) await store.replaceAll(deduped);
  return summary;
}

export async function getMemoryStats(root: string, now = new Date().toISOString()): Promise<MemoryStats> {
  const entries = await new MemoryStore(root).listAll();
  return {
    generatedAt: new Date().toISOString(),
    totalMemories: entries.length,
    pinnedMemories: entries.filter(entry => entry.pinned).length,
    expiredMemories: entries.filter(entry => isExpired(entry, now)).length,
    byKind: countByKind(entries),
    averageImportance: average(entries.map(entry => entry.importance)),
    averageConfidence: average(entries.map(entry => entry.confidence ?? 1))
  };
}

export function normalizeMemoryText(value: string): string {
  return tokenize(value).sort().join(' ');
}

function shouldRemoveExpired(entry: MemoryEntry, now: string): boolean {
  return isExpired(entry, now) && !entry.pinned;
}

function mergeDuplicates(entries: MemoryEntry[]): MemoryEntry[] {
  const sorted = entries.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const kept: MemoryEntry[] = [];
  for (const entry of sorted) {
    const duplicate = kept.find(candidate => canMerge(candidate, entry));
    if (duplicate && !entry.pinned) mergeInto(duplicate, entry);
    else kept.push(entry);
  }
  return kept.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function canMerge(existing: MemoryEntry, candidate: MemoryEntry): boolean {
  if (existing.kind !== candidate.kind) return false;
  if (!hasConceptOverlap(existing, candidate)) return false;
  if (existing.pinned && candidate.pinned) return false;
  return textSimilarity(existing.content, candidate.content) >= SIMILARITY_THRESHOLD;
}

function hasConceptOverlap(a: MemoryEntry, b: MemoryEntry): boolean {
  const left = new Set(a.concepts.map(concept => concept.toLowerCase()));
  return b.concepts.some(concept => left.has(concept.toLowerCase()));
}

function textSimilarity(a: string, b: string): number {
  const left = new Set(normalizeMemoryText(a).split(' ').filter(Boolean));
  const right = new Set(normalizeMemoryText(b).split(' ').filter(Boolean));
  const intersection = [...left].filter(token => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

function mergeInto(target: MemoryEntry, duplicate: MemoryEntry): void {
  target.files = unique([...target.files, ...duplicate.files]);
  target.concepts = unique([...target.concepts, ...duplicate.concepts]);
  target.importance = Math.max(target.importance, duplicate.importance);
  target.confidence = Math.max(target.confidence ?? 1, duplicate.confidence ?? 1);
  target.pinned = target.pinned || duplicate.pinned;
  target.updatedAt = maxDate(target.updatedAt, duplicate.updatedAt);
}

function buildCompactionResult(before: MemoryEntry[], after: MemoryEntry[], dryRun: boolean, now: string): MemoryCompactionResult {
  const totalBefore = before.length;
  const totalAfter = after.length;
  const pinnedKept = after.filter(entry => entry.pinned).length;
  const expiredRemoved = before.filter(entry => isExpired(entry, now) && !entry.pinned).length;
  const duplicatesMerged = totalBefore - expiredRemoved - totalAfter;
  const wouldChange = totalBefore !== totalAfter;
  return { dryRun, changed: dryRun ? false : wouldChange, wouldChange, totalBefore, totalAfter, expiredRemoved, duplicatesMerged, pinnedKept };
}

function countByKind(entries: MemoryEntry[]): Record<MemoryKind, number> {
  const counts = { fact: 0, decision: 0, preference: 0, bug: 0, workflow: 0, session: 0, note: 0 };
  for (const entry of entries) counts[entry.kind] += 1;
  return counts;
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function maxDate(a: string, b: string): string {
  return a.localeCompare(b) >= 0 ? a : b;
}
