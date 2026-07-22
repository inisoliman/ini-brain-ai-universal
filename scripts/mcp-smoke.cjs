const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const server = path.join(root, 'dist', 'mcp', 'server.js');
const child = spawn(process.execPath, [server], {
  cwd: root,
  env: { ...process.env, INI_BRAIN_WORKSPACE: '', INI_BRAIN_DISABLE_AUTO_BACKGROUND: '1' },
  stdio: ['pipe', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';

child.stdout.on('data', chunk => {
  stdout += chunk.toString('utf8');
});

child.stderr.on('data', chunk => {
  stderr += chunk.toString('utf8');
});

child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'smoke-test-client', version: '9.9' } } })}\n`);
child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })}\n`);
child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'ini_brain_status', arguments: {} } })}\n`);
child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'ini_brain_memory_stats', arguments: {} } })}\n`);
child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'ini_brain_memory_compact', arguments: {} } })}\n`);
child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'ini_brain_code_status', arguments: {} } })}\n`);
child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'ini_brain_status', arguments: { workspace: path.join(root, 'src') } } })}\n`);

setTimeout(() => {
  child.kill();
  if (!stdout.includes('ini_brain_get_context')) {
    console.error(stdout);
    console.error(stderr);
    console.error('MCP smoke test failed: ini_brain_get_context was not listed.');
    process.exit(1);
  }
  const tools = parseResponse(stdout, 2)?.result?.tools || [];
  const statusTool = tools.find(tool => tool.name === 'ini_brain_status');
  const generateTool = tools.find(tool => tool.name === 'ini_brain_generate_agent_guide');
  const memoryStatsTool = tools.find(tool => tool.name === 'ini_brain_memory_stats');
  const memoryCompactTool = tools.find(tool => tool.name === 'ini_brain_memory_compact');
  const codeStatusTool = tools.find(tool => tool.name === 'ini_brain_code_status');
  const codeIndexTool = tools.find(tool => tool.name === 'ini_brain_code_index');
  if (statusTool?.annotations?.readOnlyHint !== true || statusTool?.annotations?.destructiveHint !== false) {
    console.error(stdout);
    console.error(stderr);
    console.error('MCP smoke test failed: read-only tool annotations are missing.');
    process.exit(1);
  }
  if (generateTool?.annotations?.readOnlyHint !== false || generateTool?.annotations?.destructiveHint !== false) {
    console.error(stdout);
    console.error(stderr);
    console.error('MCP smoke test failed: local-write tool annotations are missing.');
    process.exit(1);
  }
  if (memoryStatsTool?.annotations?.readOnlyHint !== true) {
    console.error(stdout);
    console.error(stderr);
    console.error('MCP smoke test failed: memory stats tool is not read-only.');
    process.exit(1);
  }
  if (memoryCompactTool?.annotations?.readOnlyHint !== false || memoryCompactTool?.annotations?.destructiveHint !== false) {
    console.error(stdout);
    console.error(stderr);
    console.error('MCP smoke test failed: memory compact tool annotations are missing.');
    process.exit(1);
  }
  if (codeStatusTool?.annotations?.readOnlyHint !== true) {
    console.error(stdout);
    console.error(stderr);
    console.error('MCP smoke test failed: code status tool is not read-only.');
    process.exit(1);
  }
  if (codeIndexTool?.annotations?.readOnlyHint !== false || codeIndexTool?.annotations?.destructiveHint !== false) {
    console.error(stdout);
    console.error(stderr);
    console.error('MCP smoke test failed: code index tool annotations are missing.');
    process.exit(1);
  }
  const status = parseResponse(stdout, 3);
  const statusText = status?.result?.content?.[0]?.text;
  const statusPayload = statusText ? JSON.parse(statusText) : null;
  if (!statusPayload?.workspace || path.resolve(statusPayload.workspace).toLowerCase() !== root.toLowerCase()) {
    console.error(stdout);
    console.error(stderr);
    console.error('MCP smoke test failed: active workspace was not resolved from process cwd.');
    process.exit(1);
  }
  if (statusPayload?.workspaceTrusted !== true) {
    console.error(stdout);
    console.error(stderr);
    console.error('MCP smoke test failed: repository workspace must be trusted.');
    process.exit(1);
  }
  if (statusPayload?.client?.name !== 'smoke-test-client' || statusPayload?.client?.source !== 'initialize') {
    console.error(stdout);
    console.error(stderr);
    console.error('MCP smoke test failed: MCP client was not auto-detected from initialize clientInfo.');
    process.exit(1);
  }
  const statsText = parseResponse(stdout, 4)?.result?.content?.[0]?.text;
  const statsPayload = statsText ? JSON.parse(statsText) : null;
  if (typeof statsPayload?.stats?.totalMemories !== 'number') {
    console.error(stdout);
    console.error(stderr);
    console.error('MCP smoke test failed: memory stats did not return totals.');
    process.exit(1);
  }
  const compactText = parseResponse(stdout, 5)?.result?.content?.[0]?.text;
  const compactPayload = compactText ? JSON.parse(compactText) : null;
  if (compactPayload?.applied !== false || compactPayload?.preview?.dryRun !== true) {
    console.error(stdout);
    console.error(stderr);
    console.error('MCP smoke test failed: memory compact did not default to dry-run preview.');
    process.exit(1);
  }
  const codeText = parseResponse(stdout, 6)?.result?.content?.[0]?.text;
  const codePayload = codeText ? JSON.parse(codeText) : null;
  if (!codePayload?.selected?.provider || !Array.isArray(codePayload?.providers)) {
    console.error(stdout);
    console.error(stderr);
    console.error('MCP smoke test failed: code intelligence status did not return provider data.');
    process.exit(1);
  }
  const subdirText = parseResponse(stdout, 7)?.result?.content?.[0]?.text;
  const subdirPayload = subdirText ? JSON.parse(subdirText) : null;
  if (subdirPayload?.workspaceTrusted !== true) {
    console.error(stdout);
    console.error(stderr);
    console.error('MCP smoke test failed: an explicit workspace inside the project (subdirectory) must be trusted via ancestor markers.');
    process.exit(1);
  }
  console.log('MCP smoke test passed.');
  console.log(stdout);
  if (stderr) console.error(stderr);
  runUntrustedWorkspaceCheck();
}, 800);

// Phase 2: a client that launches the server outside any project (foreign cwd)
// must not trigger background scans there; status must flag it as untrusted.
function runUntrustedWorkspaceCheck() {
  const os = require('os');
  const fs = require('fs');
  const foreign = fs.mkdtempSync(path.join(os.tmpdir(), 'ini-foreign-cwd-'));
  const second = spawn(process.execPath, [server], {
    cwd: foreign,
    env: { ...process.env, INI_BRAIN_WORKSPACE: '', PWD: '', INIT_CWD: '', WORKSPACE: '' },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  let out = '';
  let err = '';
  second.stdout.on('data', chunk => { out += chunk.toString('utf8'); });
  second.stderr.on('data', chunk => { err += chunk.toString('utf8'); });
  second.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })}\n`);
  second.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'ini_brain_status', arguments: { workspace: foreign } } })}\n`);
  second.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'ini_brain_auto_brief', arguments: { task: 'check', workspace: foreign } } })}\n`);
  setTimeout(() => {
    second.kill();
    const statusText = parseResponse(out, 2)?.result?.content?.[0]?.text;
    const payload = statusText ? JSON.parse(statusText) : null;
    if (payload?.workspaceTrusted !== false || typeof payload?.hint !== 'string') {
      console.error(out);
      console.error(err);
      console.error('MCP smoke test failed: foreign cwd must be reported as untrusted with a hint.');
      process.exit(1);
    }
    const briefText = parseResponse(out, 3)?.result?.content?.[0]?.text || '';
    if (!briefText.includes('WARNING')) {
      console.error(out);
      console.error(err);
      console.error('MCP smoke test failed: auto_brief must warn when the workspace is untrusted.');
      process.exit(1);
    }
    if (fs.existsSync(path.join(foreign, '.brain'))) {
      console.error('MCP smoke test failed: background scan must not create .brain in a foreign directory.');
      process.exit(1);
    }
    console.log('MCP untrusted-workspace check passed.');
  }, 1500);
}

function parseResponse(output, id) {
  for (const line of output.trim().split(/\r?\n/)) {
    if (!line.trim()) continue;
    const response = JSON.parse(line);
    if (response.id === id) return response;
  }
  return undefined;
}
