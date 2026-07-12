# Install INI Brain AI Universal For Codex

Version: 3.2.0

Codex can use INI Brain through two layers:

1. Repository guidance from `AGENTS.md` and `.brain/` files.
2. Live workspace context from the local MCP server.

## Build The MCP Server

```powershell
git clone https://github.com/inisoliman/ini-brain-ai-universal.git
cd ini-brain-ai-universal
npm install
npm run compile
```

The MCP entrypoint is:

```text
dist/mcp/server.js
```

## Add Codex MCP Config

Recommended:

```powershell
codex mcp add ini-brain-ai -- node "C:/path/to/ini-brain-ai-universal/dist/mcp/server.js"
```

Manual `~/.codex/config.toml`:

```toml
[mcp_servers.ini-brain-ai]
command = "node"
args = ["C:/path/to/ini-brain-ai-universal/dist/mcp/server.js"]
startup_timeout_sec = 120
```

Do not set `INI_BRAIN_WORKSPACE` for a global Codex install unless you intentionally want to pin INI Brain to one project. Without that variable, INI Brain resolves the active project from the MCP process working directory and known workspace environment variables.

## Automatic Startup Protocol

No manual startup prompt is required. The MCP server supplies instructions to
Codex at the start of each new task: verify `ini_brain_status`, call
`ini_brain_auto_brief`, load focused context before editing, and preview Smart
Setup without applying it until the user explicitly approves.

## Arabic Summary

- ابن السيرفر: `npm install` ثم `npm run compile`.
- أضف `dist/mcp/server.js` إلى Codex كسيرفر MCP.
- افتح Codex من جذر المشروع الذي تريد العمل عليه.
- لا تحتاج إلى كتابة prompt بدء يدوي؛ تعليمات MCP تطلب `ini_brain_status` و`ini_brain_auto_brief` و`ini_brain_get_context` تلقائياً.
