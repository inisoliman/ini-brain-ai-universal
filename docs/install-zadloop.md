# ZadLoop integration

Version: 3.4.0

Select **INI Brain: Install Integrations → ZadLoop** to copy manual command/args instructions. Automatic global configuration merging is unsupported: installed runtime documentation verifies `@deepseek-ai/dsh-mcp-client` fields, but no stable active-profile insertion location or safe generic file merge contract was established. No real client configuration is modified by this release's tests.

In the client's local stdio MCP/plugin configuration interface use:

```text
serverName: ini-brain
transport: stdio
command: node
args: ["C:/path/to/ini-brain-ai-universal/dist/mcp/server.js"]
```

The installed package README documents one plugin entry per server:

```yaml
- id: mcp-ini-brain
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: ini-brain
    transport: stdio
    command: node
    args: ['C:/path/to/ini-brain-ai-universal/dist/mcp/server.js']
```

This is a manual reference, not a claim that arbitrary YAML belongs in a particular ZadLoop file. Use the client's supported plugin/settings workflow. `env` and `cwd` are documented optional plugin fields; do not globally pin one conversation's project. Settings may be persisted through the active Cordis profile; guessing and rewriting that profile is unsafe.

The observed runtime identifies itself as `dsh-mcp-client` with `capabilities: {}`. That handshake supplies neither roots nor the conversation folder. INI Brain cannot discover a project from data it did not receive. Pass the current project's absolute `workspace` on **every** INI Brain call, including status, context and memory. Never reuse project A's workspace in project B. Repeat status after every project switch. Unsafe unresolved project calls fail closed; status and auto_brief provide diagnostics.

Shared root `AGENTS.md` is the baseline. No ZadLoop-specific skills directory is invented. Server instructions guide models but cannot guarantee obedience. The compatibility suite tests the protocol handshake and workspace isolation, not actual ZadLoop UI installation or model behavior.

Evidence: installed runtime `@deepseek-ai/dsh-mcp-client/README.md` (minimal configuration and field table) and `@deepseek-ai/dsh-settings/README.md` (profile persistence), inspected read-only October 27, 2026. No secrets or real settings are copied.
