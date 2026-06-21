# Install INI Brain AI Universal For Generic MCP Clients

Version: 3.1.0

Any stdio MCP-compatible client can use INI Brain AI Universal.

## Build

```powershell
git clone https://github.com/inisoliman/ini-brain-ai-universal.git
cd ini-brain-ai-universal
npm install
npm run compile
```

## Server

```text
node C:/path/to/ini-brain-ai-universal/dist/mcp/server.js
```

Workspace detection:

- If the MCP client starts the server from the project root, no environment variable is required.
- If the client starts servers from a central folder, set `INI_BRAIN_WORKSPACE` or pass the optional `workspace` argument in tool calls.

## JSON Config

```json
{
  "mcpServers": {
    "ini-brain-ai": {
      "command": "node",
      "args": ["C:/path/to/ini-brain-ai-universal/dist/mcp/server.js"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Tool List

See the complete MCP tool list in [../README.md](../README.md#mcp-tools).

## Minimal Flow

1. Call `ini_brain_auto_brief` at the start of a task.
2. Call `ini_brain_get_context` before editing.
3. Call `ini_brain_search_memory` when prior decisions may matter.
4. Call `ini_brain_save_memory` after important discoveries.

## Arabic Summary

أي عميل MCP يدعم stdio يمكنه تشغيل `dist/mcp/server.js` عبر Node. شغل العميل من جذر المشروع أو مرر `workspace`/`INI_BRAIN_WORKSPACE` عندما يكون التشغيل من مجلد مركزي.
