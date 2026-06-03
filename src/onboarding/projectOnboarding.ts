import * as fssync from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AgentGuideGenerator } from '../core/agentGuide';
import { BrainStore } from '../core/brainStore';
import { ProjectScanner } from '../core/projectScanner';
import { OnboardingState } from '../core/types';

export class ProjectOnboardingService {
  constructor(private readonly root: string) {}

  async detect(): Promise<OnboardingState> {
    const hasBrain = await exists(path.join(this.root, '.brain', 'metadata.json'));
    const hasAgentGuide = await exists(path.join(this.root, 'AGENTS.md'));
    const sourceFileCount = await countSourceFiles(this.root, 30);
    if (sourceFileCount === 0) {
      return { kind: 'empty', root: this.root, hasBrain, hasAgentGuide, sourceFileCount, reason: 'Workspace has no source files yet.' };
    }
    if (!hasBrain || !hasAgentGuide) {
      return { kind: 'missing', root: this.root, hasBrain, hasAgentGuide, sourceFileCount, reason: 'Workspace has not been initialized by INI Brain AI.' };
    }
    const metadata = await new BrainStore(this.root).readMetadata();
    if (!metadata || Date.now() - Date.parse(metadata.generatedAt) > 1000 * 60 * 60 * 24 * 7) {
      return { kind: 'stale', root: this.root, hasBrain, hasAgentGuide, sourceFileCount, reason: 'Project context is older than seven days.' };
    }
    return { kind: 'ready', root: this.root, hasBrain, hasAgentGuide, sourceFileCount, reason: 'Project context is current.' };
  }

  async initializeOrRefresh(): Promise<OnboardingState> {
    const scan = await new ProjectScanner(this.root).scan();
    const brain = await new BrainStore(this.root).writeScan(scan);
    await new AgentGuideGenerator(this.root).generate(brain);
    return this.detect();
  }
}

async function countSourceFiles(root: string, limit: number): Promise<number> {
  let count = 0;
  async function walk(dir: string): Promise<void> {
    if (count >= limit) return;
    let entries: fssync.Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (count >= limit) return;
      if (['.git', '.brain', 'node_modules', 'dist', 'build'].includes(entry.name)) continue;
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      if (entry.isFile() && /\.(ts|tsx|js|jsx|json|md|py|go|rs|java|php|cs|html|css)$/i.test(entry.name)) count += 1;
    }
  }
  await walk(root);
  return count;
}

async function exists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}
