import * as fs from 'fs/promises';
import * as path from 'path';
import { BrainStore, buildArchitectureMarkdown } from '../core/brainStore';
import { ProjectScanner } from '../core/projectScanner';
import { buildCodeGraph, computeImpact, loadGraph, saveGraph } from '../graph/knowledgeGraph';
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

export class LiteGraphProvider implements CodeIntelligenceProvider {
  readonly id = 'lite-graph' as const;

  async status(_root: string): Promise<CodeIntelligenceStatus> {
    return {
      provider: this.id,
      available: true,
      automatic: true,
      reason: 'Built-in TypeScript lite graph is always available.'
    };
  }

  async index(root: string): Promise<CodeIndexResult> {
    const graph = await buildCodeGraph(root);
    await saveGraph(root, graph);
    return {
      provider: this.id,
      indexed: true,
      summary: `Lite graph indexed ${graph.nodes.length} node(s) and ${graph.edges.length} edge(s).`
    };
  }

  async architecture(root: string): Promise<CodeArchitectureResult> {
    const scanner = new ProjectScanner(root);
    const scan = await scanner.scan();
    const projectMap = await new BrainStore(root).writeScan(scan);
    return {
      provider: this.id,
      markdown: buildArchitectureMarkdown(projectMap.projectMap, projectMap.files, projectMap.dependencies)
    };
  }

  async search(root: string, query: string, limit = 20): Promise<CodeSearchResult> {
    const needle = query.toLowerCase();
    const files = await this.listTextFiles(root);
    const results: CodeSearchResult['results'] = [];
    for (const file of files) {
      const relative = path.relative(root, file).replace(/\\/g, '/');
      const content = await readFile(file);
      const index = content.toLowerCase().indexOf(needle);
      if (index >= 0) {
        results.push({ file: relative, snippet: compactSnippet(content, index), score: 1 });
      }
      if (results.length >= limit) break;
    }
    return { provider: this.id, query, results };
  }

  async trace(root: string, from: string, to?: string): Promise<CodeTraceResult> {
    const graph = await ensureGraph(root);
    const edges = graph.edges.filter(edge => edge.from.includes(from) || edge.to.includes(from));
    const narrowed = to ? edges.filter(edge => edge.from.includes(to) || edge.to.includes(to)) : edges;
    return { provider: this.id, from, to, paths: narrowed };
  }

  async changes(root: string, changedFiles?: string[]): Promise<CodeChangesResult> {
    const files = changedFiles?.length ? changedFiles : await getGitChangedFiles(root);
    const graph = await ensureGraph(root);
    return {
      provider: this.id,
      changedFiles: files,
      impact: files.map(file => ({ file, ...computeImpact(graph, file) }))
    };
  }

  async query(root: string, query: string): Promise<CodeQueryResult> {
    if (query === 'schema') {
      return {
        provider: this.id,
        query,
        result: {
          nodes: ['file', 'function', 'class', 'concept', 'memory'],
          edges: ['imports']
        }
      };
    }
    return this.search(root, query, 20).then(result => ({ provider: this.id, query, result }));
  }

  private async listTextFiles(root: string): Promise<string[]> {
    const files: string[] = [];
    await walk(root, files);
    return files;
  }
}

async function ensureGraph(root: string) {
  const graph = await loadGraph(root);
  if (graph) return graph;
  const next = await buildCodeGraph(root);
  await saveGraph(root, next);
  return next;
}

async function walk(dir: string, files: string[]): Promise<void> {
  let entries: Array<{ name: string; isDirectory(): boolean }>;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || ['node_modules', 'dist', 'build', 'coverage'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, files);
    } else if (/\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|rb|php|cs|md|json|yml|yaml)$/.test(entry.name)) {
      files.push(full);
    }
  }
}

async function readFile(file: string): Promise<string> {
  try {
    return await fs.readFile(file, 'utf8');
  } catch {
    return '';
  }
}

function compactSnippet(content: string, index: number): string {
  const start = Math.max(0, index - 120);
  const end = Math.min(content.length, index + 240);
  return content.slice(start, end).replace(/\s+/g, ' ').trim();
}

async function getGitChangedFiles(root: string): Promise<string[]> {
  const { execFile } = await import('child_process');
  return new Promise(resolve => {
    execFile('git', ['status', '--porcelain'], { cwd: root, windowsHide: true }, (error, stdout) => {
      if (error) {
        resolve([]);
        return;
      }
      resolve(stdout
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => line.replace(/^.{2,3}\s+/, '').split(' -> ').pop()!.trim()));
    });
  });
}
