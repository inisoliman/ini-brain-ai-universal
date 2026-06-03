import * as crypto from 'crypto';
import * as fssync from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileRecord, ProjectScanResult, ScanStats } from './types';
import { detectLanguage, isIgnoredPath, isIgnoredSegment, isTextLike, normalizePath } from './pathUtils';

const MAX_FILE_BYTES = 1024 * 1024 * 2;
const MAX_INDEXED_FILES = 100_000;

export class ProjectScanner {
  constructor(private readonly root: string) {}

  async scan(): Promise<ProjectScanResult> {
    const stats: ScanStats = {
      discoveredFiles: 0,
      indexedFiles: 0,
      skippedLargeFiles: 0,
      skippedUnreadableFiles: 0
    };
    const files: Record<string, FileRecord> = {};
    await this.walk(this.root, files, stats);
    return { files, stats };
  }

  private async walk(dir: string, files: Record<string, FileRecord>, stats: ScanStats): Promise<void> {
    if (Object.keys(files).length >= MAX_INDEXED_FILES) return;
    let entries: fssync.Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      stats.skippedUnreadableFiles += 1;
      return;
    }

    for (const entry of entries) {
      if (isIgnoredSegment(entry.name)) continue;
      const absolute = path.join(dir, entry.name);
      const relative = normalizePath(path.relative(this.root, absolute));
      if (!relative || isIgnoredPath(relative)) continue;
      if (entry.isDirectory()) {
        await this.walk(absolute, files, stats);
        continue;
      }
      if (!entry.isFile() || !isTextLike(relative)) continue;
      stats.discoveredFiles += 1;
      const record = await this.readRecord(absolute, relative, stats);
      if (record) {
        files[relative] = record;
        stats.indexedFiles += 1;
      }
    }
  }

  private async readRecord(absolute: string, relative: string, stats: ScanStats): Promise<FileRecord | undefined> {
    try {
      const stat = await fs.stat(absolute);
      if (stat.size > MAX_FILE_BYTES) {
        stats.skippedLargeFiles += 1;
        return undefined;
      }
      const content = await fs.readFile(absolute, 'utf8');
      return {
        path: relative,
        language: detectLanguage(relative),
        size: stat.size,
        hash: crypto.createHash('sha256').update(content).digest('hex'),
        imports: extractImports(content),
        exports: extractExports(content),
        classes: extractMatches(content, /\bclass\s+([A-Za-z_$][\w$]*)/g),
        functions: extractMatches(content, /\b(?:function\s+|const\s+|let\s+|var\s+)([A-Za-z_$][\w$]*)\s*(?:=|\()/g),
        summary: summarizeContent(content),
        updatedAt: new Date(stat.mtimeMs).toISOString()
      };
    } catch {
      stats.skippedUnreadableFiles += 1;
      return undefined;
    }
  }
}

function extractImports(content: string): string[] {
  const imports = new Set<string>();
  const patterns = [
    /import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
    /from\s+['"]([^'"]+)['"]/g
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) imports.add(match[1]);
  }
  return [...imports].slice(0, 80);
}

function extractExports(content: string): string[] {
  const names = new Set<string>();
  const patterns = [
    /export\s+(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g,
    /module\.exports\.([A-Za-z_$][\w$]*)/g,
    /exports\.([A-Za-z_$][\w$]*)/g
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) names.add(match[1]);
  }
  return [...names].slice(0, 80);
}

function extractMatches(content: string, pattern: RegExp): string[] {
  return [...new Set([...content.matchAll(pattern)].map(match => match[1]))].slice(0, 80);
}

function summarizeContent(content: string): string {
  const lines = content
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//') && !line.startsWith('*'));
  return lines.slice(0, 24).join('\n').slice(0, 3000);
}
