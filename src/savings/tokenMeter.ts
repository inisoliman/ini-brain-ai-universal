/**
 * Token meter — heuristic token counter and savings tracker.
 * Uses 4 chars ≈ 1 token approximation (close to GPT/Claude tokenizers for English).
 * For non-English, applies adjustment factor.
 */
import * as fs from 'fs/promises';
import * as path from 'path';

export interface TokenStats {
  totalTokens: number;
  totalCharacters: number;
  totalWords: number;
  estimatedCostUsd: number;
}

export interface SavingsRecord {
  date: string; // YYYY-MM-DD
  tokensSaved: number;
  costSavedUsd: number;
  mode: string;
}

const DEFAULT_INPUT_COST_PER_1K = 0.003;  // gpt-4.1 input
const DEFAULT_OUTPUT_COST_PER_1K = 0.012; // gpt-4.1 output

export function countTokens(text: string): number {
  if (!text) return 0;
  const chars = text.length;
  // Detect if text has many non-ASCII (Arabic, Chinese, etc.) → adjust
  const nonAsciiRatio = (text.match(/[^\x00-\x7F]/g) || []).length / Math.max(1, chars);
  const factor = nonAsciiRatio > 0.3 ? 2.5 : 4; // non-Latin needs ~2.5 chars/token
  return Math.ceil(chars / factor);
}

export function measureText(text: string, costPer1K = DEFAULT_INPUT_COST_PER_1K): TokenStats {
  const tokens = countTokens(text);
  return {
    totalTokens: tokens,
    totalCharacters: text.length,
    totalWords: text.trim().split(/\s+/).filter(Boolean).length,
    estimatedCostUsd: (tokens / 1000) * costPer1K,
  };
}

export async function measureFile(filePath: string): Promise<TokenStats> {
  const content = await fs.readFile(filePath, 'utf8');
  return measureText(content);
}

const STATS_FILE = '.brain/savings-stats.json';

export async function recordSavings(root: string, record: SavingsRecord): Promise<void> {
  const file = path.join(root, STATS_FILE);
  let history: SavingsRecord[] = [];
  try {
    const raw = await fs.readFile(file, 'utf8');
    history = JSON.parse(raw);
    if (!Array.isArray(history)) history = [];
  } catch { /* file missing */ }

  // Aggregate by date+mode
  const existing = history.find(h => h.date === record.date && h.mode === record.mode);
  if (existing) {
    existing.tokensSaved += record.tokensSaved;
    existing.costSavedUsd += record.costSavedUsd;
  } else {
    history.push(record);
  }
  // Keep last 90 days
  if (history.length > 90 * 5) {
    history = history.slice(-90 * 5);
  }

  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(history, null, 2), 'utf8');
}

export async function readSavingsHistory(root: string): Promise<SavingsRecord[]> {
  const file = path.join(root, STATS_FILE);
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function summarizeSavings(history: SavingsRecord[]): {
  totalTokensSaved: number;
  totalCostSavedUsd: number;
  byMode: Record<string, { tokens: number; cost: number }>;
  byDate: Record<string, { tokens: number; cost: number }>;
} {
  const summary = {
    totalTokensSaved: 0,
    totalCostSavedUsd: 0,
    byMode: {} as Record<string, { tokens: number; cost: number }>,
    byDate: {} as Record<string, { tokens: number; cost: number }>,
  };
  for (const r of history) {
    summary.totalTokensSaved += r.tokensSaved;
    summary.totalCostSavedUsd += r.costSavedUsd;
    if (!summary.byMode[r.mode]) summary.byMode[r.mode] = { tokens: 0, cost: 0 };
    summary.byMode[r.mode].tokens += r.tokensSaved;
    summary.byMode[r.mode].cost += r.costSavedUsd;
    if (!summary.byDate[r.date]) summary.byDate[r.date] = { tokens: 0, cost: 0 };
    summary.byDate[r.date].tokens += r.tokensSaved;
    summary.byDate[r.date].cost += r.costSavedUsd;
  }
  return summary;
}
