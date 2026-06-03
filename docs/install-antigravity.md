# Install INI Brain AI Universal For Antigravity

Version: 2.0.1

Antigravity-style agent environments can use INI Brain through generic MCP configuration and repository instruction files.

## Build

```powershell
cd ini-brain-ai-universal
npm install
npm run compile
```

## Configure MCP

If your Antigravity installation exposes MCP server settings, add:

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

If the UI uses a different shape, keep the same command, args, and environment variable:

- command: `node`
- args: `C:/path/to/ini-brain-ai-universal/dist/mcp/server.js`
- env: `INI_BRAIN_WORKSPACE=C:/path/to/your/project`

## Recommended Agent Instruction

```md
Use INI Brain project memory before editing. Call ini_brain_get_context for the task, search memory when previous decisions may matter, and save durable findings after finishing.
```

## Project Files

Run Scan Project from the VS Code extension first, or call `ini_brain_generate_agent_guide` through MCP. This creates:

- `AGENTS.md`
- `.brain/compact_context.md`
- `.brain/workflow.md`
- `.brain/skills.md`
- `.brain/quality_gates.md`

---

# تثبيت INI Brain AI Universal على Antigravity

الإصدار: 2.0.1

يمكن لبيئات الوكلاء المشابهة لـ Antigravity استخدام INI Brain من خلال إعداد MCP عام وملفات تعليمات داخل المستودع.

## البناء

```powershell
cd ini-brain-ai-universal
npm install
npm run compile
```

## إعداد MCP

إذا كانت نسخة Antigravity لديك توفر إعدادات MCP، أضف:

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

إذا كانت الواجهة تستخدم صيغة مختلفة، حافظ على نفس الأمر والوسائط ومتغير البيئة:

- command: `node`
- args: `C:/path/to/ini-brain-ai-universal/dist/mcp/server.js`
- env: `INI_BRAIN_WORKSPACE=C:/path/to/your/project`

## تعليمات الوكيل المقترحة

```md
Use INI Brain project memory before editing. Call ini_brain_get_context for the task, search memory when previous decisions may matter, and save durable findings after finishing.
```

## ملفات المشروع

شغّل Scan Project من إضافة VS Code أولًا، أو استدع `ini_brain_generate_agent_guide` عبر MCP. سينشئ ذلك:

- `AGENTS.md`
- `.brain/compact_context.md`
- `.brain/workflow.md`
- `.brain/skills.md`
- `.brain/quality_gates.md`
