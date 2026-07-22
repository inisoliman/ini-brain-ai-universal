import { IntegrationAdapter } from './types';
import { buildMcpServerConfig } from './mcpConfig';

export function getIntegrationAdapters(): IntegrationAdapter[] {
  return [
    adapter('vscode', 'VS Code', 'Use the VS Code extension sidebar, commands, and SecretStorage.', 'docs/install-vscode.md', true),
    adapter('codex', 'Codex', 'Use AGENTS.md, Codex-friendly skill guidance, and MCP context tools.', 'docs/install-codex.md', false),
    adapter('cline', 'Cline', 'Use Cline MCP settings plus .cline and .clinerules generated skills.', 'docs/install-cline.md', true),
    adapter('kilo-code', 'Kilo Code', 'Use Kilo Code MCP settings plus .kilo generated skills and commands.', 'docs/install-kilo-code.md', true),
    adapter('antigravity', 'Antigravity', 'Use generic MCP configuration and project instruction files where supported.', 'docs/install-antigravity.md', false),
    adapter('generic-mcp', 'Generic MCP Client', 'Use copyable JSON config for any stdio MCP-compatible client.', 'docs/install-generic-mcp.md', false)
  ];
}

export function findIntegrationAdapter(target: string): IntegrationAdapter | undefined {
  return getIntegrationAdapters().find(adapterItem => adapterItem.target === target);
}

function adapter(target: IntegrationAdapter['target'], displayName: string, description: string, docsPath: string, supportsAutoInstall: boolean): IntegrationAdapter {
  return {
    target,
    displayName,
    description,
    docsPath,
    supportsAutoInstall,
    buildConfig: buildMcpServerConfig,
    installInstructions(root: string, serverScript: string): string {
      const config = JSON.stringify({ mcpServers: { 'ini-brain-ai': buildMcpServerConfig(root, serverScript) } }, null, 2);
      return [
        `# ${displayName} Integration`,
        '',
        description,
        '',
        'Use this MCP server configuration:',
        '',
        '```json',
        config,
        '```',
        '',
        'Recommended agent instruction:',
        '',
        '```md',
        'Before editing, call ini_brain_get_context for my task. Search memory when previous decisions may matter. Save durable findings with ini_brain_save_memory after finishing.',
        '```'
      ].join('\n');
    }
  };
}
