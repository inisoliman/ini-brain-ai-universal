# Install INI Brain AI Universal For Cline

Version: 3.1.0

## Build

```powershell
git clone https://github.com/inisoliman/ini-brain-ai-universal.git
cd ini-brain-ai-universal
npm install
npm run compile
```

## Cline MCP Settings

Open or create your Cline MCP settings file. On Windows it is commonly under VS Code global storage:

```text
%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

Merge this server config:

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

If Cline starts MCP servers outside the project folder, add `INI_BRAIN_WORKSPACE` for that project or pass the optional `workspace` tool argument.

Reload Cline MCP servers or reload VS Code.

## Recommended Cline Instruction

```md
Before editing, call ini_brain_auto_brief and ini_brain_get_context for my task. Use ini_brain_search_memory when prior decisions may matter. Save durable findings with ini_brain_save_memory after finishing.
```

The VS Code extension also generates `.cline/skills` and `.clinerules` files when you run Scan Project or Generate Agent Guide.

## Arabic Summary

- ابن السيرفر بـ `npm install` و`npm run compile`.
- أضف إعداد MCP أعلاه داخل ملف إعدادات Cline.
- أعد تحميل Cline أو VS Code.
- بعد Scan Project ستجد skills وclinerules مولدة تلقائياً.
