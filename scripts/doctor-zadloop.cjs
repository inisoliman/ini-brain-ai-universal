#!/usr/bin/env node
/**
 * ZadLoop wiring doctor for INI Brain.
 *
 * Diagnoses one configured MCP server script by actually speaking MCP to it:
 * initialize -> tools/list -> ini_brain_status. It only ever spawns the exact
 * `--server` file you name with this Node executable; it never reads, guesses
 * or edits real client configuration and it writes nothing into the target
 * workspace.
 *
 * Usage:
 *   node scripts/doctor-zadloop.cjs --server <path/to/dist/mcp/server.js> --workspace <existing dir> --expect-version <x.y.z>
 *
 * Exit codes: 0 OK, 1 version mismatch, 2 bad path/argument, 3 untrusted or
 * unsafe workspace, 4 timeout, 5 invalid protocol/response.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const EXIT = Object.freeze({
  OK: 0,
  MISMATCH: 1,
  USAGE: 2,
  WORKSPACE: 3,
  TIMEOUT: 4,
  PROTOCOL: 5
});

const HANDSHAKE_MS = 20000;
/** How long to wait for a line-framed answer before retrying header framing. */
const FRAMING_PROBE_MS = 5000;
const TOOL_CALL_MS = 40000;
const SHUTDOWN_MS = 5000;
/** Variables that would inject a project the doctor must not rely on. */
const HOST_WORKSPACE_ENV = ['INI_BRAIN_WORKSPACE', 'CODEX_WORKSPACE', 'CODEX_CWD', 'WORKSPACE', 'INIT_CWD', 'PWD'];

const USAGE = [
  'Usage: node scripts/doctor-zadloop.cjs --server <path/to/dist/mcp/server.js> --workspace <existing project dir> [--expect-version <x.y.z>]',
  '',
  'Exit codes: 0 OK, 1 version mismatch, 2 bad path/argument, 3 unsafe/untrusted workspace, 4 timeout, 5 invalid protocol.'
].join('\n');

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--help' || token === '-h') {
      options.help = true;
      continue;
    }
    const match = /^--(server|workspace|expect-version)(?:=(.*))?$/.exec(token);
    if (!match) {
      options.error = `Unknown argument: ${token}`;
      return options;
    }
    const value = match[2] !== undefined ? match[2] : argv[++index];
    if (value === undefined || value === '' || value.startsWith('--')) {
      options.error = `Missing value for --${match[1]}`;
      return options;
    }
    options[match[1] === 'expect-version' ? 'expectVersion' : match[1]] = value;
  }
  return options;
}

/** Keep diagnostics useful without echoing environment variables or secrets. */
function sanitize(text, limit = 300) {
  if (typeof text !== 'string') return '';
  const collapsed = text
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/("?(?:api[_-]?key|token|secret|password|authorization)"?\s*[:=]\s*)("[^"]*"|'[^']*'|\S+)/gi, '$1<redacted>')
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, '<redacted>')
    .trim();
  return collapsed.length > limit ? `${collapsed.slice(0, limit)}...` : collapsed;
}

function isExistingDirectory(directory) {
  try {
    return fs.statSync(directory).isDirectory();
  } catch {
    return false;
  }
}

function isExistingFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

function projectMarkers(directory) {
  const markers = ['.brain', 'AGENTS.md', '.git', 'package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod', 'composer.json', 'pom.xml', '.project'];
  return markers.filter(marker => fs.existsSync(path.join(directory, marker)));
}

/**
 * Strict JSON-RPC client for one stdio child process.
 *
 * Framing is detected per message, exactly like the server under test:
 * `Content-Length` headers (the MCP SDK convention) or one JSON object per
 * line (the server's legacy mode). Only JSON objects carrying an `id` and a
 * `result`/`error` are answers; requests and notifications are ignored
 * rather than counted as responses, and anything that is not a JSON-RPC
 * frame is a protocol failure instead of being silently skipped.
 */
class StdioClient {
  constructor(child) {
    this.child = child;
    this.buffer = Buffer.alloc(0);
    this.mode = 'unknown';
    this.messages = [];
    this.protocolError = undefined;
    this.stderrBytes = 0;
    this.closed = false;
    child.stdout.on('data', chunk => this.consume(chunk));
    child.stderr.on('data', chunk => { this.stderrBytes += chunk.length; });
    child.once('close', () => { this.closed = true; });
    child.once('error', error => {
      this.closed = true;
      this.protocolError = this.protocolError || `Child process error: ${sanitize(error.message)}`;
    });
  }

  consume(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    for (;;) {
      // At a message boundary: skip a BOM and stray blank lines.
      while (this.buffer.length > 0 && (this.buffer[0] === 0x0a || this.buffer[0] === 0x0d)) {
        this.buffer = this.buffer.subarray(1);
      }
      if (this.buffer.length === 0) return;
      const head = this.buffer.subarray(0, 32).toString('utf8').replace(/^\uFEFF/, '');
      if (head.startsWith('{')) {
        const newline = this.buffer.indexOf(0x0a);
        if (newline === -1) return;
        const line = this.buffer.subarray(0, newline).toString('utf8').replace(/^\uFEFF/, '').trim();
        this.buffer = this.buffer.subarray(newline + 1);
        this.mode = 'lines';
        if (line) this.handle(line);
        continue;
      }
      if (/^content-length/i.test(head)) {
        const separator = this.buffer.indexOf('\r\n\r\n');
        if (separator === -1) return;
        const match = /content-length:\s*(\d+)/i.exec(this.buffer.subarray(0, separator).toString('utf8'));
        if (!match) {
          this.protocolError = this.protocolError || 'Malformed Content-Length header from server.';
          return;
        }
        const end = separator + 4 + Number(match[1]);
        if (this.buffer.length < end) return;
        const body = this.buffer.subarray(separator + 4, end).toString('utf8');
        this.buffer = this.buffer.subarray(end);
        this.mode = 'headers';
        this.handle(body);
        continue;
      }
      const newline = this.buffer.indexOf(0x0a);
      if (newline === -1) {
        // Keep waiting while this could still be an incomplete header name.
        if (/^[A-Za-z-]+$/.test(head.trim())) return;
        this.protocolError = this.protocolError || 'Server stdout is not JSON-RPC framed.';
        return;
      }
      const preamble = this.buffer.subarray(0, newline).toString('utf8').trim();
      if (preamble) {
        this.protocolError = this.protocolError || 'Server stdout is not JSON-RPC framed.';
        return;
      }
      this.buffer = this.buffer.subarray(newline + 1);
    }
  }

  handle(raw) {
    let message;
    try {
      message = JSON.parse(raw);
    } catch {
      this.protocolError = this.protocolError || 'Server sent a message that is not valid JSON.';
      return;
    }
    if (!message || typeof message !== 'object' || message.method !== undefined || message.id === undefined) return;
    if (message.result === undefined && message.error === undefined) {
      this.protocolError = this.protocolError || 'Server answered a request without result or error.';
      return;
    }
    this.messages.push(message);
  }

  /** Poll until a matching answer arrives, the child closes or the deadline passes. */
  async waitFor(predicate, timeoutMs) {
    const stopAt = Date.now() + timeoutMs;
    for (;;) {
      const found = this.messages.find(predicate);
      if (found) return found;
      if (this.closed || this.protocolError || Date.now() >= stopAt) return undefined;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  }

  write(message, framing) {
    const body = Buffer.from(JSON.stringify(message), 'utf8');
    const useHeaders = framing ? framing === 'headers' : this.mode === 'headers';
    const frame = useHeaders
      ? Buffer.concat([Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'utf8'), body])
      : Buffer.concat([body, Buffer.from('\n')]);
    return new Promise(resolve => this.child.stdin.write(frame, () => resolve()));
  }
}

/** Stop the child without leaving a hung process behind. */
async function stopChild(child, client) {
  if (child.exitCode !== null || child.signalCode !== null) return { forced: false };
  if (!client.closed) {
    if (!child.stdin.destroyed) child.stdin.end();
    const closedQuietly = await new Promise(resolve => {
      const timer = setTimeout(() => resolve(false), SHUTDOWN_MS);
      child.once('close', () => {
        clearTimeout(timer);
        resolve(true);
      });
    });
    if (closedQuietly) return { forced: false };
  }
  try {
    child.kill();
  } catch {
    // Already gone.
  }
  await new Promise(resolve => {
    const timer = setTimeout(resolve, SHUTDOWN_MS);
    child.once('close', () => {
      clearTimeout(timer);
      resolve();
    });
  });
  return { forced: true };
}

function failure(code, message, outcome = {}) {
  return { ok: false, exitCode: code, message, outcome };
}

/**
 * Run the handshake against exactly the given script.
 * Returns a result object; it never throws for expected server behaviour.
 */
async function diagnose(script, workspace) {
  const environment = { ...process.env, INI_BRAIN_DISABLE_AUTO_BACKGROUND: '1' };
  for (const key of HOST_WORKSPACE_ENV) delete environment[key];
  const child = spawn(process.execPath, [script], {
    cwd: workspace,
    env: environment,
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true
  });
  const client = new StdioClient(child);
  const outcome = {};

  try {
    const initializeRequest = {
      jsonrpc: '2.0',
      id: 'doctor-initialize',
      method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'ini-brain-doctor', version: '1' } }
    };
    await client.write(initializeRequest);
    let initialize = await client.waitFor(message => message.id === 'doctor-initialize', FRAMING_PROBE_MS);
    if (!initialize && !client.protocolError && !client.closed && client.mode === 'unknown') {
      // A Content-Length-only server never received the line-framed probe.
      // Retry the same handshake in header framing before reporting timeout.
      await client.write(initializeRequest, 'headers');
      initialize = await client.waitFor(message => message.id === 'doctor-initialize', HANDSHAKE_MS);
    }
    if (client.protocolError) return failure(EXIT.PROTOCOL, client.protocolError, outcome);
    if (!initialize) return failure(EXIT.TIMEOUT, `No initialize response within ${HANDSHAKE_MS} ms.`, outcome);
    if (initialize.error) return failure(EXIT.PROTOCOL, `initialize failed: ${sanitize(initialize.error.message) || 'unknown error'}`, outcome);
    const initResult = initialize.result || {};
    const info = initResult.serverInfo;
    if (!info || typeof info.name !== 'string' || typeof info.version !== 'string') {
      return failure(EXIT.PROTOCOL, 'initialize response has no usable serverInfo.', outcome);
    }
    if (!initResult.capabilities || typeof initResult.capabilities !== 'object') {
      return failure(EXIT.PROTOCOL, 'initialize response has no capabilities object.', outcome);
    }
    outcome.serverInfo = { name: info.name, version: info.version };
    outcome.protocolVersion = typeof initResult.protocolVersion === 'string' ? initResult.protocolVersion : undefined;

    await client.write({ jsonrpc: '2.0', method: 'notifications/initialized' });
    await client.write({ jsonrpc: '2.0', id: 'doctor-list', method: 'tools/list', params: {} });
    const list = await client.waitFor(message => message.id === 'doctor-list', HANDSHAKE_MS);
    if (client.protocolError) return failure(EXIT.PROTOCOL, client.protocolError, outcome);
    if (!list) return failure(EXIT.TIMEOUT, `No tools/list response within ${HANDSHAKE_MS} ms.`, outcome);
    if (list.error) return failure(EXIT.PROTOCOL, `tools/list failed: ${sanitize(list.error.message) || 'unknown error'}`, outcome);
    const tools = list.result && Array.isArray(list.result.tools) ? list.result.tools : undefined;
    if (!tools) return failure(EXIT.PROTOCOL, 'tools/list result has no tools array.', outcome);
    const statusTool = tools.find(tool => tool && tool.name === 'ini_brain_status');
    if (!statusTool) return failure(EXIT.PROTOCOL, 'ini_brain_status is not listed by this server.', outcome);
    const workspaceProperty = statusTool.inputSchema && statusTool.inputSchema.properties && statusTool.inputSchema.properties.workspace;
    if (!workspaceProperty) return failure(EXIT.PROTOCOL, 'ini_brain_status does not accept a workspace argument.', outcome);
    outcome.tools = tools.length;

    await client.write({
      jsonrpc: '2.0',
      id: 'doctor-status',
      method: 'tools/call',
      params: { name: 'ini_brain_status', arguments: { workspace } }
    });
    const call = await client.waitFor(message => message.id === 'doctor-status', TOOL_CALL_MS);
    if (client.protocolError) return failure(EXIT.PROTOCOL, client.protocolError, outcome);
    if (!call) return failure(EXIT.TIMEOUT, `ini_brain_status did not answer within ${TOOL_CALL_MS} ms.`, outcome);
    if (call.error) return failure(EXIT.PROTOCOL, `ini_brain_status failed: ${sanitize(call.error.message) || 'unknown error'}`, outcome);
    const content = call.result && Array.isArray(call.result.content) ? call.result.content : undefined;
    const textBlock = content && content.find(block => block && block.type === 'text' && typeof block.text === 'string');
    if (!textBlock) return failure(EXIT.PROTOCOL, 'ini_brain_status returned no text content.', outcome);
    let status;
    try {
      status = JSON.parse(textBlock.text);
    } catch {
      return failure(EXIT.PROTOCOL, 'ini_brain_status text is not JSON.', outcome);
    }
    if (!status || typeof status !== 'object') return failure(EXIT.PROTOCOL, 'ini_brain_status returned no object.', outcome);

    const normalize = value => (typeof value === 'string' ? path.resolve(value).replace(/\\/g, '/').toLowerCase() : '');
    outcome.workspace = normalize(status.workspace);
    outcome.workspaceTrusted = status.workspaceTrusted === true;
    outcome.serverVersion = typeof status.serverVersion === 'string' ? status.serverVersion : undefined;
    outcome.client = status.client && typeof status.client.name === 'string' ? status.client.name : undefined;
    outcome.hasBrain = status.hasBrain === true;

    if (!outcome.workspace || outcome.workspace !== normalize(workspace)) {
      return failure(EXIT.WORKSPACE, 'The server ignored the explicit workspace argument.', outcome);
    }
    if (typeof status.serverVersion !== 'string' || status.serverVersion !== info.version) {
      return failure(EXIT.PROTOCOL, 'status serverVersion does not match initialize serverInfo.version.', outcome);
    }
    if (!outcome.workspaceTrusted) {
      const markers = projectMarkers(workspace);
      const detail = markers.length === 0
        ? 'no project marker at all'
        : markers.length === 1 && markers[0] === '.brain'
          ? 'only .brain; a project also needs .git, package.json or another project marker, and app folders are never trusted'
          : markers.join(', ');
      return failure(EXIT.WORKSPACE, `Workspace is not trusted (found: ${detail}).`, outcome);
    }
    return { ok: true, exitCode: EXIT.OK, message: 'MCP handshake, tool list and explicit-workspace status all succeeded.', outcome };
  } catch (error) {
    return failure(EXIT.PROTOCOL, `Unexpected error: ${sanitize(error && error.message ? error.message : String(error))}`, outcome);
  } finally {
    const stopped = await stopChild(child, client);
    outcome.shutdownForced = stopped.forced;
    outcome.stderrBytes = client.stderrBytes;
  }
}

function render(result) {
  const outcome = result.outcome || {};
  const lines = [];
  if (outcome.serverInfo) {
    lines.push(`Server: ${outcome.serverInfo.name} ${outcome.serverInfo.version}${outcome.protocolVersion ? ` (protocol ${outcome.protocolVersion})` : ''}`);
  }
  if (outcome.tools !== undefined) lines.push(`Tools listed: ${outcome.tools}`);
  if (outcome.workspace) lines.push(`Workspace: ${outcome.workspace}${outcome.workspaceTrusted ? ' (trusted)' : ' (untrusted)'}`);
  if (outcome.shutdownForced) lines.push('Shutdown: the server passed the shutdown deadline and was stopped.');
  lines.push(`Result: ${result.ok ? 'OK' : 'FAILED'} - ${result.message}`);
  return lines.join('\n');
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(USAGE);
    return { ok: true, exitCode: EXIT.OK, message: 'help printed' };
  }

  let result;
  let server;
  let workspace;
  if (options.error || !options.server || !options.workspace) {
    result = failure(EXIT.USAGE, options.error ? `${options.error}.` : 'Both --server and --workspace are required.');
  } else {
    server = path.resolve(options.server);
    workspace = path.resolve(options.workspace);
    if (!isExistingFile(server) || !/\.(c|m)?js$/.test(server)) {
      result = failure(EXIT.USAGE, `MCP server script not found or not a .js/.cjs/.mjs file: ${server}`);
    } else if (!isExistingDirectory(workspace)) {
      result = failure(EXIT.USAGE, `Workspace directory does not exist: ${workspace}`);
    } else {
      result = await diagnose(server, workspace);
    }
  }

  if (result.ok && options.expectVersion && result.outcome.serverVersion !== options.expectVersion) {
    const reported = result.outcome.serverVersion || 'no version';
    result = failure(EXIT.MISMATCH, `Version mismatch: expected ${options.expectVersion}, server reports ${reported}.`, result.outcome);
  }

  const exitCode = result.exitCode;
  const report = render(result);
  const epilogue = [];
  if (server) epilogue.push(`MCP server script: ${pathToFileURL(server).href}`);
  epilogue.push(`Expected version: ${options.expectVersion || '(not checked)'}`);
  if (result.ok && result.outcome.hasBrain === false) {
    epilogue.push('Note: this workspace has no .brain/metadata.json yet; open or scan it in INI Brain first.');
  }
  if (exitCode === EXIT.USAGE) {
    console.error(report);
    console.error(USAGE);
    return { ok: false, exitCode, message: result.message };
  }
  console.log([report, ...epilogue].join('\n'));
  return { ok: result.ok, exitCode, message: result.message, outcome: result.outcome };
}

module.exports = { main, parseArgs, sanitize, diagnose, render, EXIT, USAGE, HANDSHAKE_MS, TOOL_CALL_MS };

if (require.main === module) {
  main().then(result => {
    process.exitCode = result.exitCode;
  }).catch(error => {
    console.error(`Doctor failed: ${sanitize(error && error.message ? error.message : String(error))}`);
    process.exitCode = EXIT.PROTOCOL;
  });
}
