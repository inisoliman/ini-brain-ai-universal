const fs = require('fs');
const os = require('os');
const path = require('path');
const { codeIntelligenceStatus, selectCodeIntelligenceProvider } = require('../dist/codeIntelligence/providerRegistry');

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ini-code-intel-'));
  fs.writeFileSync(path.join(tmp, 'a.ts'), "import { b } from './b';\nexport function a(){ return b(); }\n", 'utf8');
  fs.writeFileSync(path.join(tmp, 'b.ts'), "export function b(){ return 1; }\n", 'utf8');

  const status = await codeIntelligenceStatus(tmp);
  if (!status.selected?.provider) throw new Error('missing selected provider');

  const provider = await selectCodeIntelligenceProvider(tmp);
  const index = await provider.index(tmp);
  if (!index.indexed) throw new Error('index did not complete');

  const search = await provider.search(tmp, 'function b', 5);
  if (!Array.isArray(search.results)) throw new Error('search did not return results array');

  const changes = await provider.changes(tmp, ['b.ts']);
  if (!changes.changedFiles.includes('b.ts')) throw new Error('changes did not echo changed file');

  console.log(`OK code intelligence smoke (${provider.id})`);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
