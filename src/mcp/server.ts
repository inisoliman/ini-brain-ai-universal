#!/usr/bin/env node
import * as fs from 'fs/promises';
import * as path from 'path';
import { AgentGuideGenerator } from '../core/agentGuide';
import { AutoBackground } from '../core/autoBackground';
import { BrainStore } from '../core/brainStore';
import { ContextBuilder } from '../core/contextBuilder';
import { InsightBuilder } from '../core/insightBuilder';
import { MemoryStore, parseCsvList } from '../core/memoryStore';
import { ProjectScanner } from '../core/projectScanner';
import { MemoryKind } from '../core/types';
import { resolveWorkspace } from './workspace';

const GOLDEN_PROMPT = [
  'INI Brain protocol for every coding task:',
  '1. At the START of any task, call ini_brain_auto_brief once to load AGENTS.md, the compact project context, runtime memory, and prior decisions.',
  '2. Before editing files, call ini_brain_get_context with the user task to get a focused brief.',
  '3. Use ini_brain_search_memory whenever past decisions or bugs may matter.',
  '4. Use ini_brain_explain on a file before changing it, and ini_brain_impact on the changed file list before finalizing.',
  '5. After finishing, call ini_brain_save_memory to persist durable decisions, fixes, or workflow insights.',
  'A background scan keeps .brain/ and AGENTS.md fresh automatically. You never need to ask the user to run a scan.'
].join('\n');

const JSON_RPC_VERSION = '2.0';

const ErrorCode = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603
} as const;

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

class McpError extends Error {
  constructor(readonly code: number, message: string, readonly data?: unknown) {
    super(message);
  }
}

const TOOLS = [
  { name: 'ini_brain_auto_brief', description: 'AUTO-CALL THIS FIRST in every new task. Loads AGENTS.md, compact context, decisions, recent memories and the INI Brain protocol so the agent can plan before editing.', inputSchema: { type: 'object', properties: { ...workspaceProperty(), task: { type: 'string', description: 'Optional current user task for memory matching.' } } }, annotations: readOnlyAnnotations() },
  { name: 'ini_brain_status', description: 'Show workspace and INI Brain status.', inputSchema: { type: 'object', properties: workspaceProperty() }, annotations: readOnlyAnnotations() },
  { name: 'ini_brain_get_context', description: 'Build compact task context from project brain and runtime memory. Call before editing.', inputSchema: { type: 'object', properties: { ...workspaceProperty(), task: { type: 'string' }, budgetChars: { type: 'number' } }, required: ['task'] }, annotations: readOnlyAnnotations() },
  { name: 'ini_brain_search_memory', description: 'Search local runtime memory.', inputSchema: { type: 'object', properties: { ...workspaceProperty(), query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] }, annotations: readOnlyAnnotations() },
  { name: 'ini_brain_save_memory', description: 'Save durable project memory after a task.', inputSchema: { type: 'object', properties: { ...workspaceProperty(), content: { type: 'string' }, kind: { type: 'string' }, files: { type: 'array', items: { type: 'string' } }, concepts: { type: 'array', items: { type: 'string' } }, importance: { type: 'number' } }, required: ['content'] }, annotations: localWriteAnnotations() },
  { name: 'ini_brain_list_memories', description: 'List the most recent durable memories.', inputSchema: { type: 'object', properties: { ...workspaceProperty(), limit: { type: 'number' } } }, annotations: readOnlyAnnotations() },
  { name: 'ini_brain_project_profile', description: 'Return project map and memory profile.', inputSchema: { type: 'object', properties: workspaceProperty() }, annotations: readOnlyAnnotations() },
  { name: 'ini_brain_onboarding', description: 'Generate a project onboarding guide (start-here files, entry points, complexity hotspots) without an LLM.', inputSchema: { type: 'object', properties: workspaceProperty() }, annotations: readOnlyAnnotations() },
  { name: 'ini_brain_explain', description: 'Explain a single file: exports, dependencies, dependents and summary.', inputSchema: { type: 'object', properties: { ...workspaceProperty(), path: { type: 'string', description: 'Project-relative file path.' } }, required: ['path'] }, annotations: readOnlyAnnotations() },
  { name: 'ini_brain_impact', description: 'Analyze the ripple effect (blast radius) of changing a list of files using the dependency graph.', inputSchema: { type: 'object', properties: { ...workspaceProperty(), files: { type: 'array', items: { type: 'string' } } }, required: ['files'] }, annotations: readOnlyAnnotations() },
  { name: 'ini_brain_generate_agent_guide', description: 'Scan project and regenerate AGENTS.md plus .brain workflow files. Usually unnecessary because a background scan keeps these fresh.', inputSchema: { type: 'object', properties: workspaceProperty() }, annotations: localWriteAnnotations() },
  { name: 'ini_brain_suggest_skills', description: 'Return deterministic skill suggestions based on scanned project files.', inputSchema: { type: 'object', properties: workspaceProperty() }, annotations: readOnlyAnnotations() },
  { name: 'ini_brain_generate_workflow', description: 'Return current workflow guidance from .brain.', inputSchema: { type: 'object', properties: workspaceProperty() }, annotations: readOnlyAnnotations() }
] as const;

class IniBrainMcpServer {
  private inputBuffer = Buffer.alloc(0);
  private transportMode: 'headers' | 'lines' = 'lines';

  async run(): Promise<void> {
    process.stdin.on('data', chunk => this.onData(Buffer.from(chunk)));
    process.stdin.on('error', error => console.error('[INI Brain MCP] stdin error', error));
    const workspace = getWorkspace({});
    console.error(`[INI Brain MCP] running locally for ${workspace}`);
    // Background bootstrap: keep .brain/ and AGENTS.md fresh without user action.
    const auto = AutoBackground.for(workspace);
    auto.ensureFresh().then(result => {
      if (result.scanned) console.error(`[INI Brain MCP] background scan triggered (${result.reason})`);
      auto.start();
    }).catch(error => console.error('[INI Brain MCP] bootstrap error', error));
    process.on('SIGINT', () => { auto.stop(); process.exit(0); });
    process.on('SIGTERM', () => { auto.stop(); process.exit(0); });
  }

  private onData(chunk: Buffer): void {
    this.inputBuffer = Buffer.concat([this.inputBuffer, chunk]);
    for (;;) {
      const message = this.readNextMessage();
      if (!message) return;
      void this.handleMessage(message).catch(error => console.error('[INI Brain MCP] message error', error));
    }
  }

  private readNextMessage(): JsonRpcRequest | null {
    const prefix = this.inputBuffer.toString('utf8', 0, Math.min(this.inputBuffer.length, 32)).trimStart();
    if (prefix.startsWith('{')) return this.readNextLineMessage();
    const separator = this.inputBuffer.indexOf('\r\n\r\n');
    if (separator === -1) return null;
    this.transportMode = 'headers';
    const header = this.inputBuffer.subarray(0, separator).toString('utf8');
    const match = /^Content-Length:\s*(\d+)$/im.exec(header);
    if (!match) throw new McpError(ErrorCode.InvalidRequest, 'Missing Content-Length header');
    const length = Number(match[1]);
    const bodyStart = separator + 4;
    const bodyEnd = bodyStart + length;
    if (this.inputBuffer.length < bodyEnd) return null;
    const body = this.inputBuffer.subarray(bodyStart, bodyEnd).toString('utf8');
    this.inputBuffer = this.inputBuffer.subarray(bodyEnd);
    return parseMessage(body);
  }

  private readNextLineMessage(): JsonRpcRequest | null {
    const newline = this.inputBuffer.indexOf('\n');
    if (newline === -1) return null;
    this.transportMode = 'lines';
    const line = this.inputBuffer.subarray(0, newline).toString('utf8').trim();
    this.inputBuffer = this.inputBuffer.subarray(newline + 1);
    return line ? parseMessage(line) : this.readNextMessage();
  }

  private async handleMessage(request: JsonRpcRequest): Promise<void> {
    if (!request.id && request.method?.startsWith('notifications/')) return;
    const id = request.id ?? null;
    try {
      if (request.jsonrpc && request.jsonrpc !== JSON_RPC_VERSION) throw new McpError(ErrorCode.InvalidRequest, 'Only JSON-RPC 2.0 is supported');
      if (!request.method) throw new McpError(ErrorCode.InvalidRequest, 'method is required');
      this.writeResponse({ jsonrpc: JSON_RPC_VERSION, id, result: await this.dispatch(request.method, request.params || {}) });
    } catch (error) {
      const mcpError = toMcpError(error);
      this.writeResponse({ jsonrpc: JSON_RPC_VERSION, id, error: { code: mcpError.code, message: mcpError.message, data: mcpError.data } });
    }
  }

  private async dispatch(method: string, params: Record<string, unknown>): Promise<unknown> {
    if (method === 'initialize') {
      return {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'ini-brain-ai-universal', version: '2.1.0' },
        instructions: GOLDEN_PROMPT
      };
    }
    if (method === 'tools/list') return { tools: TOOLS };
    if (method !== 'tools/call') throw new McpError(ErrorCode.MethodNotFound, `Unknown method: ${method}`);
    const name = typeof params.name === 'string' ? params.name : '';
    const args = (params.arguments || {}) as Record<string, unknown>;
    // Make sure context is fresh before any tool runs.
    const ws = getWorkspace(args);
    void AutoBackground.for(ws).ensureFresh().catch(() => undefined);

    switch (name) {
      case 'ini_brain_auto_brief': return text(await autoBrief(args), false);
      case 'ini_brain_status': return text(await status(args), true);
      case 'ini_brain_get_context': return text(await getContext(args), false);
      case 'ini_brain_search_memory': return text(await searchMemory(args), true);
      case 'ini_brain_save_memory': return text(await saveMemory(args), true);
      case 'ini_brain_list_memories': return text(await listMemories(args), true);
      case 'ini_brain_project_profile': return text(await projectProfile(args), true);
      case 'ini_brain_onboarding': return text(await onboarding(args), false);
      case 'ini_brain_explain': return text(await explain(args), false);
      case 'ini_brain_impact': return text(await impact(args), false);
      case 'ini_brain_generate_agent_guide': return text(await generateAgentGuide(args), true);
      case 'ini_brain_suggest_skills': return text(await suggestSkills(args), true);
      case 'ini_brain_generate_workflow': return text(await readText(path.join(getWorkspace(args), '.brain', 'workflow.md'), 'Run ini_brain_generate_agent_guide first.'), false);
      default: throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  }

  private writeResponse(response: JsonRpcResponse): void {
    const body = Buffer.from(JSON.stringify(response), 'utf8');
    if (this.transportMode === 'lines') {
      process.stdout.write(`${body.toString('utf8')}\n`);
      return;
    }
    process.stdout.write(`Content-Length: ${body.length}\r\n\r\n`);
    process.stdout.write(body);
  }
}

async function status(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const workspace = getWorkspace(args);
  const profile = await new MemoryStore(workspace).buildProfile();
  return {
    workspace,
    brainDir: path.join(workspace, '.brain'),
    hasBrain: await exists(path.join(workspace, '.brain', 'metadata.json')),
    hasAgentGuide: await exists(path.join(workspace, 'AGENTS.md')),
    memories: profile.totalMemories,
    generatedAt: new Date().toISOString()
  };
}

async function getContext(args: Record<string, unknown>): Promise<string> {
  if (typeof args.task !== 'string' || !args.task.trim()) throw new McpError(ErrorCode.InvalidParams, 'task is required');
  const workspace = getWorkspace(args);
  const budgetChars = typeof args.budgetChars === 'number' ? Math.max(1000, Math.min(25000, Math.floor(args.budgetChars))) : 12000;
  return new ContextBuilder(workspace).build(args.task, budgetChars);
}

async function searchMemory(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (typeof args.query !== 'string' || !args.query.trim()) throw new McpError(ErrorCode.InvalidParams, 'query is required');
  const workspace = getWorkspace(args);
  const limit = typeof args.limit === 'number' ? Math.max(1, Math.min(25, Math.floor(args.limit))) : 10;
  return { workspace, query: args.query, results: await new MemoryStore(workspace).search(args.query, limit) };
}

async function saveMemory(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (typeof args.content !== 'string' || !args.content.trim()) throw new McpError(ErrorCode.InvalidParams, 'content is required');
  const workspace = getWorkspace(args);
  const entry = await new MemoryStore(workspace).save({
    content: args.content,
    kind: isMemoryKind(args.kind) ? args.kind : 'note',
    files: Array.isArray(args.files) ? args.files.map(String) : parseCsvList(typeof args.files === 'string' ? args.files : undefined),
    concepts: Array.isArray(args.concepts) ? args.concepts.map(String) : parseCsvList(typeof args.concepts === 'string' ? args.concepts : undefined),
    importance: typeof args.importance === 'number' ? args.importance : 7,
    source: 'agent'
  });
  return { workspace, saved: true, entry };
}

async function projectProfile(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const workspace = getWorkspace(args);
  return {
    workspace,
    projectMap: await readJson(path.join(workspace, '.brain', 'project_map.json'), null),
    memoryProfile: await new MemoryStore(workspace).buildProfile(),
    architecture: (await readText(path.join(workspace, '.brain', 'architecture.md'), '')).slice(0, 6000)
  };
}

async function generateAgentGuide(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const workspace = getWorkspace(args);
  const scan = await new ProjectScanner(workspace).scan();
  const brain = await new BrainStore(workspace).writeScan(scan);
  const result = await new AgentGuideGenerator(workspace).generate(brain);
  return { workspace, generated: true, stats: scan.stats, result };
}

async function suggestSkills(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const workspace = getWorkspace(args);
  const brain = await new BrainStore(workspace).readBrain();
  if (!brain) return { skills: [], note: 'Run ini_brain_generate_agent_guide first.' };
  const skills = await readText(path.join(workspace, '.brain', 'skills.md'), '');
  return { workspace, skillsMarkdown: skills };
}

async function autoBrief(args: Record<string, unknown>): Promise<string> {
  const workspace = getWorkspace(args);
  const task = typeof args.task === 'string' && args.task.trim() ? args.task : 'general project understanding';
  const auto = AutoBackground.for(workspace);
  const fresh = await auto.ensureFresh().catch(() => ({ scanned: false, reason: 'error' }));
  const agentsMd = await readText(path.join(workspace, 'AGENTS.md'), '');
  const compact = await readText(path.join(workspace, '.brain', 'compact_context.md'), '');
  const decisions = await readText(path.join(workspace, '.brain', 'decisions.md'), '');
  const tasks = await readText(path.join(workspace, '.brain', 'tasks.md'), '');
  const memoryStore = new MemoryStore(workspace);
  const recentMems = await memoryStore.list(8);
  const memCtx = await memoryStore.buildContext(task, 2500);

  const lines: string[] = [];
  lines.push('# INI Brain Auto Brief');
  lines.push('');
  lines.push(`Workspace: ${workspace}`);
  lines.push(`Task: ${task}`);
  lines.push(`Background scan: ${fresh.scanned ? 'started (' + fresh.reason + ')' : 'fresh'}`);
  lines.push('');
  lines.push('## Protocol (follow automatically)');
  lines.push(GOLDEN_PROMPT);
  lines.push('');
  if (agentsMd) {
    lines.push('## AGENTS.md');
    lines.push(agentsMd.slice(0, 3500));
    lines.push('');
  }
  if (compact) {
    lines.push('## Compact Project Context');
    lines.push(compact.slice(0, 3500));
    lines.push('');
  }
  if (decisions && !/Record durable/i.test(decisions)) {
    lines.push('## Recorded Decisions');
    lines.push(decisions.slice(0, 1800));
    lines.push('');
  }
  if (tasks && !/Add project-specific tasks/i.test(tasks)) {
    lines.push('## Pending Tasks');
    lines.push(tasks.slice(0, 1500));
    lines.push('');
  }
  if (memCtx) {
    lines.push('## Relevant Memories For Task');
    lines.push(memCtx);
    lines.push('');
  }
  if (recentMems.length) {
    lines.push('## Recent Memories');
    for (const m of recentMems) lines.push(`- [${m.kind}/${m.importance}] ${m.content}`);
    lines.push('');
  }
  lines.push('---');
  lines.push('Now plan, then call ini_brain_get_context for the focused brief, edit, and finally save what you learned with ini_brain_save_memory.');
  return lines.join('\n');
}

async function listMemories(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const workspace = getWorkspace(args);
  const limit = typeof args.limit === 'number' ? args.limit : 20;
  const memories = await new MemoryStore(workspace).list(limit);
  return { workspace, total: memories.length, memories };
}

async function onboarding(args: Record<string, unknown>): Promise<string> {
  const workspace = getWorkspace(args);
  const brain = await new BrainStore(workspace).readBrain();
  if (!brain) return 'No brain index found yet. The background scan should create it shortly — try again in a few seconds.';
  return new InsightBuilder().buildOnboarding(brain);
}

async function explain(args: Record<string, unknown>): Promise<string> {
  if (typeof args.path !== 'string' || !args.path.trim()) throw new McpError(ErrorCode.InvalidParams, 'path is required');
  const workspace = getWorkspace(args);
  const brain = await new BrainStore(workspace).readBrain();
  if (!brain) return 'No brain index found yet. The background scan should create it shortly — try again in a few seconds.';
  return new InsightBuilder().buildExplain(brain, args.path).markdown;
}

async function impact(args: Record<string, unknown>): Promise<string> {
  const files = Array.isArray(args.files) ? args.files.map(String) : [];
  if (files.length === 0) throw new McpError(ErrorCode.InvalidParams, 'files must be a non-empty array of project-relative paths');
  const workspace = getWorkspace(args);
  const brain = await new BrainStore(workspace).readBrain();
  if (!brain) return 'No brain index found yet. The background scan should create it shortly — try again in a few seconds.';
  return new InsightBuilder().buildImpact(brain, files).markdown;
}

function getWorkspace(args: Record<string, unknown>): string {
  return resolveWorkspace({ explicitWorkspace: typeof args.workspace === 'string' ? args.workspace : undefined });
}

function workspaceProperty(): Record<string, unknown> {
  return {
    workspace: {
      type: 'string',
      description: 'Optional project root override. Usually omitted because INI Brain auto-detects the active workspace.'
    }
  };
}

function readOnlyAnnotations(): Record<string, boolean> {
  return {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  };
}

function localWriteAnnotations(): Record<string, boolean> {
  return {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false
  };
}

function text(payload: unknown, pretty: boolean): { content: Array<{ type: 'text'; text: string }> } {
  return { content: [{ type: 'text', text: typeof payload === 'string' ? payload : JSON.stringify(payload, null, pretty ? 2 : 0) }] };
}

function parseMessage(value: string): JsonRpcRequest {
  try {
    return JSON.parse(value) as JsonRpcRequest;
  } catch (error) {
    throw new McpError(ErrorCode.ParseError, `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function toMcpError(error: unknown): McpError {
  return error instanceof McpError ? error : new McpError(ErrorCode.InternalError, error instanceof Error ? error.message : String(error));
}

function isMemoryKind(value: unknown): value is MemoryKind {
  return typeof value === 'string' && ['fact', 'decision', 'preference', 'bug', 'workflow', 'session', 'note'].includes(value);
}

async function exists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function readText(file: string, fallback: string): Promise<string> {
  try {
    return await fs.readFile(file, 'utf8');
  } catch {
    return fallback;
  }
}

async function readJson(file: string, fallback: unknown): Promise<unknown> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

new IniBrainMcpServer().run().catch(error => {
  console.error('[INI Brain MCP] fatal error', error);
  process.exit(1);
});
