const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  applySmartSetup,
  createSmartSetupPlan,
  recommendedPackIds,
} = require('../dist/smartSetup/smartProjectSetup');

function workspace(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `ini-smart-${name}-`));
}

(async () => {
  const empty = workspace('empty');
  fs.writeFileSync(path.join(empty, 'project_request.md'), '# Project\nBuild a React dashboard with Codex and Claude agents.\n');
  fs.mkdirSync(path.join(empty, '.codex'), { recursive: true });
  fs.mkdirSync(path.join(empty, '.claude'), { recursive: true });
  const emptyPlan = await createSmartSetupPlan(empty);
  assert(emptyPlan.project.isNewProject, 'request-only workspace should be new');
  assert(emptyPlan.project.hasFrontend, 'React requirement should trigger frontend detection');
  assert(emptyPlan.project.requirementSignals.includes('عدة وكلاء'), 'agent requirement should be detected');
  assert(recommendedPackIds(emptyPlan).includes('frontend-quality'), 'frontend pack should be recommended');
  assert(recommendedPackIds(emptyPlan).includes('multi-agent'), 'multi-agent pack should be recommended');

  const frontend = workspace('frontend');
  fs.mkdirSync(path.join(frontend, 'src'), { recursive: true });
  fs.writeFileSync(path.join(frontend, 'package.json'), '{"name":"demo"}\n');
  fs.writeFileSync(path.join(frontend, 'src', 'App.tsx'), 'export function App(){ return <main>Hello</main>; }\n');
  const frontendPlan = await createSmartSetupPlan(frontend);
  assert(frontendPlan.project.hasFrontend, 'TSX file should trigger frontend detection');

  const result = await applySmartSetup(frontend, ['workflow-core', 'token-savings', 'memory-context']);
  assert.deepStrictEqual(result.appliedPacks, ['workflow-core', 'token-savings', 'memory-context']);
  assert(fs.existsSync(path.join(frontend, '.brain', 'smart-setup.json')), 'setup report missing');
  assert(fs.existsSync(path.join(frontend, '.brain', 'skills', 'product-discovery.md')), 'workflow skill missing');
  assert(fs.existsSync(path.join(frontend, '.brain', 'skills', 'caveman.md')), 'savings skill missing');
  assert(fs.existsSync(path.join(frontend, '.brain', 'skills', 'recall-project-context.md')), 'memory skill missing');
  assert(fs.existsSync(path.join(frontend, '.brain', 'upstream', 'spec-kit', 'README.md')), 'curated source missing');
  assert(!fs.existsSync(path.join(frontend, '.brain', 'upstream', 'spec-kit', '.git')), 'full repository must not be cloned');

  await assert.rejects(() => applySmartSetup(frontend, []), /at least one/i);
  await assert.rejects(() => applySmartSetup(frontend, ['unknown-pack']), /Unknown smart setup pack/i);
  console.log('OK smart setup smoke');
})().catch(error => {
  console.error(error);
  process.exit(1);
});

