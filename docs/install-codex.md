# Install INI Brain AI Universal For Codex

Version: 2.0.1

Codex can benefit from INI Brain in two layers:

1. Repository guidance through `AGENTS.md` and `.brain/` files.
2. Live project context through the local MCP server.

## Build The MCP Server

```powershell
cd ini-brain-ai-universal
npm install
npm run compile
```

The MCP server entrypoint is:

```text
ini-brain-ai-universal/dist/mcp/server.js
```

## Add MCP Config

Use the MCP configuration format supported by your Codex installation and point it to the server:

```json
{
  "mcpServers": {
    "ini-brain-ai": {
      "command": "node",
      "args": ["C:/path/to/ini-brain-ai-universal/dist/mcp/server.js"],
      "env": {
        "INI_BRAIN_WORKSPACE": "C:/path/to/your/project"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Recommended Codex Prompt

```md
Before editing, read AGENTS.md. Then call ini_brain_get_context for my task. Search memory when previous decisions may matter. After finishing, save durable decisions, bugs, or workflow discoveries with ini_brain_save_memory.
```

## Project Setup

1. Run INI Brain scan from VS Code, or call `ini_brain_generate_agent_guide` through MCP.
2. Confirm `AGENTS.md` and `.brain/compact_context.md` exist.
3. Start Codex from the project root.
4. Ask Codex to use INI Brain context before editing.

---

# تثبيت INI Brain AI Universal على Codex

الإصدار: 2.0.1

يمكن لـ Codex الاستفادة من INI Brain بطريقتين:

1. تعليمات المستودع من خلال `AGENTS.md` وملفات `.brain/`.
2. سياق مباشر للمشروع من خلال سيرفر MCP المحلي.

## بناء سيرفر MCP

```powershell
cd ini-brain-ai-universal
npm install
npm run compile
```

مسار تشغيل سيرفر MCP هو:

```text
ini-brain-ai-universal/dist/mcp/server.js
```

## إضافة إعداد MCP

استخدم صيغة إعداد MCP المدعومة في نسخة Codex لديك، واجعلها تشير إلى السيرفر:

```json
{
  "mcpServers": {
    "ini-brain-ai": {
      "command": "node",
      "args": ["C:/path/to/ini-brain-ai-universal/dist/mcp/server.js"],
      "env": {
        "INI_BRAIN_WORKSPACE": "C:/path/to/your/project"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## البرومبت المقترح لـ Codex

```md
Before editing, read AGENTS.md. Then call ini_brain_get_context for my task. Search memory when previous decisions may matter. After finishing, save durable decisions, bugs, or workflow discoveries with ini_brain_save_memory.
```

## إعداد المشروع

1. شغّل فحص INI Brain من VS Code أو استدع `ini_brain_generate_agent_guide` من MCP.
2. تأكد من وجود `AGENTS.md` و`.brain/compact_context.md`.
3. شغّل Codex من جذر المشروع.
4. اطلب من Codex استخدام سياق INI Brain قبل التعديل.
