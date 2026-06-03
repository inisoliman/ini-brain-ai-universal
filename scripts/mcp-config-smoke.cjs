const assert = require('assert');
const path = require('path');

const { buildMcpConfigJson } = require('../dist/integrations/mcpConfig.js');

const serverScript = path.resolve('dist/mcp/server.js');
const config = JSON.parse(buildMcpConfigJson(process.cwd(), serverScript));
const server = config.mcpServers['ini-brain-ai'];

assert.strictEqual(server.command, 'node');
assert.deepStrictEqual(server.args, [serverScript]);
assert.strictEqual(server.env, undefined);
assert.strictEqual(JSON.stringify(config).includes('INI_BRAIN_WORKSPACE'), false);

console.log('MCP config smoke test passed.');
