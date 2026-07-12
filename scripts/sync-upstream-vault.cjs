const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'resources', 'upstreams', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const rawSources = new Map([
  ['codebase-memory-mcp', 'https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main'],
  ['delegate-skills', 'https://raw.githubusercontent.com/amElnagdy/delegate-skills/main']
]);

(async () => {
  for (const source of manifest.sources || []) {
    const rawBase = rawSources.get(source.id);
    if (!rawBase) continue;
    for (const file of source.files || []) {
      const content = await fetchText(`${rawBase}/${file.path}`);
      const target = path.join(root, source.snapshotRoot, file.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content, 'utf8');
      file.sha256 = crypto.createHash('sha256').update(content).digest('hex');
    }
  }
  manifest.updatedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log('Upstream vault snapshots refreshed.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'ini-brain-ai-upstream-vault' } }, response => {
      if (response.statusCode >= 400) {
        reject(new Error(`HTTP ${response.statusCode} ${url}`));
        return;
      }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => body += chunk);
      response.on('end', () => resolve(body));
    }).on('error', reject);
  });
}
