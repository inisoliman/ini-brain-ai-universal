export type MemoryKind = 'fact' | 'decision' | 'preference' | 'bug' | 'workflow' | 'session' | 'note';

export interface FileRecord {
  path: string;
  language: string;
  size: number;
  hash: string;
  imports: string[];
  exports: string[];
  classes: string[];
  functions: string[];
  summary: string;
  updatedAt: string;
}

export interface ProjectMap {
  root: string;
  totalFiles: number;
  languages: Record<string, number>;
  coreFiles: string[];
  generatedAt: string;
}

export interface DependencyGraph {
  incoming: Record<string, string[]>;
  outgoing: Record<string, string[]>;
}

export interface BrainData {
  projectMap: ProjectMap;
  files: Record<string, FileRecord>;
  dependencies: DependencyGraph;
  architecture: string;
  compactContext: string;
}

export interface BrainMetadata {
  version: 1;
  generatedAt: string;
  lastFullScanAt?: string;
  totalFiles: number;
  hashes: Record<string, string>;
}

export interface ScanStats {
  discoveredFiles: number;
  indexedFiles: number;
  skippedLargeFiles: number;
  skippedUnreadableFiles: number;
}

export interface ProjectScanResult {
  files: Record<string, FileRecord>;
  stats: ScanStats;
}

export interface MemoryEntry {
  id: string;
  kind: MemoryKind;
  content: string;
  files: string[];
  concepts: string[];
  importance: number;
  source: 'manual' | 'ai' | 'agent' | 'system';
  confidence?: number;
  expiresAt?: string;
  pinned?: boolean;
  origin?: string;
  createdAt: string;
  updatedAt: string;
  accessCount: number;
}

export interface MemorySearchResult {
  entry: MemoryEntry;
  score: number;
  matches: string[];
}

export interface ProjectMemoryProfile {
  generatedAt: string;
  totalMemories: number;
  topConcepts: Array<{ concept: string; count: number }>;
  topFiles: Array<{ file: string; count: number }>;
  importantDecisions: MemoryEntry[];
  recentMemories: MemoryEntry[];
}

export type OnboardingStateKind = 'missing' | 'empty' | 'stale' | 'ready';

export interface OnboardingState {
  kind: OnboardingStateKind;
  root: string;
  hasBrain: boolean;
  hasAgentGuide: boolean;
  sourceFileCount: number;
  reason: string;
}

export type IntegrationTarget = 'vscode' | 'codex' | 'cline' | 'kilo-code' | 'antigravity' | 'generic-mcp';

export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
  disabled: boolean;
  autoApprove: string[];
}
