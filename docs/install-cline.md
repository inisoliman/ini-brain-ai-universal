# Install INI Brain AI Universal For Cline

Version: 2.0.1

## Build

```powershell
cd ini-brain-ai-universal
npm install
npm run compile
```

## Cline MCP Settings

Open or create your Cline MCP settings file. On Windows this is commonly under VS Code global storage:

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

If Cline starts MCP servers outside the project folder, add `INI_BRAIN_WORKSPACE` for that specific project or pass the optional `workspace` tool argument.

Reload Cline MCP servers or reload VS Code.

## Recommended Cline Instruction

```md
Before editing, call ini_brain_get_context for my task. Use ini_brain_search_memory when previous decisions may matter. Save durable findings with ini_brain_save_memory after finishing.
```

The extension also generates `.cline/skills` and `.clinerules` files when you run Scan Project or Generate Agent Guide.

---

# تثبيت INI Brain AI Universal على Cline

الإصدار: 2.0.1

## البناء

```powershell
cd ini-brain-ai-universal
npm install
npm run compile
```

## إعدادات Cline MCP

افتح أو أنشئ ملف إعدادات Cline MCP. في ويندوز غالبًا يكون داخل تخزين VS Code العام:

```text
%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

ادمج إعداد السيرفر التالي:

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

إذا كان Cline يشغل سيرفرات MCP خارج مجلد المشروع، أضف `INI_BRAIN_WORKSPACE` لهذا المشروع فقط أو مرر وسيط الأداة الاختياري `workspace`.

أعد تحميل سيرفرات Cline MCP أو أعد تحميل VS Code.

## التعليمات المقترحة لـ Cline

```md
Before editing, call ini_brain_get_context for my task. Use ini_brain_search_memory when previous decisions may matter. Save durable findings with ini_brain_save_memory after finishing.
```

تقوم الإضافة أيضًا بتوليد ملفات `.cline/skills` و`.clinerules` عند تشغيل Scan Project أو Generate Agent Guide.
