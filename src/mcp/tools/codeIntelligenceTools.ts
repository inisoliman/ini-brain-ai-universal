import { codeIntelligenceStatus, selectCodeIntelligenceProvider } from '../../codeIntelligence/providerRegistry';

export const codeIntelligenceTools = {
  ini_brain_code_status: {
    description: 'Show automatic code-intelligence provider status and fallback chain.',
    inputSchema: { type: 'object', properties: {} },
    handler: async (_args: unknown, root: string) => codeIntelligenceStatus(root),
  },
  ini_brain_code_index: {
    description: 'Index the workspace using codebase-memory-mcp when available, otherwise Lite Graph.',
    inputSchema: { type: 'object', properties: {} },
    handler: async (_args: unknown, root: string) => (await selectCodeIntelligenceProvider(root)).index(root),
  },
  ini_brain_code_architecture: {
    description: 'Return architecture summary from the active code-intelligence provider.',
    inputSchema: { type: 'object', properties: {} },
    handler: async (_args: unknown, root: string) => (await selectCodeIntelligenceProvider(root)).architecture(root),
  },
  ini_brain_code_search: {
    description: 'Search code with the active code-intelligence provider.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' }
      },
      required: ['query'],
    },
    handler: async (args: { query: string; limit?: number }, root: string) =>
      (await selectCodeIntelligenceProvider(root)).search(root, args.query, args.limit),
  },
  ini_brain_code_trace: {
    description: 'Trace relationships or call paths with the active code-intelligence provider.',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string' },
        to: { type: 'string' }
      },
      required: ['from'],
    },
    handler: async (args: { from: string; to?: string }, root: string) =>
      (await selectCodeIntelligenceProvider(root)).trace(root, args.from, args.to),
  },
  ini_brain_code_changes: {
    description: 'Analyze changed files with the active code-intelligence provider.',
    inputSchema: {
      type: 'object',
      properties: {
        changedFiles: { type: 'array', items: { type: 'string' } }
      },
    },
    handler: async (args: { changedFiles?: string[] }, root: string) =>
      (await selectCodeIntelligenceProvider(root)).changes(root, args.changedFiles),
  },
  ini_brain_code_query: {
    description: 'Run an advanced graph query when available, otherwise a Lite Graph search/schema query.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' }
      },
      required: ['query'],
    },
    handler: async (args: { query: string }, root: string) =>
      (await selectCodeIntelligenceProvider(root)).query(root, args.query),
  },
};
