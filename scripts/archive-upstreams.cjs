const { spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'upstream-archives');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'resources', 'upstreams', 'manifest.json'), 'utf8'));
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ini-brain-upstream-'));
const report = { generatedAt: new Date().toISOString(), sources: [] };
let archivedCount = 0;
let failedCount = 0;

try {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const source of manifest.sources || []) {
    if (!source.archive) continue;
    archiveSource(source);
  }
  fs.writeFileSync(path.join(outputDir, 'archive-manifest.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  if (!archivedCount) throw new Error('No upstream repositories were archived.');
  if (failedCount) throw new Error(`${failedCount} upstream repository archive(s) failed.`);
  console.log(`Archived ${archivedCount} upstream repository(s).`);
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}

function archiveSource(source) {
  const mirrorPath = path.join(temporaryRoot, `${source.id}.git`);
  const bundlePath = path.join(outputDir, `${source.id}.bundle`);
  const clone = run('git', ['clone', '--mirror', `https://github.com/${source.repository}.git`, mirrorPath]);
  if (!clone.ok) {
    report.sources.push({ id: source.id, repository: source.repository, archived: false, error: clone.error });
    failedCount += 1;
    console.warn(`Warning: keeping the previous release asset for ${source.id}: ${clone.error}`);
    return;
  }

  const bundle = run('git', ['-C', mirrorPath, 'bundle', 'create', bundlePath, '--all']);
  if (!bundle.ok) {
    report.sources.push({ id: source.id, repository: source.repository, archived: false, error: bundle.error });
    failedCount += 1;
    console.warn(`Warning: could not archive ${source.id}: ${bundle.error}`);
    return;
  }

  const head = run('git', ['-C', mirrorPath, 'rev-parse', `refs/heads/${source.branch}`]);
  const bytes = fs.readFileSync(bundlePath);
  report.sources.push({
    id: source.id,
    repository: source.repository,
    branch: source.branch,
    commit: head.ok ? head.output.trim() : source.pinnedCommit,
    archived: true,
    file: path.basename(bundlePath),
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    bytes: bytes.length
  });
  archivedCount += 1;
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', windowsHide: true });
  if (result.status === 0) return { ok: true, output: result.stdout || '' };
  return { ok: false, error: (result.stderr || result.error?.message || `${command} exited with ${result.status}`).trim() };
}
