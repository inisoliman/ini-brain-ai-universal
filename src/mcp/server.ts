#!/usr/bin/env node
import * as fs from 'fs/promises';
import * as path from 'path';
import { AgentGuideGenerator } from '../core/agentGuide';
import { BrainStore } from '../core/brainStore';
import { ContextBuilder } from '../core/contextBuilder';
import { MemoryStore, parseCsvList } from '../core/memoryStore';
import { ProjectScanner } from '../core/projectScanner';
import { MemoryKind } from '../core/types';

const WORKSPACE = process.env.INI_BRAIN_WORKSPACE || process.cwd();
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
  { name: 'ini_brain_status', description: 'Show workspace and INI Brain status.', inputSchema: { type: 'object', properties: {} } },
  { name: 'ini_brain_get_context', description: 'Build compact task context from project brain and runtime memory.', inputSchema: { type: 'object', properties: { task: { type: 'string' }, budgetChars: { type: 'number' } }, required: ['task'] } },
  { name: 'ini_brain_search_memory', description: 'Search local runtime memory.', inputSchema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] } },
  { name: 'ini_brain_save_memory', description: 'Save durable project memory.', inputSchema: { type: 'object', properties: { content: { type: 'string' }, kind: { type: 'string' }, files: { type: 'array', items: { type: 'string' } }, concepts: { type: 'array', items: { type: 'string' } }, importance: { type: 'number' } }, required: ['content'] } },
  { name: 'ini_brain_project_profile', description: 'Return project map and memory profile.', inputSchema: { type: 'object', properties: {} } },
  { name: 'ini_brain_generate_agent_guide', description: 'Scan project and regenerate AGENTS.md plus .brain workflow files.', inputSchema: { type: 'object', properties: {} } },
  { name: 'ini_brain_suggest_skills', description: 'Return deterministic skill suggestions based on scanned project files.', inputSchema: { type: 'object', properties: {} } },
  { name: 'ini_brain_generate_workflow', description: 'Return current workflow guidance from .brain.', inputSchema: { type: 'object', properties: {} } }
] as const;

class IniBrainMcpServer {
  private inputBuffer = Buffer.alloc(0);
  private transportMode: 'headers' | 'lines' = 'lines';

  async run(): Promise<void> {
    process.stdin.on('data', chunk => this.onData(Buffer.from(chunk)));
    process.stdin.on('error', error => console.error('[INI Brain MCP] stdin error', error));
    console.error(`[INI Brain MCP] running locally for ${WORKSPACE}`);
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
      return { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'ini-brain-ai-universal', version: '2.0.1' } };
    }
    if (method === 'tools/list') return { tools: TOOLS };
    if (method !== 'tools/call') throw new McpError(ErrorCode.MethodNotFound, `Unknown method: ${method}`);
    const name = typeof params.name === 'string' ? params.name : '';
    const args = (params.arguments || {}) as Record<string, unknown>;
    switch (name) {
      case 'ini_brain_status': return text(await status(), true);
      case 'ini_brain_get_context': return text(await getContext(args), false);
      case 'ini_brain_search_memory': return text(await searchMemory(args), true);
      case 'ini_brain_save_memory': return text(await saveMemory(args), true);
      case 'ini_brain_project_profile': return text(await projectProfile(), true);
      case 'ini_brain_generate_agent_guide': return text(await generateAgentGuide(), true);
      case 'ini_brain_suggest_skills': return text(await suggestSkills(), true);
      case 'ini_brain_generate_workflow': return text(await readText(path.join(WORKSPACE, '.brain', 'workflow.md'), 'Run ini_brain_generate_agent_guide first.'), false);
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

async function status(): Promise<Record<string, unknown>> {
  const profile = await new MemoryStore(WORKSPACE).buildProfile();
  return {
    workspace: WORKSPACE,
    brainDir: path.join(WORKSPACE, '.brain'),
    hasBrain: await exists(path.join(WORKSPACE, '.brain', 'metadata.json')),
    hasAgentGuide: await exists(path.join(WORKSPACE, 'AGENTS.md')),
    memories: profile.totalMemories,
    generatedAt: new Date().toISOString()
  };
}

async function getContext(args: Record<string, unknown>): Promise<string> {
  if (typeof args.task !== 'string' || !args.task.trim()) throw new McpError(ErrorCode.InvalidParams, 'task is required');
  const budgetChars = typeof args.budgetChars === 'number' ? Math.max(1000, Math.min(25000, Math.floor(args.budgetChars))) : 12000;
  return new ContextBuilder(WORKSPACE).build(args.task, budgetChars);
}

async function searchMemory(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (typeof args.query !== 'string' || !args.query.trim()) throw new McpError(ErrorCode.InvalidParams, 'query is required');
  const limit = typeof args.limit === 'number' ? Math.max(1, Math.min(25, Math.floor(args.limit))) : 10;
  return { query: args.query, results: await new MemoryStore(WORKSPACE).search(args.query, limit) };
}

async function saveMemory(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (typeof args.content !== 'string' || !args.content.trim()) throw new McpError(ErrorCode.InvalidParams, 'content is required');
  const entry = await new MemoryStore(WORKSPACE).save({
    content: args.content,
    kind: isMemoryKind(args.kind) ? args.kind : 'note',
    files: Array.isArray(args.files) ? args.files.map(String) : parseCsvList(typeof args.files === 'string' ? args.files : undefined),
    concepts: Array.isArray(args.concepts) ? args.concepts.map(String) : parseCsvList(typeof args.concepts === 'string' ? args.concepts : undefined),
    importance: typeof args.importance === 'number' ? args.importance : 7,
    source: 'agent'
  });
  return { saved: true, entry };
}

async function projectProfile(): Promise<Record<string, unknown>> {
  return {
    workspace: WORKSPACE,
    projectMap: await readJson(path.join(WORKSPACE, '.brain', 'project_map.json'), null),
    memoryProfile: await new MemoryStore(WORKSPACE).buildProfile(),
    architecture: (await readText(path.join(WORKSPACE, '.brain', 'architecture.md'), '')).slice(0, 6000)
  };
}

async function generateAgentGuide(): Promise<Record<string, unknown>> {
  const scan = await new ProjectScanner(WORKSPACE).scan();
  const brain = await new BrainStore(WORKSPACE).writeScan(scan);
  const result = await new AgentGuideGenerator(WORKSPACE).generate(brain);
  return { generated: true, stats: scan.stats, result };
}

async function suggestSkills(): Promise<Record<string, unknown>> {
  const brain = await new BrainStore(WORKSPACE).readBrain();
  if (!brain) return { skills: [], note: 'Run ini_brain_generate_agent_guide first.' };
  const skills = await readText(path.join(WORKSPACE, '.brain', 'skills.md'), '');
  return { skillsMarkdown: skills };
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
