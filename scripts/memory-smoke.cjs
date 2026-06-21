const fs = require('fs');
const os = require('os');
const path = require('path');
const { MemoryStore } = require('../dist/core/memoryStore');
const { compactMemories, getMemoryStats } = require('../dist/core/memoryCompactor');

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ini-memory-'));
  const brainDir = path.join(tmp, '.brain');
  const memoryFile = path.join(brainDir, 'memories.json');
  fs.mkdirSync(brainDir, { recursive: true });

  fs.writeFileSync(memoryFile, JSON.stringify([
    {
      id: 'legacy-one',
      kind: 'decision',
      content: 'Use local JSON memory for project context.',
      files: ['src/core/memoryStore.ts'],
      concepts: ['memory'],
      importance: 8,
      source: 'manual',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      accessCount: 0
    },
    {
      id: 'duplicate-old',
      kind: 'decision',
      content: 'Prefer local JSON memory for project context',
      files: [],
      concepts: ['memory'],
      importance: 6,
      source: 'agent',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      accessCount: 0
    },
    {
      id: 'expired-one',
      kind: 'note',
      content: 'Temporary note that should expire',
      files: [],
      concepts: ['temp'],
      importance: 3,
      source: 'agent',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      accessCount: 0,
      expiresAt: '2026-01-02T00:00:00.000Z'
    },
    {
      id: 'pinned-expired',
      kind: 'note',
      content: 'Pinned note stays even after expiry',
      files: [],
      concepts: ['temp'],
      importance: 4,
      source: 'agent',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      accessCount: 0,
      pinned: true,
      expiresAt: '2026-01-02T00:00:00.000Z'
    }
  ], null, 2));

  const store = new MemoryStore(tmp);
  const legacy = (await store.list(10)).find(entry => entry.id === 'legacy-one');
  if (!legacy) throw new Error('legacy memory was not readable');
  if (legacy.confidence !== 1 || legacy.pinned !== false || legacy.origin !== 'legacy') {
    throw new Error('legacy memory metadata defaults were not applied');
  }

  const saved = await store.save({
    content: 'Pinned public release rule',
    kind: 'workflow',
    concepts: ['release'],
    confidence: 0.9,
    pinned: true,
    origin: 'memory-smoke'
  });
  if (saved.confidence !== 0.9 || !saved.pinned || saved.origin !== 'memory-smoke') {
    throw new Error('new memory metadata was not saved');
  }

  const dryRun = await compactMemories(tmp, { dryRun: true, now: '2026-06-21T00:00:00.000Z' });
  if (dryRun.changed) throw new Error('dry-run compaction wrote changes');
  if (dryRun.expiredRemoved !== 1 || dryRun.duplicatesMerged !== 1) {
    throw new Error(`unexpected dry-run compaction summary: ${JSON.stringify(dryRun)}`);
  }

  const compacted = await compactMemories(tmp, { dryRun: false, now: '2026-06-21T00:00:00.000Z' });
  if (!compacted.changed || compacted.expiredRemoved !== 1 || compacted.duplicatesMerged !== 1) {
    throw new Error(`unexpected compaction summary: ${JSON.stringify(compacted)}`);
  }

  const ids = new Set((await store.list(20)).map(entry => entry.id));
  if (ids.has('expired-one')) throw new Error('expired unpinned memory was kept');
  if (!ids.has('pinned-expired')) throw new Error('pinned expired memory was removed');
  if (ids.has('duplicate-old')) throw new Error('duplicate memory was not merged');

  const stats = await getMemoryStats(tmp, '2026-06-21T00:00:00.000Z');
  if (stats.totalMemories !== 3 || stats.pinnedMemories !== 2 || stats.expiredMemories !== 1) {
    throw new Error(`unexpected memory stats: ${JSON.stringify(stats)}`);
  }

  console.log('OK memory smoke');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
