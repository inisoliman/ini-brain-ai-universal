const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const workflowsDir = path.join(root, '.github', 'workflows');
const failures = [];

for (const fileName of fs.readdirSync(workflowsDir).filter(name => name.endsWith('.yml') || name.endsWith('.yaml'))) {
  const relative = `.github/workflows/${fileName}`;
  const lines = fs.readFileSync(path.join(workflowsDir, fileName), 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    const match = line.match(/^(\s+[A-Za-z0-9_-]+:\s+)([^'"[{|>][^#]*:\s+[^#]*)$/);
    if (match) failures.push(`${relative}:${index + 1}: quote scalar values that contain ':'`);
    if (/node-version:\s*20\b/.test(line)) {
      failures.push(`${relative}:${index + 1}: use node-version 24 to avoid GitHub Actions Node 20 deprecation warnings`);
    }
    const node24Action = line.match(/uses:\s+actions\/(checkout|setup-node)@v4\b/);
    if (node24Action) {
      failures.push(`${relative}:${index + 1}: use actions/${node24Action[1]}@v5 to avoid GitHub Actions Node 20 deprecation warnings`);
    }
    if (/uses:\s+actions\/upload-artifact@v[1-5]\b/.test(line)) {
      failures.push(`${relative}:${index + 1}: use actions/upload-artifact@v6 to avoid GitHub Actions Node 20 deprecation warnings`);
    }
    if (/uses:\s+peter-evans\/create-pull-request@v[1-7]\b/.test(line)) {
      failures.push(`${relative}:${index + 1}: use peter-evans/create-pull-request@v8 to avoid GitHub Actions Node 20 deprecation warnings`);
    }
  });
}

if (failures.length) {
  console.error('Workflow smoke failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('OK workflow smoke');
