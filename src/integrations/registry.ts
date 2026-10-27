import { IntegrationAdapter } from './types';
import { buildMcpServerConfig, buildOpenCodeMcpConfig } from './mcpConfig';

export function getIntegrationAdapters(): IntegrationAdapter[] {
  return [
    adapter('vscode', 'VS Code', 'Use the VS Code extension sidebar, commands, and SecretStorage.', 'docs/install-vscode.md', true),
    adapter('codex', 'Codex', 'Use AGENTS.md, Codex-friendly skill guidance, and MCP context tools.', 'docs/install-codex.md', false),
    adapter('cline', 'Cline', 'Use Cline MCP settings plus .cline and .clinerules generated skills.', 'docs/install-cline.md', true),
    adapter('kilo-code', 'Kilo Code', 'Use Kilo Code MCP settings plus .kilo generated skills and commands.', 'docs/install-kilo-code.md', true),
    adapter('antigravity', 'Antigravity', 'Use generic MCP configuration and project instruction files where supported.', 'docs/install-antigravity.md', false),
    adapter('opencode', 'OpenCode', 'Native OpenCode MCP config, project skills and shared root AGENTS.md.', 'docs/install-opencode.md', true),
    adapter('zadloop', 'ZadLoop', 'Manual MCP command/args export; pass workspace on every call. Automatic file installation unsupported.', 'docs/install-zadloop.md', false),
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
    buildConfig: (root, script) => target === 'opencode' ? buildOpenCodeMcpConfig(script) : target === 'zadloop' ? { command: 'node', args: [script] } : buildMcpServerConfig(root, script),
    installInstructions(root: string, serverScript: string): string {
      if (target === 'zadloop') return [
        '# ZadLoop manual MCP setup',
        'Automatic global file merge is unsupported: no stable active-profile merge location has been verified.',
        'Live profile: %APPDATA%/ZadLoop/harness/profiles/<profile>/cordis.yml (root usually []); edit cordis.patch.yml in the same folder with the app closed. Back it up first.',
        'Replace ONLY the existing ini-brain insert entry (no duplicate serverName/namespace ini_brain) and keep every other setting, including the dsh-system-prompt personaSuffix:',
        [
          '- insert:',
          '    - id: mcp-ini-brain',
          "      name: '@deepseek-ai/dsh-mcp-client'",
          '      config:',
          '        serverName: ini_brain',
          '        transport: stdio',
          '        command: node',
          `        args: ${JSON.stringify([serverScript])}`,
          '        toolCallTimeoutMs: 120000'
        ].join('\n'),
        'Notes: installing the VSIX does not update an independently configured args path (point it at the built checkout or the newly installed extension folder, not a stale ...-3.3.0 folder); remove an INI_BRAIN_WORKSPACE env that resolves to the app directory; startupTimeoutMs is not a supported dsh-mcp-client field while toolCallTimeoutMs is.',
        `Verify after restart, in a new conversation: node scripts/doctor-zadloop.cjs --server ${serverScript} --workspace <your project> --expect-version 3.4.1 (expect exit 0).`,
        'Use the shared root AGENTS.md; no ZadLoop-specific skills folder is assumed.',
        'Pass this conversation\'s explicit workspace on EVERY call; ZadLoop sends no project roots. Repeat after switching projects.'
      ].join('\n\n');
      const config = JSON.stringify(target === 'opencode' ? { mcp: { 'ini-brain-ai': buildOpenCodeMcpConfig(serverScript) } } : { mcpServers: { 'ini-brain-ai': buildMcpServerConfig(root, serverScript) } }, null, 2);
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
        'Call ini_brain_status first, then ini_brain_auto_brief and ini_brain_get_context for the task. When no project roots/cwd are supplied, pass this conversation project as workspace on EVERY call and repeat status after switching projects. Save durable findings after finishing.',
        '```'
      ].join('\n');
    }
  };
}
