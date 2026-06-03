import { McpServerConfig } from '../core/types';

export function buildMcpServerConfig(root: string, serverScript: string): McpServerConfig {
  return {
    command: 'node',
    args: [serverScript],
    env: {
      INI_BRAIN_WORKSPACE: root
    },
    disabled: false,
    autoApprove: []
  };
}

export function buildMcpConfigJson(root: string, serverScript: string): string {
  return JSON.stringify({ mcpServers: { 'ini-brain-ai': buildMcpServerConfig(root, serverScript) } }, null, 2);
}
