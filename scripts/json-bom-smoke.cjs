const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseJsonText, readJsonFile, writeJsonFile } = require('../dist/core/jsonUtils');

(async () => {
  const withBom = '\uFEFF{\n  "mcpServers": {}\n}';
  assert.deepStrictEqual(parseJsonText(withBom), { mcpServers: {} });

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ini-json-'));
  const file = path.join(tmp, 'cline_mcp_settings.json');
  fs.writeFileSync(file, Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('{"mcpServers":{}}', 'utf8')]));
  assert.deepStrictEqual(await readJsonFile(file, {}), { mcpServers: {} });

  await writeJsonFile(file, { mcpServers: { 'ini-brain-ai': { command: 'node' } } });
  const written = fs.readFileSync(file);
  assert.notDeepStrictEqual([...written.slice(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.strictEqual(JSON.parse(written.toString('utf8')).mcpServers['ini-brain-ai'].command, 'node');

  console.log('OK json BOM smoke');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
