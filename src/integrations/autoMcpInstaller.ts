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
  client: 'codex' | 'claude' | 'cline';
  status: 'installed' | 'unchanged' | 'skipped' | 'error';
  configPath: string;
  message: string;
}

export async function autoInstallMcpClients(options: AutoMcpInstallOptions): Promise<AutoMcpInstallResult[]> {
  const platform = options.platform ?? process.platform;
  const homeDir = options.homeDir ?? process.env.USERPROFILE ?? process.env.HOME ?? '';
  const appDataDir = options.appDataDir ?? process.env.APPDATA ?? path.join(homeDir, 'AppData', 'Roaming');
  const paths = getClientConfigPaths(homeDir, appDataDir, platform);
  return Promise.all([
    installCodex(paths.codex, options.serverScript),
    installJsonClient('claude', paths.claude, options.serverScript),
    installJsonClient('cline', paths.cline, options.serverScript),
  ]);
}

export function getClientConfigPaths(homeDir: string, appDataDir: string, platform: NodeJS.Platform): {
  codex: string;
  claude: string;
  cline: string;
} {
  const codex = path.join(homeDir, '.codex', 'config.toml');
  if (platform === 'win32') {
    return {
      codex,
      claude: path.join(appDataDir, 'Claude', 'claude_desktop_config.json'),
      cline: path.join(appDataDir, 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
    };
  }
  if (platform === 'darwin') {
    const support = path.join(homeDir, 'Library', 'Application Support');
    return {
      codex,
      claude: path.join(support, 'Claude', 'claude_desktop_config.json'),
      cline: path.join(support, 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
    };
  }
  const config = process.env.XDG_CONFIG_HOME ?? path.join(homeDir, '.config');
  return {
    codex,
    claude: path.join(config, 'Claude', 'claude_desktop_config.json'),
    cline: path.join(config, 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
  };
}

async function installCodex(configPath: string, serverScript: string): Promise<AutoMcpInstallResult> {
  if (!await directoryExists(path.dirname(configPath))) return skipped('codex', configPath);
  try {
    const current = await fs.readFile(configPath, 'utf8').catch(error => {
      if (hasCode(error, 'ENOENT')) return '';
      throw error;
    });
    const block = [
      '[mcp_servers.ini-brain-ai]',
      'command = "node"',
      `args = [${JSON.stringify(serverScript)}]`,
      'startup_timeout_sec = 120',
    ].join('\n');
    const withoutExisting = current
      .replace(/(?:^|\r?\n)\[mcp_servers\.ini-brain-ai\][\s\S]*?(?=\r?\n\[|$)/g, '')
      .trimEnd();
    const next = `${withoutExisting}${withoutExisting ? '\n\n' : ''}${block}\n`;
    if (next === current) return unchanged('codex', configPath);
    await fs.writeFile(configPath, next, 'utf8');
    return installed('codex', configPath);
  } catch (error) {
    return failed('codex', configPath, error);
  }
}

async function installJsonClient(
  client: 'claude' | 'cline',
  configPath: string,
  serverScript: string
): Promise<AutoMcpInstallResult> {
  if (!await directoryExists(path.dirname(configPath))) return skipped(client, configPath);
  try {
    const current = await readJsonFile<Record<string, unknown>>(configPath, {});
    const currentServers = isRecord(current.mcpServers) ? current.mcpServers : {};
    const entry: Record<string, unknown> = {
      command: 'node',
      args: [serverScript],
      disabled: false,
      autoApprove: [],
    };
    const next = { ...current, mcpServers: { ...currentServers, 'ini-brain-ai': entry } };
    if (JSON.stringify(next) === JSON.stringify(current)) return unchanged(client, configPath);
    await writeJsonFile(configPath, next);
    return installed(client, configPath);
  } catch (error) {
    return failed(client, configPath, error);
  }
}

async function directoryExists(directory: string): Promise<boolean> {
  try {
    return (await fs.stat(directory)).isDirectory();
  } catch {
    return false;
  }
}

function installed(client: AutoMcpInstallResult['client'], configPath: string): AutoMcpInstallResult {
  return { client, status: 'installed', configPath, message: 'MCP configuration installed or refreshed.' };
}

function unchanged(client: AutoMcpInstallResult['client'], configPath: string): AutoMcpInstallResult {
  return { client, status: 'unchanged', configPath, message: 'MCP configuration is already current.' };
}

function skipped(client: AutoMcpInstallResult['client'], configPath: string): AutoMcpInstallResult {
  return { client, status: 'skipped', configPath, message: 'Client configuration directory was not detected.' };
}

function failed(client: AutoMcpInstallResult['client'], configPath: string, error: unknown): AutoMcpInstallResult {
  return { client, status: 'error', configPath, message: error instanceof Error ? error.message : String(error) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasCode(error: unknown, code: string): boolean {
  return isRecord(error) && error.code === code;
}
