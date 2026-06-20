const fs = require('fs');
const os = require('os');
const path = require('path');
const { readState, writeState } = require('../dist/updater/stateStore');

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ini-updater-'));
  await writeState(tmp, { ponytail: { lastSha: 'abc', lastCheck: '2026-01-01' } });
  const s = await readState(tmp);
  if (s.ponytail.lastSha !== 'abc') throw new Error('state mismatch');
  console.log('OK updater smoke');
})().catch(e => { console.error(e); process.exit(1); });
