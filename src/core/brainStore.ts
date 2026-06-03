import * as fs from 'fs/promises';
import * as path from 'path';
import { BrainData, BrainMetadata, DependencyGraph, FileRecord, ProjectMap, ProjectScanResult } from './types';

const BRAIN_VERSION = 1;

export class BrainStore {
  readonly brainDir: string;

  constructor(private readonly root: string) {
    this.brainDir = path.join(root, '.brain');
  }

  async ensure(): Promise<void> {
    await fs.mkdir(this.brainDir, { recursive: true });
  }

  async writeScan(scan: ProjectScanResult): Promise<BrainData> {
    await this.ensure();
    const projectMap = buildProjectMap(this.root, scan.files);
    const dependencies = buildDependencyGraph(scan.files);
    const architecture = buildArchitectureMarkdown(projectMap, scan.files, dependencies);
    const compactContext = buildCompactContext(projectMap, scan.files);
    const metadata: BrainMetadata = {
      version: BRAIN_VERSION,
      generatedAt: new Date().toISOString(),
      lastFullScanAt: new Date().toISOString(),
      totalFiles: projectMap.totalFiles,
      hashes: Object.fromEntries(Object.values(scan.files).map(file => [file.path, file.hash]))
    };
    await Promise.all([
      this.writeJson('project_map.json', projectMap),
      this.writeJson('file_index.json', scan.files),
      this.writeJson('dependencies.json', dependencies),
      this.writeJson('metadata.json', metadata),
      fs.writeFile(path.join(this.brainDir, 'architecture.md'), architecture, 'utf8'),
      fs.writeFile(path.join(this.brainDir, 'compact_context.md'), compactContext, 'utf8'),
      this.writeIfMissing('decisions.md', initialDecisions()),
      this.writeIfMissing('tasks.md', initialTasks())
    ]);
    return { projectMap, files: scan.files, dependencies, architecture, compactContext };
  }

  async readBrain(): Promise<BrainData | undefined> {
    const projectMap = await this.readJson<ProjectMap>('project_map.json');
    const files = await this.readJson<Record<string, FileRecord>>('file_index.json');
    const dependencies = await this.readJson<DependencyGraph>('dependencies.json');
    if (!projectMap || !files || !dependencies) return undefined;
    const architecture = await this.readText('architecture.md', '');
    const compactContext = await this.readText('compact_context.md', '');
    return { projectMap, files, dependencies, architecture, compactContext };
  }

  async readMetadata(): Promise<BrainMetadata | undefined> {
    return this.readJson<BrainMetadata>('metadata.json');
  }

  private async writeJson(file: string, value: unknown): Promise<void> {
    await fs.writeFile(path.join(this.brainDir, file), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  }

  private async readJson<T>(file: string): Promise<T | undefined> {
    try {
      return JSON.parse(await fs.readFile(path.join(this.brainDir, file), 'utf8')) as T;
    } catch {
      return undefined;
    }
  }

  private async readText(file: string, fallback: string): Promise<string> {
    try {
      return await fs.readFile(path.join(this.brainDir, file), 'utf8');
    } catch {
      return fallback;
    }
  }

  private async writeIfMissing(file: string, content: string): Promise<void> {
    const target = path.join(this.brainDir, file);
    try {
      await fs.access(target);
    } catch {
      await fs.writeFile(target, content, 'utf8');
    }
  }
}

export function buildProjectMap(root: string, files: Record<string, FileRecord>): ProjectMap {
  const languages: Record<string, number> = {};
  for (const file of Object.values(files)) {
    languages[file.language] = (languages[file.language] || 0) + 1;
  }
  return {
    root,
    totalFiles: Object.keys(files).length,
    languages,
    coreFiles: Object.values(files).sort((a, b) => scoreCoreFile(b) - scoreCoreFile(a)).slice(0, 30).map(file => file.path),
    generatedAt: new Date().toISOString()
  };
}

export function buildDependencyGraph(files: Record<string, FileRecord>): DependencyGraph {
  const outgoing: Record<string, string[]> = {};
  const incoming: Record<string, string[]> = {};
  const paths = new Set(Object.keys(files));
  for (const file of Object.values(files)) {
    outgoing[file.path] = file.imports
      .filter(item => item.startsWith('.'))
      .map(item => resolveImport(file.path, item, paths))
      .filter((item): item is string => Boolean(item));
    for (const target of outgoing[file.path]) {
      incoming[target] = incoming[target] || [];
      incoming[target].push(file.path);
    }
  }
  return { incoming, outgoing };
}

export function resolveImport(fromFile: string, importPath: string, knownPaths: Set<string>): string | undefined {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), importPath));
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}.json`, `${base}/index.ts`, `${base}/index.tsx`, `${base}/index.js`];
  return candidates.find(candidate => knownPaths.has(candidate));
}

export function buildArchitectureMarkdown(projectMap: ProjectMap, files: Record<string, FileRecord>, dependencies: DependencyGraph): string {
  const languages = Object.entries(projectMap.languages).sort((a, b) => b[1] - a[1]).map(([lang, count]) => `- ${lang}: ${count}`).join('\n');
  const core = projectMap.coreFiles.map(file => `- ${file}`).join('\n') || '- none';
  const incoming = Object.entries(dependencies.incoming).sort((a, b) => b[1].length - a[1].length).slice(0, 20).map(([file, refs]) => `- ${file}: referenced by ${refs.length} file(s)`).join('\n') || '- none';
  return [
    '# Architecture',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Project Overview',
    `- Root: ${projectMap.root}`,
    `- Total indexed files: ${projectMap.totalFiles}`,
    '',
    '## Languages',
    languages || '- none',
    '',
    '## Core Files',
    core,
    '',
    '## Dependency Hotspots',
    incoming
  ].join('\n');
}

export function buildCompactContext(projectMap: ProjectMap, files: Record<string, FileRecord>): string {
  const records = projectMap.coreFiles.map(file => files[file]).filter(Boolean).slice(0, 25);
  return [
    '# Compact Project Context',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Files: ${projectMap.totalFiles}`,
    `Languages: ${Object.entries(projectMap.languages).map(([k, v]) => `${k} (${v})`).join(', ') || 'none'}`,
    `Core files: ${projectMap.coreFiles.slice(0, 25).join(', ') || 'none'}`,
    '',
    '## Key File Summaries',
    records.map(file => [
      `### ${file.path}`,
      `Language: ${file.language}`,
      `Exports: ${file.exports.slice(0, 12).join(', ') || 'none'}`,
      `Summary: ${file.summary.slice(0, 1000) || 'No summary available.'}`
    ].join('\n')).join('\n\n') || '- none',
    '',
    '## Agent Reminder',
    'Read AGENTS.md and .brain workflow files before editing. Prefer minimal diffs, verify changes, and never write secrets.'
  ].join('\n');
}

function scoreCoreFile(file: FileRecord): number {
  let score = file.imports.length + file.exports.length * 3 + file.classes.length * 2 + file.functions.length;
  if (/(package\.json|tsconfig|src\/extension|src\/main|src\/index|app\/|pages\/|routes\/)/i.test(file.path)) score += 20;
  if (/readme|agents\.md/i.test(file.path)) score += 8;
  return score;
}

function initialDecisions(): string {
  return `# Project Decisions\n\nRecord durable architecture and product decisions here.\n`;
}

function initialTasks(): string {
  return `# Project Tasks and Continuity Log\n\n## Pending Tasks\n- [ ] Add project-specific tasks here.\n`;
}
