# Install INI Brain AI Universal For Codex

Version: 2.0.1

Codex can benefit from INI Brain in two layers:

1. Repository guidance through `AGENTS.md` and `.brain/` files.
2. Live project context through the local MCP server.

## Build The MCP Server

```powershell
git clone https://github.com/inisoliman/ini-brain-ai-universal.git
cd ini-brain-ai-universal
npm install
npm run compile
```

The MCP server entrypoint is:

```text
ini-brain-ai-universal/dist/mcp/server.js
```

## Add MCP Config

For a Superpowers-style global install, configure Codex once without a fixed project path:

```powershell
codex mcp add ini-brain-ai -- node "C:\path\to\ini-brain-ai-universal\dist\mcp\server.js"
```

Or add the same server manually:

```toml
[mcp_servers.ini-brain-ai]
command = 'node'
args = ['C:\path\to\ini-brain-ai-universal\dist\mcp\server.js']
startup_timeout_sec = 120
```

Do not set `INI_BRAIN_WORKSPACE` for the global Codex install unless you intentionally want to pin INI Brain to one project. Without that variable, INI Brain resolves the active project automatically from the MCP process working directory and known workspace environment variables.

If the `codex` command is not in PowerShell `PATH`, run Codex through its full installed path or edit `C:\Users\<you>\.codex\config.toml` manually.

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
git clone https://github.com/inisoliman/ini-brain-ai-universal.git
cd ini-brain-ai-universal
npm install
npm run compile
```

مسار تشغيل سيرفر MCP هو:

```text
ini-brain-ai-universal/dist/mcp/server.js
```

## إضافة إعداد MCP

للتثبيت العام مثل Superpowers، اضبط Codex مرة واحدة بدون مسار مشروع ثابت:

```powershell
codex mcp add ini-brain-ai -- node "C:\path\to\ini-brain-ai-universal\dist\mcp\server.js"
```

أو أضف نفس السيرفر يدويًا:

```toml
[mcp_servers.ini-brain-ai]
command = 'node'
args = ['C:\path\to\ini-brain-ai-universal\dist\mcp\server.js']
startup_timeout_sec = 120
```

لا تضبط `INI_BRAIN_WORKSPACE` في تثبيت Codex العام إلا إذا كنت تريد ربط INI Brain بمشروع واحد فقط. بدون هذا المتغير سيكتشف INI Brain المشروع النشط تلقائيًا من مسار تشغيل MCP ومتغيرات بيئة workspace المعروفة.

إذا كان أمر `codex` غير متاح في PowerShell، شغّل Codex من مساره الكامل أو عدّل ملف `C:\Users\<you>\.codex\config.toml` يدويًا.

## البرومبت المقترح لـ Codex

```md
Before editing, read AGENTS.md. Then call ini_brain_get_context for my task. Search memory when previous decisions may matter. After finishing, save durable decisions, bugs, or workflow discoveries with ini_brain_save_memory.
```

## إعداد المشروع

1. شغّل فحص INI Brain من VS Code أو استدع `ini_brain_generate_agent_guide` من MCP.
2. تأكد من وجود `AGENTS.md` و`.brain/compact_context.md`.
3. شغّل Codex من جذر المشروع.
4. اطلب من Codex استخدام سياق INI Brain قبل التعديل.
