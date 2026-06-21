const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const server = path.join(root, 'dist', 'mcp', 'server.js');
const child = spawn(process.execPath, [server], {
  cwd: root,
  env: { ...process.env, INI_BRAIN_WORKSPACE: '' },
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

child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })}\n`);
child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })}\n`);
child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'ini_brain_status', arguments: {} } })}\n`);
child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'ini_brain_memory_stats', arguments: {} } })}\n`);
child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'ini_brain_memory_compact', arguments: {} } })}\n`);

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
  const status = parseResponse(stdout, 3);
  const statusText = status?.result?.content?.[0]?.text;
  const statusPayload = statusText ? JSON.parse(statusText) : null;
  if (!statusPayload?.workspace || path.resolve(statusPayload.workspace).toLowerCase() !== root.toLowerCase()) {
    console.error(stdout);
    console.error(stderr);
    console.error('MCP smoke test failed: active workspace was not resolved from process cwd.');
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
  console.log('MCP smoke test passed.');
  console.log(stdout);
  if (stderr) console.error(stderr);
}, 800);

function parseResponse(output, id) {
  for (const line of output.trim().split(/\r?\n/)) {
    if (!line.trim()) continue;
    const response = JSON.parse(line);
    if (response.id === id) return response;
  }
  return undefined;
}
