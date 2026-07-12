const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'resources', 'upstreams', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const failures = [];

if (manifest.schema !== 'ini-brain.upstream-vault.v1') {
  failures.push('Unexpected upstream vault schema.');
}

for (const source of manifest.sources || []) {
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

if (failures.length) {
  console.error('Upstream vault smoke failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('OK upstream vault smoke');
