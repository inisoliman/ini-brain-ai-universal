# INI Brain AI Universal

Version: 2.0.1

INI Brain AI Universal is a local-first project memory and context platform for AI coding agents.

It scans any new or existing workspace, creates a durable `.brain/` knowledge base, generates `AGENTS.md`, exposes context through a local MCP server, and helps tools such as VS Code, Codex, Cline, Antigravity, and generic MCP clients understand projects without repeated explanations.

## What It Does

- Automatically detects empty, new, old, missing, stale, and ready projects.
- Creates and refreshes `.brain/` project memory.
- Generates `AGENTS.md`, workflows, skills, and quality gates.
- Stores local runtime memories in `.brain/memories.json`.
- Exposes MCP tools for context, search, save, and project profile.
- Keeps external AI providers optional.
- Stores API keys in host secret storage where available.

## Project Status

This folder is the modern universal version of INI Brain AI and is ready to become the clean GitHub repository for the next release line.

## Install For VS Code

See [docs/install-vscode.md](docs/install-vscode.md).

Short version:

```powershell
npm install
npm run compile
npm run package
code --install-extension .\ini-brain-ai-universal-2.0.1.vsix --force
```

## Install For Codex

See [docs/install-codex.md](docs/install-codex.md).

Recommended Codex habit:

```md
Before editing, read AGENTS.md. If the INI Brain MCP server is configured, call ini_brain_get_context for my task, search memory when previous decisions may matter, and save durable findings with ini_brain_save_memory after finishing.
```

## Install For Cline

See [docs/install-cline.md](docs/install-cline.md).

## Install For Antigravity

See [docs/install-antigravity.md](docs/install-antigravity.md).

## Generic MCP Config

See [docs/install-generic-mcp.md](docs/install-generic-mcp.md).

Example:

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

## MCP Tools

- `ini_brain_status`
- `ini_brain_get_context`
- `ini_brain_search_memory`
- `ini_brain_save_memory`
- `ini_brain_project_profile`
- `ini_brain_generate_agent_guide`
- `ini_brain_suggest_skills`
- `ini_brain_generate_workflow`

## Daily Workflow

1. Open a project in VS Code.
2. INI Brain detects whether the project is empty, missing, stale, or ready.
3. Run **INI Brain: Guided Setup** for new or empty projects.
4. Run **INI Brain: Scan Project** for existing projects.
5. Install or copy MCP integration instructions for your agent.
6. Ask your agent to use `ini_brain_get_context` before editing.
7. Save important discoveries as memory.

## Safety

- No API key is written into repository files.
- Core project memory stays local.
- AI provider features are optional.
- New project generation requires explicit user action.
- The extension does not auto-apply code changes.

---

# الترجمة العربية

الإصدار: 2.0.1

INI Brain AI Universal هو نظام محلي لبناء ذاكرة وسياق للمشاريع حتى تستفيد منه أدوات الذكاء الاصطناعي البرمجية.

يقوم بفحص أي مشروع جديد أو قديم، وينشئ مجلد `.brain/` كقاعدة معرفة دائمة، ويولّد ملف `AGENTS.md`، ويوفر سيرفر MCP محلي، حتى تستطيع أدوات مثل VS Code وCodex وCline وAntigravity وأي عميل MCP فهم المشروع بدون إعادة شرح متكررة.

## ماذا يفعل؟

- يكتشف تلقائيًا المشاريع الفارغة والجديدة والقديمة والناقصة والقديمة السياق والجاهزة.
- ينشئ ويحدّث ذاكرة المشروع داخل `.brain/`.
- يولّد `AGENTS.md` وملفات workflow وskills وquality gates.
- يحفظ الذاكرة المحلية في `.brain/memories.json`.
- يوفر أدوات MCP للسياق والبحث والحفظ وملف المشروع.
- يجعل مزود الذكاء الاصطناعي الخارجي اختياريًا.
- يخزن مفاتيح API في التخزين الآمن الخاص بالبيئة عندما يكون متاحًا.

## حالة المشروع

هذا المجلد هو النسخة الحديثة والعامة من INI Brain AI، وهو مناسب ليصبح مستودع GitHub النظيف للإصدار الجديد.

## التثبيت على VS Code

راجع [docs/install-vscode.md](docs/install-vscode.md).

الأوامر المختصرة:

```powershell
npm install
npm run compile
npm run package
code --install-extension .\ini-brain-ai-universal-2.0.1.vsix --force
```

## التثبيت على Codex

راجع [docs/install-codex.md](docs/install-codex.md).

أفضل عادة مع Codex:

```md
Before editing, read AGENTS.md. If the INI Brain MCP server is configured, call ini_brain_get_context for my task, search memory when previous decisions may matter, and save durable findings with ini_brain_save_memory after finishing.
```

## التثبيت على Cline

راجع [docs/install-cline.md](docs/install-cline.md).

## التثبيت على Antigravity

راجع [docs/install-antigravity.md](docs/install-antigravity.md).

## إعداد MCP عام

راجع [docs/install-generic-mcp.md](docs/install-generic-mcp.md).

مثال:

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

## أدوات MCP

- `ini_brain_status`
- `ini_brain_get_context`
- `ini_brain_search_memory`
- `ini_brain_save_memory`
- `ini_brain_project_profile`
- `ini_brain_generate_agent_guide`
- `ini_brain_suggest_skills`
- `ini_brain_generate_workflow`

## طريقة الاستخدام اليومية

1. افتح المشروع في VS Code.
2. يكتشف INI Brain هل المشروع فارغ أو ناقص أو قديم السياق أو جاهز.
3. استخدم **INI Brain: Guided Setup** للمشاريع الجديدة أو الفارغة.
4. استخدم **INI Brain: Scan Project** للمشاريع الموجودة.
5. ثبّت أو انسخ إعداد MCP للأداة التي تستخدمها.
6. اطلب من الوكيل استخدام `ini_brain_get_context` قبل التعديل.
7. احفظ الاكتشافات المهمة كذاكرة.

## الأمان

- لا يتم كتابة مفاتيح API داخل ملفات المشروع.
- ذاكرة المشروع الأساسية تبقى محلية.
- ميزات مزود AI الخارجي اختيارية.
- إنشاء مشروع جديد يحتاج أمرًا صريحًا من المستخدم.
- الإضافة لا تطبق تعديلات كود تلقائيًا.
