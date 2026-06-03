const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { findWorkspaceRoot, resolveWorkspace } = require('../dist/mcp/workspace.js');

function samePath(actual, expected) {
  assert.strictEqual(path.resolve(actual).toLowerCase(), path.resolve(expected).toLowerCase());
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ini-brain-workspace-'));
const projectRoot = path.join(tempRoot, 'project-a');
const nestedDir = path.join(projectRoot, 'src', 'feature');
const plainDir = path.join(tempRoot, 'plain-folder');

fs.mkdirSync(path.join(projectRoot, '.git'), { recursive: true });
fs.mkdirSync(nestedDir, { recursive: true });
fs.mkdirSync(plainDir, { recursive: true });
fs.writeFileSync(path.join(projectRoot, 'package.json'), '{"name":"project-a"}\n', 'utf8');

samePath(findWorkspaceRoot(nestedDir), projectRoot);
samePath(resolveWorkspace({ cwd: nestedDir, env: {} }), projectRoot);
samePath(resolveWorkspace({ cwd: plainDir, env: {} }), plainDir);
samePath(resolveWorkspace({ cwd: plainDir, env: { INI_BRAIN_WORKSPACE: projectRoot } }), projectRoot);
samePath(resolveWorkspace({ cwd: plainDir, env: { CODEX_WORKSPACE: projectRoot } }), projectRoot);
samePath(resolveWorkspace({ cwd: plainDir, env: { CODEX_CWD: nestedDir } }), projectRoot);

console.log('Workspace detection smoke test passed.');
