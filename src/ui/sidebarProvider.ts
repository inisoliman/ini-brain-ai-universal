import * as vscode from 'vscode';
import { OnboardingState } from '../core/types';

export class SidebarProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private status = 'Ready';
  private readonly logs: string[] = [];

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = { enableScripts: true };
    view.webview.html = this.render(view.webview);
    view.webview.onDidReceiveMessage(message => {
      const command = typeof message?.command === 'string'
        ? message.command
        : message?.type === 'command' && typeof message.id === 'string'
          ? message.id
          : undefined;
      if (!command) return;
      void vscode.commands.executeCommand(command);
    });
  }

  setStatus(status: string): void {
    this.status = status;
    this.refresh();
  }

  setOnboarding(state: OnboardingState): void {
    this.log(`Workspace state: ${state.kind} - ${state.reason}`);
  }

  log(message: string): void {
    this.logs.unshift(`${new Date().toLocaleTimeString()} - ${message}`);
    this.logs.splice(25);
    this.refresh();
  }

  private refresh(): void {
    if (this.view) this.view.webview.html = this.render(this.view.webview);
  }

  private render(webview: vscode.Webview): string {
    const buttons = [
      ['iniBrain.scanProject', 'Scan'],
      ['iniBrain.rebuildBrain', 'Rebuild'],
      ['iniBrain.guidedSetup', 'Setup'],
      ['iniBrain.generateAgentGuide', 'Agent Guide'],
      ['iniBrain.generateSkillsWorkflow', 'Skills'],
      ['iniBrain.saveMemory', 'Save Memory'],
      ['iniBrain.searchMemory', 'Search'],
      ['iniBrain.showProjectProfile', 'Profile'],
      ['iniBrain.copyMcpConfig', 'Copy MCP'],
      ['iniBrain.installIntegrations', 'Integrations'],
      ['iniBrain.configureProvider', 'Provider']
    ];
    const cards = [
      {
        title: 'Token Savings',
        buttons: [
          ['iniBrain.enableAllSavings', 'Enable All'],
          ['iniBrain.disableAllSavings', 'Disable All'],
          ['iniBrain.showTokenDashboard', 'Dashboard'],
          ['iniBrain.switchSavingsLevel', 'Switch Level']
        ]
      },
      {
        title: 'Knowledge Graph',
        buttons: [
          ['iniBrain.buildKnowledgeGraph', 'Build'],
          ['iniBrain.showKnowledgeGraph', 'View'],
          ['iniBrain.findImpact', 'Find Impact']
        ]
      },
      {
        title: 'Spec-Driven Dev',
        buttons: [
          ['iniBrain.specCreate', 'New Spec'],
          ['iniBrain.specPlan', 'Plan'],
          ['iniBrain.specTasks', 'Tasks'],
          ['iniBrain.specImplement', 'Implement']
        ]
      },
      {
        title: 'Adapters',
        buttons: [
          ['iniBrain.installAllAgents', 'Install All'],
          ['iniBrain.removeAllAgents', 'Remove All']
        ]
      },
      {
        title: 'Upstream Updates',
        buttons: [
          ['iniBrain.checkUpstream', 'Check Now'],
          ['iniBrain.configureAutoUpdate', 'Configure']
        ]
      }
    ];
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 12px; }
    .status { border: 1px solid var(--vscode-panel-border); padding: 8px; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .card { border: 1px solid var(--vscode-panel-border); padding: 10px; margin: 10px 0; }
    .card h3 { margin: 0 0 8px; font-size: 13px; color: var(--vscode-textLink-foreground); }
    .card .grid { gap: 6px; }
    .card button { padding: 6px; font-size: 11px; }
    button { color: var(--vscode-button-foreground); background: var(--vscode-button-background); border: 0; padding: 8px; cursor: pointer; }
    button:hover { background: var(--vscode-button-hoverBackground); }
    .logs { margin-top: 14px; font-size: 12px; white-space: pre-wrap; opacity: .9; }
  </style>
</head>
<body>
  <h2>INI Brain AI</h2>
  <div class="status">${escapeHtml(this.status)}</div>
  <div class="grid">
    ${buttons.map(([command, label]) => `<button data-command="${command}">${escapeHtml(label)}</button>`).join('')}
  </div>
  ${cards.map(card => `<div class="card">
    <h3>${escapeHtml(card.title)}</h3>
    <div class="grid">
      ${card.buttons.map(([command, label]) => `<button data-command="${command}">${escapeHtml(label)}</button>`).join('')}
    </div>
  </div>`).join('')}
  <div class="logs">${this.logs.map(escapeHtml).join('\n')}</div>
  <script>
    const vscode = acquireVsCodeApi();
    document.querySelectorAll('button[data-command]').forEach(button => {
      button.addEventListener('click', () => vscode.postMessage({ type: 'command', id: button.dataset.command }));
    });
  </script>
</body>
</html>`;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
}
