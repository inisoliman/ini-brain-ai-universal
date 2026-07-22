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
  const claudeCodeDir = path.join(home, '.claude');
  const geminiDir = path.join(home, '.gemini');
  const cursorDir = path.join(home, '.cursor');
  const clineDir = path.join(appData, 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings');
  // Kilo Code is present but its settings subfolder has not been created yet:
  // the installer must create it instead of skipping (first-run scenario).
  const kiloAnchor = path.join(appData, 'Code', 'User', 'globalStorage', 'kilocode.kilo-code');
  for (const directory of [codexDir, claudeDir, claudeCodeDir, geminiDir, cursorDir, clineDir, kiloAnchor]) {
    fs.mkdirSync(directory, { recursive: true });
  }

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
  const installedIds = first.filter(result => result.status === 'installed').map(result => result.client);
  for (const expected of ['codex', 'claude', 'claude-code', 'gemini-cli', 'cursor', 'cline', 'kilo-code']) {
    assert(installedIds.includes(expected), `expected ${expected} to be installed, got: ${installedIds.join(', ')}`);
  }
  assert(!installedIds.includes('roo-code'), 'roo-code must be skipped when its globalStorage folder is absent');

  const codex = fs.readFileSync(path.join(codexDir, 'config.toml'), 'utf8');
  assert(codex.includes('[mcp_servers.keep-me]'));
  assert(codex.includes('[mcp_servers.ini-brain-ai]'));
  assert(codex.includes('[profiles.default]'));
  assert(!codex.includes('old-server.js'));

  for (const configPath of [
    path.join(claudeDir, 'claude_desktop_config.json'),
    path.join(clineDir, 'cline_mcp_settings.json'),
    path.join(kiloAnchor, 'settings', 'mcp_settings.json'),
    path.join(home, '.claude.json'),
    path.join(geminiDir, 'settings.json'),
    path.join(cursorDir, 'mcp.json'),
  ]) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert(config.mcpServers['ini-brain-ai'], `missing ini-brain-ai in ${configPath}`);
    assert.strictEqual(config.mcpServers['ini-brain-ai'].args[0], 'C:/extension/dist/mcp/server.js');
  }
  const cline = JSON.parse(fs.readFileSync(path.join(clineDir, 'cline_mcp_settings.json'), 'utf8'));
  assert(cline.mcpServers.existing);
  assert.strictEqual(cline.mcpServers['ini-brain-ai'].env, undefined);
  assert.strictEqual(cline.mcpServers['ini-brain-ai'].disabled, false);

  const second = await autoInstallMcpClients(options);
  const secondInstalled = second.filter(result => result.status === 'installed');
  assert.strictEqual(secondInstalled.length, 0, `second run must be idempotent, installed: ${secondInstalled.map(r => r.client).join(', ')}`);
  assert(second.filter(result => result.status === 'unchanged').length >= 7);

  // Regression: claude-code must still install when ~/.claude.json exists but
  // the ~/.claude directory anchor is absent (fallback candidate with the same
  // config path must not be deduped away after the first candidate skips).
  const temp2 = fs.mkdtempSync(path.join(os.tmpdir(), 'ini-auto-mcp-fallback-'));
  const home2 = path.join(temp2, 'home');
  const appData2 = path.join(temp2, 'appdata');
  fs.mkdirSync(home2, { recursive: true });
  fs.writeFileSync(path.join(home2, '.claude.json'), JSON.stringify({ mcpServers: { keep: { command: 'keep' } } }), 'utf8');
  const fallbackRun = await autoInstallMcpClients({ serverScript: 'C:/extension/dist/mcp/server.js', homeDir: home2, appDataDir: appData2, platform: 'win32' });
  const claudeCode = fallbackRun.filter(r => r.client === 'claude-code');
  assert(claudeCode.some(r => r.status === 'installed'), `claude-code fallback anchor must install, got: ${claudeCode.map(r => r.status).join(', ')}`);
  const claudeJson = JSON.parse(fs.readFileSync(path.join(home2, '.claude.json'), 'utf8'));
  assert(claudeJson.mcpServers.keep, 'existing servers must be preserved');
  assert(claudeJson.mcpServers['ini-brain-ai'], 'ini-brain-ai must be merged into ~/.claude.json');

  console.log('OK automatic MCP installer smoke');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
