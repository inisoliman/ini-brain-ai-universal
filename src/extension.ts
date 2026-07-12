import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { AgentGuideGenerator } from './core/agentGuide';
import { BrainStore } from './core/brainStore';
import { ContextBuilder } from './core/contextBuilder';
import { InsightBuilder } from './core/insightBuilder';
import { readJsonFile, writeJsonFile } from './core/jsonUtils';
import { MemoryStore, formatMemoryLine, parseCsvList } from './core/memoryStore';
import { safeResolve } from './core/pathUtils';
import { ProjectScanner } from './core/projectScanner';
import { MemoryKind } from './core/types';
import { buildMcpConfigJson } from './integrations/mcpConfig';
import { getIntegrationAdapters } from './integrations/registry';
import { ProjectOnboardingService } from './onboarding/projectOnboarding';
import { SidebarProvider } from './ui/sidebarProvider';
import { OpenAiCompatibleProvider } from './providers/openAiCompatibleProvider';
import { deployCavemanLocal, removeCavemanLocal, CavemanMode } from './savings/caveman';
import { deployPonytailLocal, removePonytailLocal, PonytailMode } from './savings/ponytail';
import { deployClaudeLeanLocal, removeClaudeLeanLocal } from './savings/claudeLean';
import { measureText, readSavingsHistory, summarizeSavings } from './savings/tokenMeter';
import { removeAllSavings } from './savings';
import { createSpec, createPlan, createTasks, listSpecs } from './methodology/specKit';
import { deployEngineeringWorkflowLocal, ENGINEERING_WORKFLOW_SKILLS, removeEngineeringWorkflowLocal } from './methodology/engineeringWorkflow';
import { buildCodeGraph, loadGraph, saveGraph, computeImpact } from './graph/knowledgeGraph';
import { renderMermaid, renderMermaidHtml } from './graph/mermaidRenderer';
import { deployToAllAgents, removeFromAllAgents, detectInstalledAdapters } from './adapters/registry';
import { checkAll, applyOne } from './updater/repoSync';

let output: vscode.OutputChannel;

interface CodeChange {
  path: string;
  action: 'create' | 'update' | 'delete';
  content?: string;
}

interface AppliedChange {
  path: string;
  action: CodeChange['action'];
  backupPath?: string;
}

interface AutoModeOptions {
  root: string;
  context: vscode.ExtensionContext;
  contextBuilder: ContextBuilder;
  sidebar: SidebarProvider;
  request: string;
  title: string;
}

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
  const contextBuilder = new ContextBuilder(root);
  const insights = new InsightBuilder();

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
    vscode.commands.registerCommand('iniBrain.openSettings', () => showSettingsPanel(context, sidebar)),
    vscode.commands.registerCommand('iniBrain.askAI', (chatRequest?: string) => runWithStatus(sidebar, 'AI Working', async () => {
      const request = chatRequest || await vscode.window.showInputBox({ prompt: 'What do you want to ask INI Brain AI?' });
      if (!request) return;
      sidebar.addChatMessage('user', request);
      const answer = await askWithProjectContext(context, contextBuilder, request);
      output.clear();
      output.appendLine('# INI Brain AI Answer');
      output.appendLine('');
      output.appendLine(answer);
      output.show(true);
      sidebar.addChatMessage('assistant', summarizeForSidebar(answer));
      sidebar.log('AI answer generated. Check the Output panel.');
    })),
    vscode.commands.registerCommand('iniBrain.copyChatTaskForCline', (chatRequest?: string) => runWithStatus(sidebar, 'Ready', async () => {
      if (!chatRequest?.trim()) {
        vscode.window.showWarningMessage('Write your idea in Ask AI Chat first.');
        return;
      }
      const taskContext = await contextBuilder.build(chatRequest, 14000);
      await vscode.env.clipboard.writeText(buildClineTask(chatRequest, taskContext));
      sidebar.addChatMessage('system', 'Task copied for Cline with INI Brain context.');
      sidebar.log('Ask AI chat task copied for Cline.');
    })),
    vscode.commands.registerCommand('iniBrain.autoMode', () => runWithStatus(sidebar, 'AI Working', async () => {
      const request = await vscode.window.showInputBox({ prompt: 'Describe the change. INI Brain will prepare an implementation plan.' });
      if (!request) return;
      await runAutoMode({ root, context, contextBuilder, sidebar, request, title: 'Auto Mode' });
    })),
    vscode.commands.registerCommand('iniBrain.generateProject', () => runWithStatus(sidebar, 'AI Working', async () => generateProject(root, context, contextBuilder, sidebar))),
    vscode.commands.registerCommand('iniBrain.copyContextForCline', () => runWithStatus(sidebar, 'Ready', async () => {
      await vscode.env.clipboard.writeText(await contextBuilder.build('project architecture decisions workflow bugs preferences', 16000));
      sidebar.log('Compact context copied for Cline.');
      vscode.window.showInformationMessage('INI Brain context copied. Paste it into Cline before your prompt.');
    })),
    vscode.commands.registerCommand('iniBrain.showMemoryProfile', () => runWithStatus(sidebar, 'Ready', async () => showMemoryProfile(memory, sidebar))),
    vscode.commands.registerCommand('iniBrain.copyMcpConfigForCline', () => vscode.commands.executeCommand('iniBrain.copyMcpConfig')),
    vscode.commands.registerCommand('iniBrain.installMcpForCline', () => runWithStatus(sidebar, 'Ready', async () => installMcpForCline(root, sidebar))),
    vscode.commands.registerCommand('iniBrain.generateOnboarding', () => runWithStatus(sidebar, 'Ready', async () => {
      const brain = await brainStore.readBrain() || await brainStore.writeScan(await scanner.scan());
      const markdown = insights.buildOnboarding(brain);
      const outPath = path.join(root, '.brain', 'onboarding.md');
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, markdown, 'utf8');
      output.clear();
      output.appendLine(markdown);
      output.show(true);
      sidebar.log('Onboarding guide generated: .brain/onboarding.md');
    })),
    vscode.commands.registerCommand('iniBrain.explainFile', () => runWithStatus(sidebar, 'Ready', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) { vscode.window.showWarningMessage('Open a file in the editor first.'); return; }
      const brain = await brainStore.readBrain() || await brainStore.writeScan(await scanner.scan());
      const rel = path.relative(root, editor.document.uri.fsPath).replace(/\\/g, '/');
      const result = insights.buildExplain(brain, rel);
      output.clear();
      output.appendLine(result.markdown);
      output.show(true);
      sidebar.log(`Explained file: ${rel}${result.found ? '' : ' (not indexed)'}`);
    })),
    vscode.commands.registerCommand('iniBrain.analyzeImpact', () => runWithStatus(sidebar, 'Ready', async () => {
      const changed = await getGitChangedFiles(root);
      if (changed.length === 0) { vscode.window.showInformationMessage('No changed files detected via git.'); return; }
      const brain = await brainStore.readBrain() || await brainStore.writeScan(await scanner.scan());
      const result = insights.buildImpact(brain, changed);
      output.clear();
      output.appendLine(result.markdown);
      output.show(true);
      sidebar.log(`Impact analysis: ${result.changedFiles.length} changed, ${result.affectedFiles.length} affected, risk=${result.risk}.`);
    })),
    vscode.commands.registerCommand('iniBrain.generateGuards', () => runWithStatus(sidebar, 'Generating', async () => {
      const scan = await scanner.scan();
      const brain = await brainStore.writeScan(scan);
      const result = await agentGuide.generate(brain);
      sidebar.log(`Quality guards generated in skills dirs and ${result.qualityGatesPath}.`);
      vscode.window.showInformationMessage('INI Brain generated quality guards.');
    })),
    vscode.commands.registerCommand('iniBrain.restoreBackup', () => runWithStatus(sidebar, 'Ready', async () => restoreBackup(root, sidebar))),
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
      vscode.window.showInformationMessage(`Caveman enabled (${mode}). Measure results for your prompts; savings vary by task and model.`);
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
      vscode.window.showInformationMessage(`Ponytail enabled (${mode}). It favors smaller implementations; savings vary by task and model.`);
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
      vscode.window.showInformationMessage('All savings enabled. Verify savings with token comparison or client usage data.');
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

    // === Engineering Workflow Pack ===
    vscode.commands.registerCommand('iniBrain.enableEngineeringWorkflow', () => runWithStatus(sidebar, 'Generating', async () => {
      await deployEngineeringWorkflowLocal(root);
      for (const workflowSkill of ENGINEERING_WORKFLOW_SKILLS) {
        const body = await fs.readFile(path.join(root, '.brain', 'skills', `${workflowSkill.id}.md`), 'utf8');
        await deployToAllAgents({ root, skillName: workflowSkill.id, skillBody: body, onlyInstalled: true });
      }
      await vscode.workspace.getConfiguration('iniBrain').update('engineeringWorkflow.enabled', true, vscode.ConfigurationTarget.Workspace);
      vscode.window.showInformationMessage(`Engineering Workflow enabled with ${ENGINEERING_WORKFLOW_SKILLS.length} focused skills.`);
    })),
    vscode.commands.registerCommand('iniBrain.disableEngineeringWorkflow', () => runWithStatus(sidebar, 'Ready', async () => {
      await removeEngineeringWorkflowLocal(root);
      await Promise.all(ENGINEERING_WORKFLOW_SKILLS.map(workflowSkill => removeFromAllAgents(root, workflowSkill.id)));
      await vscode.workspace.getConfiguration('iniBrain').update('engineeringWorkflow.enabled', false, vscode.ConfigurationTarget.Workspace);
      vscode.window.showInformationMessage('Engineering Workflow disabled.');
    })),
    
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
      if (cfg.get<boolean>('engineeringWorkflow.enabled')) await vscode.commands.executeCommand('iniBrain.enableEngineeringWorkflow');
      vscode.window.showInformationMessage(`Deployed to ${detected.length} agents.`);
    }),
    vscode.commands.registerCommand('iniBrain.removeAllAgents', async () => {
      const yes = await vscode.window.showWarningMessage('Remove all INI Brain skills from agents?', 'Yes', 'No');
      if (yes !== 'Yes') return;
      await removeFromAllAgents(root, 'caveman');
      await removeFromAllAgents(root, 'ponytail');
      await removeFromAllAgents(root, 'claude-lean');
      await Promise.all(ENGINEERING_WORKFLOW_SKILLS.map(workflowSkill => removeFromAllAgents(root, workflowSkill.id)));
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
    ...registerLegacyCommandAliases({
      scanProject: 'iniBrain.scanProject',
      rebuildBrain: 'iniBrain.rebuildBrain',
      askAI: 'iniBrain.askAI',
      generateProject: 'iniBrain.generateProject',
      autoMode: 'iniBrain.autoMode',
      openSettings: 'iniBrain.openSettings',
      generateAgentGuide: 'iniBrain.generateAgentGuide',
      copyContextForCline: 'iniBrain.copyContextForCline',
      generateSkillsWorkflow: 'iniBrain.generateSkillsWorkflow',
      saveMemory: 'iniBrain.saveMemory',
      searchMemory: 'iniBrain.searchMemory',
      showMemoryProfile: 'iniBrain.showMemoryProfile',
      copyMcpConfigForCline: 'iniBrain.copyMcpConfigForCline',
      installMcpForCline: 'iniBrain.installMcpForCline',
      copyChatTaskForCline: 'iniBrain.copyChatTaskForCline',
      generateOnboarding: 'iniBrain.generateOnboarding',
      explainFile: 'iniBrain.explainFile',
      analyzeImpact: 'iniBrain.analyzeImpact',
      generateGuards: 'iniBrain.generateGuards',
      restoreBackup: 'iniBrain.restoreBackup'
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

async function askWithProjectContext(context: vscode.ExtensionContext, contextBuilder: ContextBuilder, request: string): Promise<string> {
  const cfg = vscode.workspace.getConfiguration('iniBrain');
  const provider = new OpenAiCompatibleProvider({
    apiBaseUrl: cfg.get('apiBaseUrl', 'https://api.openai.com/v1/'),
    modelName: cfg.get('modelName', 'gpt-4.1'),
    apiKey: await context.secrets.get('iniBrain.apiKey'),
    requestTimeoutMs: cfg.get('requestTimeoutMs', 120000)
  });
  const projectContext = await contextBuilder.build(request, cfg.get('maxContextFiles', 16) * 1200);
  return provider.chat(
    'You are INI Brain AI inside VS Code. Use the project context, answer directly, avoid secrets, and prefer safe, minimal changes.',
    `${projectContext}\n\nUser request:\n${request}`
  );
}

async function generateProject(root: string, context: vscode.ExtensionContext, contextBuilder: ContextBuilder, sidebar: SidebarProvider): Promise<void> {
  const requestPath = path.join(root, 'project_request.md');
  try {
    await fs.access(requestPath);
  } catch {
    await fs.writeFile(requestPath, '# Project Request\n\nDescribe the project you want INI Brain AI to generate.\n', 'utf8');
    vscode.window.showInformationMessage('Created project_request.md. Fill it, then run Generate Project again.');
    return;
  }
  const request = await fs.readFile(requestPath, 'utf8');
  await runAutoMode({
    root,
    context,
    contextBuilder,
    sidebar,
    request: `Generate a project from project_request.md.\n\n${request}`,
    title: 'Generate Project'
  });
}

async function runAutoMode(opts: AutoModeOptions): Promise<void> {
  const { root, context, contextBuilder, sidebar, request, title } = opts;
  sidebar.log(`${title}: planning changes...`);
  const prompt = [
    'Prepare the safest minimal implementation for this request.',
    'If file edits are ready, include exactly one fenced JSON block using this schema:',
    '{"changes":[{"path":"relative/path","action":"create|update|delete","content":"complete file content for create/update"}]}',
    'Use workspace-relative paths only. Do not modify .git, .brain/backups, secrets, API keys, or binary files.',
    'For update actions, provide the complete final file content.',
    '',
    'Request:',
    request
  ].join('\n');
  const answer = await askWithProjectContext(context, contextBuilder, prompt);
  const changes = extractChanges(answer);

  output.clear();
  output.appendLine(`# ${title}`);
  output.appendLine('');
  output.appendLine(answer);
  output.appendLine('');
  output.appendLine('# Proposed Changes');
  output.appendLine(changes.length ? changes.map(c => `- ${c.action}: ${c.path}`).join('\n') : 'No machine-readable changes block found; no files were modified.');
  output.show(true);

  if (!changes.length) {
    sidebar.log(`${title}: no changes to apply.`);
    return;
  }

  const cfg = vscode.workspace.getConfiguration('iniBrain');
  const confirmEach = cfg.get<boolean>('autoModeConfirmEachChange', true);
  const message = confirmEach
    ? `${title} will apply ${changes.length} file change(s). Review the Output panel first.`
    : `${title} will apply ${changes.length} AI-generated file change(s).`;
  const ok = await vscode.window.showWarningMessage(message, { modal: true }, 'Apply Changes');
  if (ok !== 'Apply Changes') {
    sidebar.log(`${title}: cancelled before applying changes.`);
    return;
  }

  const applied = await applyAutoModeChanges(root, changes);
  await pruneBackups(root, cfg.get<number>('backupRetention', 50));
  output.appendLine('');
  output.appendLine('# Applied Changes');
  output.appendLine(applied.map(c => `- ${c.action}: ${c.path}${c.backupPath ? ` (backup: ${c.backupPath})` : ''}`).join('\n'));
  output.show(true);
  sidebar.log(`${title}: applied ${applied.length} change(s).`);
}

async function applyAutoModeChanges(root: string, changes: CodeChange[]): Promise<AppliedChange[]> {
  const applied: AppliedChange[] = [];
  for (const change of changes) {
    applied.push(await applyAutoModeChange(root, change));
  }
  return applied;
}

async function applyAutoModeChange(root: string, change: CodeChange): Promise<AppliedChange> {
  const target = safeResolve(root, change.path);
  const backupPath = await backupIfExists(root, target, change.path);

  if (change.action === 'delete') {
    await fs.rm(target, { force: true, recursive: false });
    return { path: change.path, action: change.action, backupPath };
  }

  if (typeof change.content !== 'string') throw new Error(`Missing content for ${change.action}: ${change.path}`);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, change.content, 'utf8');
  return { path: change.path, action: change.action, backupPath };
}

async function backupIfExists(root: string, target: string, relativePath: string): Promise<string | undefined> {
  let stat: Awaited<ReturnType<typeof fs.stat>>;
  try {
    stat = await fs.stat(target);
  } catch (error) {
    if (isErrorCode(error, 'ENOENT')) return undefined;
    throw error;
  }
  if (!stat.isFile()) return undefined;
  const safeName = relativePath.split(/[\\/]/).join('__');
  const backupRel = path.posix.join('.brain', 'backups', `${Date.now()}-${safeName}`);
  const backupAbs = path.join(root, backupRel);
  await fs.mkdir(path.dirname(backupAbs), { recursive: true });
  await fs.copyFile(target, backupAbs);
  return backupRel;
}

function isErrorCode(error: unknown, code: string): boolean {
  return error instanceof Error && 'code' in error && error.code === code;
}

async function readDirectoryIfExists(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch (error) {
    if (isErrorCode(error, 'ENOENT')) return [];
    throw error;
  }
}

async function readJsonIfExists<T>(file: string, fallback: T): Promise<T> {
  return readJsonFile(file, fallback);
}

async function readTextIfExists(file: string, fallback: string): Promise<string> {
  try {
    return await fs.readFile(file, 'utf8');
  } catch (error) {
    if (isErrorCode(error, 'ENOENT')) return fallback;
    throw error;
  }
}

async function fileExists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch (error) {
    if (isErrorCode(error, 'ENOENT')) return false;
    throw error;
  }
}

async function writeIfMissing(file: string, content: string): Promise<void> {
  if (await fileExists(file)) return;
  await fs.writeFile(file, content, 'utf8');
}

async function readText(file: string, fallback: string): Promise<string> {
  return readTextIfExists(file, fallback);
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  return readJsonIfExists(file, fallback);
}

async function listBackupEntries(root: string): Promise<string[]> {
  return readDirectoryIfExists(path.join(root, '.brain', 'backups'));
}

async function copyBackupToTarget(root: string, backupName: string, target: string): Promise<void> {
  await fs.copyFile(path.join(root, '.brain', 'backups', backupName), target);
}

async function pruneBackups(root: string, retention = 50): Promise<void> {
  if (!retention || retention <= 0) return;
  const dir = path.join(root, '.brain', 'backups');
  const entries = await readDirectoryIfExists(dir);
  if (entries.length <= retention) return;
  const toDelete = entries.sort().slice(0, entries.length - retention);
  await Promise.all(toDelete.map(name => fs.rm(path.join(dir, name), { force: true })));
}

function extractChanges(text: string): CodeChange[] {
  const blocks = [...text.matchAll(/```json\s*([\s\S]*?)```/gi)];
  for (const match of blocks) {
    try {
      const parsed = JSON.parse(match[1]) as { changes?: CodeChange[] };
      if (Array.isArray(parsed.changes)) {
        return parsed.changes.filter(change =>
          change &&
          typeof change.path === 'string' &&
          (change.action === 'create' || change.action === 'update' || change.action === 'delete') &&
          (change.action === 'delete' || typeof change.content === 'string')
        );
      }
    } catch {
      // Try the next fenced JSON block.
    }
  }
  return [];
}

function summarizeForSidebar(text: string): string {
  const compact = text.replace(/\r/g, '').split('\n').filter(line => line.trim()).slice(0, 12).join('\n');
  return compact.length > 1200 ? `${compact.slice(0, 1200)}...\n\nFull answer is available in the Output panel.` : `${compact}\n\nFull answer is available in the Output panel.`;
}

function buildClineTask(request: string, projectContext: string): string {
  return [
    '<task>',
    request.trim(),
    '</task>',
    '',
    '## INI Brain AI Context',
    'Use this project context, then implement the task in Cline. Follow AGENTS.md, inspect files before editing, make minimal compatible changes, and run verification commands.',
    '',
    projectContext
  ].join('\n');
}

async function showMemoryProfile(memory: MemoryStore, sidebar: SidebarProvider): Promise<void> {
  const profile = await memory.buildProfile();
  output.clear();
  output.appendLine('# INI Brain Memory Profile');
  output.appendLine(`Generated: ${profile.generatedAt}`);
  output.appendLine(`Total memories: ${profile.totalMemories}`);
  output.appendLine('');
  output.appendLine('## Top Concepts');
  output.appendLine(profile.topConcepts.map(item => `- ${item.concept}: ${item.count}`).join('\n') || '- None');
  output.appendLine('');
  output.appendLine('## Top Files');
  output.appendLine(profile.topFiles.map(item => `- ${item.file}: ${item.count}`).join('\n') || '- None');
  output.appendLine('');
  output.appendLine('## Important Decisions');
  output.appendLine(profile.importantDecisions.map(formatMemoryLine).join('\n') || '- None');
  output.appendLine('');
  output.appendLine('## Recent Memories');
  output.appendLine(profile.recentMemories.map(formatMemoryLine).join('\n') || '- None');
  output.show(true);
  sidebar.log(`Memory profile shown. Total memories: ${profile.totalMemories}.`);
}

async function installMcpForCline(root: string, sidebar: SidebarProvider): Promise<void> {
  const settingsPath = getClineMcpSettingsPath();
  const ok = await vscode.window.showWarningMessage(`Install/update INI Brain MCP in Cline settings?\n\n${settingsPath}`, { modal: true }, 'Install');
  if (ok !== 'Install') return;
  const current = await readJson<Record<string, unknown>>(settingsPath, {});
  const currentServers = current.mcpServers && typeof current.mcpServers === 'object' && !Array.isArray(current.mcpServers)
    ? current.mcpServers as Record<string, unknown>
    : {};
  const next = {
    ...current,
    mcpServers: {
      ...currentServers,
      'ini-brain-ai': {
        command: 'node',
        args: [getMcpServerScript()],
        env: { INI_BRAIN_WORKSPACE: root },
        disabled: false,
        autoApprove: []
      }
    }
  };
  await writeJsonFile(settingsPath, next);
  sidebar.log(`INI Brain MCP installed for Cline: ${settingsPath}`);
  vscode.window.showInformationMessage('INI Brain MCP installed for Cline. Reload Cline MCP servers or reload VS Code.');
}

function getClineMcpSettingsPath(): string {
  const tail = ['globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'];
  const home = process.env.USERPROFILE || process.env.HOME || '';
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'Code', 'User', ...tail);
  }
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'Code', 'User', ...tail);
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(home, '.config'), 'Code', 'User', ...tail);
}

async function getGitChangedFiles(root: string): Promise<string[]> {
  const { exec } = await import('child_process');
  return new Promise(resolve => {
    exec('git status --porcelain', { cwd: root, windowsHide: true }, (error, stdout) => {
      if (error) { resolve([]); return; }
      const files = stdout
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => line.replace(/^.{2,3}\s+/, '').split(' -> ').pop()!.trim())
        .filter(Boolean);
      resolve([...new Set(files)]);
    });
  });
}

async function restoreBackup(root: string, sidebar: SidebarProvider): Promise<void> {
  let entries = await listBackupEntries(root);
  if (!entries.length) {
    vscode.window.showInformationMessage('No Auto Mode backups found in .brain/backups.');
    return;
  }
  entries = entries.sort().reverse();
  const pick = await vscode.window.showQuickPick(entries, { placeHolder: 'Select a backup to restore' });
  if (!pick) return;
  const relPath = pick.replace(/^\d+-/, '').split('__').join('/');
  const target = path.join(root, relPath);
  const ok = await vscode.window.showWarningMessage(`Restore backup to ${relPath}? This overwrites the current file.`, { modal: true }, 'Restore');
  if (ok !== 'Restore') return;
  await fs.mkdir(path.dirname(target), { recursive: true });
  await copyBackupToTarget(root, pick, target);
  sidebar.log(`Restored backup ${pick} to ${relPath}`);
}

function showSettingsPanel(context: vscode.ExtensionContext, sidebar: SidebarProvider): void {
  const cfg = vscode.workspace.getConfiguration('iniBrain');
  const panel = vscode.window.createWebviewPanel('iniBrainSettings', 'INI Brain AI Settings', vscode.ViewColumn.One, { enableScripts: true });
  const nonce = Math.random().toString(36).slice(2);
  panel.webview.html = `<!doctype html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';"><style>
    body{font-family:var(--vscode-font-family);color:var(--vscode-foreground);padding:28px;max-width:900px}
    label{display:block;font-weight:600;margin:18px 0 6px} input{box-sizing:border-box;width:100%;padding:8px;border:1px solid var(--vscode-input-border);background:var(--vscode-input-background);color:var(--vscode-input-foreground)}
    button{margin-top:18px;margin-right:8px;padding:8px 14px;border:0;background:var(--vscode-button-background);color:var(--vscode-button-foreground);cursor:pointer}.danger{background:transparent;color:var(--vscode-errorForeground);border:1px solid var(--vscode-errorForeground)}
  </style></head><body>
    <h1>INI Brain AI Settings</h1>
    <p>API Key is stored only in VS Code SecretStorage. It is never written to workspace settings or .brain files.</p>
    <label>API Base URL</label><input id="apiBaseUrl" value="${escapeAttr(cfg.get('apiBaseUrl', 'https://api.openai.com/v1/'))}">
    <label>API Key (saved securely)</label><input id="apiKey" type="password" placeholder="Paste a new key only if you want to replace the saved one">
    <p>Leave blank to keep the existing key.</p>
    <label>Model Name</label><input id="modelName" value="${escapeAttr(cfg.get('modelName', 'gpt-4.1'))}">
    <button id="save">Save Settings</button><button id="clear" class="danger">Clear API Key</button>
    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
      document.getElementById('save').addEventListener('click', () => vscode.postMessage({ type:'save', apiBaseUrl: apiBaseUrl.value, apiKey: apiKey.value, modelName: modelName.value }));
      document.getElementById('clear').addEventListener('click', () => vscode.postMessage({ type:'clearKey' }));
    </script>
  </body></html>`;
  panel.webview.onDidReceiveMessage(async message => {
    if (message?.type === 'save') {
      await cfg.update('apiBaseUrl', String(message.apiBaseUrl || '').trim(), vscode.ConfigurationTarget.Workspace);
      await cfg.update('modelName', String(message.modelName || '').trim(), vscode.ConfigurationTarget.Workspace);
      if (String(message.apiKey || '').trim()) await context.secrets.store('iniBrain.apiKey', String(message.apiKey).trim());
      sidebar.log('AI provider settings saved.');
      vscode.window.showInformationMessage('INI Brain settings saved.');
    }
    if (message?.type === 'clearKey') {
      await context.secrets.delete('iniBrain.apiKey');
      sidebar.log('AI provider API key cleared.');
      vscode.window.showInformationMessage('INI Brain API key cleared.');
    }
  });
}

function escapeAttr(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
}

function getMcpServerScript(): string {
  return path.join(__dirname, 'mcp', 'server.js');
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
function registerLegacyCommandAliases(commands: Record<string, string>): vscode.Disposable[] {
  return Object.entries(commands).map(([legacyId, currentId]) =>
    vscode.commands.registerCommand(`projectBrain.${legacyId}`, (...args: unknown[]) =>
      vscode.commands.executeCommand(currentId, ...args)
    )
  );
}
