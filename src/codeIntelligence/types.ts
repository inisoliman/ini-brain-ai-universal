export type CodeIntelligenceProviderId = 'codebase-memory-mcp' | 'lite-graph';

export interface CodeIntelligenceStatus {
  provider: CodeIntelligenceProviderId;
  available: boolean;
  automatic: boolean;
  reason?: string;
  version?: string;
  fallbackProvider?: CodeIntelligenceProviderId;
}

export interface CodeIndexResult {
  provider: CodeIntelligenceProviderId;
  indexed: boolean;
  summary: string;
  details?: unknown;
}

export interface CodeSearchResult {
  provider: CodeIntelligenceProviderId;
  query: string;
  results: Array<{
    file?: string;
    label?: string;
    snippet?: string;
    score?: number;
  }>;
}

export interface CodeArchitectureResult {
  provider: CodeIntelligenceProviderId;
  markdown: string;
  details?: unknown;
}

export interface CodeTraceResult {
  provider: CodeIntelligenceProviderId;
  from: string;
  to?: string;
  paths: unknown[];
}

export interface CodeChangesResult {
  provider: CodeIntelligenceProviderId;
  changedFiles: string[];
  impact?: unknown;
}

export interface CodeQueryResult {
  provider: CodeIntelligenceProviderId;
  query: string;
  result: unknown;
}

export interface CodeIntelligenceProvider {
  readonly id: CodeIntelligenceProviderId;
  status(root: string): Promise<CodeIntelligenceStatus>;
  index(root: string): Promise<CodeIndexResult>;
  architecture(root: string): Promise<CodeArchitectureResult>;
  search(root: string, query: string, limit?: number): Promise<CodeSearchResult>;
  trace(root: string, from: string, to?: string): Promise<CodeTraceResult>;
  changes(root: string, changedFiles?: string[]): Promise<CodeChangesResult>;
  query(root: string, query: string): Promise<CodeQueryResult>;
}
