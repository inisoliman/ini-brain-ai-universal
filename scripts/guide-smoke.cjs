const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const guide = path.join(root, 'docs', 'guide');
const pages = fs.readdirSync(guide).filter(file => file.endsWith('.html'));
const failures = [];

if (pages.length < 6) failures.push(`Expected at least 6 guide pages, found ${pages.length}`);

for (const page of pages) {
  const absolute = path.join(guide, page);
  const html = fs.readFileSync(absolute, 'utf8');
  if (!/<html[^>]+lang="ar"[^>]+dir="rtl"/i.test(html)) failures.push(`${page}: missing Arabic RTL root`);
  if (!/<meta[^>]+name="viewport"/i.test(html)) failures.push(`${page}: missing viewport`);
  if (!/<title>[^<]+<\/title>/i.test(html)) failures.push(`${page}: missing title`);
  for (const image of html.matchAll(/<img\s+([^>]+)>/gi)) {
    if (!/\balt="[^"]+"/i.test(image[1])) failures.push(`${page}: image missing useful alt`);
  }
  for (const reference of html.matchAll(/(?:href|src)="([^"]+)"/gi)) {
    const target = reference[1];
    if (/^(?:https?:|#|mailto:|data:)/i.test(target)) continue;
    const clean = target.split('#')[0].split('?')[0];
    if (!clean) continue;
    if (!fs.existsSync(path.resolve(path.dirname(absolute), clean))) failures.push(`${page}: broken local reference ${target}`);
  }
}

const extension = fs.readFileSync(path.join(root, 'src', 'extension.ts'), 'utf8');
if (!extension.includes("'docs', 'guide', 'index.html'")) failures.push('Visual Guide command does not target packaged guide');

if (failures.length) {
  console.error('Guide smoke failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`OK guide smoke (${pages.length} pages)`);

