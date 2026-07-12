import * as vscode from 'vscode';
import { OnboardingState } from '../core/types';

type ChatRole = 'user' | 'assistant' | 'system';

export class SidebarProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private status = 'Ready';
  private readonly logs: string[] = [];
  private readonly chatMessages: Array<{ role: ChatRole; text: string }> = [];

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = { enableScripts: true };
    view.webview.html = this.render();
    view.webview.onDidReceiveMessage(message => {
      if (message?.command === 'clearConsole') {
        this.clear();
        return;
      }
      if (message?.command === 'refresh') {
        this.refresh();
        return;
      }
      const command = typeof message?.command === 'string'
        ? message.command
        : message?.type === 'command' && typeof message.id === 'string'
          ? message.id
          : undefined;
      if (!command) return;
      void vscode.commands.executeCommand(command, message.payload);
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
    this.logs.unshift(`[${new Date().toLocaleTimeString()}] ${message}`);
    this.logs.splice(100);
    this.refresh();
  }

  addChatMessage(role: ChatRole, text: string): void {
    this.chatMessages.push({ role, text });
    this.chatMessages.splice(0, Math.max(0, this.chatMessages.length - 20));
    this.refresh();
  }

  clear(): void {
    this.logs.splice(0);
    this.refresh();
  }

  private refresh(): void {
    if (this.view) this.view.webview.html = this.render();
  }

  private render(): string {
    const nonce = getNonce();
    const statusClass = this.status.toLowerCase().replace(/\s+/g, '-');
    const legacyButtons = [
      ['Scan Project', 'iniBrain.scanProject', 'primary'],
      ['Rebuild Brain', 'iniBrain.rebuildBrain', 'secondary'],
      ['Ask AI', 'openAskChat', 'secondary'],
      ['Auto Mode', 'iniBrain.autoMode', 'secondary'],
      ['Generate Project', 'iniBrain.generateProject', 'primary'],
      ['Agent Guide', 'iniBrain.generateAgentGuide', 'secondary'],
      ['Skills & Workflow', 'iniBrain.generateSkillsWorkflow', 'secondary'],
      ['Onboarding', 'iniBrain.generateOnboarding', 'secondary'],
      ['Explain File', 'iniBrain.explainFile', 'secondary'],
      ['Analyze Impact', 'iniBrain.analyzeImpact', 'secondary'],
      ['Quality Guards', 'iniBrain.generateGuards', 'secondary'],
      ['Restore Backup', 'iniBrain.restoreBackup', 'secondary'],
      ['Copy for Cline', 'iniBrain.copyContextForCline', 'secondary'],
      ['Save Memory', 'iniBrain.saveMemory', 'primary'],
      ['Search Memory', 'iniBrain.searchMemory', 'secondary'],
      ['Memory Profile', 'iniBrain.showMemoryProfile', 'secondary'],
      ['Copy MCP Config', 'iniBrain.copyMcpConfigForCline', 'secondary'],
      ['Install MCP', 'iniBrain.installMcpForCline', 'primary'],
      ['Settings', 'iniBrain.openSettings', 'secondary']
    ];
    const cards = [
      ['Token Savings', [
        ['Enable All', 'iniBrain.enableAllSavings'],
        ['Disable All', 'iniBrain.disableAllSavings'],
        ['Dashboard', 'iniBrain.showTokenDashboard'],
        ['Switch Level', 'iniBrain.switchSavingsLevel']
      ]],
      ['Knowledge Graph', [
        ['Build', 'iniBrain.buildKnowledgeGraph'],
        ['View', 'iniBrain.showKnowledgeGraph'],
        ['Find Impact', 'iniBrain.findImpact']
      ]],
      ['Spec-Driven Dev', [
        ['New Spec', 'iniBrain.specCreate'],
        ['Plan', 'iniBrain.specPlan'],
        ['Tasks', 'iniBrain.specTasks'],
        ['Implement', 'iniBrain.specImplement']
      ]],
      ['Engineering Workflow', [
        ['Enable Pack', 'iniBrain.enableEngineeringWorkflow'],
        ['Disable Pack', 'iniBrain.disableEngineeringWorkflow']
      ]],
      ['Adapters', [
        ['Install All', 'iniBrain.installAllAgents'],
        ['Remove All', 'iniBrain.removeAllAgents']
      ]],
      ['Upstream Updates', [
        ['Check Now', 'iniBrain.checkUpstream'],
        ['Configure', 'iniBrain.configureAutoUpdate']
      ]]
    ] as const;

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root { color-scheme: light dark; }
    body { font-family: var(--vscode-font-family); padding: 12px; color: var(--vscode-foreground); background: var(--vscode-sideBar-background); }
    .header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .title { display: flex; flex-direction: column; gap: 4px; }
    h2 { margin: 0; font-size: 15px; }
    .subtitle { font-size: 12px; opacity: 0.78; }
    .status { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; padding: 4px 10px; border-radius: 999px; border: 1px solid transparent; }
    .status::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: currentColor; display: inline-block; }
    .ready { color: #16a34a; background: rgba(22,163,74,0.12); }
    .scanning, .rebuilding, .generating, .setup, .auto-scan, .checking, .building-graph { color: #d97706; background: rgba(217,119,6,0.12); }
    .ai-working { color: #7c3aed; background: rgba(124,58,237,0.12); }
    .error { color: #ef4444; background: rgba(239,68,68,0.12); }
    .actions, .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .actions { margin-top: 12px; }
    .btn { padding: 8px 10px; border-radius: 6px; border: 1px solid var(--vscode-button-border, transparent); cursor: pointer; font-size: 12px; min-width: 0; }
    .btn.primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
    .btn.secondary { background: var(--vscode-button-secondaryBackground, transparent); color: var(--vscode-button-secondaryForeground, var(--vscode-foreground)); }
    .btn:hover { filter: brightness(1.08); }
    .card { border: 1px solid var(--vscode-panel-border); border-radius: 8px; padding: 10px; margin-top: 10px; background: var(--vscode-editor-background); }
    .card h3 { margin: 0 0 8px; font-size: 13px; color: var(--vscode-textLink-foreground); }
    .card .btn { padding: 6px 8px; font-size: 11px; }
    .toolbar { display: flex; gap: 8px; margin-top: 10px; }
    .toolbar .btn { flex: 1; }
    .chat { display: none; margin-top: 12px; border: 1px solid var(--vscode-panel-border); border-radius: 10px; background: var(--vscode-editor-background); overflow: hidden; }
    .chat.open { display: block; }
    .chat-header { padding: 10px; border-bottom: 1px solid var(--vscode-panel-border); }
    .chat-title { font-size: 12px; font-weight: 700; }
    .chat-help { margin-top: 4px; font-size: 11px; opacity: 0.75; line-height: 1.4; }
    .chat-messages { max-height: 300px; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
    .message { padding: 8px; border-radius: 8px; font-size: 12px; line-height: 1.45; white-space: pre-wrap; border: 1px solid transparent; }
    .message.user { background: rgba(59,130,246,0.12); border-color: rgba(59,130,246,0.22); }
    .message.assistant { background: rgba(124,58,237,0.12); border-color: rgba(124,58,237,0.22); }
    .message.system { background: rgba(245,158,11,0.12); border-color: rgba(245,158,11,0.22); }
    .composer { padding: 10px; border-top: 1px solid var(--vscode-panel-border); display: flex; flex-direction: column; gap: 8px; }
    textarea { min-height: 92px; resize: vertical; padding: 8px; border-radius: 8px; border: 1px solid var(--vscode-input-border, var(--vscode-panel-border)); color: var(--vscode-input-foreground); background: var(--vscode-input-background); font-family: var(--vscode-font-family); font-size: 12px; }
    .composer-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .console { margin-top: 12px; border-top: 1px solid var(--vscode-panel-border); padding-top: 10px; }
    .console-header { display:flex; align-items:center; justify-content:space-between; margin-bottom: 8px; }
    .console-title { font-size: 12px; font-weight: 600; opacity: 0.85; }
    .log { white-space: pre-wrap; font-size: 12px; line-height: 1.45; max-height: 420px; overflow-y: auto; padding: 8px; border: 1px solid var(--vscode-panel-border); border-radius: 8px; background: var(--vscode-editor-background); }
    .empty { opacity: 0.7; font-style: italic; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">
      <h2>INI Brain AI</h2>
      <div class="subtitle">Autonomous project understanding and evolution</div>
    </div>
    <div class="status ${statusClass}">${escapeHtml(this.status)}</div>
  </div>

  <div class="actions">
    ${legacyButtons.map(([label, command, kind]) => `<button class="btn ${kind}" data-command="${command}">${escapeHtml(label)}</button>`).join('')}
  </div>

  <div class="toolbar">
    <button class="btn secondary" data-command="refresh">Refresh</button>
    <button class="btn secondary" data-command="clearConsole">Clear Console</button>
  </div>

  ${cards.map(([title, buttons]) => `<section class="card">
    <h3>${escapeHtml(title)}</h3>
    <div class="grid">${buttons.map(([label, command]) => `<button class="btn secondary" data-command="${command}">${escapeHtml(label)}</button>`).join('')}</div>
  </section>`).join('')}

  <section id="askChat" class="chat ${this.chatMessages.length ? 'open' : ''}">
    <div class="chat-header">
      <div class="chat-title">Ask AI Chat -> Cline</div>
      <div class="chat-help">Write the idea here. INI Brain can answer with project context or copy a ready task for Cline.</div>
    </div>
    <div class="chat-messages">
      ${this.chatMessages.length ? this.chatMessages.map(message => `<div class="message ${message.role}">${escapeHtml(message.text)}</div>`).join('') : '<div class="message system">Describe the task, then choose Ask AI or Copy Task for Cline.</div>'}
    </div>
    <div class="composer">
      <textarea id="askInput" placeholder="Example: inspect the project and prepare a safe plan for this feature..."></textarea>
      <div class="composer-actions">
        <button class="btn primary" data-chat-command="iniBrain.askAI">Ask AI</button>
        <button class="btn secondary" data-chat-command="iniBrain.copyChatTaskForCline">Copy Task for Cline</button>
      </div>
    </div>
  </section>

  <div class="console">
    <div class="console-header">
      <div class="console-title">Output Console</div>
      <div class="subtitle">${this.logs.length} entries</div>
    </div>
    <div class="log">${this.logs.length ? this.logs.map(escapeHtml).join('\n') : '<span class="empty">No logs yet. Run Scan or Ask AI to get started.</span>'}</div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const askChat = document.getElementById('askChat');
    const askInput = document.getElementById('askInput');
    document.querySelectorAll('button[data-command]').forEach(button => {
      button.addEventListener('click', () => {
        const command = button.getAttribute('data-command');
        if (command === 'openAskChat') {
          askChat?.classList.toggle('open');
          askInput?.focus();
          return;
        }
        if (command) vscode.postMessage({ command });
      });
    });
    document.querySelectorAll('button[data-chat-command]').forEach(button => {
      button.addEventListener('click', () => {
        const command = button.getAttribute('data-chat-command');
        const text = askInput?.value?.trim();
        if (!command || !text) return;
        vscode.postMessage({ command, payload: text });
      });
    });
  </script>
</body>
</html>`;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  return nonce;
}
