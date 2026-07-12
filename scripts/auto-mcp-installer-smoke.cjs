const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { autoInstallMcpClients } = require('../dist/integrations/autoMcpInstaller');

(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ini-auto-mcp-'));
  const home = path.join(temp, 'home');
  const appData = path.join(temp, 'appdata');
  const codexDir = path.join(home, '.codex');
  const claudeDir = path.join(appData, 'Claude');
  const clineDir = path.join(appData, 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings');
  for (const directory of [codexDir, claudeDir, clineDir]) fs.mkdirSync(directory, { recursive: true });

  fs.writeFileSync(path.join(codexDir, 'config.toml'), [
    '[mcp_servers.keep-me]',
    'command = "keep"',
    '',
    '[mcp_servers.ini-brain-ai]',
    'command = "old-node"',
    'args = ["old-server.js"]',
    '',
    '[profiles.default]',
    'model = "gpt-5"',
    '',
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(claudeDir, 'claude_desktop_config.json'), JSON.stringify({ mcpServers: { existing: { command: 'keep' } } }), 'utf8');
  fs.writeFileSync(path.join(clineDir, 'cline_mcp_settings.json'), JSON.stringify({ mcpServers: { existing: { command: 'keep' } } }), 'utf8');

  const options = {
    serverScript: 'C:/extension/dist/mcp/server.js',
    homeDir: home,
    appDataDir: appData,
    platform: 'win32',
  };
  const first = await autoInstallMcpClients(options);
  assert.strictEqual(first.filter(result => result.status === 'installed').length, 3);

  const codex = fs.readFileSync(path.join(codexDir, 'config.toml'), 'utf8');
  assert(codex.includes('[mcp_servers.keep-me]'));
  assert(codex.includes('[mcp_servers.ini-brain-ai]'));
  assert(codex.includes('[profiles.default]'));
  assert(!codex.includes('old-server.js'));

  for (const configPath of [
    path.join(claudeDir, 'claude_desktop_config.json'),
    path.join(clineDir, 'cline_mcp_settings.json'),
  ]) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert(config.mcpServers.existing);
    assert(config.mcpServers['ini-brain-ai']);
  }
  const cline = JSON.parse(fs.readFileSync(path.join(clineDir, 'cline_mcp_settings.json'), 'utf8'));
  assert.strictEqual(cline.mcpServers['ini-brain-ai'].env, undefined);

  const second = await autoInstallMcpClients(options);
  assert.strictEqual(second.filter(result => result.status === 'unchanged').length, 3);
  console.log('OK automatic MCP installer smoke');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
