const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'resources', 'upstreams', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const failures = [];

if (manifest.schema !== 'ini-brain.upstream-vault.v2') {
  failures.push('Unexpected upstream vault schema.');
}

for (const source of manifest.sources || []) {
  if (!source.repository || !source.branch || !source.pinnedCommit || !source.license) {
    failures.push(`Incomplete source metadata: ${source.id || 'unknown'}`);
  }
  if (source.snapshotPolicy === 'curated' && !(source.files || []).length) {
    failures.push(`Curated source has no snapshot files: ${source.id}`);
  }
  for (const file of source.files || []) {
    const absolute = path.join(root, source.snapshotRoot, file.path);
    if (!fs.existsSync(absolute)) {
      failures.push(`Missing snapshot: ${source.id}/${file.path}`);
      continue;
    }
    const hash = crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
    if (hash !== file.sha256) {
      failures.push(`Checksum mismatch: ${source.id}/${file.path}`);
    }
  }
}

const registry = fs.readFileSync(path.join(root, 'src', 'updater', 'upstreamSources.ts'), 'utf8');
const runtimeIds = [...registry.matchAll(/source\('([^']+)'/g)].map(match => match[1]);
const manifestIds = new Set((manifest.sources || []).map(source => source.id));
for (const id of runtimeIds) {
  if (!manifestIds.has(id)) failures.push(`Runtime source is missing from vault manifest: ${id}`);
}

if (failures.length) {
  console.error('Upstream vault smoke failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('OK upstream vault smoke');
