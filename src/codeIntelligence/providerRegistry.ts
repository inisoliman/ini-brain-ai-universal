import { CodebaseMemoryProvider } from './codebaseMemoryProvider';
import { LiteGraphProvider } from './liteProvider';
import { CodeIntelligenceProvider, CodeIntelligenceStatus } from './types';

const advancedProvider = new CodebaseMemoryProvider();
const liteProvider = new LiteGraphProvider();

export async function selectCodeIntelligenceProvider(root: string): Promise<CodeIntelligenceProvider> {
  const advanced = await advancedProvider.status(root);
  return advanced.available ? advancedProvider : liteProvider;
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
