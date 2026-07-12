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
  });
}

if (failures.length) {
  console.error('Workflow smoke failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('OK workflow smoke');
