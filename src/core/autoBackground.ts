import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { AgentGuideGenerator } from './agentGuide';
import { BrainStore } from './brainStore';
import { ProjectScanner } from './projectScanner';

const RESCAN_DEBOUNCE_MS = 5000;
const WATCHER_DIRS = ['src', 'lib', 'app', 'pages', 'routes', 'core', 'packages', 'modules'];
const IGNORED_DIRS = new Set([
  '.git', '.brain', 'node_modules', 'dist', 'build', 'out', '.next',
  '.cache', 'coverage', '.idea', '.vscode', 'target', '__pycache__'
]);

/**
 * AutoBackground keeps each workspace's `.brain/` fresh without any user
 * action. It runs in three phases:
 *   1. ensureFresh()  - on first MCP touch per workspace, scan if `.brain` is
 *      missing or older than the staleness threshold.
 *   2. start()        - watch the workspace for relevant file changes and
 *      schedule a debounced rescan.
 *   3. rescan()       - regenerate `AGENTS.md`, `.brain/*` and skill files.
 *
 * All scans run silently in the background; failures are logged to stderr but
 * never break MCP responses.
 */
export class AutoBackground {
  private static readonly registry = new Map<string, AutoBackground>();
  private rescanTimer: NodeJS.Timeout | null = null;
  private watchers: fs.FSWatcher[] = [];
  private busy = false;
  private lastScan = 0;

  private constructor(private readonly workspace: string) {}

  static for(workspace: string): AutoBackground {
    const key = path.resolve(workspace);
    let instance = AutoBackground.registry.get(key);
    if (!instance) {
      instance = new AutoBackground(key);
      AutoBackground.registry.set(key, instance);
    }
    return instance;
  }

  /**
   * Make sure the workspace has fresh brain context. Triggers a background
   * scan when `.brain` is missing or older than 24h.
   */
  async ensureFresh(maxAgeMs = 24 * 60 * 60 * 1000): Promise<{ scanned: boolean; reason: string }> {
    const metaPath = path.join(this.workspace, '.brain', 'metadata.json');
    let needScan = false;
    let reason = 'fresh';
    try {
      const stat = await fsp.stat(metaPath);
      if (Date.now() - stat.mtimeMs > maxAgeMs) {
        needScan = true;
        reason = 'stale';
      }
    } catch {
      needScan = true;
      reason = 'missing';
    }

    if (!needScan) return { scanned: false, reason };

    void this.rescan().catch(error => console.error('[INI Brain MCP] auto-scan failed', error));
    return { scanned: true, reason };
  }

  start(): void {
    if (this.watchers.length > 0) return;
    const candidates = [this.workspace, ...WATCHER_DIRS.map(d => path.join(this.workspace, d))];
    for (const candidate of candidates) {
      try {
        if (!fs.existsSync(candidate)) continue;
        const watcher = fs.watch(candidate, { persistent: false, recursive: true }, (_event, filename) => this.onFileEvent(filename));
        watcher.on('error', () => { /* ignore */ });
        this.watchers.push(watcher);
      } catch {
        // recursive watch may not be supported, ignore.
      }
    }
  }

  stop(): void {
    for (const watcher of this.watchers) {
      try { watcher.close(); } catch { /* noop */ }
    }
    this.watchers = [];
    if (this.rescanTimer) clearTimeout(this.rescanTimer);
    this.rescanTimer = null;
  }

  private onFileEvent(filename: fs.PathLike | null): void {
    if (!filename) return;
    const rel = String(filename).replace(/\\/g, '/');
    const head = rel.split('/')[0];
    if (IGNORED_DIRS.has(head)) return;
    if (rel.includes('.brain/') || rel.endsWith('.lock') || rel.endsWith('.log')) return;

    if (this.rescanTimer) clearTimeout(this.rescanTimer);
    this.rescanTimer = setTimeout(() => {
      this.rescanTimer = null;
      void this.rescan().catch(error => console.error('[INI Brain MCP] background rescan failed', error));
    }, RESCAN_DEBOUNCE_MS);
  }

  async rescan(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      const scan = await new ProjectScanner(this.workspace).scan();
      const brain = await new BrainStore(this.workspace).writeScan(scan);
      await new AgentGuideGenerator(this.workspace).generate(brain);
      this.lastScan = Date.now();
      console.error(`[INI Brain MCP] background scan complete: ${scan.stats.indexedFiles} files indexed for ${this.workspace}`);
    } finally {
      this.busy = false;
    }
  }
}
