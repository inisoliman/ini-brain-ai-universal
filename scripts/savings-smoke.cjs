const fs = require('fs');
const os = require('os');
const path = require('path');
const { deployPonytailLocal, removePonytailLocal } = require('../dist/savings/ponytail');
const { deployCavemanLocal, removeCavemanLocal } = require('../dist/savings/caveman');
const { deployClaudeLeanLocal } = require('../dist/savings/claudeLean');
const { compareTokenEstimates, measureText } = require('../dist/savings/tokenMeter');

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ini-savings-'));
  console.log('tmp:', tmp);

  const pony = await deployPonytailLocal({ root: tmp, mode: 'full' });
  if (!pony.length) throw new Error('no ponytail');
  console.log('ponytail:', pony.length);

  const cave = await deployCavemanLocal({ root: tmp, mode: 'full' });
  if (!cave.length) throw new Error('no caveman');
  console.log('caveman:', cave.length);

  const lean = await deployClaudeLeanLocal(tmp);
  if (!lean.length) throw new Error('no lean');
  console.log('lean:', lean.length);

  const stats = measureText('Hello world this is a test');
  if (stats.totalTokens <= 0) throw new Error('token count failed');
  console.log('tokens:', stats.totalTokens);

  const comparison = compareTokenEstimates('This is a deliberately verbose baseline response with repeated detail.', 'Short response.');
  if (comparison.estimatedTokensSaved <= 0 || comparison.estimatedReductionPercent <= 0) {
    throw new Error('token comparison failed');
  }
  const emptyComparison = compareTokenEstimates('', 'Short response.');
  if (emptyComparison.estimatedReductionPercent !== 0) throw new Error('empty baseline must not divide by zero');

  await removePonytailLocal(tmp);
  await removeCavemanLocal(tmp);
  console.log('OK savings smoke');
})().catch(e => { console.error(e); process.exit(1); });
