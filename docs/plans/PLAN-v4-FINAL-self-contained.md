# 🎯 INI Brain AI Universal — Master Plan v4.0.0 (Self-Contained Final)

> **هذا الملف مكتفٍ ذاتياً (self-contained).** الوكيل الرخيص لا يحتاج لقراءة أي ملف آخر.
> كل كود مطلوب موجود في هذا الملف **جاهز للنسخ** بدون مراجع لخطط سابقة.
>
> **يدمج:** v2 (Ponytail + Spec-Kit) + v3 (Caveman + Superpowers + Graphify + Universal Adapter + Auto-Update + Token Dashboard).
>
> **الهدف:** `ini-brain-ai-universal@3.0.0` كاملة وقابلة للنشر كـ `.vsix`.

---

## 📑 الفهرس الكامل

- [0. تعليمات للوكيل المنفّذ](#0-تعليمات-للوكيل-المنفّذ)
- [1. السياق والمعمارية](#1-السياق-والمعمارية)
- [2. الملفات الموجودة حالياً (لا تلمسها)](#2-الملفات-الموجودة-حالياً)
- [المرحلة 0: التحضير](#المرحلة-0-التحضير)
- [المرحلة 1: تحديث package.json بالكامل](#المرحلة-1-تحديث-packagejson-بالكامل)
- [المرحلة 2: Savings Layer (Caveman + Ponytail + ClaudeLean + TokenMeter)](#المرحلة-2-savings-layer)
- [المرحلة 3: Methodology Layer (Spec-Kit + Superpowers)](#المرحلة-3-methodology-layer)
- [المرحلة 4: Universal Agent Adapter (12 adapter)](#المرحلة-4-universal-agent-adapter)
- [المرحلة 5: Knowledge Graph + Mermaid](#المرحلة-5-knowledge-graph)
- [المرحلة 6: Auto-Update System](#المرحلة-6-auto-update-system)
- [المرحلة 7: MCP Tools الجديدة](#المرحلة-7-mcp-tools-الجديدة)
- [المرحلة 8: تعديل extension.ts](#المرحلة-8-تعديل-extensionts)
- [المرحلة 9: UI Sidebar + Webviews](#المرحلة-9-ui-sidebar)
- [المرحلة 10: التوثيق ثنائي اللغة](#المرحلة-10-التوثيق-ثنائي-اللغة)
- [المرحلة 11: Smoke Tests + التغليف](#المرحلة-11-smoke-tests)
- [قائمة الفحص النهائية](#قائمة-الفحص-النهائية)

---

## 0. تعليمات للوكيل المنفّذ

### قواعد لا تخالفها أبداً
1. **اقرأ هذا الملف بالكامل مرة واحدة قبل البدء.**
2. **نفّذ المراحل بالترتيب 0→11.** لا تقفز.
3. **بعد كل مرحلة:** نفّذ `npm run compile` في `ini-brain-ai-universal/`. إذا فشل، صحّح قبل المتابعة.
4. **لا تضف أي npm dependency جديدة.** المشروع zero-deps في `dependencies`. devDependencies فقط لـ TypeScript.
5. **كل كود في هذا الملف:** انسخه بالحرف. لا تختصر ولا تعدّل أسماء المتغيرات.
6. **عند تعديل ملف موجود:** استخدم Search/Replace block المحدد في كل مرحلة.
7. **UTF-8 + LF** لكل الملفات.
8. **بعد كل مرحلة:** احفظ session memory:
   ```
   ini_brain_save_memory: "v4 progress: completed phase N. Next: phase N+1."
   ```
9. **لو توقفت لأي سبب:** ابحث في الذاكرة عن `"v4 progress"` لمعرفة آخر مرحلة.
10. **لا تلمس:** `.git/`, `.brain/backups/`, ملفات `.vsix` الموجودة.

### بنية الـworkspace الحالية
```
c:/Users/helen/Downloads/vs/exbrain.all/
├── ini-brain-ai-universal/        ← العمل هنا
│   ├── src/                        ← كل الكود الجديد هنا
│   ├── docs/                       ← التوثيق
│   ├── scripts/                    ← smoke tests
│   ├── resources/
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
```

---

## 1. السياق والمعمارية

### 1.1 ماذا نبني؟
**Universal AI Productivity Platform** = إضافة VS Code واحدة تجمع:
- **Memory:** ذاكرة دائمة للمشروع.
- **Token Savings:** Caveman (-70٪ output) + Ponytail (-54٪ code) + Claude-Lean.
- **Methodology:** Spec-Kit (SDD) + Superpowers (composable skills).
- **Knowledge Graph:** code/concept/memory graph بـ Mermaid.
- **Universal Agent Adapter:** 12 وكيل (Claude/Codex/Cline/Cursor/Windsurf/Antigravity/Gemini/Copilot/OpenCode/Kimi/Kiro + AGENTS.md).
- **Auto-Update:** يتابع 7 ريبوهات upstream أسبوعياً.

### 1.2 المعمارية النهائية
```
ini-brain-ai-universal/src/
├── extension.ts                  ← يُعدّل
├── core/                          ← موجود (لا يُلمس)
│   ├── agentGuide.ts
│   ├── brainStore.ts
│   ├── memoryStore.ts
│   ├── projectScanner.ts
│   ├── contextBuilder.ts
│   ├── insightBuilder.ts
│   ├── autoBackground.ts
│   ├── guardSkills.ts
│   ├── pathUtils.ts
│   └── types.ts
├── savings/                       ⭐ جديد كامل
│   ├── index.ts
│   ├── ponytail.ts
│   ├── caveman.ts
│   ├── claudeLean.ts
│   └── tokenMeter.ts
├── methodology/                   ⭐ جديد كامل
│   ├── specKit.ts
│   └── superpowers.ts
├── graph/                         ⭐ جديد كامل
│   ├── knowledgeGraph.ts
│   └── mermaidRenderer.ts
├── adapters/                      ⭐ جديد كامل
│   ├── types.ts
│   ├── registry.ts
│   ├── claudeAdapter.ts
│   ├── codexAdapter.ts
│   ├── clineAdapter.ts
│   ├── cursorAdapter.ts
│   ├── windsurfAdapter.ts
│   ├── antigravityAdapter.ts
│   ├── geminiAdapter.ts
│   ├── copilotAdapter.ts
│   ├── openCodeAdapter.ts
│   ├── kimiAdapter.ts
│   ├── kiroAdapter.ts
│   └── universalFallback.ts
├── updater/                       ⭐ جديد كامل
│   ├── upstreamSources.ts
│   ├── repoSync.ts
│   └── stateStore.ts
├── mcp/                           ← يُعدّل
│   ├── server.ts                  (يُمدّد)
│   ├── workspace.ts               (موجود)
│   └── tools/                     ⭐ جديد
│       ├── savingsTools.ts
│       ├── graphTools.ts
│       └── methodologyTools.ts
└── ui/                            ← يُعدّل
    ├── sidebarProvider.ts         (يُمدّد)
    ├── graphWebview.ts            ⭐ جديد
    └── savingsDashboard.ts        ⭐ جديد
```

---

## 2. الملفات الموجودة حالياً

> ⚠️ **هذه الملفات موجودة. لا تنشئها من جديد. عدّلها فقط حسب التعليمات المحددة.**

| الملف | الوظيفة الحالية | يُعدَّل في v4؟ |
|------|----------------|--------------|
| `src/extension.ts` | تفعيل الإضافة + commands | ✅ المرحلة 8 |
| `src/core/agentGuide.ts` | كتابة AGENTS.md + skills | ✅ المرحلة 4 (تكامل adapter) |
| `src/core/brainStore.ts` | تخزين scan results | ❌ |
| `src/core/memoryStore.ts` | ذاكرة المشروع | ❌ |
| `src/core/projectScanner.ts` | فحص الـworkspace | ❌ |
| `src/core/contextBuilder.ts` | بناء context | ❌ |
| `src/core/autoBackground.ts` | المهام الخلفية | ✅ المرحلة 6 (auto-update) |
| `src/core/guardSkills.ts` | guard skills | ❌ |
| `src/mcp/server.ts` | MCP server | ✅ المرحلة 7 (tools جديدة) |
| `src/ui/sidebarProvider.ts` | sidebar HTML | ✅ المرحلة 9 (dashboards) |
| `src/integrations/registry.ts` | mcp config integration | ❌ |
| `package.json` | manifest | ✅ المرحلة 1 |
| `README.md` | docs | ✅ المرحلة 10 |

---

## المرحلة 0: التحضير

**الزمن المتوقع:** 5 دقائق.

### 0.1 أنشئ المجلدات الجديدة
```powershell
cd c:\Users\helen\Downloads\vs\exbrain.all\ini-brain-ai-universal
New-Item -ItemType Directory -Force -Path src\savings, src\methodology, src\graph, src\adapters, src\updater, src\mcp\tools, docs\features\ar, docs\features\en, docs\features\plans-archive
```

### 0.2 ثبّت dependencies (إذا كانت غير مثبتة)
```powershell
npm install
```
> إذا فشل: تأكد من Node 20+.

### 0.3 تحقق من حالة compile الحالية
```powershell
npm run compile
```
يجب أن ينجح. إذا فشل = توقف وأبلغ المستخدم.

### 0.4 احفظ نقطة بداية في الذاكرة
استدع `ini_brain_save_memory` بالمحتوى:
```
v4 progress: starting phase 0 complete. Workspace prepared.
```

---

## المرحلة 1: تحديث package.json بالكامل

**الزمن المتوقع:** 10 دقائق.

### 1.1 المهمة
استبدل ملف `ini-brain-ai-universal/package.json` بالكامل بهذا المحتوى:

```json
{
  "name": "ini-brain-ai-universal",
  "displayName": "INI Brain AI Universal",
  "description": "Local-first AI productivity platform: project memory, token savings (Caveman+Ponytail), Spec-Driven Development, knowledge graph, and universal adapter for Claude/Codex/Cline/Cursor/Windsurf/Antigravity/Gemini/Copilot/OpenCode/Kimi/Kiro and any MCP client.",
  "version": "3.0.0",
  "publisher": "ini-brain",
  "license": "MIT",
  "engines": {
    "vscode": "^1.90.0"
  },
  "categories": [
    "AI",
    "Machine Learning",
    "Other"
  ],
  "activationEvents": [
    "onStartupFinished",
    "onView:iniBrain.sidebar"
  ],
  "main": "./dist/extension.js",
  "bin": {
    "ini-brain-mcp": "./dist/mcp/server.js"
  },
  "contributes": {
    "commands": [
      { "command": "iniBrain.scanProject", "title": "INI Brain: Scan Project" },
      { "command": "iniBrain.rebuildBrain", "title": "INI Brain: Rebuild Brain" },
      { "command": "iniBrain.guidedSetup", "title": "INI Brain: Guided Setup" },
      { "command": "iniBrain.generateAgentGuide", "title": "INI Brain: Generate Agent Guide" },
      { "command": "iniBrain.generateSkillsWorkflow", "title": "INI Brain: Generate Skills and Workflow" },
      { "command": "iniBrain.saveMemory", "title": "INI Brain: Save Memory" },
      { "command": "iniBrain.searchMemory", "title": "INI Brain: Search Memory" },
      { "command": "iniBrain.showProjectProfile", "title": "INI Brain: Show Project Profile" },
      { "command": "iniBrain.copyMcpConfig", "title": "INI Brain: Copy MCP Config" },
      { "command": "iniBrain.installIntegrations", "title": "INI Brain: Install Integrations" },
      { "command": "iniBrain.configureProvider", "title": "INI Brain: Configure AI Provider" },

      { "command": "iniBrain.enableCaveman", "title": "INI Brain: Enable Caveman Mode (output -70%)" },
      { "command": "iniBrain.disableCaveman", "title": "INI Brain: Disable Caveman Mode" },
      { "command": "iniBrain.enablePonytail", "title": "INI Brain: Enable Ponytail Mode (code -54%)" },
      { "command": "iniBrain.disablePonytail", "title": "INI Brain: Disable Ponytail Mode" },
      { "command": "iniBrain.enableClaudeLean", "title": "INI Brain: Enable Claude Lean Rules" },
      { "command": "iniBrain.disableClaudeLean", "title": "INI Brain: Disable Claude Lean Rules" },
      { "command": "iniBrain.enableAllSavings", "title": "INI Brain: Enable All Savings (recommended)" },
      { "command": "iniBrain.disableAllSavings", "title": "INI Brain: Disable All Savings" },
      { "command": "iniBrain.switchSavingsLevel", "title": "INI Brain: Switch Savings Level (lite/full/ultra)" },
      { "command": "iniBrain.showTokenDashboard", "title": "INI Brain: Show Token Savings Dashboard" },
      { "command": "iniBrain.measureFileTokens", "title": "INI Brain: Measure Current File Tokens" },

      { "command": "iniBrain.specCreate", "title": "INI Brain: Create Spec (SDD)" },
      { "command": "iniBrain.specPlan", "title": "INI Brain: Generate Plan from Spec" },
      { "command": "iniBrain.specTasks", "title": "INI Brain: Break Spec into Tasks" },
      { "command": "iniBrain.specImplement", "title": "INI Brain: Open Next Task to Implement" },

      { "command": "iniBrain.buildKnowledgeGraph", "title": "INI Brain: Build Knowledge Graph" },
      { "command": "iniBrain.showKnowledgeGraph", "title": "INI Brain: Show Knowledge Graph" },
      { "command": "iniBrain.findImpact", "title": "INI Brain: Find Impact (Blast Radius)" },

      { "command": "iniBrain.installAllAgents", "title": "INI Brain: Install Skills for All Agents" },
      { "command": "iniBrain.removeAllAgents", "title": "INI Brain: Remove Skills from All Agents" },

      { "command": "iniBrain.checkUpstream", "title": "INI Brain: Check Upstream Updates" },
      { "command": "iniBrain.applyUpstream", "title": "INI Brain: Apply Upstream Updates" },
      { "command": "iniBrain.configureAutoUpdate", "title": "INI Brain: Configure Auto-Update" }
    ],
    "viewsContainers": {
      "activitybar": [
        {
          "id": "iniBrain",
          "title": "INI Brain AI",
          "icon": "resources/brain.svg"
        }
      ]
    },
    "views": {
      "iniBrain": [
        {
          "id": "iniBrain.sidebar",
          "name": "Brain",
          "type": "webview"
        }
      ]
    },
    "configuration": {
      "title": "INI Brain AI Universal",
      "properties": {
        "iniBrain.apiBaseUrl": {
          "type": "string",
          "default": "https://api.openai.com/v1/",
          "description": "OpenAI-compatible API base URL used for optional AI-assisted project analysis."
        },
        "iniBrain.modelName": {
          "type": "string",
          "default": "gpt-4.1",
          "description": "Model name used for optional AI-assisted suggestions."
        },
        "iniBrain.autoScan": {
          "type": "boolean",
          "default": true,
          "description": "Automatically initialize or refresh INI Brain context when a workspace opens."
        },
        "iniBrain.maxContextFiles": {
          "type": "number",
          "default": 16,
          "minimum": 1,
          "maximum": 80,
          "description": "Maximum relevant files included in generated task context."
        },
        "iniBrain.caveman.enabled": {
          "type": "boolean",
          "default": false,
          "description": "Enable Caveman compression skill (reduces AI output verbosity ~70%)."
        },
        "iniBrain.caveman.mode": {
          "type": "string",
          "enum": ["lite", "full", "ultra", "wenyan"],
          "default": "full",
          "description": "Caveman compression level."
        },
        "iniBrain.ponytail.enabled": {
          "type": "boolean",
          "default": false,
          "description": "Enable Ponytail lazy-senior-dev skill (reduces generated code ~54%)."
        },
        "iniBrain.ponytail.mode": {
          "type": "string",
          "enum": ["lite", "full", "ultra"],
          "default": "full",
          "description": "Ponytail strictness level."
        },
        "iniBrain.claudeLean.enabled": {
          "type": "boolean",
          "default": false,
          "description": "Enable Claude lean response rules (no preamble, no sycophancy)."
        },
        "iniBrain.specKit.enabled": {
          "type": "boolean",
          "default": false,
          "description": "Enable local Spec-Driven Development workflow."
        },
        "iniBrain.graph.autoBuild": {
          "type": "boolean",
          "default": false,
          "description": "Auto-build knowledge graph on scan."
        },
        "iniBrain.adapter.installOnEnable": {
          "type": "boolean",
          "default": true,
          "description": "Deploy skills to all detected agents when a skill is enabled."
        },
        "iniBrain.autoUpdate.enabled": {
          "type": "boolean",
          "default": false,
          "description": "Periodically check upstream repos for skill updates."
        },
        "iniBrain.autoUpdate.intervalHours": {
          "type": "number",
          "default": 168,
          "minimum": 24,
          "maximum": 720,
          "description": "Interval between upstream checks in hours (default: 1 week)."
        },
        "iniBrain.autoUpdate.requireApproval": {
          "type": "boolean",
          "default": true,
          "description": "Always ask before applying upstream updates."
        }
      }
    }
  },
  "scripts": {
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "test:workspace": "node scripts/workspace-detection-smoke.cjs",
    "test:mcp-config": "node scripts/mcp-config-smoke.cjs",
    "smoke:mcp": "node scripts/mcp-smoke.cjs",
    "smoke:savings": "node scripts/savings-smoke.cjs",
    "smoke:adapters": "node scripts/adapters-smoke.cjs",
    "smoke:updater": "node scripts/updater-smoke.cjs",
    "smoke:all": "npm run smoke:mcp && npm run smoke:savings && npm run smoke:adapters && npm run smoke:updater",
    "package": "vsce package --no-dependencies",
    "vscode:prepublish": "npm run compile"
  },
  "devDependencies": {
    "@types/node": "^20.14.10",
    "@types/vscode": "^1.90.0",
    "@vscode/vsce": "^2.32.0",
    "typescript": "^5.5.3"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/inisoliman/ini-brain-ai-universal.git"
  }
}
```

### 1.2 تحقق
```powershell
npm run compile
```
يجب أن ينجح. الإصدار الآن 3.0.0.

### 1.3 احفظ progress
```
ini_brain_save_memory: "v4 progress: phase 1 complete. package.json updated to 3.0.0 with 35+ commands and 12 settings."
```

---

## المرحلة 2: Savings Layer

**الزمن المتوقع:** 90 دقيقة.

### 2.1 أنشئ `src/savings/ponytail.ts`

```typescript
/**
 * Ponytail integration for INI Brain AI Universal.
 * Skill text adapted from https://github.com/DietrichGebert/ponytail (MIT © Dietrich Gebert).
 */
import * as fs from 'fs/promises';
import * as path from 'path';

export type PonytailMode = 'lite' | 'full' | 'ultra';

const PONYTAIL_CORE = `# Ponytail — Lazy Senior Dev Mode

You are a lazy senior developer. Lazy means efficient, not careless.
The best code is the code never written.

Before writing any code, stop at the first rung that holds:

1. Does this need to be built at all? (YAGNI)
2. Does the standard library already do this? Use it.
3. Does a native platform feature cover it? Use it.
4. Does an already-installed dependency solve it? Use it.
5. Can this be one line? Make it one line.
6. Only then: write the minimum code that works.

## Rules

- No abstractions that weren't explicitly requested.
- No new dependency if it can be avoided.
- No boilerplate nobody asked for.
- Deletion over addition. Boring over clever. Fewest files possible.
- Question complex requests: "Do you actually need X, or does Y cover it?"
- Mark intentional simplifications with a \`ponytail:\` comment.

## Never Lazy About

- Input validation at trust boundaries.
- Error handling that prevents data loss.
- Security and authentication.
- Accessibility (a11y).
- Anything explicitly requested by the user.

Non-trivial logic leaves ONE runnable check behind
(assert-based self-check or one small test file).
`;

const PONYTAIL_ULTRA_SUFFIX = `

## Ultra Mode (aggressive)

- If a function is under 5 lines, inline it at the call site.
- If a file exports one thing, prefer co-locating it.
- Prefer expression-bodied returns over multi-statement blocks.
- Delete dead branches the moment they're spotted.
`;

const PONYTAIL_LITE_BODY = `# Ponytail Lite — YAGNI Only

Before writing code, ask: "Does this need to exist?"
If no, skip it. If yes, keep it minimal.

Never compromise on: validation, error handling, security, accessibility.
`;

export function renderPonytailSkill(mode: PonytailMode): string {
  if (mode === 'lite') return PONYTAIL_LITE_BODY;
  if (mode === 'ultra') return PONYTAIL_CORE + PONYTAIL_ULTRA_SUFFIX;
  return PONYTAIL_CORE;
}

export const PONYTAIL_COMMANDS: Record<string, string> = {
  'ponytail-review.md': `# /ponytail-review

Review the current file under Ponytail rules. Output:
- Lines that can be deleted with no behavior change.
- Abstractions that have only one caller.
- Dependencies imported but barely used.
- Boilerplate that adds no value.

End with: total LOC before → estimated LOC after.
`,
  'ponytail-audit.md': `# /ponytail-audit

Walk the workspace and produce JSON:
{
  "unused_dependencies": [...],
  "single_caller_abstractions": [...],
  "files_under_3_lines": [...],
  "estimated_savings_loc": number
}
`,
  'ponytail-debt.md': `# /ponytail-debt

Find technical debt that violates the lazy ladder:
- New wrappers around stdlib.
- Polyfills for features the runtime already has.
- Custom utilities duplicating dep functionality.

Output: priority-ranked list with suggested deletion path.
`,
  'ponytail-gain.md': `# /ponytail-gain

Before any new feature, run this checklist:
1. Will the user actually use this within 30 days?
2. Is there a one-line stdlib/platform alternative?
3. Can it be a comment in existing code instead?
4. What is the deletion cost if requirements change?

Only proceed if answers justify the cost.
`,
  'ponytail-help.md': `# /ponytail-help

Ponytail commands: /ponytail-review, /ponytail-audit, /ponytail-debt, /ponytail-gain.
Modes: lite, full, ultra. Toggle via INI Brain settings.
`,
};

export interface PonytailDeployOptions {
  root: string;
  mode: PonytailMode;
}

export async function deployPonytailLocal(opts: PonytailDeployOptions): Promise<string[]> {
  const skillBody = renderPonytailSkill(opts.mode);
  const written: string[] = [];
  const skillFile = path.join(opts.root, '.brain', 'skills', 'ponytail.md');
  await fs.mkdir(path.dirname(skillFile), { recursive: true });
  await fs.writeFile(skillFile, skillBody, 'utf8');
  written.push(skillFile);

  for (const [name, body] of Object.entries(PONYTAIL_COMMANDS)) {
    const file = path.join(opts.root, '.brain', 'commands', name);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, body, 'utf8');
    written.push(file);
  }
  return written;
}

export async function removePonytailLocal(root: string): Promise<void> {
  await fs.rm(path.join(root, '.brain', 'skills', 'ponytail.md'), { force: true }).catch(() => undefined);
  for (const name of Object.keys(PONYTAIL_COMMANDS)) {
    await fs.rm(path.join(root, '.brain', 'commands', name), { force: true }).catch(() => undefined);
  }
}
```

### 2.2 أنشئ `src/savings/caveman.ts`

```typescript
/**
 * Caveman integration for INI Brain AI Universal.
 * Skill philosophy adapted from https://github.com/JuliusBrussee/caveman (MIT).
 */
import * as fs from 'fs/promises';
import * as path from 'path';

export type CavemanMode = 'lite' | 'full' | 'ultra' | 'wenyan';

const CAVEMAN_LITE = `# Caveman Lite

Reply concisely. Skip filler:
- No "Sure!", "Great question!", "Of course!".
- No restating the question.
- No unsolicited suggestions at the end.

Preserve byte-for-byte: code, URLs, file paths, error messages.
Preserve user's language.
`;

const CAVEMAN_FULL = `# Caveman — Compressed Style

Why use many token when few do trick.

Rules:
- No preamble, no postamble.
- No apologies or sycophancy.
- No "I hope this helps" or similar.
- Drop articles where unambiguous.
- Use telegraphic style for prose.
- Code, URLs, paths, error strings: BYTE-PRESERVED. Never compress.
- Math/numbers: preserve exactly.
- User's language: preserved (Arabic stays Arabic).

Output style:
- Direct answer first.
- Bullets over paragraphs.
- Tables when comparing.
- Minimum words, full meaning.

What NEVER compresses:
- Thinking/reasoning (internal).
- Code blocks.
- Quoted strings.
- File paths.
- Error messages.
- URLs.
`;

const CAVEMAN_ULTRA = `# Caveman Ultra — Telegraphic

Extreme compression. Read like telegram.

- Drop subject when implied.
- Drop "the", "a", "an" when clear.
- "is/are" → omit if implied.
- Numbers > words.
- Symbols > phrases: → not "becomes", & not "and".
- Imperatives over descriptions.
- One verb per sentence ideal.

Preserve same as full mode: code, URLs, paths, errors, math, user language.
`;

const CAVEMAN_WENYAN = `# Caveman Wenyan — Classical Chinese Style

Compress prose toward classical Chinese density (works in any language).
Each sentence: subject + verb + object. No connectives unless needed.
Punctuation minimal.

Preserve: code, URLs, paths, errors, math, user language.
`;

export function renderCavemanSkill(mode: CavemanMode): string {
  switch (mode) {
    case 'lite': return CAVEMAN_LITE;
    case 'ultra': return CAVEMAN_ULTRA;
    case 'wenyan': return CAVEMAN_WENYAN;
    case 'full':
    default: return CAVEMAN_FULL;
  }
}

export const CAVEMAN_COMMANDS: Record<string, string> = {
  'caveman.md': `# /caveman [lite|full|ultra|wenyan]

Switch Caveman compression level for this session.
Default: full. Use 'off' to disable.
`,
  'caveman-commit.md': `# /caveman-commit

Write a git commit message in Caveman style.
Format: <type>: <imperative, lower-case, ≤50 chars>

Body (optional): bullets, no fluff, why > what.
Footer: BREAKING CHANGE: / Closes #N.
`,
  'caveman-pr.md': `# /caveman-pr

Write a Pull Request description in Caveman style:
- Title: imperative ≤72 chars.
- Why: 1 sentence.
- What: bullets.
- How to test: bullets.
- Risks: bullets or "none".
`,
  'caveman-doc.md': `# /caveman-doc

Write documentation in Caveman style:
- One-line summary first.
- Parameters: name (type) — meaning.
- Returns: type — meaning.
- Example: minimal, runnable.
- No "this function does X" prose.
`,
  'caveman-help.md': `# /caveman-help

Modes:
- lite: drop filler only.
- full (default): telegraphic style.
- ultra: extreme compression.
- wenyan: classical-dense style.

Preserves: code, URLs, paths, errors, math, user language.
Subcommands: /caveman-commit /caveman-pr /caveman-doc.
`,
};

export async function deployCavemanLocal(opts: { root: string; mode: CavemanMode }): Promise<string[]> {
  const skillBody = renderCavemanSkill(opts.mode);
  const written: string[] = [];
  const skillFile = path.join(opts.root, '.brain', 'skills', 'caveman.md');
  await fs.mkdir(path.dirname(skillFile), { recursive: true });
  await fs.writeFile(skillFile, skillBody, 'utf8');
  written.push(skillFile);

  for (const [name, body] of Object.entries(CAVEMAN_COMMANDS)) {
    const file = path.join(opts.root, '.brain', 'commands', name);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, body, 'utf8');
    written.push(file);
  }
  return written;
}

export async function removeCavemanLocal(root: string): Promise<void> {
  await fs.rm(path.join(root, '.brain', 'skills', 'caveman.md'), { force: true }).catch(() => undefined);
  for (const name of Object.keys(CAVEMAN_COMMANDS)) {
    await fs.rm(path.join(root, '.brain', 'commands', name), { force: true }).catch(() => undefined);
  }
}
```

### 2.3 أنشئ `src/savings/claudeLean.ts`

```typescript
/**
 * Claude Lean rules for INI Brain AI Universal.
 * Inspired by https://github.com/drona23/claude-token-efficient (MIT).
 */
import * as fs from 'fs/promises';
import * as path from 'path';

const CLAUDE_LEAN_RULES = `# Claude Lean Mode

Output cost dominates at scale. Apply these rules to every response:

1. No preamble. Answer the question first.
2. No sycophancy: drop "Sure!", "Great question!", "Absolutely!".
3. No closing wrap-up: drop "I hope this helps!", "Let me know if...".
4. Don't restate the question.
5. No unsolicited suggestions or alternatives.
6. No smart quotes (' ' " "). Use ASCII quotes.
7. No em-dashes (—). Use commas, periods, or parens.
8. No "the user", refer directly: "you".
9. Code first when code is asked. Explanation second, only if requested.
10. Lists over paragraphs when applicable.

What you DO keep:
- Necessary clarifications when ambiguous.
- Warnings when proposing destructive actions.
- Citations when claiming facts.

When the user prefers verbose: they override; comply.
`;

export async function deployClaudeLeanLocal(root: string): Promise<string[]> {
  const written: string[] = [];
  const targets = [
    path.join(root, '.brain', 'skills', 'claude-lean.md'),
    path.join(root, 'CLAUDE.md'),
  ];
  for (const target of targets) {
    await fs.mkdir(path.dirname(target), { recursive: true });
    // For CLAUDE.md, append if exists to preserve user content
    if (target.endsWith('CLAUDE.md')) {
      try {
        const existing = await fs.readFile(target, 'utf8');
        if (!existing.includes('# Claude Lean Mode')) {
          await fs.writeFile(target, existing.trimEnd() + '\n\n' + CLAUDE_LEAN_RULES, 'utf8');
        }
      } catch {
        await fs.writeFile(target, CLAUDE_LEAN_RULES, 'utf8');
      }
    } else {
      await fs.writeFile(target, CLAUDE_LEAN_RULES, 'utf8');
    }
    written.push(target);
  }
  return written;
}

export async function removeClaudeLeanLocal(root: string): Promise<void> {
  await fs.rm(path.join(root, '.brain', 'skills', 'claude-lean.md'), { force: true }).catch(() => undefined);
  // CLAUDE.md: only remove the appended section
  try {
    const file = path.join(root, 'CLAUDE.md');
    const content = await fs.readFile(file, 'utf8');
    const idx = content.indexOf('# Claude Lean Mode');
    if (idx >= 0) {
      const before = content.slice(0, idx).trimEnd();
      if (before.length === 0) {
        await fs.rm(file, { force: true });
      } else {
        await fs.writeFile(file, before + '\n', 'utf8');
      }
    }
  } catch {
    // ignore
  }
}

export function getClaudeLeanRules(): string {
  return CLAUDE_LEAN_RULES;
}
```

### 2.4 أنشئ `src/savings/tokenMeter.ts`

```typescript
/**
 * Token meter — heuristic token counter and savings tracker.
 * Uses 4 chars ≈ 1 token approximation (close to GPT/Claude tokenizers for English).
 * For non-English, applies adjustment factor.
 */
import * as fs from 'fs/promises';
import * as path from 'path';

export interface TokenStats {
  totalTokens: number;
  totalCharacters: number;
  totalWords: number;
  estimatedCostUsd: number;
}

export interface SavingsRecord {
  date: string; // YYYY-MM-DD
  tokensSaved: number;
  costSavedUsd: number;
  mode: string;
}

const DEFAULT_INPUT_COST_PER_1K = 0.003;  // gpt-4.1 input
const DEFAULT_OUTPUT_COST_PER_1K = 0.012; // gpt-4.1 output

export function countTokens(text: string): number {
  if (!text) return 0;
  const chars = text.length;
  // Detect if text has many non-ASCII (Arabic, Chinese, etc.) → adjust
  const nonAsciiRatio = (text.match(/[^\x00-\x7F]/g) || []).length / Math.max(1, chars);
  const factor = nonAsciiRatio > 0.3 ? 2.5 : 4; // non-Latin needs ~2.5 chars/token
  return Math.ceil(chars / factor);
}

export function measureText(text: string, costPer1K = DEFAULT_INPUT_COST_PER_1K): TokenStats {
  const tokens = countTokens(text);
  return {
    totalTokens: tokens,
    totalCharacters: text.length,
    totalWords: text.trim().split(/\s+/).filter(Boolean).length,
    estimatedCostUsd: (tokens / 1000) * costPer1K,
  };
}

export async function measureFile(filePath: string): Promise<TokenStats> {
  const content = await fs.readFile(filePath, 'utf8');
  return measureText(content);
}

const STATS_FILE = '.brain/savings-stats.json';

export async function recordSavings(root: string, record: SavingsRecord): Promise<void> {
  const file = path.join(root, STATS_FILE);
  let history: SavingsRecord[] = [];
  try {
    const raw = await fs.readFile(file, 'utf8');
    history = JSON.parse(raw);
    if (!Array.isArray(history)) history = [];
  } catch { /* file missing */ }

  // Aggregate by date+mode
  const existing = history.find(h => h.date === record.date && h.mode === record.mode);
  if (existing) {
    existing.tokensSaved += record.tokensSaved;
    existing.costSavedUsd += record.costSavedUsd;
  } else {
    history.push(record);
  }
  // Keep last 90 days
  if (history.length > 90 * 5) {
    history = history.slice(-90 * 5);
  }

  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(history, null, 2), 'utf8');
}

export async function readSavingsHistory(root: string): Promise<SavingsRecord[]> {
  const file = path.join(root, STATS_FILE);
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function summarizeSavings(history: SavingsRecord[]): {
  totalTokensSaved: number;
  totalCostSavedUsd: number;
  byMode: Record<string, { tokens: number; cost: number }>;
  byDate: Record<string, { tokens: number; cost: number }>;
} {
  const summary = {
    totalTokensSaved: 0,
    totalCostSavedUsd: 0,
    byMode: {} as Record<string, { tokens: number; cost: number }>,
    byDate: {} as Record<string, { tokens: number; cost: number }>,
  };
  for (const r of history) {
    summary.totalTokensSaved += r.tokensSaved;
    summary.totalCostSavedUsd += r.costSavedUsd;
    if (!summary.byMode[r.mode]) summary.byMode[r.mode] = { tokens: 0, cost: 0 };
    summary.byMode[r.mode].tokens += r.tokensSaved;
    summary.byMode[r.mode].cost += r.costSavedUsd;
    if (!summary.byDate[r.date]) summary.byDate[r.date] = { tokens: 0, cost: 0 };
    summary.byDate[r.date].tokens += r.tokensSaved;
    summary.byDate[r.date].cost += r.costSavedUsd;
  }
  return summary;
}
```

### 2.5 أنشئ `src/savings/index.ts`

```typescript
/**
 * Savings layer orchestrator.
 * Coordinates Caveman, Ponytail, Claude-Lean, and Token Meter.
 */
import { CavemanMode, deployCavemanLocal, removeCavemanLocal } from './caveman';
import { PonytailMode, deployPonytailLocal, removePonytailLocal } from './ponytail';
import { deployClaudeLeanLocal, removeClaudeLeanLocal } from './claudeLean';

export * from './caveman';
export * from './ponytail';
export * from './claudeLean';
export * from './tokenMeter';

export type SavingsSkill = 'caveman' | 'ponytail' | 'claudeLean';

export interface SavingsState {
  caveman: { enabled: boolean; mode: CavemanMode };
  ponytail: { enabled: boolean; mode: PonytailMode };
  claudeLean: { enabled: boolean };
}

export async function applySavings(root: string, state: SavingsState): Promise<string[]> {
  const written: string[] = [];
  if (state.caveman.enabled) {
    written.push(...await deployCavemanLocal({ root, mode: state.caveman.mode }));
  } else {
    await removeCavemanLocal(root);
  }
  if (state.ponytail.enabled) {
    written.push(...await deployPonytailLocal({ root, mode: state.ponytail.mode }));
  } else {
    await removePonytailLocal(root);
  }
  if (state.claudeLean.enabled) {
    written.push(...await deployClaudeLeanLocal(root));
  } else {
    await removeClaudeLeanLocal(root);
  }
  return written;
}

export async function removeAllSavings(root: string): Promise<void> {
  await removeCavemanLocal(root);
  await removePonytailLocal(root);
  await removeClaudeLeanLocal(root);
}
```

### 2.6 تحقق
```powershell
npm run compile
```
يجب أن ينجح بدون أخطاء.

### 2.7 احفظ progress
```
ini_brain_save_memory: "v4 progress: phase 2 complete. Savings layer created (Ponytail+Caveman+ClaudeLean+TokenMeter). Files in src/savings/."
```

---

> **⚠️ ملاحظة:** هذا الجزء الأول من v4. الملف الكامل طويل جداً (~5000 سطر). الجزء التالي من المرحلة 3 إلى 11 سيكون في **نفس الملف** عبر تعديلات لاحقة.

⏭️ **انتقل للمرحلة 3** عندما تنتهي من المرحلة 2.
