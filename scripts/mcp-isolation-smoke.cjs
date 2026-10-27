const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fixture = fs.mkdtempSync(path.join(root, '.mcp-isolation-'));
const home = path.join(fixture, 'home');
const host = path.join(home, 'AppData', 'Local', 'Programs', 'ZadLoop');
const a = path.join(fixture, 'a'); const b = path.join(fixture, 'b'); const empty = path.join(fixture, 'empty');
for (const dir of [home, host, a, b, empty]) fs.mkdirSync(dir, { recursive: true });
for (const dir of [a, b]) fs.writeFileSync(path.join(dir, 'package.json'), '{}');
fs.writeFileSync(path.join(host, 'AGENTS.md'), '# application');
fs.writeFileSync(path.join(host, 'package.json'), '{"name":"desktop-host"}');
const clients = [];
function client(capabilities, cwd = host, background = false, preload) {
  const child = spawn(process.execPath, [...(preload ? ['-r', preload] : []), path.join(root, 'dist/mcp/server.js')], { cwd, env: { ...process.env, USERPROFILE: home, HOME: home, INI_BRAIN_WORKSPACE: '', CODEX_WORKSPACE: '', CODEX_CWD: '', WORKSPACE: '', INIT_CWD: '', PWD: '', INI_BRAIN_DISABLE_AUTO_BACKGROUND: background ? '' : '1' }, stdio: ['pipe', 'pipe', 'inherit', 'ipc'] });
  const refreshEvents = []; const refreshWaiters = [];
  child.on('message', message => { if (message?.type === 'refresh-entered') { const waiter = refreshWaiters.shift(); if (waiter) waiter(message); else refreshEvents.push(message); } });
  const refreshEntered = () => refreshEvents.length ? Promise.resolve(refreshEvents.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('refresh barrier timeout')), 5000);
    refreshWaiters.push(message => { clearTimeout(timer); resolve(message); });
  });
  let next = 0; let buffer = ''; let closed = false; let failure; const pending = new Map(); const requests = []; const rootWaiters = [];
  const fail = error => { failure = error; for (const waiter of pending.values()) waiter.reject(error); pending.clear(); for (const waiter of rootWaiters.splice(0)) waiter.reject(error); };
  const close = new Promise(resolve => child.once('close', (code, signal) => { closed = true; fail(new Error(`MCP child closed (${code}, ${signal})`)); resolve(); }));
  child.on('error', fail); child.stdin.on('error', fail);
  const shutdown = async () => {
    if (closed) return;
    child.kill();
    let timer;
    try { await Promise.race([close, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('MCP child shutdown exceeded 5 seconds; fixture retained')), 5000); })]); }
    finally { clearTimeout(timer); }
  };
  clients.push({ shutdown, isClosed: () => closed });
  child.stdout.on('data', chunk => {
    buffer += chunk;
    for (;;) {
      const end = buffer.indexOf('\n'); if (end < 0) break;
      let msg; try { msg = JSON.parse(buffer.slice(0, end)); } catch (error) { fail(error); return; } buffer = buffer.slice(end + 1);
      if (msg.method === 'roots/list') { const waiter = rootWaiters.shift(); if (waiter) waiter.resolve(msg); else requests.push(msg); }
      else { const waiter = pending.get(msg.id); if (waiter) { pending.delete(msg.id); waiter.resolve(msg); } }
    }
  });
  const send = msg => child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', ...msg })}\n`);
  const call = (method, params) => new Promise((resolve, reject) => {
    if (failure) return reject(failure);
    const id = ++next; const timer = setTimeout(() => { pending.delete(id); reject(new Error(`timeout ${method}`)); }, 6000);
    pending.set(id, { resolve: msg => { clearTimeout(timer); resolve(msg); }, reject: error => { clearTimeout(timer); reject(error); } }); send({ id, method, params });
  });
  const roots = () => {
    if (failure) return Promise.reject(failure);
    if (requests.length) return Promise.resolve(requests.shift());
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { const index = rootWaiters.indexOf(waiter); if (index >= 0) rootWaiters.splice(index, 1); reject(new Error('roots request timeout')); }, 6000);
      const waiter = { resolve: msg => { clearTimeout(timer); resolve(msg); }, reject: error => { clearTimeout(timer); reject(error); } }; rootWaiters.push(waiter);
    });
  };
  return { child, shutdown, refreshEntered, releaseRefresh: () => child.send({ type: 'release-refresh' }), send, call, tool: (name, args = {}) => call('tools/call', { name, arguments: args }), roots, initialize: () => call('initialize', { capabilities, clientInfo: { name: 'dsh-mcp-client' } }) };
}
const payload = response => JSON.parse(response.result.content[0].text);
async function main() {
  let c = client({});
  try {
    const init = await c.initialize();
    assert(!init.result.capabilities.roots, 'server must not advertise client-only roots capability');
    const status = payload(await c.tool('ini_brain_status'));
    assert.equal(status.workspaceTrusted, false);
    assert((await c.tool('ini_brain_auto_brief')).result.content[0].text.includes('WARNING'));
    for (const name of ['ini_brain_save_memory', 'ini_brain_generate_agent_guide', 'ini_brain_graph_build', 'ini_brain_search_memory']) {
      assert((await c.tool(name, { content: 'do not write host', query: 'query' })).error, `${name} must refuse unresolved host`);
    }
    assert(!fs.existsSync(path.join(host, '.brain')), 'host has no mutations');
    assert((await c.tool('ini_brain_save_memory', { workspace: path.join(fixture, 'missing'), content: 'wrong path' })).error, 'invalid explicit path never falls back');
    assert((await c.tool('ini_brain_save_memory', { workspace: home, content: 'home' })).error);
    for (const [workspace, content] of [[a, 'only alpha'], [b, 'only beta'], [a, 'alpha again'], [empty, 'explicit empty initialization']]) {
      assert(!(await c.tool('ini_brain_save_memory', { workspace, content })).error);
    }
    assert.equal(JSON.parse(fs.readFileSync(path.join(a, '.brain/memories.json'))).length, 2);
    assert.equal(JSON.parse(fs.readFileSync(path.join(b, '.brain/memories.json')))[0].content, 'only beta');
    assert.equal(payload(await c.tool('ini_brain_status')).workspaceTrusted, false, 'explicit calls never stick');
    assert(!fs.existsSync(path.join(home, '.ini-brain')), 'no global project registry writes');
  } finally { await c.shutdown(); }
  c = client({ roots: { listChanged: true } });
  try {
    await c.initialize(); c.send({ method: 'notifications/initialized' });
    const first = await c.roots();
    c.send({ id: 'unrelated-response', result: { roots: [{ uri: pathToFileURL(a).href }] } });
    const unresolved = await c.tool('ini_brain_save_memory', { content: 'unknown response must not bind a' });
    assert(unresolved.error, 'unknown response ID cannot supply roots');
    c.send({ id: first.id, result: { roots: [{ uri: pathToFileURL(a).href }, { uri: pathToFileURL(b).href }] } });
    assert((await c.tool('ini_brain_save_memory', { content: 'ambiguous' })).error, 'multiple roots require explicit workspace');
    assert(!(await c.tool('ini_brain_save_memory', { workspace: a, content: 'explicit wins multi roots' })).error);
    c.send({ method: 'notifications/roots/list_changed' }); const second = await c.roots();
    assert.notEqual(first.id, second.id);
    c.send({ id: second.id, result: { roots: [{ uri: pathToFileURL(b).href }] } });
    assert.equal(payload(await c.tool('ini_brain_status')).workspace, b);
    c.send({ method: 'notifications/roots/list_changed' }); const third = await c.roots();
    c.send({ id: second.id, result: { roots: [{ uri: pathToFileURL(a).href }] } });
    assert((await c.tool('ini_brain_save_memory', { content: 'stale roots must not bind' })).error);
    c.send({ id: third.id, result: { roots: [] } });
    assert.equal(payload(await c.tool('ini_brain_status')).workspaceTrusted, false);
    console.log('OK MCP isolation: no-roots, A/B, empty, invalid, response IDs, multi-roots, roots changes');
  } finally { await c.shutdown(); }
}
async function requestIdentityIsolation() {
  const projectA = path.join(fixture, 'request-a'); const projectB = path.join(fixture, 'request-b');
  for (const dir of [projectA, projectB]) { fs.mkdirSync(path.join(dir, '.git'), { recursive: true }); fs.writeFileSync(path.join(dir, 'README.md'), '# identity'); }
  const preload = path.join(fixture, 'refresh-barrier.cjs');
  fs.writeFileSync(preload, `const {AutoBackground}=require(${JSON.stringify(path.join(root, 'dist/core/autoBackground.js'))});
const original=AutoBackground.prototype.ensureFresh;
AutoBackground.prototype.ensureFresh=async function(...args){
  await new Promise(resolve=>{process.once('message', message=>{if(message.type==='release-refresh')resolve();});process.send({type:'refresh-entered'});});
  return original.apply(this,args);
};
`);
  const c = client({ roots: { listChanged: true } }, host, true, preload);
  const setRoots = async directories => { c.send({ method: 'notifications/roots/list_changed' }); const request = await c.roots(); c.send({ id: request.id, result: { roots: directories.map(dir => ({ uri: pathToFileURL(dir).href })) } }); };
  try {
    await c.initialize(); c.send({ method: 'notifications/initialized' }); const initial = await c.roots(); c.send({ id: initial.id, result: { roots: [{ uri: pathToFileURL(projectA).href }] } });
    assert.equal(payload(await c.tool('ini_brain_status')).workspace, projectA);
    const saving = c.tool('ini_brain_save_memory', { content: 'belongs to request A' });
    await c.refreshEntered(); await setRoots([projectB]);
    assert.equal(payload(await c.tool('ini_brain_status')).workspace, projectB);
    c.releaseRefresh();
    const saved = payload(await saving); assert.equal(saved.workspace, projectA, 'save keeps workspace resolved before awaited refresh');
    assert.equal(JSON.parse(fs.readFileSync(path.join(projectA, '.brain/memories.json')))[0].content, 'belongs to request A');
    assert(!fs.existsSync(path.join(projectB, '.brain/memories.json')), 'A memory never lands in B');
    fs.mkdirSync(path.join(projectB, '.brain'), { recursive: true });
    fs.writeFileSync(path.join(projectB, '.brain/metadata.json'), '{}');
    fs.writeFileSync(path.join(projectB, '.brain/compact_context.md'), 'CONTEXT_B_IDENTITY');
    const reading = c.tool('ini_brain_get_context', { task: 'identity' });
    await c.refreshEntered(); await setRoots([]);
    assert.equal(payload(await c.tool('ini_brain_status')).workspaceTrusted, false, 'empty roots remain diagnostic-untrusted');
    assert((await c.tool('ini_brain_auto_brief')).result.content[0].text.includes('WARNING'));
    c.releaseRefresh();
    const context = await reading; assert(!context.error, 'validated B read does not fall back or fail after roots become empty');
    assert(context.result.content[0].text.includes('CONTEXT_B_IDENTITY'), 'context read remains pinned to B');
    assert(!fs.existsSync(path.join(host, '.brain')), 'unresolved switch never mutates cwd');
  } finally { await c.shutdown(); }
  console.log('OK request identity across awaited refresh: save A->B and context B->empty');
}
async function backgroundIsolation() {
  const cwd = path.join(fixture, 'startup-project'); const project = path.join(fixture, 'advertised-project');
  for (const dir of [cwd, project]) { fs.mkdirSync(path.join(dir, '.git'), { recursive: true }); fs.writeFileSync(path.join(dir, 'README.md'), '# untouched'); }
  const c = client({ roots: { listChanged: true } }, cwd, true);
  try {
    await c.initialize(); c.send({ method: 'notifications/initialized' }); const first = await c.roots();
    c.send({ id: first.id, result: { roots: [{ uri: pathToFileURL(project).href }] } });
    assert.equal(payload(await c.tool('ini_brain_status')).workspace, project);
    // Wait beyond the background loop interval, so stale startup timers are visible.
    await new Promise(resolve => setTimeout(resolve, 5500));
    assert(!fs.existsSync(path.join(cwd, '.brain')), 'status/initialize never scan startup cwd');
    assert(!fs.existsSync(path.join(project, '.brain')), 'status never scans advertised project');
    c.send({ method: 'notifications/roots/list_changed' }); const second = await c.roots();
    c.send({ id: second.id, result: { roots: [{ uri: pathToFileURL(cwd).href }, { uri: pathToFileURL(project).href }] } });
    assert.equal(payload(await c.tool('ini_brain_status')).workspaceTrusted, false);
    assert(!fs.existsSync(path.join(cwd, '.brain')));
    c.send({ method: 'notifications/roots/list_changed' }); const third = await c.roots();
    c.send({ id: third.id, result: { roots: [{ uri: pathToFileURL(project).href }] } });
    assert(!(await c.tool('ini_brain_auto_brief', { workspace: project, task: 'explicit project refresh' })).error);
    assert(fs.existsSync(path.join(project, '.brain/metadata.json')), 'scoped auto_brief remains usable');
    const metadata = fs.readFileSync(path.join(project, '.brain/metadata.json'), 'utf8');
    fs.writeFileSync(path.join(project, 'README.md'), '# changed after switch');
    c.send({ method: 'notifications/roots/list_changed' }); const fourth = await c.roots();
    c.send({ id: fourth.id, result: { roots: [{ uri: pathToFileURL(cwd).href }] } });
    await c.tool('ini_brain_status');
    await new Promise(resolve => setTimeout(resolve, 5500));
    assert.equal(fs.readFileSync(path.join(project, '.brain/metadata.json'), 'utf8'), metadata, 'old root never has a stale refresh loop');
    assert(!fs.existsSync(path.join(cwd, '.brain')));
  } finally { await c.shutdown(); }
  console.log('OK background-enabled status/startup/root-switch isolation');
}
(async () => {
  try {
    const { AutoBackground } = require('../dist/core/autoBackground');
    const refreshRoot = path.join(fixture, 'awaited-refresh'); fs.mkdirSync(refreshRoot); fs.writeFileSync(path.join(refreshRoot, 'README.md'), '# refresh');
    const refresh = AutoBackground.for(refreshRoot);
    await Promise.all([1, 2].map(async () => { await refresh.ensureFresh(); assert(fs.existsSync(path.join(refreshRoot, '.brain/metadata.json')), 'every awaited refresh finishes before returning'); }));
    await requestIdentityIsolation(); await main(); await backgroundIsolation();
  }
  finally {
    const shutdowns = await Promise.allSettled(clients.map(c => c.shutdown()));
    const failed = shutdowns.find(result => result.status === 'rejected');
    if (failed) throw failed.reason;
    assert(clients.every(c => c.isClosed()), 'all children close before fixture cleanup');
    assert.equal(path.dirname(fixture), root); assert(path.basename(fixture).startsWith('.mcp-isolation-'));
    fs.rmSync(fixture, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
