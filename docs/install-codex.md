# Install INI Brain AI Universal For Codex

Version: 3.1.0

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

## Recommended Codex Prompt

```md
Start with ini_brain_auto_brief for this task, then call ini_brain_get_context before editing. Search memory when prior decisions may matter. After finishing, save durable decisions or bugs with ini_brain_save_memory.
```

## Arabic Summary

- ابن السيرفر: `npm install` ثم `npm run compile`.
- أضف `dist/mcp/server.js` إلى Codex كخادم MCP.
- افتح Codex من جذر المشروع الذي تريد العمل عليه.
- ابدأ أي مهمة بـ `ini_brain_auto_brief` ثم `ini_brain_get_context`.
