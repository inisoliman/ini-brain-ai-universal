import * as fs from 'fs/promises';
import * as path from 'path';
import { readJsonFile, writeJsonFile } from '../core/jsonUtils';

export interface AutoMcpInstallOptions {
  serverScript: string;
  homeDir?: string;
  appDataDir?: string;
  platform?: NodeJS.Platform;
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
  for (const client of CLIENTS) {
    const candidates = client.candidates(ctx);
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
  const current = await fs.readFile(configPath, 'utf8').catch(error => {
    if (hasCode(error, 'ENOENT')) return '';
    throw error;
  });
  const block = [
    `[mcp_servers.${SERVER_KEY}]`,
    'command = "node"',
    `args = [${JSON.stringify(serverScript)}]`,
    'startup_timeout_sec = 120',
  ].join('\n');
  const withoutExisting = current
    .replace(/(?:^|\r?\n)\[mcp_servers\.ini-brain-ai\][\s\S]*?(?=\r?\n\[|$)/g, '')
    .trimEnd();
  const next = `${withoutExisting}${withoutExisting ? '\n\n' : ''}${block}\n`;
  if (next === current) return unchanged(client, configPath);
  await fs.writeFile(configPath, next, 'utf8');
  return installed(client, configPath);
}

async function installJson(client: ClientDescriptor, configPath: string, serverScript: string): Promise<AutoMcpInstallResult> {
  const current = await readJsonFile<Record<string, unknown>>(configPath, {});
  const currentServers = isRecord(current.mcpServers) ? current.mcpServers : {};
  const entry: Record<string, unknown> = client.vscodeFamily
    ? { command: 'node', args: [serverScript], disabled: false, autoApprove: [] }
    : { command: 'node', args: [serverScript] };
  const next = { ...current, mcpServers: { ...currentServers, [SERVER_KEY]: entry } };
  if (JSON.stringify(next) === JSON.stringify(current)) return unchanged(client.id, configPath);
  await writeJsonFile(configPath, next);
  return installed(client.id, configPath);
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
