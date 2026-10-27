const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { openCodeAdapter } = require('../dist/adapters/openCodeAdapter');
const { getIntegrationAdapters } = require('../dist/integrations/registry');
const { autoInstallMcpClients } = require('../dist/integrations/autoMcpInstaller');
const root = fs.mkdtempSync(path.join(path.resolve(__dirname, '..'), '.integration-reliability-'));
async function main() {
  const skill = path.join(root, '.opencode/skills/release-check/SKILL.md');
  await openCodeAdapter.writeSkill({ root, name: 'release-check', body: '# Release check\nVerify tests.' });
  assert(fs.existsSync(skill), 'OpenCode native SKILL.md layout');
  const text = fs.readFileSync(skill, 'utf8');
  assert.match(text, /^---\r?\nname: release-check\r?\ndescription: .+/);
  for (const name of ['../escape', 'Upper', 'bad--name', 'a'.repeat(65)]) await assert.rejects(() => openCodeAdapter.writeSkill({ root, name, body: 'bad' }));
  fs.writeFileSync(skill, '# user replacement');
  await assert.rejects(() => openCodeAdapter.writeSkill({ root, name: 'release-check', body: 'do not overwrite' }));
  await openCodeAdapter.removeSkill(root, 'release-check');
  assert.equal(fs.readFileSync(skill, 'utf8'), '# user replacement');
  const agents = path.join(root, 'AGENTS.md'); fs.writeFileSync(agents, '# user guide');
  await openCodeAdapter.writeAgentsFile({ root, body: '# generated' });
  assert.equal(fs.readFileSync(agents, 'utf8'), '# user guide');
  fs.writeFileSync(path.join(root, 'opencode.jsonc'), '{}');
  assert(await openCodeAdapter.detectInstalled(root));
  const adapters = getIntegrationAdapters();
  const opencode = adapters.find(a => a.target === 'opencode');
  assert(opencode, 'OpenCode is selectable');
  const native = opencode.buildConfig(root, 'server.js');
  assert.deepEqual(native, { type: 'local', command: ['node', 'server.js'], enabled: true });
  const zadloop = adapters.find(a => a.target === 'zadloop');
  assert(zadloop && !zadloop.supportsAutoInstall, 'ZadLoop explicit manual status');
  assert.match(zadloop.installInstructions(root, 'server.js'), /command.*node/is);
  const home = path.join(root, 'home'); const appdata = path.join(root, 'appdata');
  const claude = path.join(appdata, 'Claude/claude_desktop_config.json');
  const oc = path.join(home, '.config/opencode/opencode.json');
  for (const file of [claude, oc]) fs.mkdirSync(path.dirname(file), { recursive: true });
  const existing = { command: 'old', args: ['old.js'], env: { USER_FLAG: 'keep' }, disabled: true, autoApprove: ['existing'], custom: 42 };
  fs.writeFileSync(claude, JSON.stringify({ theme: 'keep', mcpServers: { other: { command: 'keep' }, 'ini-brain-ai': existing } }));
  fs.writeFileSync(oc, JSON.stringify({ model: 'keep', mcp: { other: { type: 'remote', url: 'https://example.invalid' }, 'ini-brain-ai': { type: 'local', command: ['old'], environment: { KEEP: 'yes' }, enabled: false, timeout: 90000 } } }));
  const options = { homeDir: home, appDataDir: appdata, platform: 'win32', serverScript: 'new.js' };
  const original = fs.readFileSync(claude, 'utf8');
  await autoInstallMcpClients(options);
  const updated = JSON.parse(fs.readFileSync(claude));
  assert.deepEqual(updated.mcpServers['ini-brain-ai'], { ...existing, command: 'node', args: ['new.js'] });
  assert.equal(updated.theme, 'keep'); assert(updated.mcpServers.other);
  const backups = fs.readdirSync(path.dirname(claude)).filter(f => f.includes('.bak'));
  assert(backups.some(f => fs.readFileSync(path.join(path.dirname(claude), f), 'utf8') === original), 'original backup exists');
  const ocConfig = JSON.parse(fs.readFileSync(oc));
  assert.deepEqual(ocConfig.mcp['ini-brain-ai'], { type: 'local', command: ['node', 'new.js'], environment: { KEEP: 'yes' }, enabled: false, timeout: 90000 });
  assert(ocConfig.mcp.other); assert.equal(ocConfig.model, 'keep');
  assert(!(await autoInstallMcpClients(options)).some(r => r.status === 'installed'), 'repeat install unchanged');
  for (const bad of ['{broken', '[]', '{"mcpServers":[]}', '{"mcpServers":{"ini-brain-ai":null}}']) {
    fs.writeFileSync(claude, bad);
    const results = await autoInstallMcpClients(options);
    assert(results.some(r => r.client === 'claude' && r.status === 'error'));
    assert.equal(fs.readFileSync(claude, 'utf8'), bad);
  }
  // JSONC must be safely preserved OR refused with a clear manual merge message.
  fs.unlinkSync(oc); const jsonc = `${oc}c`; const comments = '{\n // keep comment\n "model": "keep",\n}'; fs.writeFileSync(jsonc, comments);
  const jsoncResult = (await autoInstallMcpClients(options)).find(r => r.client === 'opencode' && r.configPath === jsonc);
  assert(jsoncResult);
  if (jsoncResult.status === 'error') { assert.match(jsoncResult.message, /manual|JSONC/i); assert.equal(fs.readFileSync(jsonc, 'utf8'), comments); }
  else { assert(fs.readFileSync(jsonc, 'utf8').includes('// keep comment')); }
  assert(!fs.existsSync(oc), 'no competing JSON config created beside JSONC');
  const codex = path.join(home, '.codex/config.toml'); fs.mkdirSync(path.dirname(codex));
  const freshCodex = await autoInstallMcpClients({ ...options, clients: ['codex'] });
  assert(freshCodex.some(r => r.status === 'installed'), 'detected Codex with missing config initializes safely');
  assert(fs.existsSync(codex));
  fs.writeFileSync(codex, '[mcp_servers.ini-brain-ai]\ncommand = "old"\nargs = ["old"]\nenabled = false\nstartup_timeout_sec = 99\n[mcp_servers.ini-brain-ai.env]\nKEEP = "yes"\n');
  const tomlRun = await autoInstallMcpClients({ ...options, clients: ['codex'] });
  assert(tomlRun.some(r => r.status === 'installed'));
  const toml = fs.readFileSync(codex, 'utf8'); assert(toml.includes('enabled = false')); assert(toml.includes('KEEP = "yes"')); assert(toml.includes('startup_timeout_sec = 99'));
  assert(!(await autoInstallMcpClients({ ...options, clients: ['codex'] })).some(r => r.status === 'installed'));
  fs.writeFileSync(codex, '[mcp_servers.ini-brain-ai]\n  command = "old"\n  args = ["old"]\n');
  assert((await autoInstallMcpClients({ ...options, clients: ['codex'] })).some(r => r.status === 'installed'));
  const indented = fs.readFileSync(codex, 'utf8'); assert.equal((indented.match(/command\s*=/g) || []).length, 1, 'indented TOML updates never append duplicate keys');
  for (const bad of ['[broken', 'a = "unterminated', 'a = 1\na = 2', 'a = [null]', 'a = [true, null]', 'a = "\\uD800"', '  [mcp_servers.ini-brain-ai]\ncommand = "old"\nargs = ["old"]\n']) { fs.writeFileSync(codex, bad); assert((await autoInstallMcpClients({ ...options, clients: ['codex'] })).some(r => r.status === 'error')); assert.equal(fs.readFileSync(codex, 'utf8'), bad); }
  console.log('OK integration reliability: native OpenCode, user files, env/options, backups, invalid configs, JSONC, idempotence');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => fs.rmSync(root, { recursive: true, force: true }));
