# Install INI Brain AI Universal For Cline

Version: 3.3.0

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

## Automatic Startup Protocol

No manual startup instruction is required for MCP clients that honor server
instructions. INI Brain supplies the status, auto-brief, focused-context, memory,
and Smart Setup preview rules automatically.

The VS Code extension also generates `.cline/skills` and `.clinerules` files when you run Scan Project or Generate Agent Guide.

## Arabic Summary

- ابن السيرفر بـ `npm install` و`npm run compile`.
- أضف إعداد MCP داخل ملف إعدادات Cline أو اترك إضافة VS Code تدمجه تلقائياً عند التفعيل.
- أعد تحميل Cline أو VS Code بعد أول تركيب.
- لا تحتاج إلى تعليمات بدء يدوية إذا كان العميل يقرأ تعليمات MCP.
