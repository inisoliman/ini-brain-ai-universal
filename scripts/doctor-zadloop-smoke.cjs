/**
 * Regression fixtures for scripts/doctor-zadloop.cjs.
 *
 * Each fixture builds a temporary workspace and a temporary MCP server script,
 * runs the doctor as a real child process, and asserts the exit code. Nothing
 * touches real client configuration, and the doctor must leave every fixture
 * workspace byte-identical.
 */
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const doctor = path.join(root, 'scripts', 'doctor-zadloop.cjs');
const fixtures = [];

function fixture(name) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), `ini-brain-doctor-${name}-`));
  fixtures.push(directory);
  return directory;
}

function write(file, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body, 'utf8');
}

function serverFixture(directory, name, body) {
  const file = path.join(directory, name);
  write(file, `'use strict';\n${body}`);
  return file;
}

function protocolServer({ version = '9.9.9', mode = 'lines', onStatus, trust = true, delayStatusMs = 0 } = {}) {
  return `
const fs = require('fs');
const path = require('path');
const MODE = ${JSON.stringify(mode)};
const VERSION = ${JSON.stringify(version)};
function send(message) {
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  if (MODE === 'headers') process.stdout.write(Buffer.concat([Buffer.from('Content-Length: ' + body.length + '\\r\\n\\r\\n', 'utf8'), body]));
  else process.stdout.write(body.toString('utf8') + '\\n');
}
function answer(message) {
  if (message.method === 'initialize') {
    send({ jsonrpc: '2.0', id: message.id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'fixture-server', version: VERSION } } });
    return;
  }
  if (message.method === 'tools/list') {
    send({ jsonrpc: '2.0', id: message.id, result: { tools: [{ name: 'ini_brain_status', inputSchema: { type: 'object', properties: { workspace: { type: 'string' } } } }] } });
    return;
  }
  if (message.method === 'tools/call') {
    const workspace = String((message.params.arguments || {}).workspace || '');
    const payload = { workspace, workspaceTrusted: ${JSON.stringify(trust)}, serverVersion: VERSION, hasBrain: false };
    const text = ${JSON.stringify(onStatus || null)} !== null ? JSON.stringify(${JSON.stringify(onStatus || null)}) : JSON.stringify(payload);
    const reply = () => send({ jsonrpc: '2.0', id: message.id, result: { content: [{ type: 'text', text }] } });
    if (${delayStatusMs}) setTimeout(reply, ${delayStatusMs});
    else reply();
  }
}
if (MODE === 'headers') {
  let buffer = Buffer.alloc(0);
  process.stdin.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);
    for (;;) {
      const split = buffer.indexOf('\\r\\n\\r\\n');
      if (split === -1) return;
      const length = Number(/Content-Length:\\s*(\\d+)/i.exec(buffer.subarray(0, split).toString('utf8'))[1]);
      if (buffer.length < split + 4 + length) return;
      const body = buffer.subarray(split + 4, split + 4 + length).toString('utf8');
      buffer = buffer.subarray(split + 4 + length);
      answer(JSON.parse(body));
    }
  });
} else {
  let pending = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    pending += chunk;
    let newline;
    while ((newline = pending.indexOf('\\n')) !== -1) {
      const line = pending.slice(0, newline).trim();
      pending = pending.slice(newline + 1);
      if (line) answer(JSON.parse(line));
    }
  });
}
process.stdin.on('end', () => process.exit(0));
`;
}

function snapshot(directory) {
  const entries = [];
  const walk = (current, relative) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(current, entry.name);
      const rel = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(full, rel);
      else {
        const body = fs.readFileSync(full);
        entries.push(`${rel}:${body.length}:${crypto.createHash('sha256').update(body).digest('hex')}`);
      }
    }
  };
  walk(directory, '');
  return entries;
}

function run(args) {
  const result = spawnSync(process.execPath, [doctor, ...args], { encoding: 'utf8', timeout: 120000 });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  assert.strictEqual(result.error, undefined, `doctor could not run: ${result.error}`);
  assert.ok(!/C:\\\\Users\\\\[^\\s]+AppData/i.test(output), `doctor output leaked an AppData path:\n${output}`);
  return { code: result.status, output };
}

function projectWorkspace(name) {
  const workspace = fixture(name);
  write(path.join(workspace, 'package.json'), '{ "name": "fixture-project" }\n');
  return workspace;
}

function assertUnchanged(workspace, before, label) {
  assert.deepStrictEqual(snapshot(workspace), before, `${label} wrote to the target workspace`);
}

// 1. Success over line framing and over Content-Length framing.
{
  const workspace = projectWorkspace('success');
  const before = snapshot(workspace);
  const server = serverFixture(fixture('success-server'), 'server.cjs', protocolServer({ version: '3.4.1' }));
  const lines = run(['--server', server, '--workspace', workspace, '--expect-version', '3.4.1']);
  assert.strictEqual(lines.code, 0, `success fixture failed:\n${lines.output}`);
  assert.match(lines.output, /fixture-server 3\.4\.1/);
  assert.match(lines.output, /Result: OK/);
  assert.ok(lines.output.includes(path.resolve(workspace).replace(/\\/g, '/').toLowerCase()), 'doctor did not echo the checked workspace');

  const headersServer = serverFixture(fixture('success-headers'), 'server.cjs', protocolServer({ version: '3.4.1', mode: 'headers' }));
  const headers = run(['--server', headersServer, '--workspace', workspace]);
  assert.strictEqual(headers.code, 0, `content-length fixture failed:\n${headers.output}`);
  assertUnchanged(workspace, before, 'success fixtures');
}

// 2. Version mismatch is a distinct, nonzero failure.
{
  const workspace = projectWorkspace('mismatch');
  const server = serverFixture(fixture('mismatch-server'), 'server.cjs', protocolServer({ version: '3.3.0' }));
  const result = run(['--server', server, '--workspace', workspace, '--expect-version', '3.4.1']);
  assert.strictEqual(result.code, 1, `mismatch fixture exit was ${result.code}:\n${result.output}`);
  assert.match(result.output, /Version mismatch: expected 3\.4\.1, server reports 3\.3\.0/);
}

// 3. Missing server script and missing workspace are usage failures.
{
  const workspace = projectWorkspace('missing');
  const missingScript = run(['--server', path.join(workspace, 'nope', 'server.js'), '--workspace', workspace]);
  assert.strictEqual(missingScript.code, 2, `missing server exit was ${missingScript.code}`);
  assert.match(missingScript.output, /not found/);

  const missingWorkspace = run(['--server', doctor, '--workspace', path.join(workspace, 'absent-project')]);
  assert.strictEqual(missingWorkspace.code, 2, `missing workspace exit was ${missingWorkspace.code}`);
  assert.match(missingWorkspace.output, /Workspace directory does not exist/);

  const badArgument = run(['--server', doctor, '--bogus', 'x']);
  assert.strictEqual(badArgument.code, 2, `bad argument exit was ${badArgument.code}`);
}

// 4. A server that never answers the tool call times out and is stopped.
{
  const workspace = projectWorkspace('timeout');
  const before = snapshot(workspace);
  const server = serverFixture(fixture('timeout-server'), 'server.cjs', protocolServer({ version: '3.4.1', delayStatusMs: 120000 }));
  const started = Date.now();
  const result = run(['--server', server, '--workspace', workspace, '--expect-version', '3.4.1']);
  const elapsed = Date.now() - started;
  assert.strictEqual(result.code, 4, `timeout fixture exit was ${result.code}:\n${result.output}`);
  assert.match(result.output, /did not answer within/);
  assert.ok(elapsed < 90000, `timeout fixture took ${elapsed} ms; shutdown is not bounded`);
  assertUnchanged(workspace, before, 'timeout fixture');
}

// 5. Spaces plus Arabic in both the workspace and the server path.
{
  const parent = fixture('spaces-arabic');
  const workspace = path.join(parent, 'مشروع تجريبي', 'مجلد المشروع');
  write(path.join(workspace, 'README.md'), 'fixture\n');
  write(path.join(workspace, '.git', 'HEAD'), 'ref: refs/heads/main\n');
  const before = snapshot(workspace);
  const server = serverFixture(path.join(parent, 'مجلد الأدوات'), 'server.cjs', protocolServer({ version: '3.4.1' }));
  const result = run(['--server', server, '--workspace', workspace, '--expect-version', '3.4.1']);
  assert.strictEqual(result.code, 0, `spaces + Arabic fixture failed:\n${result.output}`);
  assert.ok(result.output.includes(path.resolve(workspace).replace(/\\/g, '/').toLowerCase()));
  assertUnchanged(workspace, before, 'spaces + Arabic fixture');
}

// 6. Explicit-workspace contract: ignored workspace and untrusted workspace.
{
  const workspace = projectWorkspace('ignored');
  const ignored = serverFixture(fixture('ignored-server'), 'server.cjs', protocolServer({
    version: '3.4.1',
    onStatus: { workspace: path.join(os.tmpdir(), 'somewhere-else'), workspaceTrusted: true, serverVersion: '3.4.1', hasBrain: false }
  }));
  const ignoredResult = run(['--server', ignored, '--workspace', workspace]);
  assert.strictEqual(ignoredResult.code, 3, `ignored workspace exit was ${ignoredResult.code}:\n${ignoredResult.output}`);
  assert.match(ignoredResult.output, /ignored the explicit workspace/);

  const untrusted = serverFixture(fixture('untrusted-server'), 'server.cjs', protocolServer({ version: '3.4.1', trust: false }));
  const untrustedResult = run(['--server', untrusted, '--workspace', workspace]);
  assert.strictEqual(untrustedResult.code, 3, `untrusted workspace exit was ${untrustedResult.code}`);
  assert.match(untrustedResult.output, /not trusted/);
}

// 7. Invalid protocol responses fail with a distinct code and sanitized text.
{
  const workspace = projectWorkspace('protocol');
  const garbage = serverFixture(fixture('garbage-server'), 'server.cjs', `
process.stdout.write('this is not json\\n');
process.stdin.resume();
`);
  const garbageResult = run(['--server', garbage, '--workspace', workspace]);
  assert.strictEqual(garbageResult.code, 5, `garbage fixture exit was ${garbageResult.code}:\n${garbageResult.output}`);

  const leaking = serverFixture(fixture('leaking-server'), 'server.cjs', `
process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: 'doctor-initialize', error: { code: -32000, message: 'authorization=Bearer sk-live-abcdefghijklmnopqrstuvwxyz012345' } }) + '\\n');
process.stdin.resume();
`);
  const leakingResult = run(['--server', leaking, '--workspace', workspace]);
  assert.strictEqual(leakingResult.code, 5, `error fixture exit was ${leakingResult.code}:\n${leakingResult.output}`);
  assert.ok(!leakingResult.output.includes('sk-live-abcdefghijklmnopqrstuvwxyz012345'), 'doctor printed a secret from server text');
  assert.match(leakingResult.output, /<redacted>|initialize failed/);

  const wrongShape = serverFixture(fixture('shape-server'), 'server.cjs', `
process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: 'doctor-initialize', result: { capabilities: {} } }) + '\\n');
process.stdin.resume();
`);
  const shapeResult = run(['--server', wrongShape, '--workspace', workspace]);
  assert.strictEqual(shapeResult.code, 5, `shape fixture exit was ${shapeResult.code}`);
  assert.match(shapeResult.output, /no usable serverInfo/);
}

// 8. A real workspace is never written: doctor only spawns the named script.
{
  const workspace = projectWorkspace('real-dist');
  const before = snapshot(workspace);
  const distServer = path.join(root, 'dist', 'mcp', 'server.js');
  assert.ok(fs.existsSync(distServer), 'compile before running the ZadLoop doctor smoke test');
  const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  const result = run(['--server', distServer, '--workspace', workspace, '--expect-version', version]);
  assert.strictEqual(result.code, 0, `built server fixture failed for ${workspace}:\n${result.output}`);
  assertUnchanged(workspace, before, 'doctor against the built server');
}

for (const directory of fixtures) {
  fs.rmSync(directory, { recursive: true, force: true });
}

console.log('ZadLoop doctor smoke test passed.');
