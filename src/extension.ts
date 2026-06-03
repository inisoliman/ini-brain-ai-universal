import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { AgentGuideGenerator } from './core/agentGuide';
import { BrainStore } from './core/brainStore';
import { MemoryStore, formatMemoryLine, parseCsvList } from './core/memoryStore';
import { ProjectScanner } from './core/projectScanner';
import { MemoryKind } from './core/types';
import { buildMcpConfigJson } from './integrations/mcpConfig';
import { getIntegrationAdapters } from './integrations/registry';
import { ProjectOnboardingService } from './onboarding/projectOnboarding';
import { SidebarProvider } from './ui/sidebarProvider';

let output: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  output = vscode.window.createOutputChannel('INI Brain AI Universal');
  context.subscriptions.push(output);

  const sidebar = new SidebarProvider();
  context.subscriptions.push(vscode.window.registerWebviewViewProvider('iniBrain.sidebar', sidebar));

  const root = getWorkspaceRoot();
  if (!root) {
    sidebar.log('Open a workspace folder to use INI Brain AI.');
    return;
  }

  const scanner = new ProjectScanner(root);
  const brainStore = new BrainStore(root);
  const agentGuide = new AgentGuideGenerator(root);
  const memory = new MemoryStore(root);
  const onboarding = new ProjectOnboardingService(root);

  context.subscriptions.push(
    vscode.commands.registerCommand('iniBrain.scanProject', () => runWithStatus(sidebar, 'Scanning', async () => {
      const scan = await scanner.scan();
      const brain = await brainStore.writeScan(scan);
      await agentGuide.generate(brain);
      sidebar.log(`Scanned ${scan.stats.indexedFiles} file(s).`);
      vscode.window.showInformationMessage('INI Brain scan completed.');
    })),
    vscode.commands.registerCommand('iniBrain.rebuildBrain', () => runWithStatus(sidebar, 'Rebuilding', async () => {
      const scan = await scanner.scan();
      const brain = await brainStore.writeScan(scan);
      await agentGuide.generate(brain);
      sidebar.log(`Rebuilt project brain with ${scan.stats.indexedFiles} file(s).`);
    })),
    vscode.commands.registerCommand('iniBrain.guidedSetup', () => runWithStatus(sidebar, 'Setup', async () => {
      const state = await onboarding.detect();
      sidebar.setOnboarding(state);
      if (state.kind === 'empty') {
        const requestPath = path.join(root, 'project_request.md');
        await writeIfMissing(requestPath, '# Project Request\n\nDescribe the project you want to build here.\n');
        vscode.window.showInformationMessage('Created project_request.md. Fill it, then run your preferred AI agent with INI Brain context.');
        return;
      }
      await onboarding.initializeOrRefresh();
      vscode.window.showInformationMessage('INI Brain guided setup completed.');
    })),
    vscode.commands.registerCommand('iniBrain.generateAgentGuide', () => runWithStatus(sidebar, 'Generating', async () => {
      const scan = await scanner.scan();
      const brain = await brainStore.writeScan(scan);
      const result = await agentGuide.generate(brain);
      sidebar.log(`Generated ${result.agentsPath} and ${result.skillsIndexPath}.`);
    })),
    vscode.commands.registerCommand('iniBrain.generateSkillsWorkflow', () => runWithStatus(sidebar, 'Generating', async () => {
      const brain = await brainStore.readBrain() || await brainStore.writeScan(await scanner.scan());
      const result = await agentGuide.generate(brain);
      sidebar.log(`Generated workflow and ${result.generatedSkills.length} skill file(s).`);
    })),
    vscode.commands.registerCommand('iniBrain.saveMemory', () => runWithStatus(sidebar, 'Ready', async () => saveMemory(memory, sidebar))),
    vscode.commands.registerCommand('iniBrain.searchMemory', () => runWithStatus(sidebar, 'Ready', async () => searchMemory(memory, sidebar))),
    vscode.commands.registerCommand('iniBrain.showProjectProfile', () => runWithStatus(sidebar, 'Ready', async () => showProjectProfile(root, memory))),
    vscode.commands.registerCommand('iniBrain.copyMcpConfig', () => runWithStatus(sidebar, 'Ready', async () => {
      await vscode.env.clipboard.writeText(buildMcpConfigJson(root, getMcpServerScript()));
      sidebar.log('MCP config copied to clipboard.');
      vscode.window.showInformationMessage('INI Brain MCP config copied.');
    })),
    vscode.commands.registerCommand('iniBrain.installIntegrations', () => runWithStatus(sidebar, 'Ready', async () => installIntegrations(root, sidebar))),
    vscode.commands.registerCommand('iniBrain.configureProvider', () => runWithStatus(sidebar, 'Ready', async () => configureProvider(context, sidebar)))
  );

  sidebar.log('INI Brain AI Universal activated.');
  if (vscode.workspace.getConfiguration('iniBrain').get('autoScan', true)) {
    void runAutoOnboarding(onboarding, sidebar);
  }
}

export function deactivate(): void {}

function getWorkspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

async function runAutoOnboarding(onboarding: ProjectOnboardingService, sidebar: SidebarProvider): Promise<void> {
  try {
    const state = await onboarding.detect();
    sidebar.setOnboarding(state);
    if (state.kind === 'missing' || state.kind === 'stale') {
      sidebar.setStatus('Auto scan');
      await onboarding.initializeOrRefresh();
      sidebar.setStatus('Ready');
      sidebar.log('Automatic project context refresh completed.');
    }
    if (state.kind === 'empty') {
      sidebar.log('Empty project detected. Run Guided Setup when ready.');
    }
  } catch (error) {
    sidebar.setStatus('Error');
    sidebar.log(error instanceof Error ? error.message : String(error));
  }
}

async function saveMemory(memory: MemoryStore, sidebar: SidebarProvider): Promise<void> {
  const content = await vscode.window.showInputBox({ prompt: 'What should INI Brain remember?' });
  if (!content) return;
  const kindPick = await vscode.window.showQuickPick(['fact', 'decision', 'preference', 'bug', 'workflow', 'session', 'note'], { placeHolder: 'Memory type' });
  if (!kindPick) return;
  const kind = kindPick as MemoryKind;
  const files = parseCsvList(await vscode.window.showInputBox({ prompt: 'Related files, comma separated', placeHolder: 'src/extension.ts, package.json' }));
  const concepts = parseCsvList(await vscode.window.showInputBox({ prompt: 'Concepts, comma separated', placeHolder: 'MCP, Codex, onboarding' }));
  const entry = await memory.save({ content, kind, files, concepts, importance: 7, source: 'manual' });
  sidebar.log(`Saved memory ${entry.id}.`);
}

async function searchMemory(memory: MemoryStore, sidebar: SidebarProvider): Promise<void> {
  const query = await vscode.window.showInputBox({ prompt: 'Search INI Brain memory' });
  if (!query) return;
  const results = await memory.search(query, 12);
  output.clear();
  output.appendLine(`# Memory Search: ${query}`);
  output.appendLine('');
  output.appendLine(results.map(result => formatMemoryLine(result.entry)).join('\n') || 'No matching memories found.');
  output.show(true);
  sidebar.log(`Memory search returned ${results.length} result(s).`);
}

async function showProjectProfile(root: string, memory: MemoryStore): Promise<void> {
  const profile = await memory.buildProfile();
  const map = await readText(path.join(root, '.brain', 'project_map.json'), '{}');
  output.clear();
  output.appendLine('# INI Brain Project Profile');
  output.appendLine('');
  output.appendLine('## Project Map');
  output.appendLine(map);
  output.appendLine('');
  output.appendLine('## Memory Profile');
  output.appendLine(JSON.stringify(profile, null, 2));
  output.show(true);
}

async function installIntegrations(root: string, sidebar: SidebarProvider): Promise<void> {
  const adapters = getIntegrationAdapters();
  const pick = await vscode.window.showQuickPick(adapters.map(adapter => ({ label: adapter.displayName, description: adapter.description, adapter })), { placeHolder: 'Choose integration target' });
  if (!pick) return;
  const instructions = pick.adapter.installInstructions(root, getMcpServerScript());
  await vscode.env.clipboard.writeText(instructions);
  sidebar.log(`${pick.adapter.displayName} instructions copied.`);
  vscode.window.showInformationMessage(`${pick.adapter.displayName} integration instructions copied to clipboard.`);
}

async function configureProvider(context: vscode.ExtensionContext, sidebar: SidebarProvider): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('iniBrain');
  const apiBaseUrl = await vscode.window.showInputBox({ prompt: 'OpenAI-compatible API base URL', value: cfg.get('apiBaseUrl', 'https://api.openai.com/v1/') });
  if (!apiBaseUrl) return;
  const modelName = await vscode.window.showInputBox({ prompt: 'Model name', value: cfg.get('modelName', 'gpt-4.1') });
  if (!modelName) return;
  const apiKey = await vscode.window.showInputBox({ prompt: 'API key (stored in VS Code SecretStorage)', password: true });
  await cfg.update('apiBaseUrl', apiBaseUrl.trim(), vscode.ConfigurationTarget.Workspace);
  await cfg.update('modelName', modelName.trim(), vscode.ConfigurationTarget.Workspace);
  if (apiKey?.trim()) await context.secrets.store('iniBrain.apiKey', apiKey.trim());
  sidebar.log('AI provider settings saved.');
}

function getMcpServerScript(): string {
  return path.join(__dirname, 'mcp', 'server.js');
}

async function writeIfMissing(file: string, content: string): Promise<void> {
  try {
    await fs.access(file);
  } catch {
    await fs.writeFile(file, content, 'utf8');
  }
}

async function readText(file: string, fallback: string): Promise<string> {
  try {
    return await fs.readFile(file, 'utf8');
  } catch {
    return fallback;
  }
}

async function runWithStatus(sidebar: SidebarProvider, status: string, fn: () => Promise<void>): Promise<void> {
  try {
    sidebar.setStatus(status);
    await fn();
    sidebar.setStatus('Ready');
  } catch (error) {
    sidebar.setStatus('Error');
    const message = error instanceof Error ? error.message : String(error);
    output.appendLine(error instanceof Error ? error.stack || error.message : String(error));
    sidebar.log(message);
    vscode.window.showErrorMessage(message);
  }
}
