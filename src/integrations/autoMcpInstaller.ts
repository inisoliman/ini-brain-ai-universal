import * as fs from 'fs/promises';
import * as path from 'path';
import { buildOpenCodeMcpConfig } from './mcpConfig';

export interface AutoMcpInstallOptions {
  serverScript: string;
  homeDir?: string;
  appDataDir?: string;
  platform?: NodeJS.Platform;
  clients?: string[];
}

export interface AutoMcpInstallResult {
  client: string;
  status: 'installed' | 'unchanged' | 'skipped' | 'error';
  configPath: string;
  message: string;
}

type ClientKind = 'json' | 'toml';

interface ClientDescriptor {
  id: string;
  kind: ClientKind;
  /** VS Code-family settings shape keeps disabled/autoApprove keys. */
  vscodeFamily: boolean;
  /** Resolve candidate config file paths. Each entry is gated by an anchor
   *  directory that must already exist (proof the client is installed). */
  candidates(ctx: InstallContext): Array<{ anchor: string; configPath: string; createDir?: string }>;
}

interface InstallContext {
  homeDir: string;
  appDataDir: string;
  platform: NodeJS.Platform;
}

const SERVER_KEY = 'ini-brain-ai';
const EDITOR_DIRS = ['Code', 'Code - Insiders', 'VSCodium'] as const;

/** Platform-specific per-application configuration root. */
function configHome(ctx: InstallContext): string {
  if (ctx.platform === 'win32') return ctx.appDataDir;
  if (ctx.platform === 'darwin') return path.join(ctx.homeDir, 'Library', 'Application Support');
  return process.env.XDG_CONFIG_HOME ?? path.join(ctx.homeDir, '.config');
}

function editorUserDirs(ctx: InstallContext): string[] {
  return EDITOR_DIRS.map(dir => path.join(configHome(ctx), dir, 'User'));
}

function globalStorageCandidate(userDir: string, extensionId: string, settingsFile: string): { anchor: string; configPath: string; createDir: string } {
  const anchor = path.join(userDir, 'globalStorage', extensionId);
  return {
    anchor,
    configPath: path.join(anchor, 'settings', settingsFile),
    createDir: path.join(anchor, 'settings'),
  };
}

function perEditor(ctx: InstallContext, extensionId: string, settingsFile: string): Array<{ anchor: string; configPath: string; createDir: string }> {
  return editorUserDirs(ctx).map(userDir => globalStorageCandidate(userDir, extensionId, settingsFile));
}

const CLIENTS: ClientDescriptor[] = [
  {
    id: 'opencode', kind: 'json', vscodeFamily: false,
    candidates: ctx => {
      const dir = path.join(ctx.homeDir, '.config', 'opencode');
      return [{ anchor: dir, configPath: path.join(dir, 'opencode.json') }];
    }
  },
  {
    id: 'codex',
    kind: 'toml',
    vscodeFamily: false,
    candidates: ctx => [{ anchor: path.join(ctx.homeDir, '.codex'), configPath: path.join(ctx.homeDir, '.codex', 'config.toml') }],
  },
  {
    id: 'claude',
    kind: 'json',
    vscodeFamily: false,
    candidates: ctx => [{ anchor: path.join(configHome(ctx), 'Claude'), configPath: path.join(configHome(ctx), 'Claude', 'claude_desktop_config.json') }],
  },
  {
    id: 'claude-code',
    kind: 'json',
    vscodeFamily: false,
    candidates: ctx => [
      { anchor: path.join(ctx.homeDir, '.claude'), configPath: path.join(ctx.homeDir, '.claude.json') },
      { anchor: path.join(ctx.homeDir, '.claude.json'), configPath: path.join(ctx.homeDir, '.claude.json') },
    ],
  },
  {
    id: 'gemini-cli',
    kind: 'json',
    vscodeFamily: false,
    candidates: ctx => [{ anchor: path.join(ctx.homeDir, '.gemini'), configPath: path.join(ctx.homeDir, '.gemini', 'settings.json') }],
  },
  {
    id: 'cursor',
    kind: 'json',
    vscodeFamily: false,
    candidates: ctx => [{ anchor: path.join(ctx.homeDir, '.cursor'), configPath: path.join(ctx.homeDir, '.cursor', 'mcp.json') }],
  },
  {
    id: 'cline',
    kind: 'json',
    vscodeFamily: true,
    candidates: ctx => perEditor(ctx, 'saoudrizwan.claude-dev', 'cline_mcp_settings.json'),
  },
  {
    id: 'kilo-code',
    kind: 'json',
    vscodeFamily: true,
    candidates: ctx => perEditor(ctx, 'kilocode.kilo-code', 'mcp_settings.json'),
  },
  {
    id: 'roo-code',
    kind: 'json',
    vscodeFamily: true,
    candidates: ctx => perEditor(ctx, 'rooveterinaryinc.roo-cline', 'mcp_settings.json'),
  },
];

export async function autoInstallMcpClients(options: AutoMcpInstallOptions): Promise<AutoMcpInstallResult[]> {
  const homeDir = options.homeDir ?? process.env.USERPROFILE ?? process.env.HOME ?? '';
  const ctx: InstallContext = {
    platform: options.platform ?? process.platform,
    homeDir,
    appDataDir: options.appDataDir ?? process.env.APPDATA ?? path.join(homeDir, 'AppData', 'Roaming'),
  };
  const results: AutoMcpInstallResult[] = [];
  if (options.clients?.includes('zadloop')) results.push({ client: 'zadloop', status: 'skipped', configPath: '', message: 'Automatic installation unsupported. Use the ZadLoop manual command/args export.' });
  for (const client of CLIENTS) {
    if (options.clients && !options.clients.includes(client.id)) continue;
    const candidates = client.candidates(ctx);
    if (client.id === 'opencode') {
      const candidate = candidates[0];
      if (await pathExists(`${candidate.configPath}c`)) candidate.configPath += 'c';
    }
    const handledPaths = new Set<string>();
    for (const candidate of candidates) {
      if (handledPaths.has(candidate.configPath)) continue;
      const result = await installCandidate(client, candidate, options.serverScript);
      // Only dedupe non-skipped outcomes: a skipped candidate (missing anchor)
      // must not block a fallback candidate for the same config file whose
      // anchor does exist (e.g. ~/.claude.json present without ~/.claude/).
      if (result.status !== 'skipped') handledPaths.add(candidate.configPath);
      results.push(result);
    }
  }
  return results;
}

async function installCandidate(
  client: ClientDescriptor,
  candidate: { anchor: string; configPath: string; createDir?: string },
  serverScript: string
): Promise<AutoMcpInstallResult> {
  if (!await pathExists(candidate.anchor)) return skipped(client.id, candidate.configPath);
  try {
    if (candidate.createDir) await fs.mkdir(candidate.createDir, { recursive: true });
    if (client.kind === 'toml') return await installToml(client.id, candidate.configPath, serverScript);
    return await installJson(client, candidate.configPath, serverScript);
  } catch (error) {
    return failed(client.id, candidate.configPath, error);
  }
}

async function installToml(client: string, configPath: string, serverScript: string): Promise<AutoMcpInstallResult> {
  const original = await fs.readFile(configPath, 'utf8').catch(error => {
    if (hasCode(error, 'ENOENT')) return undefined;
    throw error;
  });
  const current = original ?? '';
  const block = [
    `[mcp_servers.${SERVER_KEY}]`,
    'command = "node"',
    `args = [${JSON.stringify(serverScript)}]`,
    'startup_timeout_sec = 120',
  ].join('\n');
  // No TOML parser ships in the runtime. Validate a conservative subset and
  // refuse complex syntax unchanged rather than rewriting a user's document.
  validateSimpleToml(current);
  const section = /(^|\r?\n)(\[mcp_servers\.ini-brain-ai\]\s*\r?\n)([\s\S]*?)(?=\r?\n\[|$)/.exec(current);
  let next: string;
  if (section) {
    let body = section[3];
    for (const [key, value] of [['command', '"node"'], ['args', `[${JSON.stringify(serverScript)}]`]]) {
      const line = new RegExp(`^[ \t]*${key}\\s*=.*$`, 'm');
      body = line.test(body) ? body.replace(line, `${key} = ${value}`) : `${body.trimEnd()}\n${key} = ${value}\n`;
    }
    next = current.slice(0, section.index) + section[1] + section[2] + body + current.slice(section.index + section[0].length);
  } else next = `${current.trimEnd()}${current.trim() ? '\n\n' : ''}${block}\n`;
  validateSimpleToml(next);
  if (next === current) return unchanged(client, configPath);
  await atomicConfigWrite(configPath, original, next);
  return installed(client, configPath);
}

async function installJson(client: ClientDescriptor, configPath: string, serverScript: string): Promise<AutoMcpInstallResult> {
  if (configPath.endsWith('.jsonc')) throw new Error('JSONC automatic merge unsupported in the dependency-free runtime; manually merge the exported native MCP config. Original file unchanged.');
  const original = await fs.readFile(configPath, 'utf8').catch(error => { if (hasCode(error, 'ENOENT')) return undefined; throw error; });
  const current: unknown = original === undefined ? {} : JSON.parse(original.replace(/^\uFEFF/, ''));
  if (!isRecord(current)) throw new Error('Invalid config: expected an object. Original unchanged.');
  const key = client.id === 'opencode' ? 'mcp' : 'mcpServers';
  if (key in current && !isRecord(current[key])) throw new Error(`Invalid ${key}: expected an object. Original unchanged.`);
  const servers = (current[key] || {}) as Record<string, unknown>;
  if (SERVER_KEY in servers && !isRecord(servers[SERVER_KEY])) throw new Error('Invalid INI Brain server entry. Original unchanged.');
  const existing = (servers[SERVER_KEY] || {}) as Record<string, unknown>;
  const defaults: Record<string, unknown> = client.id === 'opencode' ? { ...buildOpenCodeMcpConfig(serverScript) } : client.vscodeFamily
    ? { command: 'node', args: [serverScript], disabled: false, autoApprove: [] }
    : { command: 'node', args: [serverScript] };
  const entry = client.id === 'opencode'
    ? { ...defaults, ...existing, type: 'local', command: ['node', serverScript] }
    : { ...defaults, ...existing, command: 'node', args: [serverScript] };
  const next = { ...current, [key]: { ...servers, [SERVER_KEY]: entry } };
  if (JSON.stringify(next) === JSON.stringify(current)) return unchanged(client.id, configPath);
  await atomicConfigWrite(configPath, original, `${JSON.stringify(next, null, 2)}\n`);
  return installed(client.id, configPath);
}

function validateSimpleToml(text: string): void {
  let section = '';
  const keys = new Set<string>();
  const sections = new Set<string>();
  for (const raw of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (/^\[[A-Za-z0-9_.-]+\]$/.test(line)) {
      if (raw !== line) throw new Error('Indented or padded TOML table headers require manual merge. Original unchanged.');
      section = line;
      if (sections.has(section)) throw new Error('Duplicate TOML section; merge manually. Original unchanged.');
      sections.add(section); continue;
    }
    const assignment = /^([A-Za-z0-9_-]+)\s*=\s*(.+)$/.exec(line);
    if (!assignment || keys.has(`${section}/${assignment[1]}`)) throw new Error('Invalid or complex TOML; merge manually. Original unchanged.');
    keys.add(`${section}/${assignment[1]}`);
    const value = assignment[2];
    // Deliberately accept only the JSON/TOML intersection, not arbitrary JSON.
    try {
      if (/[\x00-\x08\x0b-\x1f\x7f]/.test(value)) throw new Error();
      if (/^'[^']*'$/.test(value)) continue;
      const scalar = (item: unknown): boolean => typeof item === 'boolean' ||
        (typeof item === 'number' && Number.isFinite(item)) ||
        (typeof item === 'string' && !/[\x00-\x08\x0b-\x1f\x7f\uD800-\uDFFF]/.test(item));
      // JSON permits escaped slash, which TOML does not; Unicode escapes need a
      // real TOML parser to validate code points, so refuse rather than rewrite.
      if (/\\(?:\/|u)/.test(value)) throw new Error();
      const parsed: unknown = JSON.parse(value);
      if (!(Array.isArray(parsed) ? parsed.every(scalar) : scalar(parsed))) throw new Error();
    } catch { throw new Error('Unsupported TOML value; merge manually. Original unchanged.'); }
  }
}

async function atomicConfigWrite(file: string, original: string | undefined, next: string): Promise<void> {
  const lock = await fs.open(`${file}.ini-brain.lock`, 'wx', 0o600);
  const temp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    const current = await fs.readFile(file, 'utf8').catch(error => { if (hasCode(error, 'ENOENT')) return undefined; throw error; });
    if (current !== original) throw new Error('Config changed during installation; retry after reviewing it.');
    if (original !== undefined) await fs.copyFile(file, `${file}.${Date.now()}.${Math.random().toString(36).slice(2)}.bak`, 1);
    const handle = await fs.open(temp, 'wx', 0o600);
    try { await handle.writeFile(next, 'utf8'); await handle.sync(); } finally { await handle.close(); }
    await fs.rename(temp, file);
  } finally {
    await fs.unlink(temp).catch(error => { if (!hasCode(error, 'ENOENT')) throw error; });
    await lock.close();
    await fs.unlink(`${file}.ini-brain.lock`);
  }
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

function installed(client: string, configPath: string): AutoMcpInstallResult {
  return { client, status: 'installed', configPath, message: 'MCP configuration installed or refreshed.' };
}

function unchanged(client: string, configPath: string): AutoMcpInstallResult {
  return { client, status: 'unchanged', configPath, message: 'MCP configuration is already current.' };
}

function skipped(client: string, configPath: string): AutoMcpInstallResult {
  return { client, status: 'skipped', configPath, message: 'Client was not detected on this machine.' };
}

function failed(client: string, configPath: string, error: unknown): AutoMcpInstallResult {
  return { client, status: 'error', configPath, message: error instanceof Error ? error.message : String(error) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasCode(error: unknown, code: string): boolean {
  return isRecord(error) && error.code === code;
}
