import { McpServerConfig } from '../core/types';

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
