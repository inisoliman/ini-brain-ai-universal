const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'src', 'mcp', 'server.ts'), 'utf8');
const required = [
  'Call ini_brain_status first',
  'Call ini_brain_auto_brief once',
  'call ini_brain_get_context',
  'call ini_brain_smart_setup_plan and show the proposed plan',
  'Never call ini_brain_smart_setup_apply until the user explicitly approves',
  'Do not ask the user to paste a startup prompt manually',
];
for (const phrase of required) {
  if (!server.includes(phrase)) throw new Error(`missing automatic MCP instruction: ${phrase}`);
}
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
if (readme.includes('## Ready-To-Use Agent Prompts')) {
  throw new Error('README must not ask users to paste manual startup prompts');
}
if (/Start a coding task:[\s\S]*ini_brain_auto_brief/.test(readme)) {
  throw new Error('README still contains a manual ini_brain_auto_brief startup prompt');
}
console.log('OK MCP automatic instructions smoke');
