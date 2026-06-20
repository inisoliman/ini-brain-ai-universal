# INI Brain AI Universal

## What's New in 3.0.0

- **Caveman Mode** - output tokens -70%
- **Ponytail Mode** - generated code -54%
- **Claude Lean** - no preamble, no sycophancy
- **Spec-Kit Lite** - local SDD workflow
- **Knowledge Graph** - visual project map
- **12 Agent Adapters** - Claude/Codex/Cline/Cursor/Windsurf/Antigravity/Gemini/Copilot/OpenCode/Kimi/Kiro + universal
- **Auto-Update** - tracks 7 upstream sources
- **Bilingual Docs** - Arabic + English

See: [docs/features/ar/overview.md](docs/features/ar/overview.md) | [docs/features/en/overview.md](docs/features/en/overview.md)

## Acknowledgements

MIT-licensed projects integrated:
- [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)
- [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)
- [drona23/claude-token-efficient](https://github.com/drona23/claude-token-efficient)
- [github/spec-kit](https://github.com/github/spec-kit)
- [obra/superpowers](https://github.com/obra/superpowers)
- [safishamsi/graphify](https://github.com/safishamsi/graphify)
- [alexgreensh/token-optimizer](https://github.com/alexgreensh/token-optimizer)


> **Version 2.1.0** — Local-first project memory and context platform for AI coding agents (Codex, Claude Desktop, Cline, Antigravity, any MCP client).

GitHub: https://github.com/inisoliman/ini-brain-ai-universal

## What It Does

INI Brain AI Universal scans any new or existing workspace, creates a durable `.brain/` knowledge base, generates `AGENTS.md`, exposes context through a local MCP server, and ships a built-in **golden prompt + quality guards** so every coding agent follows the same disciplined workflow.

- 🧠 Auto-builds `.brain/` (project map, dependencies, compact context, memory).
- 🤖 13 MCP tools (status, get_context, auto_brief, search/save/list memory, project_profile, onboarding, explain, impact, generate_agent_guide, suggest_skills, generate_workflow).
- 🛡️ Three built-in **Quality Guards** (`clean-code-guard`, `test-guard`, `karpathy-guidelines`) auto-deployed to `.brain/skills/`, `.cline/skills/`, `.clinerules/skills/`, `.codex/skills/<id>/SKILL.md`.
- 🌟 **Golden prompt auto-injected** via MCP `instructions` — the agent reads it on every connect, no manual prompt copying.
- 🔄 **Background scan & watcher** — `.brain/` and `AGENTS.md` stay fresh automatically when files change.
- 🔒 100% local. No API key is written to repository files. External AI provider features are optional.

## What's New In 2.1.0

| Feature | Effect |
|---|---|
| `ini_brain_auto_brief` tool | One call returns AGENTS.md + compact context + decisions + memories + protocol. |
| `ini_brain_onboarding` / `explain` / `impact` | LLM-free project insights ported from the advanced edition. |
| `AutoBackground` service | First MCP touch triggers a background scan; `fs.watch` keeps `.brain/` fresh on every file change. |
| Golden prompt in `instructions` | Codex/Claude/Cline read the protocol the moment they connect. |
| Quality Guards skills | `clean-code-guard`, `test-guard`, `karpathy-guidelines` are written to every project automatically. |

## Quick Install (One Command)

```powershell
git clone https://github.com/inisoliman/ini-brain-ai-universal.git
cd ini-brain-ai-universal
powershell -ExecutionPolicy Bypass -File .\scripts\install-all.ps1
```

The auto-installer:
1. Verifies Node.js.
2. Runs `npm install` and `npm run compile`.
3. Adds the MCP server to `~/.codex/config.toml`.
4. Adds the MCP server to Claude Desktop (`%APPDATA%\Claude\claude_desktop_config.json`).
5. Adds the MCP server to Cline (`%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`).

Skip flags: `-SkipBuild -SkipCodex -SkipClaude -SkipCline`.

## Manual Install

### Step 1 — Build the MCP server

```powershell
git clone https://github.com/inisoliman/ini-brain-ai-universal.git
cd ini-brain-ai-universal
npm install
npm run compile
```

The MCP entrypoint will be at `ini-brain-ai-universal/dist/mcp/server.js`.

### Step 2 — Codex CLI

```powershell
codex mcp add ini-brain-ai -- node "C:/path/to/ini-brain-ai-universal/dist/mcp/server.js"
```

Or edit `~/.codex/config.toml` directly:

```toml
[mcp_servers.ini-brain-ai]
command = 'node'
args = ['C:/path/to/ini-brain-ai-universal/dist/mcp/server.js']
startup_timeout_sec = 120
```

### Step 3 — Claude Desktop

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

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

Then **Quit Claude Desktop completely** (also from the system tray) and reopen.

### Step 4 — VS Code (optional)

```powershell
npm run package
code --install-extension .\ini-brain-ai-universal-2.1.0.vsix --force
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

# 🇪🇬 الترجمة العربية

> **الإصدار 2.1.0** — نظام محلي لذاكرة وسياق المشاريع لأي وكيل ذكاء اصطناعي يدعم MCP (Codex / Claude Desktop / Cline / Antigravity).

📂 **المستودع:** https://github.com/inisoliman/ini-brain-ai-universal

📘 **الدليل العربي الكامل:** [docs/install-arabic-guide.md](docs/install-arabic-guide.md)
🪙 **هل توفر التوكينات أم تستهلكها؟:** [docs/tokens-faq.md](docs/tokens-faq.md)

## ماذا يفعل؟

- 🧠 يبني `.brain/` تلقائياً (خريطة المشروع، التبعيات، السياق المضغوط، الذاكرة).
- 🤖 يوفر **13 أداة MCP** لأي عميل ذكي.
- 🛡️ ينشر **3 حُرّاس جودة تلقائياً**: `clean-code-guard`, `test-guard`, `karpathy-guidelines` في `.brain/skills/`, `.cline/skills/`, `.codex/skills/`.
- 🌟 **يحقن البرومبت الذهبي تلقائياً** عبر MCP `instructions` — لا تحتاج كتابته في كل محادثة.
- 🔄 **فحص في الخلفية + watcher** يحدّث `.brain/` و `AGENTS.md` تلقائياً عند تغيّر الملفات.
- 🔒 محلي 100%. لا تُكتب مفاتيح API في ملفات المشروع.

## ✨ الجديد في 2.1.0

| الميزة | التأثير |
|---|---|
| `ini_brain_auto_brief` | استدعاء واحد يعطيك AGENTS.md + السياق + القرارات + الذكريات + البروتوكول. |
| `onboarding` / `explain` / `impact` | تحليل مشروع بدون LLM (entry points، blast radius، شرح ملف). |
| `AutoBackground` | فحص تلقائي عند بدء MCP + watcher على الملفات. |
| البرومبت الذهبي في `instructions` | الوكيل يقرأه فور الاتصال. |
| حُرّاس الجودة | تنتشر في كل مشروع تلقائياً. |

## 🚀 التثبيت السريع (أمر واحد)

```powershell
git clone https://github.com/inisoliman/ini-brain-ai-universal.git
cd ini-brain-ai-universal
powershell -ExecutionPolicy Bypass -File .\scripts\install-all.ps1
```

السكربت يقوم بـ:
1. التحقق من Node.js
2. `npm install` + `npm run compile`
3. إضافة السيرفر إلى `~/.codex/config.toml`
4. إضافته إلى Claude Desktop
5. إضافته إلى Cline (إن كان مثبتاً)

معاملات التخطّي: `-SkipBuild -SkipCodex -SkipClaude -SkipCline`.

## 🔧 التثبيت اليدوي

### 1) بناء سيرفر MCP

```powershell
git clone https://github.com/inisoliman/ini-brain-ai-universal.git
cd ini-brain-ai-universal
npm install
npm run compile
```

### 2) Codex CLI

```powershell
codex mcp add ini-brain-ai -- node "C:/path/to/ini-brain-ai-universal/dist/mcp/server.js"
```

### 3) Claude Desktop
عدّل `%APPDATA%\Claude\claude_desktop_config.json`:

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
ثم **أغلق Claude بالكامل** (من شريط المهام) ثم افتحه.

### 4) VS Code (اختياري)

```powershell
npm run package
code --install-extension .\ini-brain-ai-universal-2.1.0.vsix --force
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
