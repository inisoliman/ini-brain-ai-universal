const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
if (process.platform !== 'win32') {
  console.log('SKIP Windows PowerShell installer smoke: requires Windows; generic integration/installer fixtures still run in smoke:all.');
  process.exit(0);
}
const root = path.resolve(__dirname, '..');
const fixture = fs.mkdtempSync(path.join(root, '.installer-safety-'));
const home = path.join(fixture, 'home'); const appdata = path.join(fixture, 'appdata');
const file = path.join(appdata, 'Claude/claude_desktop_config.json');
fs.mkdirSync(path.dirname(file), { recursive: true }); fs.mkdirSync(home);
const run = () => spawnSync(path.join(process.env.SystemRoot || 'C:/Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe'), ['-NoProfile', '-File', path.join(root, 'scripts/install-all.ps1'), '-SkipBuild', '-SkipCodeIntel', '-SkipCodex', '-SkipCline'], { cwd: root, env: { ...process.env, USERPROFILE: home, HOME: home, APPDATA: appdata, XDG_CONFIG_HOME: path.join(home, '.config') }, stdio: 'inherit' });
try {
  for (const bad of ['{broken', '[]', '{"mcpServers":[]}', '{"mcpServers":{"ini-brain-ai":null}}']) {
    fs.writeFileSync(file, bad); const result = run();
    if (result.error) throw result.error;
    assert.notEqual(result.status, 0, `installer must report malformed input: ${result.stdout} ${result.stderr}`);
    assert.equal(fs.readFileSync(file, 'utf8'), bad, 'malformed original unchanged');
  }
  const original = JSON.stringify({ other: 1, mcpServers: { keep: { command: 'keep' }, 'ini-brain-ai': { command: 'old', args: ['old'], env: { FLAG: 'keep' }, custom: 42 } } });
  fs.writeFileSync(file, original);
  let result = run(); assert.equal(result.status, 0, result.stdout + result.stderr);
  const config = JSON.parse(fs.readFileSync(file)); assert.equal(config.mcpServers['ini-brain-ai'].env.FLAG, 'keep'); assert.equal(config.mcpServers['ini-brain-ai'].custom, 42); assert(config.mcpServers.keep);
  assert(fs.readdirSync(path.dirname(file)).some(f => f.includes('.bak') && fs.readFileSync(path.join(path.dirname(file), f), 'utf8') === original));
  const bytes = fs.readFileSync(file, 'utf8'); result = run(); assert.equal(result.status, 0); assert.equal(fs.readFileSync(file, 'utf8'), bytes);
  assert(!fs.existsSync(path.join(home, '.codex')), 'absent clients not installed');
  console.log('OK PowerShell installer: malformed refusal, preservation, backup, idempotence, isolated home');
} finally { fs.rmSync(fixture, { recursive: true, force: true }); }
