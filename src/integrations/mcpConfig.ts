import { McpServerConfig, OpenCodeMcpConfig } from '../core/types';

/** OpenCode uses its native mcp map and executable/arguments array. */
export function buildOpenCodeMcpConfig(serverScript: string): OpenCodeMcpConfig {
  return { type: 'local', command: ['node', serverScript], enabled: true };
}

export function buildMcpServerConfig(root: string, serverScript: string): McpServerConfig {
  void root;
  return {
    command: 'node',
    args: [serverScript],
    disabled: false,
    autoApprove: []
  };
}

export function buildMcpConfigJson(root: string, serverScript: string): string {
  return JSON.stringify({ mcpServers: { 'ini-brain-ai': buildMcpServerConfig(root, serverScript) } }, null, 2);
}
