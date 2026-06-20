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
import { deployCavemanLocal, removeCavemanLocal, CavemanMode } from './savings/caveman';
import { deployPonytailLocal, removePonytailLocal, PonytailMode } from './savings/ponytail';
import { deployClaudeLeanLocal, removeClaudeLeanLocal } from './savings/claudeLean';
import { measureText, readSavingsHistory, summarizeSavings } from './savings/tokenMeter';
import { removeAllSavings } from './savings';
import { createSpec, createPlan, createTasks, listSpecs } from './methodology/specKit';
import { buildCodeGraph, loadGraph, saveGraph, computeImpact } from './graph/knowledgeGraph';
import { renderMermaid, renderMermaidHtml } from './graph/mermaidRenderer';
import { deployToAllAgents, removeFromAllAgents, detectInstalledAdapters } from './adapters/registry';
import { checkAll, applyOne } from './updater/repoSync';

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
    vscode.commands.registerCommand('iniBrain.configureProvider', () => runWithStatus(sidebar, 'Ready', async () => configureProvider(context, sidebar))),
    // === Savings ===
    vscode.commands.registerCommand('iniBrain.enableCaveman', async () => {
      const cfg = vscode.workspace.getConfiguration('iniBrain');
      const mode = (cfg.get<string>('caveman.mode') ?? 'full') as CavemanMode;
      await deployCavemanLocal({ root, mode });
      await cfg.update('caveman.enabled', true, vscode.ConfigurationTarget.Workspace);
      if (cfg.get<boolean>('adapter.installOnEnable', true)) {
        const cavemanFile = path.join(root, '.brain', 'skills', 'caveman.md');
        try {
          const body = await fs.readFile(cavemanFile, 'utf8');
          await deployToAllAgents({ root, skillName: 'caveman', skillBody: body, onlyInstalled: true });
        } catch {}
      }
      vscode.window.showInformationMessage(`Caveman enabled (${mode}). Output tokens -~70%.`);
    }),
    vscode.commands.registerCommand('iniBrain.disableCaveman', async () => {
      await removeCavemanLocal(root);
      await removeFromAllAgents(root, 'caveman');
      await vscode.workspace.getConfiguration('iniBrain').update('caveman.enabled', false, vscode.ConfigurationTarget.Workspace);
      vscode.window.showInformationMessage('Caveman disabled.');
    }),
    vscode.commands.registerCommand('iniBrain.enablePonytail', async () => {
      const cfg = vscode.workspace.getConfiguration('iniBrain');
      const mode = (cfg.get<string>('ponytail.mode') ?? 'full') as PonytailMode;
      await deployPonytailLocal({ root, mode });
      await cfg.update('ponytail.enabled', true, vscode.ConfigurationTarget.Workspace);
      if (cfg.get<boolean>('adapter.installOnEnable', true)) {
        const f = path.join(root, '.brain', 'skills', 'ponytail.md');
        try {
          const body = await fs.readFile(f, 'utf8');
          await deployToAllAgents({ root, skillName: 'ponytail', skillBody: body, onlyInstalled: true });
        } catch {}
      }
      vscode.window.showInformationMessage(`Ponytail enabled (${mode}). Code -~54%.`);
    }),
    vscode.commands.registerCommand('iniBrain.disablePonytail', async () => {
      await removePonytailLocal(root);
      await removeFromAllAgents(root, 'ponytail');
      await vscode.workspace.getConfiguration('iniBrain').update('ponytail.enabled', false, vscode.ConfigurationTarget.Workspace);
      vscode.window.showInformationMessage('Ponytail disabled.');
    }),
    vscode.commands.registerCommand('iniBrain.enableClaudeLean', async () => {
      await deployClaudeLeanLocal(root);
      await vscode.workspace.getConfiguration('iniBrain').update('claudeLean.enabled', true, vscode.ConfigurationTarget.Workspace);
      vscode.window.showInformationMessage('Claude Lean enabled.');
    }),
    vscode.commands.registerCommand('iniBrain.disableClaudeLean', async () => {
      await removeClaudeLeanLocal(root);
      await vscode.workspace.getConfiguration('iniBrain').update('claudeLean.enabled', false, vscode.ConfigurationTarget.Workspace);
      vscode.window.showInformationMessage('Claude Lean disabled.');
    }),
    vscode.commands.registerCommand('iniBrain.enableAllSavings', async () => {
      await vscode.commands.executeCommand('iniBrain.enableCaveman');
      await vscode.commands.executeCommand('iniBrain.enablePonytail');
      await vscode.commands.executeCommand('iniBrain.enableClaudeLean');
      vscode.window.showInformationMessage('All savings enabled. Expected ~60-80% token reduction.');
    }),
    vscode.commands.registerCommand('iniBrain.disableAllSavings', async () => {
      await removeAllSavings(root);
      await removeFromAllAgents(root, 'caveman');
      await removeFromAllAgents(root, 'ponytail');
      const cfg = vscode.workspace.getConfiguration('iniBrain');
      await cfg.update('caveman.enabled', false, vscode.ConfigurationTarget.Workspace);
      await cfg.update('ponytail.enabled', false, vscode.ConfigurationTarget.Workspace);
      await cfg.update('claudeLean.enabled', false, vscode.ConfigurationTarget.Workspace);
      vscode.window.showInformationMessage('All savings disabled.');
    }),
    vscode.commands.registerCommand('iniBrain.switchSavingsLevel', async () => {
      const skill = await vscode.window.showQuickPick(['caveman', 'ponytail'], { placeHolder: 'Which skill?' });
      if (!skill) return;
      const levels = skill === 'caveman' ? ['lite', 'full', 'ultra', 'wenyan'] : ['lite', 'full', 'ultra'];
      const level = await vscode.window.showQuickPick(levels, { placeHolder: 'Level' });
      if (!level) return;
      await vscode.workspace.getConfiguration('iniBrain').update(`${skill}.mode`, level, vscode.ConfigurationTarget.Workspace);
      await vscode.commands.executeCommand(skill === 'caveman' ? 'iniBrain.enableCaveman' : 'iniBrain.enablePonytail');
    }),
    vscode.commands.registerCommand('iniBrain.showTokenDashboard', async () => {
      const history = await readSavingsHistory(root);
      const summary = summarizeSavings(history);
      const panel = vscode.window.createWebviewPanel(
        'iniBrainTokenDashboard', 'INI Brain — Token Savings', vscode.ViewColumn.One, {}
      );
      panel.webview.html = `<!DOCTYPE html><html><body style="font-family:system-ui;padding:20px;background:#1e1e1e;color:#ddd">
        <h1>💰 Token Savings Dashboard</h1>
        <h2>Total Saved: ${summary.totalTokensSaved.toLocaleString()} tokens</h2>
        <h2>Cost Saved: ${summary.totalCostSavedUsd.toFixed(2)}</h2>
        <h3>By Mode</h3><pre>${JSON.stringify(summary.byMode, null, 2)}</pre>
      </body></html>`;
    }),
    vscode.commands.registerCommand('iniBrain.measureFileTokens', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) { vscode.window.showWarningMessage('Open a file first.'); return; }
      const stats = measureText(editor.document.getText());
      vscode.window.showInformationMessage(
        `${path.basename(editor.document.fileName)}: ${stats.totalTokens} tokens, ~${stats.estimatedCostUsd.toFixed(4)}`
      );
    }),
    
    // === Spec-Kit ===
    vscode.commands.registerCommand('iniBrain.specCreate', async () => {
      const name = await vscode.window.showInputBox({ prompt: 'Feature name' });
      if (!name) return;
      const desc = await vscode.window.showInputBox({ prompt: 'What & why' });
      if (!desc) return;
      const { specPath } = await createSpec({ root, featureName: name, description: desc });
      await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(specPath));
    }),
    vscode.commands.registerCommand('iniBrain.specPlan', async () => {
      const specs = await listSpecs(root);
      if (!specs.length) { vscode.window.showWarningMessage('No specs.'); return; }
      const slug = await vscode.window.showQuickPick(specs, { placeHolder: 'Pick spec' });
      if (!slug) return;
      const tech = await vscode.window.showInputBox({ prompt: 'Tech stack' });
      if (!tech) return;
      const p = await createPlan({ root, specSlug: slug, techStack: tech });
      await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(p));
    }),
    vscode.commands.registerCommand('iniBrain.specTasks', async () => {
      const specs = await listSpecs(root);
      if (!specs.length) return;
      const slug = await vscode.window.showQuickPick(specs, { placeHolder: 'Pick spec' });
      if (!slug) return;
      const t = await createTasks({ root, specSlug: slug });
      await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(t));
    }),
    vscode.commands.registerCommand('iniBrain.specImplement', async () => {
      const specs = await listSpecs(root);
      if (!specs.length) return;
      const slug = await vscode.window.showQuickPick(specs, { placeHolder: 'Pick spec' });
      if (!slug) return;
      const tasksFile = path.join(root, '.specify', 'specs', slug, 'tasks.md');
      await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(tasksFile));
      vscode.window.showInformationMessage('Hand tasks.md to your AI: "Implement next unchecked task and mark [x]."');
    }),
    
    // === Graph ===
    vscode.commands.registerCommand('iniBrain.buildKnowledgeGraph', () => runWithStatus(sidebar, 'Building graph', async () => {
      const graph = await buildCodeGraph(root);
      await saveGraph(root, graph);
      sidebar.log(`Graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges.`);
    })),
    vscode.commands.registerCommand('iniBrain.showKnowledgeGraph', async () => {
      let graph = await loadGraph(root);
      if (!graph) { graph = await buildCodeGraph(root); await saveGraph(root, graph); }
      const mermaid = renderMermaid(graph, { maxNodes: 60 });
      const html = renderMermaidHtml(mermaid);
      const panel = vscode.window.createWebviewPanel('iniBrainGraph', 'Knowledge Graph', vscode.ViewColumn.One, { enableScripts: true });
      panel.webview.html = html;
    }),
    vscode.commands.registerCommand('iniBrain.findImpact', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) { vscode.window.showWarningMessage('Open a file.'); return; }
      let graph = await loadGraph(root);
      if (!graph) { graph = await buildCodeGraph(root); await saveGraph(root, graph); }
      const rel = path.relative(root, editor.document.fileName).replace(/\\/g, '/');
      const impact = computeImpact(graph, rel);
      output.clear();
      output.appendLine(`# Impact of: ${rel}`);
      output.appendLine(`\n## Direct (${impact.direct.length})`);
      for (const f of impact.direct) output.appendLine(`- ${f}`);
      output.appendLine(`\n## Transitive (${impact.transitive.length})`);
      for (const f of impact.transitive) output.appendLine(`- ${f}`);
      output.show(true);
    }),
    
    // === Adapters ===
    vscode.commands.registerCommand('iniBrain.installAllAgents', async () => {
      const detected = await detectInstalledAdapters(root);
      sidebar.log(`Detected: ${detected.map(d => d.id).join(', ')}`);
      const cfg = vscode.workspace.getConfiguration('iniBrain');
      if (cfg.get<boolean>('caveman.enabled')) await vscode.commands.executeCommand('iniBrain.enableCaveman');
      if (cfg.get<boolean>('ponytail.enabled')) await vscode.commands.executeCommand('iniBrain.enablePonytail');
      vscode.window.showInformationMessage(`Deployed to ${detected.length} agents.`);
    }),
    vscode.commands.registerCommand('iniBrain.removeAllAgents', async () => {
      const yes = await vscode.window.showWarningMessage('Remove all INI Brain skills from agents?', 'Yes', 'No');
      if (yes !== 'Yes') return;
      await removeFromAllAgents(root, 'caveman');
      await removeFromAllAgents(root, 'ponytail');
      await removeFromAllAgents(root, 'claude-lean');
      vscode.window.showInformationMessage('Removed.');
    }),
    
    // === Updater ===
    vscode.commands.registerCommand('iniBrain.checkUpstream', () => runWithStatus(sidebar, 'Checking', async () => {
      const checks = await checkAll(root);
      const updates = checks.filter(c => c.hasUpdate);
      sidebar.log(`Checked ${checks.length}. ${updates.length} updates.`);
      if (!updates.length) { vscode.window.showInformationMessage('All up to date.'); return; }
      const list = updates.map(u => `• ${u.source.id}`).join('\n');
      const choice = await vscode.window.showInformationMessage(
        `${updates.length} updates:\n${list}`, 'Apply All', 'Skip'
      );
      if (choice === 'Apply All') {
        for (const u of updates) await applyOne(u.source, root, u.latestSha);
        vscode.window.showInformationMessage(`Applied ${updates.length}.`);
      }
    })),
    vscode.commands.registerCommand('iniBrain.applyUpstream', () =>
      vscode.commands.executeCommand('iniBrain.checkUpstream')),
    vscode.commands.registerCommand('iniBrain.configureAutoUpdate', async () => {
      const cfg = vscode.workspace.getConfiguration('iniBrain');
      const enabled = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Enable auto-update?' });
      if (!enabled) return;
      await cfg.update('autoUpdate.enabled', enabled === 'Yes', vscode.ConfigurationTarget.Workspace);
      if (enabled === 'Yes') {
        const h = await vscode.window.showInputBox({ prompt: 'Hours between checks', value: String(cfg.get<number>('autoUpdate.intervalHours', 168)) });
        if (h) await cfg.update('autoUpdate.intervalHours', Number(h), vscode.ConfigurationTarget.Workspace);
      }
      vscode.window.showInformationMessage('Auto-update configured.');
    }),
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
