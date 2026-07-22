import { AgentAdapter, DeploymentResult } from './types';
import { claudeAdapter } from './claudeAdapter';
import { codexAdapter } from './codexAdapter';
import { clineAdapter } from './clineAdapter';
import { cursorAdapter } from './cursorAdapter';
import { windsurfAdapter } from './windsurfAdapter';
import { antigravityAdapter } from './antigravityAdapter';
import { geminiAdapter } from './geminiAdapter';
import { copilotAdapter } from './copilotAdapter';
import { openCodeAdapter } from './openCodeAdapter';
import { kimiAdapter } from './kimiAdapter';
import { kiroAdapter } from './kiroAdapter';
import { kiloCodeAdapter } from './kiloCodeAdapter';
import { universalFallback } from './universalFallback';

export const ALL_ADAPTERS: AgentAdapter[] = [
  claudeAdapter, codexAdapter, clineAdapter, kiloCodeAdapter, cursorAdapter,
  windsurfAdapter, antigravityAdapter, geminiAdapter, copilotAdapter,
  openCodeAdapter, kimiAdapter, kiroAdapter, universalFallback,
];

export async function detectInstalledAdapters(root: string): Promise<AgentAdapter[]> {
  const detected: AgentAdapter[] = [];
  for (const a of ALL_ADAPTERS) {
    if (await a.detectInstalled(root)) detected.push(a);
  }
  return detected;
}

export interface DeploySkillOpts {
  root: string;
  skillName: string;
  skillBody: string;
  commands?: Array<{ name: string; body: string }>;
  agentsFileBody?: string;
  onlyInstalled?: boolean;
}

export async function deployToAllAgents(opts: DeploySkillOpts): Promise<DeploymentResult[]> {
  const targets = opts.onlyInstalled
    ? await detectInstalledAdapters(opts.root)
    : ALL_ADAPTERS;
  const results: DeploymentResult[] = [];
  for (const adapter of targets) {
    const files: string[] = [];
    const errors: string[] = [];
    try {
      files.push(...await adapter.writeSkill({
        root: opts.root, name: opts.skillName, body: opts.skillBody
      }));
      if (opts.commands) {
        for (const cmd of opts.commands) {
          files.push(...await adapter.writeCommand({
            root: opts.root, name: cmd.name, body: cmd.body
          }));
        }
      }
      if (opts.agentsFileBody) {
        files.push(...await adapter.writeAgentsFile({
          root: opts.root, body: opts.agentsFileBody
        }));
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
    results.push({ adapter: adapter.id, files, errors: errors.length ? errors : undefined });
  }
  return results;
}

export async function removeFromAllAgents(root: string, skillName: string): Promise<void> {
  for (const adapter of ALL_ADAPTERS) {
    try {
      await adapter.removeSkill(root, skillName);
      await adapter.removeCommand(root, skillName);
    } catch { /* ignore */ }
  }
}

export { AgentAdapter, DeploymentResult } from './types';
