import { CodebaseMemoryProvider } from './codebaseMemoryProvider';
import { LiteGraphProvider } from './liteProvider';
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

const advancedProvider = new CodebaseMemoryProvider();
const liteProvider = new LiteGraphProvider();

export async function selectCodeIntelligenceProvider(root: string): Promise<CodeIntelligenceProvider> {
  await root;
  return new AutoCodeIntelligenceProvider(advancedProvider, liteProvider);
}

export async function codeIntelligenceStatus(root: string): Promise<{
  selected: CodeIntelligenceStatus;
  providers: CodeIntelligenceStatus[];
}> {
  const advanced = await advancedProvider.status(root);
  const lite = await liteProvider.status(root);
  return {
    selected: advanced.available ? advanced : lite,
    providers: [advanced, lite]
  };
}

class AutoCodeIntelligenceProvider implements CodeIntelligenceProvider {
  readonly id = 'codebase-memory-mcp' as const;

  constructor(
    private readonly advanced: CodeIntelligenceProvider,
    private readonly lite: CodeIntelligenceProvider
  ) {}

  async status(root: string): Promise<CodeIntelligenceStatus> {
    const advanced = await this.advanced.status(root);
    return advanced.available ? advanced : this.lite.status(root);
  }

  async index(root: string): Promise<CodeIndexResult> {
    return this.withFallback(root, provider => provider.index(root));
  }

  async architecture(root: string): Promise<CodeArchitectureResult> {
    return this.withFallback(root, provider => provider.architecture(root));
  }

  async search(root: string, query: string, limit?: number): Promise<CodeSearchResult> {
    return this.withFallback(root, provider => provider.search(root, query, limit));
  }

  async trace(root: string, from: string, to?: string): Promise<CodeTraceResult> {
    return this.withFallback(root, provider => provider.trace(root, from, to));
  }

  async changes(root: string, changedFiles?: string[]): Promise<CodeChangesResult> {
    return this.withFallback(root, provider => provider.changes(root, changedFiles));
  }

  async query(root: string, query: string): Promise<CodeQueryResult> {
    return this.withFallback(root, provider => provider.query(root, query));
  }

  private async withFallback<T>(
    root: string,
    run: (provider: CodeIntelligenceProvider) => Promise<T>
  ): Promise<T> {
    const advanced = await this.advanced.status(root);
    if (!advanced.available) return run(this.lite);

    try {
      return await run(this.advanced);
    } catch (error) {
      const fallback = await run(this.lite);
      return {
        ...(fallback as object),
        details: {
          fallbackFrom: this.advanced.id,
          fallbackReason: error instanceof Error ? error.message : String(error),
          details: readDetails(fallback)
        }
      } as T;
    }
  }
}

function readDetails(result: unknown): unknown {
  if (result && typeof result === 'object' && 'details' in result) {
    return (result as { details?: unknown }).details;
  }
  return undefined;
}
