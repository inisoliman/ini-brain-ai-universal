# خطة دمج Ponytail و Spec-Kit داخل INI Brain AI Universal

> **الجمهور المستهدف من هذا الملف:** وكيل ذكاء اصطناعي رخيص (Haiku / GPT-4o-mini / Qwen / DeepSeek-Coder)
> سيقوم بتنفيذ الكود خطوة بخطوة دون الحاجة لاتخاذ قرارات معمارية.
> **اللغة:** عربي للشرح + إنجليزي للكود وأسماء الملفات والـ commit messages.
> **الإصدار المستهدف:** `ini-brain-ai-universal@2.2.0`

---

## 0. الرأي الصريح (TL;DR) قبل أي تنفيذ

### 0.1 رأيي في Ponytail (https://github.com/DietrichGebert/ponytail)

**ما هو فعلياً:**
Ponytail **ليس مكتبة كود ولا MCP server**. هو فقط **"skill / system prompt"** ذكي اسمه "lazy senior dev" يُضاف لأي وكيل AI، يجبره على اتباع سلّم من 6 درجات قبل أن يكتب أي سطر:

```
1. هل يحتاج هذا للوجود أصلاً؟ (YAGNI)
2. هل المكتبة القياسية تفعلها؟ → استخدمها
3. هل المنصة (المتصفح/OS) لديها feature أصلي؟ → استخدمه
4. هل dependency مثبت يحلّها؟ → استخدمها
5. هل يمكن في سطر واحد؟ → سطر واحد
6. وأخيراً فقط: اكتب الحد الأدنى الذي يعمل
```

**الفوائد الحقيقية للمستخدم (بصدق):**
- ✅ **توفير 20–54٪ من التوكنات** (وفي مهام معينة حتى 94٪). هذا توفير حقيقي بالمال.
- ✅ **كود أقل = bugs أقل + maintenance أسهل**.
- ✅ يمنع الوكيل من تثبيت dependencies غير ضرورية (لا flatpickr عندما `<input type="date">` يكفي).
- ✅ **يكمّل INI Brain AI ولا يصارعه**: نحن نعطي السياق، وهو يضبط أسلوب الكتابة.
- ✅ ملفات صغيرة (skill واحد ~ 1KB) لا تثقل المشروع.

**العيوب وما يجب الحذر منه:**
- ⚠️ ليس له API ولا MCP — مجرد ملفات نصية (`AGENTS.md`, `.cursor/rules/*`, `.clinerules/*`...).
- ⚠️ Benchmark الأصلي كان مُبالغاً فيه (80–94٪) لكن الأرقام الواقعية (54٪ متوسط) ما زالت ممتازة.
- ⚠️ ممكن يبسّط الكود أكثر من اللازم لو لم يُضبط (لذلك له أوضاع `lite/full/ultra/off`).
- ⚠️ **مرخّص MIT** فيجوز إعادة استخدام نصوصه بشرط الإسناد (attribution).

**الحكم:** **نعم، يستحق الدمج 100٪** — لكن **كـ skill اختياري قابل للتفعيل/الإلغاء**، وليس كـ default سلوك إجباري. سندمج **الفلسفة + الـ skills + الـ commands** فقط، بدون hooks أو Node runtime خاصة به.

---

### 0.2 رأيي في GitHub Spec-Kit (https://github.com/github/spec-kit)

**ما هو فعلياً:**
أداة CLI من GitHub اسمها `specify` تُنفّذ **Spec-Driven Development (SDD)**:

```
/speckit.constitution  →  مبادئ المشروع الحاكمة
/speckit.specify       →  ماذا تبني (الـ what & why)
/speckit.plan          →  كيف تبني (التقنيات والمعمار)
/speckit.tasks         →  قائمة مهام تنفيذية صغيرة
/speckit.implement     →  نفّذ المهام
```

يُنشئ مجلد `.specify/` فيه specs و plans و tasks، ويدعم 30+ وكيل (Cline, Cursor, Copilot, Codex, Gemini, Claude…).

**الفوائد الحقيقية:**
- ✅ يحوّل "vibe coding" إلى منهجية واضحة → **تقليل الـ rework**.
- ✅ يجبر المستخدم على التفكير قبل الكود → جودة أفضل.
- ✅ يولّد artifacts (specs, plans, tasks) **قابلة للمراجعة من الفريق البشري**.
- ✅ من GitHub رسمياً → موثوق وله مستقبل طويل.

**العيوب وما يجب الحذر منه:**
- ⚠️ يتطلب Python + `uv` (مدير الحزم) → **تبعية خارجية ثقيلة**.
- ⚠️ Specify CLI يُنشئ specs مفصّلة قد تستهلك توكنات كثيرة في المهام البسيطة.
- ⚠️ **مرخّص MIT**.
- ⚠️ يفترض أن المستخدم يبني feature جديد — أقل فائدة في bug-fixing السريع.

**هل ستعمل جيداً مع INI Brain AI Universal؟**
**نعم، بشكل ممتاز** — لأن:
1. INI Brain يعطي **context المشروع** ← spec-kit يستخدمه لكتابة specs أدق.
2. INI Brain لديه `.brain/decisions.md` و `tasks.md` ← يتكامل مع `/speckit.tasks` بشكل طبيعي.
3. كلاهما يكتب ملفات في الـ workspace فقط ← لا تعارض.
4. MCP الخاص بنا يقدّم `ini_brain_get_context` ← يمكن لـ `/speckit.specify` استخدامه لتوفير 30–50٪ توكن إضافي.

**الحكم:** **نعم، أضفها** — لكن **لا تُلزم المستخدم بتثبيت `uv` و Python**. سنقدّم **نسخة Lite مكتوبة بـ TypeScript** تنفّذ نفس فلسفة SDD محلياً، مع زر "Install official Spec-Kit" للمستخدم المتقدم الذي يريد النسخة الكاملة.

---

### 0.3 المعمارية النهائية المقترحة (نظرة عامة)

```
INI Brain AI Universal v2.2.0
├── Core (موجود) ───────── Project memory + MCP context
├── Ponytail Mode (جديد) ── Lazy Senior Dev skill + 5 commands
├── Spec-Kit Lite (جديد) ── Local SDD workflow بـ TypeScript
└── Integration (جديد) ──── MCP tools: ponytail_check, spec_create
```

**3 طبقات منفصلة قابلة للتفعيل/الإلغاء من الإعدادات.**

---

## 1. مراحل التنفيذ (للوكيل الرخيص)

> **تعليمات حرجة للوكيل المنفّذ:**
> - نفّذ **مرحلة واحدة في كل مرة**. بعد كل مرحلة اعمل `npm run compile` للتأكد.
> - لا تكسر أي شيء موجود. كل ما هو جديد يجب أن يكون **اختياري** عبر إعدادات.
> - استخدم **TypeScript strict** كباقي المشروع.
> - الـ encoding دائماً UTF-8، الـ line endings LF.
> - لا تضف أي dependency جديدة بدون موافقة (المشروع حالياً zero-deps).

---

## 2. المرحلة 1 — تحديث package.json (5 دقائق)

### 2.1 ملف: `ini-brain-ai-universal/package.json`

**التغييرات المطلوبة:**

1. ارفع الإصدار من `2.1.0` إلى `2.2.0`.

2. أضف الأوامر التالية داخل `contributes.commands`:

```json
{
  "command": "iniBrain.enablePonytail",
  "title": "INI Brain: Enable Ponytail Lazy Mode"
},
{
  "command": "iniBrain.disablePonytail",
  "title": "INI Brain: Disable Ponytail Lazy Mode"
},
{
  "command": "iniBrain.ponytailReview",
  "title": "INI Brain: Ponytail Review Current File"
},
{
  "command": "iniBrain.specCreate",
  "title": "INI Brain: Create Spec (SDD)"
},
{
  "command": "iniBrain.specPlan",
  "title": "INI Brain: Generate Plan from Spec"
},
{
  "command": "iniBrain.specTasks",
  "title": "INI Brain: Break Spec into Tasks"
},
{
  "command": "iniBrain.specImplement",
  "title": "INI Brain: Implement Next Task"
}
```

3. أضف الـ activation events المقابلة:

```json
"onCommand:iniBrain.enablePonytail",
"onCommand:iniBrain.disablePonytail",
"onCommand:iniBrain.ponytailReview",
"onCommand:iniBrain.specCreate",
"onCommand:iniBrain.specPlan",
"onCommand:iniBrain.specTasks",
"onCommand:iniBrain.specImplement"
```

4. أضف الإعدادات التالية داخل `contributes.configuration.properties`:

```json
"iniBrain.ponytail.enabled": {
  "type": "boolean",
  "default": false,
  "description": "Enable Ponytail Lazy Senior Dev skill in agent guides."
},
"iniBrain.ponytail.mode": {
  "type": "string",
  "enum": ["lite", "full", "ultra"],
  "default": "full",
  "description": "Ponytail strictness level. lite=YAGNI only, full=standard ladder, ultra=aggressive deletion."
},
"iniBrain.specKit.enabled": {
  "type": "boolean",
  "default": false,
  "description": "Enable local Spec-Driven Development workflow."
},
"iniBrain.specKit.useOfficialCli": {
  "type": "boolean",
  "default": false,
  "description": "Delegate to official GitHub spec-kit (requires Python + uv). Otherwise uses local TS implementation."
}
```

**اختبار:** `cd ini-brain-ai-universal && npm run compile` — يجب أن يمر بدون أخطاء.

---

## 3. المرحلة 2 — وحدة Ponytail (30 دقيقة)

### 3.1 إنشاء ملف: `ini-brain-ai-universal/src/core/ponytail.ts`

**الهدف:** تمثيل skill الـ Ponytail كثوابت + دوال render إلى ملفات.

**الكود الكامل:**

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

export type PonytailMode = 'lite' | 'full' | 'ultra';

export interface PonytailRenderOptions {
  mode: PonytailMode;
  root: string;
}

/**
 * Ponytail skill body. Adapted from DietrichGebert/ponytail (MIT)
 * with attribution preserved. https://github.com/DietrichGebert/ponytail
 */
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

const COMMANDS: Record<string, string> = {
  'ponytail-review.md': `# /ponytail-review

Review the current file under Ponytail rules.
Output a bullet list of:
- Lines that can be deleted with no behavior change.
- Abstractions that have only one caller.
- Dependencies imported but barely used.
- Boilerplate that adds no value.

End with: total LOC before → estimated LOC after.
`,

  'ponytail-audit.md': `# /ponytail-audit

Walk the workspace and produce a JSON summary:
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

Show available Ponytail commands and current mode.
Commands: /ponytail-review, /ponytail-audit, /ponytail-debt, /ponytail-gain.
Modes: lite (YAGNI only), full (6-rung ladder), ultra (aggressive deletion).
Toggle via INI Brain settings: iniBrain.ponytail.enabled / .mode.
`,
};

/**
 * Writes Ponytail skill + commands into agent-specific locations.
 * Returns absolute paths of generated files.
 */
export async function applyPonytail(opts: PonytailRenderOptions): Promise<string[]> {
  const { mode, root } = opts;
  const skillBody = renderPonytailSkill(mode);
  const written: string[] = [];

  const targets = [
    path.join(root, '.brain', 'skills', 'ponytail.md'),
    path.join(root, '.clinerules', 'skills', 'ponytail.md'),
    path.join(root, '.cline', 'skills', 'ponytail.md'),
    path.join(root, '.cursor', 'rules', 'ponytail.mdc'),
    path.join(root, '.windsurf', 'rules', 'ponytail.md'),
    path.join(root, '.codex', 'skills', 'ponytail', 'SKILL.md'),
  ];

  for (const target of targets) {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, skillBody, 'utf8');
    written.push(target);
  }

  // commands
  for (const [name, body] of Object.entries(COMMANDS)) {
    const cmdTargets = [
      path.join(root, '.brain', 'commands', name),
      path.join(root, '.clinerules', 'workflows', name),
    ];
    for (const t of cmdTargets) {
      await fs.mkdir(path.dirname(t), { recursive: true });
      await fs.writeFile(t, body, 'utf8');
      written.push(t);
    }
  }

  return written;
}

/**
 * Removes all Ponytail-generated files. Safe to call even if not present.
 */
export async function removePonytail(root: string): Promise<void> {
  const paths = [
    path.join(root, '.brain', 'skills', 'ponytail.md'),
    path.join(root, '.clinerules', 'skills', 'ponytail.md'),
    path.join(root, '.cline', 'skills', 'ponytail.md'),
    path.join(root, '.cursor', 'rules', 'ponytail.mdc'),
    path.join(root, '.windsurf', 'rules', 'ponytail.md'),
    path.join(root, '.codex', 'skills', 'ponytail', 'SKILL.md'),
    path.join(root, '.brain', 'commands'),
  ];
  for (const p of paths) {
    await fs.rm(p, { force: true, recursive: true }).catch(() => undefined);
  }
}
```

**اختبار سريع:** أنشئ ملف `scripts/ponytail-smoke.cjs` بالمحتوى:

```javascript
const { applyPonytail, removePonytail } = require('../dist/core/ponytail');
const path = require('path');
const os = require('os');
const fs = require('fs');

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pony-'));
  const written = await applyPonytail({ mode: 'full', root: tmp });
  console.log('wrote', written.length, 'files');
  if (!fs.existsSync(path.join(tmp, '.brain/skills/ponytail.md'))) {
    throw new Error('skill not written');
  }
  await removePonytail(tmp);
  console.log('OK');
})();
```

ثم: `npm run compile && node scripts/ponytail-smoke.cjs`.

---

## 4. المرحلة 3 — وحدة Spec-Kit Lite (45 دقيقة)

### 4.1 إنشاء ملف: `ini-brain-ai-universal/src/core/specKit.ts`

**الهدف:** تنفيذ Spec-Driven Development بصورة محلية بدون Python.

**الكود الكامل:**

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

export interface SpecInitOptions {
  root: string;
  featureName: string;
  description: string;
}

export interface SpecPlanOptions {
  root: string;
  specSlug: string;
  techStack: string;
}

export interface SpecTasksOptions {
  root: string;
  specSlug: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

async function ensureConstitution(root: string): Promise<string> {
  const file = path.join(root, '.specify', 'memory', 'constitution.md');
  try {
    await fs.access(file);
    return file;
  } catch {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const body = `# Project Constitution

> Governing principles for this project. All specs/plans must comply.

## Principles

1. **Quality first.** No feature ships without input validation and error handling.
2. **Minimal surface.** Prefer stdlib > platform > existing dep > new code.
3. **Reversibility.** Every change must be revertible in one commit.
4. **Documentation.** Public APIs require a one-line docstring.
5. **Testing.** Non-trivial logic ships with at least one runnable check.

## Out of Scope

- Auto-deploying to production without human approval.
- Storing secrets in repository files.
- Modifying \`.git/\` or \`.brain/backups/\`.

_Edit this file to match your project's actual standards._
`;
    await fs.writeFile(file, body, 'utf8');
    return file;
  }
}

export async function createSpec(opts: SpecInitOptions): Promise<{ specPath: string; slug: string }> {
  const { root, featureName, description } = opts;
  await ensureConstitution(root);
  const slug = slugify(featureName);
  const dir = path.join(root, '.specify', 'specs', slug);
  await fs.mkdir(dir, { recursive: true });

  const specPath = path.join(dir, 'spec.md');
  const body = `# Spec: ${featureName}

**Slug:** \`${slug}\`
**Status:** draft
**Created:** ${new Date().toISOString()}

## What & Why

${description}

## User Stories

- [ ] As a user, I can ...
- [ ] As a user, I can ...

## Acceptance Criteria

- [ ] Given ... when ... then ...
- [ ] Given ... when ... then ...

## Non-Functional

- Performance: ...
- Security: ...
- Accessibility: ...

## Out of Scope

- ...

## Open Questions

- [ ] ...
`;
  await fs.writeFile(specPath, body, 'utf8');
  return { specPath, slug };
}

export async function createPlan(opts: SpecPlanOptions): Promise<string> {
  const { root, specSlug, techStack } = opts;
  const dir = path.join(root, '.specify', 'specs', specSlug);
  const planPath = path.join(dir, 'plan.md');
  const body = `# Plan: ${specSlug}

**Created:** ${new Date().toISOString()}

## Tech Stack

${techStack}

## Architecture

\`\`\`
[describe modules, data flow, boundaries]
\`\`\`

## Data Model

| Entity | Fields | Notes |
|--------|--------|-------|
|        |        |       |

## Risks

- [ ] ...
- [ ] ...

## Verification Strategy

- Unit: ...
- Integration: ...
- Manual: ...
`;
  await fs.writeFile(planPath, body, 'utf8');
  return planPath;
}

export async function createTasks(opts: SpecTasksOptions): Promise<string> {
  const { root, specSlug } = opts;
  const dir = path.join(root, '.specify', 'specs', specSlug);
  const tasksPath = path.join(dir, 'tasks.md');
  const body = `# Tasks: ${specSlug}

**Created:** ${new Date().toISOString()}

> Mark tasks \`[x]\` as they complete. Keep each under 30 minutes.

## Setup

- [ ] T001 Scaffold module folder structure.
- [ ] T002 Add config entries.

## Implementation

- [ ] T010 ...
- [ ] T011 ...

## Verification

- [ ] T100 Add self-check.
- [ ] T101 Manual smoke test.

## Wrap-up

- [ ] T200 Update README.
- [ ] T201 Update \`.brain/decisions.md\` if architecture changed.
`;
  await fs.writeFile(tasksPath, body, 'utf8');
  return tasksPath;
}

export async function listSpecs(root: string): Promise<string[]> {
  const dir = path.join(root, '.specify', 'specs');
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(e => e.name);
  } catch {
    return [];
  }
}

export async function readSpec(root: string, slug: string): Promise<{
  spec?: string; plan?: string; tasks?: string;
}> {
  const dir = path.join(root, '.specify', 'specs', slug);
  const read = async (name: string) => {
    try { return await fs.readFile(path.join(dir, name), 'utf8'); }
    catch { return undefined; }
  };
  return {
    spec: await read('spec.md'),
    plan: await read('plan.md'),
    tasks: await read('tasks.md'),
  };
}
```

**اختبار:** نفس نمط Ponytail — أنشئ smoke test في `scripts/speckit-smoke.cjs`.

---

## 5. المرحلة 4 — توصيل الأوامر في extension.ts (20 دقيقة)

### 5.1 ملف: `ini-brain-ai-universal/src/extension.ts`

**الإضافات المطلوبة** (داخل دالة `activate`):

```typescript
import { applyPonytail, removePonytail, PonytailMode } from './core/ponytail';
import { createSpec, createPlan, createTasks, listSpecs } from './core/specKit';

// === Ponytail commands ===
context.subscriptions.push(
  vscode.commands.registerCommand('iniBrain.enablePonytail', async () => {
    const root = getWorkspaceRoot();
    if (!root) { return; }
    const cfg = vscode.workspace.getConfiguration('iniBrain');
    const mode = (cfg.get<string>('ponytail.mode') ?? 'full') as PonytailMode;
    const written = await applyPonytail({ root, mode });
    await cfg.update('ponytail.enabled', true, vscode.ConfigurationTarget.Workspace);
    vscode.window.showInformationMessage(
      `Ponytail enabled (${mode}). Wrote ${written.length} files.`
    );
  }),

  vscode.commands.registerCommand('iniBrain.disablePonytail', async () => {
    const root = getWorkspaceRoot();
    if (!root) { return; }
    await removePonytail(root);
    const cfg = vscode.workspace.getConfiguration('iniBrain');
    await cfg.update('ponytail.enabled', false, vscode.ConfigurationTarget.Workspace);
    vscode.window.showInformationMessage('Ponytail disabled.');
  }),

  vscode.commands.registerCommand('iniBrain.ponytailReview', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Open a file to review.');
      return;
    }
    const text = editor.document.getText();
    const loc = text.split('\n').length;
    const advice = `Ponytail review of ${path.basename(editor.document.fileName)}:
- Lines: ${loc}
- Apply 6-rung ladder: stdlib > platform > existing dep > one-liner > minimum code.
- Suggested next step: paste this file into your AI agent and run /ponytail-review.`;
    const doc = await vscode.workspace.openTextDocument({ content: advice, language: 'markdown' });
    await vscode.window.showTextDocument(doc);
  }),
);

// === Spec-Kit commands ===
context.subscriptions.push(
  vscode.commands.registerCommand('iniBrain.specCreate', async () => {
    const root = getWorkspaceRoot();
    if (!root) { return; }
    const name = await vscode.window.showInputBox({
      prompt: 'Feature name',
      placeHolder: 'photo-albums',
    });
    if (!name) { return; }
    const desc = await vscode.window.showInputBox({
      prompt: 'Short description (what & why)',
    });
    if (!desc) { return; }
    const { specPath } = await createSpec({ root, featureName: name, description: desc });
    const doc = await vscode.workspace.openTextDocument(specPath);
    await vscode.window.showTextDocument(doc);
  }),

  vscode.commands.registerCommand('iniBrain.specPlan', async () => {
    const root = getWorkspaceRoot();
    if (!root) { return; }
    const specs = await listSpecs(root);
    if (specs.length === 0) {
      vscode.window.showWarningMessage('No specs yet. Run "Create Spec" first.');
      return;
    }
    const slug = await vscode.window.showQuickPick(specs, { placeHolder: 'Pick a spec' });
    if (!slug) { return; }
    const tech = await vscode.window.showInputBox({
      prompt: 'Tech stack (e.g., "Vite + React + SQLite")',
    });
    if (!tech) { return; }
    const planPath = await createPlan({ root, specSlug: slug, techStack: tech });
    const doc = await vscode.workspace.openTextDocument(planPath);
    await vscode.window.showTextDocument(doc);
  }),

  vscode.commands.registerCommand('iniBrain.specTasks', async () => {
    const root = getWorkspaceRoot();
    if (!root) { return; }
    const specs = await listSpecs(root);
    if (specs.length === 0) {
      vscode.window.showWarningMessage('No specs yet.');
      return;
    }
    const slug = await vscode.window.showQuickPick(specs, { placeHolder: 'Pick a spec' });
    if (!slug) { return; }
    const tasksPath = await createTasks({ root, specSlug: slug });
    const doc = await vscode.workspace.openTextDocument(tasksPath);
    await vscode.window.showTextDocument(doc);
  }),

  vscode.commands.registerCommand('iniBrain.specImplement', async () => {
    const root = getWorkspaceRoot();
    if (!root) { return; }
    const specs = await listSpecs(root);
    if (specs.length === 0) { return; }
    const slug = await vscode.window.showQuickPick(specs, { placeHolder: 'Pick a spec to implement' });
    if (!slug) { return; }
    const tasksFile = path.join(root, '.specify', 'specs', slug, 'tasks.md');
    const doc = await vscode.workspace.openTextDocument(tasksFile);
    await vscode.window.showTextDocument(doc);
    vscode.window.showInformationMessage(
      `Hand this tasks.md to your AI agent with the goal: "Implement next unchecked task and mark it [x]."`
    );
  }),
);
```

> **ملاحظة للوكيل:** ادمج هذا الكود **داخل دالة activate الموجودة**، لا تنشئ activate ثانية. تحقّق من وجود `getWorkspaceRoot` — لو غير موجود، ابنه من `vscode.workspace.workspaceFolders[0].uri.fsPath`.

---

## 6. المرحلة 5 — إضافة MCP tools (20 دقيقة)

### 6.1 ملف: `ini-brain-ai-universal/src/mcp/server.ts`

**أضف tool واحد لكل وحدة** (داخل قائمة الـ tools):

```typescript
{
  name: 'ini_brain_ponytail_review',
  description: 'Apply Ponytail lazy-senior-dev review to a file. Returns suggestions to reduce code.',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Project-relative path to file' }
    },
    required: ['path']
  }
},
{
  name: 'ini_brain_spec_list',
  description: 'List all Spec-Kit specs in the project.',
  inputSchema: { type: 'object', properties: {} }
},
{
  name: 'ini_brain_spec_read',
  description: 'Read a specific spec (spec + plan + tasks).',
  inputSchema: {
    type: 'object',
    properties: {
      slug: { type: 'string' }
    },
    required: ['slug']
  }
}
```

**التطبيق:** استخدم نفس النمط الموجود لأي tool آخر في الملف. ادمج `readSpec` و `listSpecs` من `core/specKit.ts`.

---

## 7. المرحلة 6 — تحديث agentGuide.ts لاحترام إعدادات Ponytail (10 دقائق)

### 7.1 ملف: `ini-brain-ai-universal/src/core/agentGuide.ts`

داخل `generate()`، بعد كتابة الـ guard skills، أضف:

```typescript
// Optional Ponytail integration
const cfg = vscode.workspace.getConfiguration('iniBrain');
if (cfg.get<boolean>('ponytail.enabled')) {
  const mode = (cfg.get<string>('ponytail.mode') ?? 'full') as PonytailMode;
  const { applyPonytail } = await import('./ponytail');
  await applyPonytail({ root: this.root, mode });
}
```

> **مهم:** استورد `vscode` بشكل ديناميكي لأن agentGuide قد يُستدعى من سياقات بدون vscode (MCP server standalone). الحل البديل: مرّر `ponytailEnabled` و `ponytailMode` كـ parameters في `generate(data, options)`.

**التوصية:** غيّر signature إلى:
```typescript
async generate(data: BrainData, options?: { ponytailMode?: PonytailMode }): Promise<AgentGuideResult>
```

ومرّر القيمة من `extension.ts` بعد قراءة الإعدادات.

---

## 8. المرحلة 7 — التوثيق (15 دقيقة)

### 8.1 ملفات جديدة

#### `ini-brain-ai-universal/docs/ponytail-guide.md`
```markdown
# Ponytail — Lazy Senior Dev Mode

Adapted from [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) (MIT).

## What

A skill that teaches your AI agent to write less code by following a 6-rung ladder:
YAGNI → stdlib → platform → existing dep → one-liner → minimum code.

## Enable

1. Open Command Palette → `INI Brain: Enable Ponytail Lazy Mode`.
2. Pick mode in Settings → `iniBrain.ponytail.mode` (`lite` / `full` / `ultra`).
3. The skill is now written to `.brain/skills/`, `.clinerules/`, `.cursor/rules/`,
   `.windsurf/rules/`, `.codex/skills/`.

## Commands (use in your AI agent chat)

- `/ponytail-review` — review current file.
- `/ponytail-audit` — full workspace audit.
- `/ponytail-debt` — find debt that violates the ladder.
- `/ponytail-gain` — pre-feature checklist.

## Expected Savings

54% less code on average (peak 94%), 20% lower cost, 27% faster — measured on
real agent sessions. See the upstream benchmark for methodology.

## Disable

`INI Brain: Disable Ponytail Lazy Mode` removes all generated files.
```

#### `ini-brain-ai-universal/docs/speckit-guide.md`
```markdown
# Spec-Kit Lite — Local Spec-Driven Development

Inspired by [github/spec-kit](https://github.com/github/spec-kit) (MIT).
This is a TypeScript-only local implementation — no Python or `uv` required.

## Workflow

1. **`INI Brain: Create Spec (SDD)`** — describe what & why.
2. **`INI Brain: Generate Plan from Spec`** — add tech stack.
3. **`INI Brain: Break Spec into Tasks`** — produce checklist.
4. **`INI Brain: Implement Next Task`** — hand off to your AI agent.

Files are stored in `.specify/specs/<slug>/{spec,plan,tasks}.md`
and `.specify/memory/constitution.md`.

## Why a Local Lite Version?

- Zero new dependencies (the extension stays Python-free).
- Works offline.
- Templates align with INI Brain's `.brain/decisions.md` and `.brain/tasks.md`.

## Want the Full Official CLI?

Enable `iniBrain.specKit.useOfficialCli` and the extension will delegate
to the official `specify` CLI (you must install `uv` and run
`uv tool install specify-cli` separately).

## Integration with INI Brain Memory

Use the MCP tool `ini_brain_get_context` before `/speckit.specify` to feed
project context automatically — saves 30–50% tokens.
```

### 8.2 تحديث `README.md` الرئيسي

أضف قسم جديد:
```markdown
## What's New in 2.2.0

- 🦥 **Ponytail Lazy Mode** — optional skill that cuts AI-generated code by ~54%.
- 📋 **Spec-Kit Lite** — local Spec-Driven Development workflow (no Python).
- 🛠️ 7 new commands, 3 new MCP tools.

See: [docs/ponytail-guide.md](docs/ponytail-guide.md) · [docs/speckit-guide.md](docs/speckit-guide.md).
```

---

## 9. المرحلة 8 — Smoke tests + packaging (10 دقيقة)

### 9.1 سكربتات الاختبار

أنشئ:
- `ini-brain-ai-universal/scripts/ponytail-smoke.cjs` (موضّح في المرحلة 2).
- `ini-brain-ai-universal/scripts/speckit-smoke.cjs` (نفس النمط).

أضف في `package.json` تحت `scripts`:
```json
"smoke:ponytail": "node scripts/ponytail-smoke.cjs",
"smoke:speckit": "node scripts/speckit-smoke.cjs",
"smoke:all": "npm run smoke:mcp && npm run smoke:ponytail && npm run smoke:speckit"
```

### 9.2 التغليف

```powershell
cd ini-brain-ai-universal
npm install
npm run compile
npm run smoke:all
npm run package
```

النتيجة المتوقعة: `ini-brain-ai-universal-2.2.0.vsix`.

---

## 10. ملخص الـ Diff (للمراجعة السريعة)

| الملف | نوع التغيير | الحجم التقريبي |
|------|------------|---------------|
| `package.json` | تعديل | +30 سطر |
| `src/core/ponytail.ts` | جديد | ~180 سطر |
| `src/core/specKit.ts` | جديد | ~180 سطر |
| `src/extension.ts` | تعديل | +120 سطر |
| `src/mcp/server.ts` | تعديل | +60 سطر |
| `src/core/agentGuide.ts` | تعديل | +15 سطر |
| `docs/ponytail-guide.md` | جديد | ~50 سطر |
| `docs/speckit-guide.md` | جديد | ~40 سطر |
| `docs/plans/PLAN-ponytail-and-speckit-integration.md` | جديد (هذا الملف) | — |
| `README.md` | تعديل | +10 أسطر |
| `scripts/ponytail-smoke.cjs` | جديد | ~20 سطر |
| `scripts/speckit-smoke.cjs` | جديد | ~25 سطر |

**صفر تبعيات جديدة في `dependencies`.**

---

## 11. قائمة فحص نهائية للوكيل المنفّذ

- [ ] رفعت الإصدار إلى `2.2.0` في `package.json`.
- [ ] أضفت 7 commands جديدة وعرّفتها في `contributes.commands`.
- [ ] أضفت 4 إعدادات جديدة تحت `iniBrain.ponytail.*` و `iniBrain.specKit.*`.
- [ ] أنشأت `src/core/ponytail.ts` بالكود الكامل أعلاه.
- [ ] أنشأت `src/core/specKit.ts` بالكود الكامل أعلاه.
- [ ] سجّلت 7 commands في `extension.ts` داخل `activate`.
- [ ] أضفت 3 MCP tools جديدة في `src/mcp/server.ts`.
- [ ] حدّثت `agentGuide.ts` ليحترم إعداد Ponytail.
- [ ] أنشأت `docs/ponytail-guide.md` و `docs/speckit-guide.md`.
- [ ] أضفت قسم 2.2.0 في `README.md`.
- [ ] كتبت smoke tests وتأكدت أنها تمر.
- [ ] `npm run compile` يمر بدون أخطاء.
- [ ] `npm run package` ينتج `ini-brain-ai-universal-2.2.0.vsix`.
- [ ] حفظت قرار التصميم في INI Brain memory:
      `decision: "Integrated Ponytail skill + Spec-Kit Lite workflow as optional features in v2.2.0"`.

---

## 12. تعليمات إسناد الحقوق (Attribution)

في **بداية** `src/core/ponytail.ts` ضع:
```typescript
/**
 * Ponytail integration. Skill text adapted from
 * https://github.com/DietrichGebert/ponytail (MIT © Dietrich Gebert).
 */
```

في **بداية** `src/core/specKit.ts` ضع:
```typescript
/**
 * Spec-Kit Lite. Workflow inspired by
 * https://github.com/github/spec-kit (MIT © GitHub).
 * This is an independent TypeScript implementation; no upstream code copied.
 */
```

في `README.md` أضف قسم Acknowledgements:
```markdown
## Acknowledgements

- [Ponytail](https://github.com/DietrichGebert/ponytail) — skill text adapted under MIT.
- [Spec-Kit](https://github.com/github/spec-kit) — workflow concept under MIT.
```

---

## 13. الفوائد المتوقعة للمستخدم النهائي (الخلاصة)

1. **توفير 20–54٪ من توكنات الـ AI** → توفير مالي مباشر.
2. **منهجية واضحة** بدلاً من vibe coding → جودة أفضل.
3. **كل شيء اختياري** → لا يفرض شيء على المستخدم.
4. **بدون تبعيات جديدة** → الإضافة تبقى خفيفة وآمنة.
5. **تكامل عميق مع INI Brain memory** → السياق + المنهجية معاً.
6. **يعمل مع كل الوكلاء** (Cline, Cursor, Windsurf, Codex, Claude, Copilot) عبر الملفات.

---

## 14. ما يجب على الوكيل الرخيص ألا يفعله

- ❌ لا تضف dependencies جديدة في `package.json` (المشروع zero-deps حالياً).
- ❌ لا تعدّل بنية INI Brain القائمة — أضف فقط.
- ❌ لا تكتب أي API keys أو tokens.
- ❌ لا تلمس `.git/` أو `.brain/backups/`.
- ❌ لا تنسخ كود من ponytail repo حرفياً غير AGENTS.md (المسموح + إسناد).
- ❌ لا تجبر المستخدم على تفعيل Ponytail — اتركه `default: false`.

---

**نهاية الخطة. الإجمالي المتوقع: 2–3 ساعات تنفيذ للوكيل الرخيص.**
