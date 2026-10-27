import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface WorkspaceResolutionOptions {
  cwd?: string;
  env?: Record<string, string | undefined>;
  explicitWorkspace?: string;
  clientWorkspace?: string;
}

const WORKSPACE_ENV_KEYS = [
  'INI_BRAIN_WORKSPACE',
  'CODEX_WORKSPACE',
  'CODEX_CWD',
  'WORKSPACE',
  'INIT_CWD',
  'PWD'
] as const;

const HOME_ONLY_MARKERS = ['.brain', 'AGENTS.md'] as const;

const PROJECT_MARKERS = [
  '.git',
  'package.json',
  'pyproject.toml',
  'Cargo.toml',
  'go.mod',
  'composer.json',
  'pom.xml',
  '.project'
] as const;

const WORKSPACE_MARKERS = [...HOME_ONLY_MARKERS, ...PROJECT_MARKERS] as const;

/**
 * Application install roots whose `.brain` must never be adopted as a
 * workspace. A desktop host (ZadLoop, VS Code, Electron apps) launches one MCP
 * process for the whole application, so `process.cwd()` is the app folder. If
 * that folder happens to carry `AGENTS.md` — hosts that ship such a file — the
 * server would treat the installed program as the project and write project
 * memory inside it. These segments identify such installs structurally rather
 * than by name, so a renamed or relocated app is still refused.
 */
const APPLICATION_SEGMENTS = ['app.asar', 'app.asar.unpacked'] as const;
const APPLICATION_PARENTS = [
  ['appdata', 'local', 'programs'],
  ['appdata', 'roaming'],
  ['program files'],
  ['program files (x86)'],
  ['applications'],
  ['library', 'application support']
] as const;

export function resolveWorkspace(options: WorkspaceResolutionOptions = {}): string {
  const env = options.env || process.env;
  // An explicit workspace (tool argument) is the caller's authoritative choice:
  // use it verbatim instead of climbing to an ancestor with markers.
  if (options.explicitWorkspace !== undefined) {
    const explicit = toExistingDirectory(options.explicitWorkspace);
    if (!explicit || !fs.statSync(explicit).isDirectory()) throw new Error('Invalid workspace: select an existing project directory.');
    return explicit;
  }
  if (env.INI_BRAIN_WORKSPACE?.trim()) {
    const configured = toExistingDirectory(env.INI_BRAIN_WORKSPACE);
    if (!configured) throw new Error('Invalid INI_BRAIN_WORKSPACE: directory does not exist.');
    return configured;
  }

  const candidates = [
    options.clientWorkspace,
    ...WORKSPACE_ENV_KEYS.map(key => env[key]),
    options.cwd || process.cwd()
  ];

  for (const candidate of candidates) {
    const directory = toExistingDirectory(candidate);
    if (!directory || isUserHome(directory) || isApplicationDirectory(directory)) continue;
    return avoidHome(findWorkspaceRoot(directory), options.cwd);
  }

  return avoidHome(path.resolve(options.cwd || process.cwd()), options.cwd);
}

export function findWorkspaceRoot(startPath: string): string {
  const start = path.resolve(startPath);
  let current = start;
  const fallback = start;
  for (;;) {
    if (!isUserHome(current) && hasWorkspaceMarker(current)) return current;
    const parent = path.dirname(current);
    if (parent === current || isUserHome(current)) break;
    current = parent;
  }
  return fallback;
}

export function isUserHome(directory: string): boolean {
  const resolved = path.resolve(directory);
  return userHomeDirectories().some(home => sameDirectory(resolved, home));
}

export function fileUriToDirectory(uri: string): string | undefined {
  if (!uri.startsWith('file://')) return undefined;
  const rest = uri.slice('file://'.length);
  let pathname = rest;
  if (/^\/[A-Za-z]:/.test(rest)) pathname = rest.slice(1);
  else if (/^localhost\//i.test(rest)) pathname = rest.slice('localhost'.length);
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }
  pathname = pathname.replace(/\//g, path.sep);
  return toExistingDirectory(pathname);
}

/** Explicit selection can initialize an empty directory, never home or an application. */
export function isSafeExplicitWorkspace(directory: string): boolean {
  const existing = toExistingDirectory(directory);
  return Boolean(existing && !isUserHome(existing) && !isApplicationDirectory(existing) && path.dirname(existing) !== existing);
}

/**
 * A workspace is "trusted" when it or any ancestor contains at least one
 * project marker — so an explicit `workspace` pointing at a project
 * subdirectory is still trusted, while a genuinely foreign directory (for
 * example C:\Windows\System32) stays untrusted and background scanning does
 * not run there.
 *
 * Recompute on each call so removed directories or changed markers never leave
 * a stale positive trust verdict shared between clients.
 */
export function isTrustedWorkspace(directory: string): boolean {
  const resolved = path.resolve(directory);
  if (isUserHome(resolved) || isApplicationDirectory(resolved)) return false;
  if (!toExistingDirectory(resolved)) return false;
  let current = resolved;
  for (;;) {
    if (!isUserHome(current) && !isApplicationDirectory(current) && hasWorkspaceMarker(current)) {
      return true;
    }
    const parent = path.dirname(current);
    if (parent === current || isUserHome(current) || isApplicationDirectory(current)) return false;
    current = parent;
  }
}

/**
 * True when the path is an installed program rather than a user project.
 *
 * Detection is structural: a path under a known application location
 * (`AppData\Local\Programs`, `%APPDATA%`, `Program Files`, `/Applications`,
 * `Library/Application Support`) without a .git marker at the project or an
 * ancestor below that application location. Package manifests are not VCS proof.
 * Actual app.asar/app.asar.unpacked paths stay blocked; an ordinary resources
 * directory is not an application marker.
 */
export function isApplicationDirectory(directory: string): boolean {
  const resolved = path.resolve(directory);
  const parts = resolved.split(path.sep).filter(Boolean).map(part => part.toLowerCase());
  if (parts.length === 0) return false;

  if (parts.some(part => (APPLICATION_SEGMENTS as readonly string[]).includes(part))) {
    return true;
  }
  for (const parent of APPLICATION_PARENTS) {
    const index = indexOfSequence(parts, parent);
    if (index === -1) continue;
    // The directory itself sits at or below the application location.
    if (index + parent.length <= parts.length) {
      let current = resolved;
      while (current.split(path.sep).filter(Boolean).length > index + parent.length) {
        if (fs.existsSync(path.join(current, '.git'))) return false;
        current = path.dirname(current);
      }
      return true;
    }
  }
  return false;
}

function indexOfSequence(parts: string[], sequence: readonly string[]): number {
  outer: for (let index = 0; index + sequence.length <= parts.length; index += 1) {
    for (let offset = 0; offset < sequence.length; offset += 1) {
      if (parts[index + offset] !== sequence[offset]) continue outer;
    }
    return index;
  }
  return -1;
}

function hasProjectMarker(directory: string): boolean {
  return PROJECT_MARKERS.some(marker => fs.existsSync(path.join(directory, marker)));
}

function toExistingDirectory(candidate: string | undefined): string | undefined {
  if (!candidate || !candidate.trim()) return undefined;
  const resolved = path.resolve(candidate.trim());
  try {
    const stat = fs.statSync(resolved);
    return stat.isDirectory() ? fs.realpathSync(resolved) : undefined;
  } catch {
    return undefined;
  }
}

function hasWorkspaceMarker(directory: string): boolean {
  return WORKSPACE_MARKERS.some(marker => fs.existsSync(path.join(directory, marker)));
}

function avoidHome(directory: string, cwd: string | undefined): string {
  if (!isUserHome(directory)) return directory;
  const fallback = toExistingDirectory(cwd);
  return fallback && !isUserHome(fallback) ? fallback : directory;
}

function userHomeDirectories(): string[] {
  const homes = [
    process.env.USERPROFILE,
    process.env.HOME,
    process.env.HOMEDRIVE && process.env.HOMEPATH ? `${process.env.HOMEDRIVE}${process.env.HOMEPATH}` : undefined,
    os.homedir()
  ];
  return [...new Set(homes.filter((home): home is string => Boolean(home && home.trim())).map(home => path.resolve(home)))];
}

function sameDirectory(left: string, right: string): boolean {
  const a = path.resolve(left);
  const b = path.resolve(right);
  return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
}
