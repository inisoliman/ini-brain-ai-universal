const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const server = path.join(root, 'dist', 'mcp', 'server.js');
const child = spawn(process.execPath, [server], {
  cwd: root,
  env: {
    ...process.env,
    INI_BRAIN_WORKSPACE: root
  },
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

setTimeout(() => {
  child.kill();
  if (!stdout.includes('ini_brain_get_context')) {
    console.error(stdout);
    console.error(stderr);
    console.error('MCP smoke test failed: ini_brain_get_context was not listed.');
    process.exit(1);
  }
  console.log('MCP smoke test passed.');
  console.log(stdout);
  if (stderr) console.error(stderr);
}, 800);
