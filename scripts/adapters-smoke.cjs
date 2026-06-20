const fs = require('fs');
const os = require('os');
const path = require('path');
const { deployToAllAgents, detectInstalledAdapters, ALL_ADAPTERS } = require('../dist/adapters/registry');

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ini-adapters-'));
  console.log('tmp:', tmp);

  fs.mkdirSync(path.join(tmp, '.cursor'));
  fs.mkdirSync(path.join(tmp, '.clinerules'));

  const detected = await detectInstalledAdapters(tmp);
  console.log('detected:', detected.map(d => d.id).join(', '));

  const results = await deployToAllAgents({
    root: tmp, skillName: 'test-skill', skillBody: '# Test\n', onlyInstalled: false,
  });
  if (results.length !== ALL_ADAPTERS.length) throw new Error('not all ran');
  console.log('deployed to', results.length, 'adapters');
  console.log('OK adapters smoke');
})().catch(e => { console.error(e); process.exit(1); });
