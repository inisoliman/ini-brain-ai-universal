# ZadLoop integration

Version: 3.4.1

ZadLoop (DeepSeek Harness) runs MCP servers through the `@deepseek-ai/dsh-mcp-client` plugin. Automatic profile installation is unsupported: no stable active-profile merge location has been verified, so the edit is manual. These are the verified concrete steps.

## Steps

1. Close the ZadLoop app completely before editing anything. The live profile file is `%APPDATA%\ZadLoop\harness\profiles\<profile>\cordis.yml`; its `root` is usually `[]`, and the real edit target is `cordis.patch.yml` in the same folder.

2. Back up `cordis.patch.yml` first (for example to `cordis.patch.yml.bak`). Rollback = restore that backup with ZadLoop closed.

3. Replace ONLY the existing ini-brain insert entry — no duplicate `serverName: ini_brain` / `namespace ini_brain` — and keep every other setting, including the existing `dsh-system-prompt` `personaSuffix` that instructs the model to pass the conversation workspace on every call:

```yaml
- insert:
    - id: mcp-ini-brain
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: ini_brain
        transport: stdio
        command: node
        args: ['C:/path/to/ini-brain-ai-universal/dist/mcp/server.js']
        toolCallTimeoutMs: 120000
```

4. Fix the `args` path: installing the VSIX does not update an independently configured `args` path. The path must point at the built checkout (`dist/mcp/server.js`) or at the newly installed extension folder — not at a stale older folder such as `...-3.3.0`. Also remove any `INI_BRAIN_WORKSPACE` env in the entry that resolves to the ZadLoop app directory; it makes the server target the app folder instead of your project.

5. `startupTimeoutMs` is not a supported `@deepseek-ai/dsh-mcp-client` field; `toolCallTimeoutMs` is the documented one. Do not add `startupTimeoutMs`.

6. Restart ZadLoop, open a new conversation, then verify from the checkout:

```powershell
node scripts/doctor-zadloop.cjs --server "C:/path/to/ini-brain-ai-universal/dist/mcp/server.js" --workspace "C:/path/to/your-project" --expect-version 3.4.1
```

Expected: `Result: OK` and exit code 0.

## Workspace on every call

The observed ZadLoop handshake identifies itself as `dsh-mcp-client` with `capabilities: {}` and sends no project roots. Every tool call on this host must therefore pass an explicit `workspace` (the conversation project's absolute path), including status, context and memory. Never reuse project A's workspace in project B; repeat status after switching projects. Unsafe/unresolved project calls fail closed.

## Evidence

The installed `@deepseek-ai/dsh-mcp-client` schema/docs live under the ZadLoop resources folder. Its README documents the plugin fields `serverName`, `transport`, `command`, `args`, `env`, `cwd`, and `toolCallTimeoutMs`; `startupTimeoutMs` is not documented. Inspected read-only; no real client settings were modified by this release's tests. Shared root `AGENTS.md` remains the baseline; no ZadLoop-specific skills folder is assumed.
