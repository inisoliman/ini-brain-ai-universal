const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function walk(relativeDir, files = []) {
  for (const entry of fs.readdirSync(path.join(root, relativeDir), { withFileTypes: true })) {
    const relativePath = path.join(relativeDir, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      walk(relativePath, files);
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

function fail(message) {
  failures.push(message);
}

function auditCommands() {
  const pkg = JSON.parse(read('package.json'));
  const extensionSource = read('src/extension.ts');
  const contributedCommands = new Set((pkg.contributes.commands || []).map(command => command.command));
  const registeredCommands = [...extensionSource.matchAll(/registerCommand\('([^']+)'/g)].map(match => match[1]);

  for (const command of registeredCommands.filter(command => command.startsWith('iniBrain.'))) {
    if (!contributedCommands.has(command)) fail(`Command registered but not contributed: ${command}`);
  }
  for (const command of contributedCommands) {
    if (command.startsWith('iniBrain.') && !registeredCommands.includes(command)) {
      fail(`Command contributed but not registered: ${command}`);
    }
  }
}

function auditPublicDocs() {
  const docs = [
    'README.md',
    'AGENTS.md',
    ...walk('docs').filter(file => !file.startsWith('docs/plans/'))
  ];
  const stalePatterns = [
    [/Version:\s*2\./, 'old Version header'],
    [/الإصدار:\s*2\./, 'old Arabic version header'],
    [/ini-brain-ai-universal-2\./, 'old VSIX filename'],
    [/C:\\Users\\helen/i, 'personal Windows path'],
    [/â|ð|Ù|Ø/, 'mojibake encoding marker']
  ];

  for (const doc of docs) {
    const body = read(doc);
    for (const [pattern, label] of stalePatterns) {
      if (pattern.test(body)) fail(`${doc}: ${label}`);
    }
  }

  // VSIX filenames referenced in docs must match the current package version,
  // regardless of which file type (md/html) mentions them.
  const currentVersion = JSON.parse(read('package.json')).version;
  for (const doc of docs) {
    const body = read(doc);
    for (const match of body.matchAll(/ini-brain-ai-universal-(\d+\.\d+\.\d+)\.vsix/g)) {
      if (match[1] !== currentVersion) fail(`${doc}: stale VSIX version ${match[1]} (current ${currentVersion})`);
    }
  }
}

function auditPackageIgnores() {
  const vscodeignore = read('.vscodeignore');
  for (const required of ['src/**', '.brain/**', '.codex/**', 'docs/plans/**', 'scripts/**', 'upstream-archives/**']) {
    if (!vscodeignore.includes(required)) fail(`.vscodeignore missing ${required}`);
  }
}

auditCommands();
auditPublicDocs();
auditPackageIgnores();

if (failures.length) {
  console.error('Public release audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Public release audit passed.');
