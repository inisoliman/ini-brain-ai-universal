const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const installer = fs.readFileSync(path.join(root, 'scripts', 'install-all.ps1'), 'utf8');
const activation = fs.readFileSync(path.join(root, 'src', 'extension.ts'), 'utf8');

if (!installer.includes('[switch]$InstallCodeIntel')) {
  throw new Error('advanced code intelligence must have an explicit opt-in switch');
}
if (!installer.includes('if ($InstallCodeIntel -and -not $SkipCodeIntel)')) {
  throw new Error('advanced code intelligence installation is not guarded by opt-in');
}
if (/git\s+clone/i.test(activation) || /npm\s+install/i.test(activation)) {
  throw new Error('extension activation must not clone repositories or install packages');
}
console.log('OK install behavior smoke');

