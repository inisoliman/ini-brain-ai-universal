import * as fs from 'fs';
import * as path from 'path';

export interface WorkspaceResolutionOptions {
  cwd?: string;
  env?: Record<string, string | undefined>;
  explicitWorkspace?: string;
}

const WORKSPACE_ENV_KEYS = [
  'INI_BRAIN_WORKSPACE',
  'CODEX_WORKSPACE',
  'CODEX_CWD',
  'WORKSPACE',
  'INIT_CWD',
  'PWD'
] as const;

const WORKSPACE_MARKERS = [
  '.brain',
  'AGENTS.md',
  '.git',
  'package.json',
  'pyproject.toml',
  'Cargo.toml',
  'go.mod',
  'composer.json',
  'pom.xml',
  '.project'
] as const;

export function resolveWorkspace(options: WorkspaceResolutionOptions = {}): string {
  const env = options.env || process.env;
  const candidates = [
    options.explicitWorkspace,
    ...WORKSPACE_ENV_KEYS.map(key => env[key]),
    options.cwd || process.cwd()
  ];

  for (const candidate of candidates) {
    const directory = toExistingDirectory(candidate);
    if (directory) return findWorkspaceRoot(directory);
  }

  return path.resolve(options.cwd || process.cwd());
}

export function findWorkspaceRoot(startPath: string): string {
  let current = path.resolve(startPath);
  for (;;) {
    if (hasWorkspaceMarker(current)) return current;
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(startPath);
    current = parent;
  }
}

function toExistingDirectory(candidate: string | undefined): string | undefined {
  if (!candidate || !candidate.trim()) return undefined;
  const resolved = path.resolve(candidate.trim());
  try {
    const stat = fs.statSync(resolved);
    return stat.isDirectory() ? resolved : path.dirname(resolved);
  } catch {
    return undefined;
  }
}

function hasWorkspaceMarker(directory: string): boolean {
  return WORKSPACE_MARKERS.some(marker => fs.existsSync(path.join(directory, marker)));
}
