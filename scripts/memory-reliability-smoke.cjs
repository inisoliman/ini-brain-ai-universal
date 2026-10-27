// Catches corrupt-store erasure, lost concurrent inserts/counters and unsafe lock eviction.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { MemoryStore } = require('../dist/core/memoryStore');
const { compactMemories } = require('../dist/core/memoryCompactor');

async function worker(root, index) {
  const store = new MemoryStore(root);
  for (let n = 0; n < 12; n++) {
    await store.save({ content: `unique worker ${index} record ${n}`, pinned: true, origin: `worker-${index}` });
    await store.search('unique', 50);
    await store.save({ content: `expired worker ${index} record ${n}`, expiresAt: '2000-01-01T00:00:00.000Z' });
    await compactMemories(root, { dryRun: false });
  }
}

async function main() {
  const root = fs.mkdtempSync(path.join(path.resolve(__dirname, '..'), '.memory-reliability-'));
  const file = path.join(root, '.brain', 'memories.json');
  fs.mkdirSync(path.dirname(file));
  try {
    const store = new MemoryStore(root);
    for (const bytes of (process.argv.includes('--concurrency-only') ? [] : ['{broken', '{"not":"an array"}', '[null]', '[{"content":42}]'])) {
      fs.writeFileSync(file, bytes);
      for (const action of [() => store.save({ content: 'must not erase' }), () => store.search('query'), () => compactMemories(root, { dryRun: false }), () => store.replaceAll([])]) {
        await assert.rejects(action, /memory|JSON|Unexpected|Expected/i, 'corrupt memory must fail closed');
        assert.equal(fs.readFileSync(file, 'utf8'), bytes, 'corrupt bytes retained');
      }
    }
    fs.writeFileSync(file, '[]');
    await Promise.all(Array.from({ length: 24 }, (_, n) => new MemoryStore(root).save({ content: `same process ${n}`, pinned: true })));
    assert.equal((await store.listAll()).length, 24, 'same-process inserts retained');
    fs.writeFileSync(file, '[]');
    const children = Array.from({ length: 4 }, (_, n) => new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [__filename, '--worker', root, String(n)], { stdio: 'inherit' });
      child.once('error', reject);
      child.once('exit', code => code === 0 ? resolve() : reject(new Error(`worker exit ${code}`)));
    }));
    const outcomes = await Promise.allSettled(children);
    const failure = outcomes.find(outcome => outcome.status === 'rejected');
    if (failure) throw failure.reason;
    const entries = await store.listAll();
    assert.equal(entries.length, 48, 'cross-process inserts survive search/compaction');
    assert.equal(new Set(entries.map(e => e.id)).size, 48);
    assert(entries.every(e => e.pinned && e.origin.startsWith('worker-')));
    const before = entries.reduce((sum, e) => sum + e.accessCount, 0);
    await Promise.all(Array.from({ length: 16 }, () => new MemoryStore(root).search('unique', 50)));
    assert.equal((await store.listAll()).reduce((sum, e) => sum + e.accessCount, 0) - before, 16 * 48, 'access increments are not lost');
    const lock = `${file}.lock`;
    fs.writeFileSync(lock, 'live lock');
    const old = new Date('2000-01-01'); fs.utimesSync(lock, old, old);
    const started = Date.now();
    await assert.rejects(() => store.save({ content: 'blocked' }), /lock|busy|contention/i);
    assert(Date.now() - started < 15000, 'contention is bounded');
    assert.equal(fs.readFileSync(lock, 'utf8'), 'live lock', 'old live locks must not be evicted');
    fs.unlinkSync(lock);
    await store.save({ content: 'lock released' });
    assert(!fs.existsSync(lock));
    // An IO failure must not be treated as an empty store and must release the lock.
    fs.unlinkSync(file); fs.mkdirSync(file);
    await assert.rejects(() => store.save({ content: 'IO failure' }));
    assert(!fs.existsSync(lock));
    fs.rmdirSync(file);
    await store.save({ content: 'ENOENT initializes empty' });
    assert.equal((await store.listAll()).length, 1);
    console.log('OK memory reliability: corrupt bytes, processes, counters, compaction, locks and IO');
  } finally {
    // root is the verified unique test fixture created above, never user data.
    fs.rmSync(root, { recursive: true, force: true });
  }
}
(process.argv[2] === '--worker' ? worker(process.argv[3], process.argv[4]) : main()).catch(error => { console.error(error); process.exitCode = 1; });
