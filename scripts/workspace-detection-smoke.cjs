const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { fileUriToDirectory, findWorkspaceRoot, isApplicationDirectory, isTrustedWorkspace, isUserHome, resolveWorkspace } = require('../dist/mcp/workspace.js');

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

const fakeHome = path.join(tempRoot, 'home');
const nestedProject = path.join(fakeHome, 'work', 'project-b');
const nestedSrc = path.join(nestedProject, 'src');
fs.mkdirSync(path.join(fakeHome, '.brain'), { recursive: true });
fs.writeFileSync(path.join(fakeHome, 'AGENTS.md'), '# home\n', 'utf8');
fs.mkdirSync(path.join(nestedProject, '.git'), { recursive: true });
fs.mkdirSync(nestedSrc, { recursive: true });
fs.writeFileSync(path.join(nestedProject, 'package.json'), '{"name":"project-b"}\n', 'utf8');

const homeEnv = { USERPROFILE: fakeHome, HOME: fakeHome, HOMEDRIVE: undefined, HOMEPATH: undefined };
samePath(resolveWorkspace({ cwd: fakeHome, env: homeEnv }), fakeHome);
assert.strictEqual(isUserHome(fakeHome), false);
samePath(findWorkspaceRoot(nestedSrc), nestedProject);
samePath(resolveWorkspace({ cwd: nestedSrc, env: homeEnv }), nestedProject);
samePath(resolveWorkspace({ cwd: fakeHome, env: homeEnv, explicitWorkspace: nestedProject }), nestedProject);
samePath(resolveWorkspace({ cwd: fakeHome, env: homeEnv, clientWorkspace: nestedProject }), nestedProject);
samePath(resolveWorkspace({ cwd: plainDir, env: {}, explicitWorkspace: plainDir }), plainDir);

const uri = `file:///${nestedProject.replace(/\\/g, '/')}`;
samePath(fileUriToDirectory(uri), nestedProject);

// An installed desktop application must never be adopted as a workspace. This
// is the ZadLoop shape: the host launches one MCP process for the whole app,
// so the unresolvable workspace falls back to the install folder. That folder
// carries its own AGENTS.md, which previously made it look like a project.
const fakeAppData = path.join(tempRoot, 'AppData', 'Local', 'Programs');
const appDir = path.join(fakeAppData, 'SomeHost');
const appResources = path.join(appDir, 'resources', 'app.asar.unpacked');
fs.mkdirSync(appResources, { recursive: true });
fs.writeFileSync(path.join(appDir, 'AGENTS.md'), '# host agent guide\n', 'utf8');
fs.mkdirSync(path.join(appDir, '.brain'), { recursive: true });

assert.strictEqual(isApplicationDirectory(appDir), true);
assert.strictEqual(isApplicationDirectory(appResources), true);
assert.strictEqual(isTrustedWorkspace(appDir), false);
assert.strictEqual(isTrustedWorkspace(appResources), false);
samePath(resolveWorkspace({ cwd: appDir, env: {} }), appDir);
assert.strictEqual(isTrustedWorkspace(resolveWorkspace({ cwd: appDir, env: {} })), false);
assert.strictEqual(
  isTrustedWorkspace(resolveWorkspace({ cwd: appDir, env: { INI_BRAIN_WORKSPACE: appDir } })),
  false,
  'the host install folder must stay untrusted even when passed as INI_BRAIN_WORKSPACE'
);
// An explicit workspace argument still points at the real project.
samePath(resolveWorkspace({ cwd: appDir, env: {}, explicitWorkspace: nestedProject }), nestedProject);

// A real project that genuinely lives under an application tree keeps a VCS
// marker and therefore stays usable.
const projectUnderAppData = path.join(fakeAppData, 'MyProject');
fs.mkdirSync(path.join(projectUnderAppData, '.git'), { recursive: true });
assert.strictEqual(isApplicationDirectory(projectUnderAppData), false);
assert.strictEqual(isTrustedWorkspace(projectUnderAppData), true);

const resources = path.join(projectRoot, 'resources');
const appProjectSubdir = path.join(projectUnderAppData, 'resources', 'assets');
for (const dir of [resources, appProjectSubdir]) fs.mkdirSync(dir, { recursive: true });
assert.strictEqual(isApplicationDirectory(resources), false, 'ordinary resources is not an application');
assert.strictEqual(isTrustedWorkspace(resources), true);
assert.strictEqual(isApplicationDirectory(appProjectSubdir), false, 'ancestor VCS permits real app-tree project subdirectories');
assert.strictEqual(isTrustedWorkspace(appProjectSubdir), true);
samePath(resolveWorkspace({ explicitWorkspace: resources, env: {} }), resources);
samePath(resolveWorkspace({ clientWorkspace: nestedProject, env: { INI_BRAIN_WORKSPACE: projectRoot } }), projectRoot);
fs.writeFileSync(path.join(appDir, 'package.json'), '{}');
assert.strictEqual(isApplicationDirectory(appDir), true, 'host package.json is not VCS proof');
assert.strictEqual(isApplicationDirectory(appResources), true);
console.log('Workspace detection smoke test passed.');
