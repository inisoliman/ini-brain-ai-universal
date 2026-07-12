import { execFile, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
  CodeArchitectureResult,
  CodeChangesResult,
  CodeIndexResult,
  CodeIntelligenceProvider,
  CodeIntelligenceStatus,
  CodeQueryResult,
  CodeSearchResult,
  CodeTraceResult
} from './types';

interface CommandInvocation {
  command: string;
  argsPrefix: string[];
}

const TIMEOUT_MS = 120_000;
const OUTPUT_LIMIT = 1024 * 1024 * 4;

export class CodebaseMemoryProvider implements CodeIntelligenceProvider {
  readonly id = 'codebase-memory-mcp' as const;

  async status(root: string): Promise<CodeIntelligenceStatus> {
    const probe = await runVersion(root);
    return {
      provider: this.id,
      available: probe.ok,
      automatic: probe.ok,
      reason: probe.ok ? 'codebase-memory-mcp binary is available on PATH.' : probe.error,
      version: probe.version,
      fallbackProvider: probe.ok ? undefined : 'lite-graph'
    };
  }

  async index(root: string): Promise<CodeIndexResult> {
    const details = await runCli(root, 'index_repository', { path: root });
    return {
      provider: this.id,
      indexed: true,
      summary: 'Advanced codebase-memory-mcp index completed.',
      details
    };
  }

  async architecture(root: string): Promise<CodeArchitectureResult> {
    const details = await runCli(root, 'get_architecture', { path: root });
    return {
      provider: this.id,
      markdown: stringifyResult(details),
      details
    };
  }

  async search(root: string, query: string, limit = 20): Promise<CodeSearchResult> {
    const result = await runCli(root, 'search_code', { path: root, query, limit });
    return {
      provider: this.id,
      query,
      results: normalizeSearchResults(result)
    };
  }

  async trace(root: string, from: string, to?: string): Promise<CodeTraceResult> {
    const result = await runCli(root, 'trace_call_path', { path: root, from, to });
    return { provider: this.id, from, to, paths: Array.isArray(result) ? result : [result] };
  }

  async changes(root: string, changedFiles?: string[]): Promise<CodeChangesResult> {
    const result = await runCli(root, 'detect_changes', { path: root, changedFiles });
    return { provider: this.id, changedFiles: changedFiles || [], impact: result };
  }

  async query(root: string, query: string): Promise<CodeQueryResult> {
    const result = await runCli(root, 'query_graph', { path: root, query });
    return { provider: this.id, query, result };
  }
}

async function runVersion(root: string): Promise<{ ok: boolean; version?: string; error?: string }> {
  const invocation = resolveCommandInvocation();
  return new Promise(resolve => {
    execFile(invocation.command, [...invocation.argsPrefix, '--version'], { cwd: root, windowsHide: true, timeout: 10_000 }, (error, stdout, stderr) => {
      if (error) {
        resolve({ ok: false, error: stderr.trim() || error.message });
        return;
      }
      resolve({ ok: true, version: stdout.trim() || 'available' });
    });
  });
}

async function runCli(root: string, tool: string, args: Record<string, unknown>): Promise<unknown> {
  const invocation = resolveCommandInvocation();
  return new Promise((resolve, reject) => {
    const child = spawn(invocation.command, [...invocation.argsPrefix, 'cli', tool, JSON.stringify(args)], {
      cwd: root,
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`codebase-memory-mcp ${tool} timed out after ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS);
    child.stdout.on('data', chunk => {
      stdout = appendLimited(stdout, chunk.toString('utf8'));
    });
    child.stderr.on('data', chunk => {
      stderr = appendLimited(stderr, chunk.toString('utf8'));
    });
    child.on('error', error => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(stderr.trim() || `codebase-memory-mcp ${tool} exited with ${code}`));
        return;
      }
      resolve(parseJsonOrText(stdout));
    });
  });
}

function resolveCommandInvocation(): CommandInvocation {
  const configured = process.env.INI_BRAIN_CODEBASE_MEMORY_BIN;
  if (configured) return scriptOrBinaryInvocation(configured);

  if (process.platform === 'win32') {
    const npmBin = findWindowsNpmBinJs();
    if (npmBin) return { command: process.execPath, argsPrefix: [npmBin] };
  }

  return { command: 'codebase-memory-mcp', argsPrefix: [] };
}

function scriptOrBinaryInvocation(command: string): CommandInvocation {
  if (command.endsWith('.js')) {
    return { command: process.execPath, argsPrefix: [command] };
  }
  return { command, argsPrefix: [] };
}

function findWindowsNpmBinJs(): string | undefined {
  const searchDirs = (process.env.PATH || '')
    .split(path.delimiter)
    .filter(Boolean);
  const appData = process.env.APPDATA;
  if (appData) searchDirs.unshift(path.join(appData, 'npm'));

  for (const dir of searchDirs) {
    const candidate = path.join(dir, 'node_modules', 'codebase-memory-mcp', 'bin.js');
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

function appendLimited(current: string, next: string): string {
  const combined = current + next;
  return combined.length > OUTPUT_LIMIT ? combined.slice(combined.length - OUTPUT_LIMIT) : combined;
}

function parseJsonOrText(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function stringifyResult(result: unknown): string {
  if (typeof result === 'string') return result;
  return JSON.stringify(result, null, 2);
}

function normalizeSearchResults(result: unknown): CodeSearchResult['results'] {
  if (!Array.isArray(result)) {
    return [{ snippet: stringifyResult(result), score: 1 }];
  }
  return result.slice(0, 50).map(item => {
    if (!item || typeof item !== 'object') return { snippet: String(item) };
    const record = item as Record<string, unknown>;
    return {
      file: stringField(record, 'file') || stringField(record, 'path'),
      label: stringField(record, 'label') || stringField(record, 'name'),
      snippet: stringField(record, 'snippet') || stringField(record, 'text'),
      score: typeof record.score === 'number' ? record.score : undefined
    };
  });
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  return typeof record[key] === 'string' ? record[key] as string : undefined;
}
