/**
 * Knowledge Graph builder.
 * Inspired by https://github.com/safishamsi/graphify (MIT) — TypeScript Lite version.
 */
import * as fs from 'fs/promises';
import * as path from 'path';

export type EdgeKind = 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';

export interface GraphNode {
  id: string;
  type: 'file' | 'function' | 'class' | 'concept' | 'memory';
  label: string;
  metadata?: Record<string, string | number>;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: EdgeKind;
  label?: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  generatedAt: string;
}

const IMPORT_REGEX_TS = /import\s+(?:[\s\S]+?\s+from\s+)?['"](\.[^'"]+)['"]/g;
const IMPORT_REGEX_PY = /^\s*(?:from|import)\s+([\w.]+)/gm;

function nodeId(prefix: string, value: string): string {
  return `${prefix}:${value.replace(/[\\/]/g, '_').slice(0, 80)}`;
}

export async function buildCodeGraph(root: string): Promise<KnowledgeGraph> {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  async function walk(dir: string): Promise<string[]> {
    const out: string[] = [];
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return out; }
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'dist') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        out.push(...await walk(full));
      } else if (/\.(ts|tsx|js|jsx|py|go|rs|java|rb|php)$/.test(e.name)) {
        out.push(full);
      }
    }
    return out;
  }

  const files = await walk(root);

  for (const file of files) {
    const rel = path.relative(root, file).replace(/\\/g, '/');
    const id = nodeId('file', rel);
    nodes.set(id, { id, type: 'file', label: rel });

    let content: string;
    try { content = await fs.readFile(file, 'utf8'); } catch { continue; }

    if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      IMPORT_REGEX_TS.lastIndex = 0;
      let m;
      while ((m = IMPORT_REGEX_TS.exec(content)) !== null) {
        const target = path.resolve(path.dirname(file), m[1]);
        const targetRel = path.relative(root, target).replace(/\\/g, '/');
        const targetId = nodeId('file', targetRel);
        if (!nodes.has(targetId)) {
          nodes.set(targetId, { id: targetId, type: 'file', label: targetRel });
        }
        edges.push({ from: id, to: targetId, kind: 'EXTRACTED', label: 'imports' });
      }
    } else if (/\.py$/.test(file)) {
      IMPORT_REGEX_PY.lastIndex = 0;
      let m;
      while ((m = IMPORT_REGEX_PY.exec(content)) !== null) {
        const targetId = nodeId('module', m[1]);
        if (!nodes.has(targetId)) {
          nodes.set(targetId, { id: targetId, type: 'concept', label: m[1] });
        }
        edges.push({ from: id, to: targetId, kind: 'INFERRED', label: 'imports' });
      }
    }
  }

  return {
    nodes: [...nodes.values()],
    edges,
    generatedAt: new Date().toISOString(),
  };
}

export async function saveGraph(root: string, graph: KnowledgeGraph): Promise<string> {
  const file = path.join(root, '.brain', 'knowledge-graph.json');
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(graph, null, 2), 'utf8');
  return file;
}

export async function loadGraph(root: string): Promise<KnowledgeGraph | null> {
  const file = path.join(root, '.brain', 'knowledge-graph.json');
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch { return null; }
}

export function computeImpact(graph: KnowledgeGraph, fileRelPath: string): {
  direct: string[]; transitive: string[];
} {
  const targetId = nodeId('file', fileRelPath);
  const direct = graph.edges
    .filter(e => e.to === targetId)
    .map(e => graph.nodes.find(n => n.id === e.from)?.label)
    .filter((x): x is string => !!x);

  const visited = new Set<string>([targetId]);
  const transitive: string[] = [];
  function visit(id: string) {
    for (const e of graph.edges) {
      if (e.to === id && !visited.has(e.from)) {
        visited.add(e.from);
        const node = graph.nodes.find(n => n.id === e.from);
        if (node) transitive.push(node.label);
        visit(e.from);
      }
    }
  }
  visit(targetId);
  return { direct, transitive: transitive.filter(t => !direct.includes(t)) };
}
