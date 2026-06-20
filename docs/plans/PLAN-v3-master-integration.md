# 🧠 INI Brain AI Universal — Master Plan v3.0.0

> الخطة الشاملة لتحويل الإضافة إلى **Universal AI Productivity Platform**
> تدمج: Ponytail + Spec-Kit + Caveman + Token-Optimizer + Claude-Token-Efficient + Graphify + Superpowers
> مع **Universal Agent Adapter** يعمل مع Claude Code / Codex / Cline / Cursor / Windsurf / Antigravity / Gemini CLI / Copilot / Kimi / OpenCode / VS Code Copilot Chat / كل MCP client.
> + **نظام تحديث تلقائي** يتابع الريبوهات المصدر ويحدّث الـskills تلقائياً.

---

## 📑 الفهرس

1. [الرؤية والمعمارية](#1-الرؤية-والمعمارية)
2. [رأيي الصريح في كل ريبو](#2-رأيي-الصريح-في-كل-ريبو)
3. [الميزات الجديدة بالتفصيل](#3-الميزات-الجديدة-بالتفصيل)
4. [بنية المشروع الجديدة](#4-بنية-المشروع-الجديدة)
5. [خريطة الـCommands الكاملة](#5-خريطة-الـcommands-الكاملة)
6. [نظام Universal Agent Adapter](#6-نظام-universal-agent-adapter)
7. [نظام Auto-Update من الريبوهات](#7-نظام-auto-update-من-الريبوهات)
8. [مراحل التنفيذ للوكيل الرخيص](#8-مراحل-التنفيذ-للوكيل-الرخيص)
9. [التوثيق ثنائي اللغة](#9-التوثيق-ثنائي-اللغة)
10. [قائمة فحص نهائية](#10-قائمة-فحص-نهائية)

---

## 1) الرؤية والمعمارية

### 1.1 الرؤية
> **"إضافة واحدة، تعمل مع كل وكيل AI، توفّر 60–80٪ من التوكنات، وتحفظ ذاكرة المشروع، وتعمل بدون إنترنت."**

### 1.2 المعمارية الكلية

```
┌──────────────────────────────────────────────────────────────────┐
│                INI Brain AI Universal v3.0.0                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │  Core Memory    │  │ Token Savings    │  │ Methodology     │ │
│  │  (existing)     │  │ Layer (NEW)      │  │ Layer (NEW)     │ │
│  │                 │  │                  │  │                 │ │
│  │ • brainStore    │  │ • Ponytail       │  │ • Spec-Kit Lite │ │
│  │ • memoryStore   │  │ • Caveman        │  │ • Superpowers   │ │
│  │ • projectScan   │  │ • TokenOptimizer │  │   Methodology   │ │
│  │ • contextBuilder│  │ • ClaudeEfficient│  │                 │ │
│  └─────────────────┘  └──────────────────┘  └─────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │           Knowledge Graph Layer (NEW - Graphify)             ││
│  │  • Code dependency graph  • Concept graph  • Memory graph   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │       Universal Agent Adapter (NEW)                          ││
│  │  Claude / Codex / Cline / Cursor / Windsurf / Antigravity   ││
│  │  Gemini / Copilot / Kimi / OpenCode / VS Code / Any MCP     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │       Auto-Update System (NEW)                               ││
│  │  • Fetch latest from upstream repos  • Diff & merge         ││
│  │  • Notify user  • One-click update                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.3 الفلسفة
- **Local-first** — كل شيء يعمل بدون إنترنت بعد الإعداد الأول.
- **Zero new runtime dependencies** — Python اختياري، Node موجود بالفعل.
- **Opt-in everything** — كل ميزة يفعّلها المستخدم.
- **Universal** — يعمل مع أي وكيل عبر ملفات في الـworkspace.
- **Auto-evolving** — يحدّث نفسه من المصادر العلوية.

---

## 2) رأيي الصريح في كل ريبو

### 2.1 ✅ Ponytail (DietrichGebert/ponytail) — MIT
- **ما هو:** Skill يجبر الوكيل على lazy-senior-dev mode (6-rung ladder).
- **الفائدة:** ~54٪ توفير في الكود المولّد.
- **يستحق الدمج؟** **نعم 100٪** — خفيف، ملفات نصية فقط.
- **ما ننقله:** `AGENTS.md` text + 5 commands + modes (lite/full/ultra).

### 2.2 ✅ Caveman (JuliusBrussee/caveman) — MIT
- **ما هو:** Skill يضغط أسلوب الرد (telegraphic style) — يحذف "Sure!", "I hope this helps!", إلخ.
- **الفائدة:** **65–75٪ توفير في output tokens** (ضربة قوية!).
- **يحفظ:** Code, URLs, paths, error strings byte-for-byte.
- **يحفظ لغة المستخدم** (عربي يبقى عربي).
- **يستحق الدمج؟** **نعم 100٪** — هذا أهم من Ponytail في توفير التوكنات.
- **ما ننقله:** 4 levels (lite/full/ultra/wenyan) + commands (`/caveman`, `/caveman-commit`, إلخ).
- **الفرق عن Ponytail:** Ponytail يقلل **كود**، Caveman يقلل **نص الرد**. كلاهما يكمّل الآخر.

### 2.3 ⚡ Token Optimizer (alexgreensh/token-optimizer) — MIT
- **ما هو:** Sidecar plugin مع داشبورد على localhost:24842 + Python CLI.
- **الفائدة:** قياس + تحسين توكنات في الوقت الفعلي.
- **يستحق الدمج؟** **نعم جزئياً** — الفلسفة والـmeasurement script.
- **ما ننقله:**
  - مفهوم **Token Usage Dashboard** (لكن مدمج في sidebar الإضافة).
  - **measure command** يحسب توكنات الملفات قبل إرسالها.
  - **session metrics**: قبل/بعد.
- **ما لا ننقله:** الـPython daemon (ثقيل) — نكتب TypeScript بديل.

### 2.4 ✅ Claude-Token-Efficient (drona23) — MIT
- **ما هو:** ملف `CLAUDE.md` (~352 byte) قواعد سلوكية: لا preamble, لا sycophancy, لا "Sure!".
- **الفائدة:** قواعد بسيطة فعّالة جداً للوكلاء (خصوصاً Claude).
- **يستحق الدمج؟** **نعم 100٪** — صغير ومُجرّب.
- **ما ننقله:** القواعد كـ `claude.md` و `agents.md` template جاهز.
- **التحذير الذي ذكروه:** فقط مفيد عند high output volume — سنوضّحه للمستخدم.

### 2.5 ✅ Graphify (safishamsi/graphify) — MIT
- **ما هو:** Claude skill يبني knowledge graph من code + docs + PDFs + صور.
- **الفائدة:** **71.5x أقل توكنات** لكل query بدلاً من قراءة الملفات كاملة.
- **يستخدم:** NetworkX + Leiden + tree-sitter + Claude API.
- **يستحق الدمج؟** **نعم لكن نسخة Lite TypeScript** بدون NetworkX/Python.
- **ما ننقله:**
  - بناء **code dependency graph** من INI Brain القائم (متوفر جزئياً).
  - **concept extraction** من Markdown + comments.
  - **memory graph view** في sidebar (visualization بـD3/Mermaid).
  - مفهوم **EXTRACTED / INFERRED / AMBIGUOUS labels** للحواف.
- **ما لا ننقله:** Python stack + Claude API (نستخدم MCP context بدلاً).

### 2.6 ✅ Superpowers (obra/Jesse Vincent) — MIT (Apache 2.0?)
- **ما هو:** **منهجية كاملة لتطوير البرمجيات للوكلاء** + composable skills + bootstrap.
- **يدعم:** Claude, Codex, Antigravity, Cursor, Factory Droid, Gemini, Copilot, Kimi, OpenCode, Pi.
- **يستحق الدمج؟** **نعم 100٪** — هذا أهم ريبو بعد Caveman.
- **ما ننقله:**
  - **بنية Skills المركّبة (composable skills)** — skills تستدعي بعضها.
  - **Bootstrap pattern** (`using-superpowers` يُحقن مرة في بداية الجلسة).
  - **Multi-harness adapter pattern** — هذا بالضبط ما يحتاجه Universal Adapter لدينا.
  - **Skills marketplace** concept.

### 2.7 الخلاصة: الترتيب حسب الأولوية
| # | الريبو | الأولوية | النوع المضاف |
|---|--------|---------|--------------|
| 1 | **Caveman** | 🔥🔥🔥 | Token saver (output) |
| 2 | **Superpowers** | 🔥🔥🔥 | Methodology + adapter pattern |
| 3 | **Ponytail** | 🔥🔥 | Code saver |
| 4 | **Graphify Lite** | 🔥🔥 | Knowledge graph + viz |
| 5 | **Claude-Token-Efficient** | 🔥 | Quick win template |
| 6 | **Spec-Kit Lite** | 🔥 | Methodology workflow |
| 7 | **Token-Optimizer Lite** | ⚡ | Measurement + dashboard |

---

## 3) الميزات الجديدة بالتفصيل

### 3.1 ⚡ Token Savings Layer (طبقة توفير التوكنات)

**5 وحدات مستقلة قابلة للتفعيل:**

| الوحدة | الملف | الوظيفة | التوفير |
|--------|------|---------|---------|
| Ponytail | `src/savings/ponytail.ts` | كود أقل | ~54٪ code |
| Caveman | `src/savings/caveman.ts` | رد مضغوط | ~70٪ output |
| Claude-Lean | `src/savings/claudeLean.ts` | قواعد سلوك Claude | ~15٪ output |
| Token-Meter | `src/savings/tokenMeter.ts` | قياس + تنبيه | — (measurement) |
| Context-Compressor | `src/savings/contextCompressor.ts` | ضغط الـcontext قبل الإرسال | ~30٪ input |

**مع dashboard في sidebar:**
```
┌─ Token Savings Today ──────────┐
│ Saved:    142,381 tokens       │
│ Cost:     $0.43 saved         │
│ Mode:     Caveman:full        │
│           Ponytail:full       │
│ [Switch Mode] [Disable]       │
└────────────────────────────────┘
```

### 3.2 🧬 Knowledge Graph Layer (طبقة الـGraph)

**ملف:** `src/graph/knowledgeGraph.ts`

- يبني graph من:
  - **Code:** dependencies, imports, function calls (موجود جزئياً في `projectScanner`).
  - **Concepts:** من Markdown headings + JSDoc + comments.
  - **Memory:** الـmemories المخزّنة عند INI Brain.
- يستخدم **node:zlib** للضغط (built-in).
- العرض: **Mermaid diagram** في WebView (لا dependencies).
- كل edge موسوم بـ: `EXTRACTED` (من AST) أو `INFERRED` (من اسم/heuristic) أو `AMBIGUOUS`.

### 3.3 📋 Methodology Layer (طبقة المنهجية)

- **Spec-Kit Lite:** Constitution → Spec → Plan → Tasks → Implement (موجود في الخطة v2).
- **Superpowers Skills Engine:** Skills قابلة للتركيب، تستدعي بعضها عبر `@skill-name`.

### 3.4 🔌 Universal Agent Adapter (مهم جداً)

ملف: `src/adapters/registry.ts`

يكتب الـskills والـcommands في كل المواقع التي يفهمها كل وكيل:

| الوكيل | المجلد المستهدف | صيغة الملف |
|-------|------------------|------------|
| Claude Code | `.claude/skills/<name>/SKILL.md` | Markdown |
| Claude Desktop | `~/.claude/skills/<name>/SKILL.md` (global) | Markdown |
| Codex CLI | `.codex/skills/<name>/SKILL.md` | Markdown |
| Codex App | `~/.codex/plugins/` | TOML + MD |
| Cline | `.clinerules/<name>.md` + `.clinerules/workflows/` | Markdown |
| Cursor | `.cursor/rules/<name>.mdc` | MDC |
| Windsurf | `.windsurf/rules/<name>.md` | Markdown |
| Antigravity | `.agents/rules/<name>.md` | Markdown |
| Gemini CLI | `gemini-extension.json` + `.gemini/` | JSON |
| Copilot | `.github/copilot-instructions.md` | Markdown |
| OpenCode | `opencode.json` + `.opencode/plugins/` | JS plugin |
| Kimi/Pi | `~/.kimi/skills/` | Markdown |
| Kiro | `.kiro/steering/<name>.md` | Markdown |
| Any MCP | `AGENTS.md` (universal fallback) | Markdown |

**استراتيجية:** عند تفعيل أي skill (Caveman, Ponytail, إلخ)، يتم نشره في **كل** المواقع تلقائياً. المستخدم لا يهتم بأي وكيل يستخدم — يعمل في كلها.

### 3.5 🔄 Auto-Update System (نظام التحديث التلقائي)

**ملف:** `src/updater/repoSync.ts`

- يحفظ في الإعدادات: قائمة الـupstream repos + الـcommit SHA الحالي لكل واحد.
- مرة كل أسبوع (قابل للتعديل): يفحص GitHub API:
  ```
  GET /repos/{owner}/{name}/commits/HEAD → sha
  ```
- إذا تغيّر SHA:
  - يحمّل الملف الجديد (`README.md` / `AGENTS.md` / إلخ).
  - يحسب diff مع النسخة المحلية.
  - يعرض إشعار: **"Caveman has updated. View changes & apply?"**
- زر **"Apply Update"** يستبدل الـskill وينشره من جديد.
- زر **"Skip"** يحدّث الـSHA فقط بدون تطبيق.
- خيار **"Auto-apply minor updates"** للمستخدم المتقدم.

**Endpoint api لا يحتاج token** (Github public API allows 60 req/h بدون auth).

**ملف الإعدادات:** `.brain/upstream-sources.json`
```json
{
  "repos": [
    {
      "id": "caveman",
      "owner": "JuliusBrussee",
      "name": "caveman",
      "files": ["AGENTS.md", "skills/caveman.md"],
      "lastSha": "abc123...",
      "lastCheck": "2026-06-19T12:00:00Z",
      "autoApply": false
    }
  ],
  "checkIntervalHours": 168
}
```

---

## 4) بنية المشروع الجديدة

```
ini-brain-ai-universal/
├── src/
│   ├── extension.ts                  (موجود — يُحدَّث)
│   ├── core/                         (موجود — يبقى)
│   │   ├── agentGuide.ts
│   │   ├── brainStore.ts
│   │   ├── memoryStore.ts
│   │   └── ...
│   ├── savings/                      ⭐ جديد
│   │   ├── index.ts                  (orchestrator)
│   │   ├── ponytail.ts
│   │   ├── caveman.ts
│   │   ├── claudeLean.ts
│   │   ├── tokenMeter.ts
│   │   └── contextCompressor.ts
│   ├── methodology/                  ⭐ جديد
│   │   ├── specKit.ts
│   │   └── superpowers.ts            (skills engine)
│   ├── graph/                        ⭐ جديد
│   │   ├── knowledgeGraph.ts
│   │   ├── codeGraph.ts
│   │   ├── conceptExtractor.ts
│   │   └── mermaidRenderer.ts
│   ├── adapters/                     ⭐ جديد (أهم تطور)
│   │   ├── registry.ts               (قائمة كل الوكلاء)
│   │   ├── claudeAdapter.ts
│   │   ├── codexAdapter.ts
│   │   ├── clineAdapter.ts
│   │   ├── cursorAdapter.ts
│   │   ├── windsurfAdapter.ts
│   │   ├── antigravityAdapter.ts
│   │   ├── geminiAdapter.ts
│   │   ├── copilotAdapter.ts
│   │   ├── openCodeAdapter.ts
│   │   ├── kimiAdapter.ts
│   │   ├── kiroAdapter.ts
│   │   └── universalFallback.ts      (AGENTS.md)
│   ├── updater/                      ⭐ جديد
│   │   ├── repoSync.ts
│   │   ├── upstreamSources.ts
│   │   └── diffViewer.ts
│   ├── mcp/                          (موجود — يُوسَّع)
│   │   ├── server.ts
│   │   ├── workspace.ts
│   │   └── tools/                    ⭐ جديد (تقسيم الأدوات)
│   │       ├── memoryTools.ts
│   │       ├── graphTools.ts
│   │       ├── savingsTools.ts
│   │       └── methodologyTools.ts
│   ├── ui/                           (موجود — يُحدَّث)
│   │   ├── sidebarProvider.ts
│   │   ├── graphWebview.ts           ⭐ جديد
│   │   └── savingsDashboard.ts       ⭐ جديد
│   └── ...
├── docs/
│   ├── plans/
│   │   ├── PLAN-ponytail-and-speckit-integration.md  (السابق)
│   │   └── PLAN-v3-master-integration.md             (هذا الملف)
│   ├── features/                     ⭐ جديد
│   │   ├── ar/                       (شرح بالعربي لكل ميزة)
│   │   │   ├── overview.md
│   │   │   ├── caveman.md
│   │   │   ├── ponytail.md
│   │   │   ├── spec-kit.md
│   │   │   ├── knowledge-graph.md
│   │   │   ├── token-meter.md
│   │   │   ├── superpowers.md
│   │   │   ├── auto-update.md
│   │   │   └── commands-reference.md
│   │   └── en/                       (English explanation per feature)
│   │       ├── overview.md
│   │       ├── caveman.md
│   │       ├── ...
│   │       └── commands-reference.md
│   ├── ponytail-guide.md             (السابق)
│   └── speckit-guide.md              (السابق)
└── package.json                       (الإصدار → 3.0.0)
```

---

## 5) خريطة الـCommands الكاملة

### 5.1 الـCommands داخل VS Code (Command Palette)

| الـCommand | الوظيفة | الفئة |
|------------|---------|-------|
| `INI Brain: Scan Project` | (موجود) فحص المشروع | Core |
| `INI Brain: Rebuild Brain` | (موجود) إعادة بناء الذاكرة | Core |
| `INI Brain: Save Memory` | (موجود) حفظ ذكرى | Core |
| `INI Brain: Search Memory` | (موجود) بحث في الذاكرة | Core |
| `INI Brain: Generate Agent Guide` | (موجود) كتابة AGENTS.md | Core |
| **`INI Brain: Enable Caveman Mode`** | تفعيل ضغط الردود | Savings |
| **`INI Brain: Enable Ponytail Mode`** | تفعيل lazy-dev | Savings |
| **`INI Brain: Enable Claude Lean Mode`** | قواعد سلوك Claude | Savings |
| **`INI Brain: Enable All Savings`** | تفعيل الكل دفعة واحدة | Savings |
| **`INI Brain: Disable All Savings`** | إيقاف الكل | Savings |
| **`INI Brain: Switch Savings Level`** | تبديل lite/full/ultra | Savings |
| **`INI Brain: Show Token Dashboard`** | عرض إحصاءات التوفير | Savings |
| **`INI Brain: Measure File Tokens`** | حساب توكنات الملف الحالي | Savings |
| **`INI Brain: Create Spec`** | بدء spec جديد | Methodology |
| **`INI Brain: Generate Plan`** | خطة من spec | Methodology |
| **`INI Brain: Break into Tasks`** | تقسيم لمهام | Methodology |
| **`INI Brain: Implement Next Task`** | تنفيذ مهمة | Methodology |
| **`INI Brain: Build Knowledge Graph`** | بناء الـgraph | Graph |
| **`INI Brain: Show Knowledge Graph`** | عرض الـgraph | Graph |
| **`INI Brain: Find Impact (Blast Radius)`** | تأثير تغيير ملف | Graph |
| **`INI Brain: Install for All Agents`** | نشر لكل الوكلاء | Adapter |
| **`INI Brain: Check Upstream Updates`** | فحص تحديثات الريبوهات | Updater |
| **`INI Brain: Apply Upstream Updates`** | تطبيق التحديثات | Updater |
| **`INI Brain: Configure Auto-Update`** | إعدادات التحديث | Updater |

### 5.2 الـCommands داخل وكيل الـAI (Chat slash commands)

هذه تُكتب في ملفات `.brain/commands/`, `.clinerules/workflows/`, إلخ. تظهر كـ slash commands في:
- **Claude Code:** `/caveman`, `/ponytail-review`, إلخ.
- **Cline:** يستخدمها كـ workflow.
- **Cursor:** عبر `@rules`.
- **Codex:** كـ skills.

| الـSlash Command | الوظيفة |
|------------------|---------|
| `/caveman [lite\|full\|ultra]` | بدّل مستوى Caveman |
| `/caveman-commit` | اكتب commit message مضغوط |
| `/caveman-pr` | اكتب PR description مضغوط |
| `/caveman-doc` | اكتب وثائق مضغوطة |
| `/ponytail [lite\|full\|ultra]` | بدّل مستوى Ponytail |
| `/ponytail-review` | راجع الملف الحالي |
| `/ponytail-audit` | راجع المشروع كله |
| `/ponytail-debt` | اعثر على debt يخالف الـladder |
| `/ponytail-gain` | checklist قبل feature |
| `/spec-new <name>` | spec جديد |
| `/spec-plan` | خطة من spec |
| `/spec-tasks` | مهام من خطة |
| `/spec-do` | نفّذ المهمة التالية |
| `/graph-build` | ابنِ knowledge graph |
| `/graph-find <topic>` | ابحث في الـgraph |
| `/graph-impact <file>` | تأثير ملف |
| `/memory-save <note>` | احفظ ذكرى |
| `/memory-search <query>` | ابحث |
| `/context <task>` | احصل على context مضغوط |
| `/ini-update` | فحص تحديثات upstream |

### 5.3 الـCommands عبر MCP Tools

(تستخدم تلقائياً من قبل وكيل MCP بدون تدخل المستخدم)

| الـMCP Tool | الوظيفة |
|-------------|---------|
| `ini_brain_status` | (موجود) حالة الإضافة |
| `ini_brain_save_memory` | (موجود) حفظ ذكرى |
| `ini_brain_search_memory` | (موجود) بحث |
| `ini_brain_get_context` | (موجود) سياق |
| `ini_brain_project_profile` | (موجود) ملف المشروع |
| `ini_brain_onboarding` | (موجود) دليل تعريفي |
| `ini_brain_explain` | (موجود) شرح ملف |
| `ini_brain_impact` | (موجود) تأثير |
| `ini_brain_list_memories` | (موجود) قائمة الذكريات |
| **`ini_brain_savings_status`** ⭐ | حالة طبقة التوفير |
| **`ini_brain_savings_enable`** ⭐ | تفعيل skill |
| **`ini_brain_measure_tokens`** ⭐ | عدّ توكنات نص |
| **`ini_brain_compress_context`** ⭐ | ضغط نص قبل الإرسال |
| **`ini_brain_graph_query`** ⭐ | استعلام الـgraph |
| **`ini_brain_graph_impact`** ⭐ | تأثير في الـgraph |
| **`ini_brain_spec_list`** ⭐ | قائمة specs |
| **`ini_brain_spec_read`** ⭐ | قراءة spec |
| **`ini_brain_spec_create`** ⭐ | إنشاء spec |
| **`ini_brain_upstream_check`** ⭐ | فحص upstream |
| **`ini_brain_upstream_apply`** ⭐ | تطبيق upstream |

---

## 6) نظام Universal Agent Adapter

### 6.1 الفكرة
**واجهة موحّدة** ينفّذها كل adapter:

```typescript
// src/adapters/types.ts
export interface AgentAdapter {
  id: string;
  displayName: string;
  detectInstalled(root: string): Promise<boolean>;
  writeSkill(opts: { root: string; name: string; body: string }): Promise<string[]>;
  writeCommand(opts: { root: string; name: string; body: string }): Promise<string[]>;
  writeAgentsFile(opts: { root: string; body: string }): Promise<string[]>;
  removeAll(root: string, name: string): Promise<void>;
}
```

### 6.2 Registry
```typescript
// src/adapters/registry.ts
import { claudeAdapter } from './claudeAdapter';
import { codexAdapter } from './codexAdapter';
// ... 12 adapters total

export const ALL_ADAPTERS: AgentAdapter[] = [
  claudeAdapter,
  codexAdapter,
  clineAdapter,
  cursorAdapter,
  windsurfAdapter,
  antigravityAdapter,
  geminiAdapter,
  copilotAdapter,
  openCodeAdapter,
  kimiAdapter,
  kiroAdapter,
  universalFallback, // AGENTS.md دائماً
];

export async function deployToAllAgents(opts: {
  root: string;
  skill: { name: string; body: string };
  commands?: Array<{ name: string; body: string }>;
}): Promise<{ adapter: string; files: string[] }[]> {
  const results = [];
  for (const adapter of ALL_ADAPTERS) {
    try {
      const files = await adapter.writeSkill({
        root: opts.root,
        name: opts.skill.name,
        body: opts.skill.body,
      });
      if (opts.commands) {
        for (const cmd of opts.commands) {
          files.push(...await adapter.writeCommand({
            root: opts.root,
            name: cmd.name,
            body: cmd.body,
          }));
        }
      }
      results.push({ adapter: adapter.id, files });
    } catch (e) {
      console.warn(`Adapter ${adapter.id} failed:`, e);
    }
  }
  return results;
}
```

### 6.3 مثال adapter — Claude
```typescript
// src/adapters/claudeAdapter.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { AgentAdapter } from './types';

export const claudeAdapter: AgentAdapter = {
  id: 'claude',
  displayName: 'Claude Code',

  async detectInstalled(root) {
    try {
      await fs.access(path.join(root, '.claude'));
      return true;
    } catch { return false; }
  },

  async writeSkill({ root, name, body }) {
    const dir = path.join(root, '.claude', 'skills', name);
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, 'SKILL.md');
    await fs.writeFile(file, body, 'utf8');
    return [file];
  },

  async writeCommand({ root, name, body }) {
    const dir = path.join(root, '.claude', 'commands');
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${name}.md`);
    await fs.writeFile(file, body, 'utf8');
    return [file];
  },

  async writeAgentsFile({ root, body }) {
    const file = path.join(root, 'CLAUDE.md');
    await fs.writeFile(file, body, 'utf8');
    return [file];
  },

  async removeAll(root, name) {
    await fs.rm(path.join(root, '.claude', 'skills', name), { recursive: true, force: true });
    await fs.rm(path.join(root, '.claude', 'commands', `${name}.md`), { force: true });
  },
};
```

نفس النمط لكل الـadapters الـ12.

---

## 7) نظام Auto-Update من الريبوهات

### 7.1 المصادر الـUpstream
```typescript
// src/updater/upstreamSources.ts
export const UPSTREAM_SOURCES = [
  {
    id: 'ponytail',
    owner: 'DietrichGebert',
    name: 'ponytail',
    branch: 'main',
    files: ['AGENTS.md', 'commands/ponytail.toml', 'commands/ponytail-review.toml',
            'commands/ponytail-audit.toml', 'commands/ponytail-debt.toml',
            'commands/ponytail-gain.toml', 'commands/ponytail-help.toml'],
    targetMap: {
      'AGENTS.md': 'skills/ponytail/SKILL.md',
      'commands/ponytail.toml': 'commands/ponytail.md',
      // ...
    },
  },
  {
    id: 'caveman',
    owner: 'JuliusBrussee',
    name: 'caveman',
    branch: 'main',
    files: ['AGENTS.md', 'skills/caveman/SKILL.md',
            'commands/caveman.md', 'commands/caveman-commit.md', /*...*/],
  },
  {
    id: 'spec-kit',
    owner: 'github',
    name: 'spec-kit',
    branch: 'main',
    files: ['templates/spec-template.md', 'templates/plan-template.md',
            'templates/tasks-template.md'],
  },
  {
    id: 'superpowers',
    owner: 'obra',
    name: 'superpowers',
    branch: 'main',
    files: ['AGENTS.md', 'skills/using-superpowers/SKILL.md'],
  },
  {
    id: 'graphify',
    owner: 'safishamsi',
    name: 'graphify',
    branch: 'main',
    files: ['AGENTS.md', 'skills/graphify/SKILL.md'],
  },
  {
    id: 'token-optimizer',
    owner: 'alexgreensh',
    name: 'token-optimizer',
    branch: 'main',
    files: ['AGENTS.md'],
  },
  {
    id: 'claude-token-efficient',
    owner: 'drona23',
    name: 'claude-token-efficient',
    branch: 'main',
    files: ['CLAUDE.md'],
  },
];
```

### 7.2 آلية الفحص
```typescript
// src/updater/repoSync.ts
import * as https from 'https';

async function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'ini-brain-ai-updater' }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

export async function checkUpstream(source: UpstreamSource): Promise<{
  hasUpdate: boolean;
  latestSha: string;
  changes?: string[];
}> {
  const url = `https://api.github.com/repos/${source.owner}/${source.name}/commits/${source.branch}`;
  const data = await fetchJson(url);
  const latestSha = data.sha;
  return {
    hasUpdate: latestSha !== source.lastSha,
    latestSha,
    changes: data.commit?.message ? [data.commit.message] : [],
  };
}

export async function applyUpstream(source: UpstreamSource, root: string): Promise<string[]> {
  const written: string[] = [];
  for (const file of source.files) {
    const url = `https://raw.githubusercontent.com/${source.owner}/${source.name}/${source.branch}/${file}`;
    const content = await fetchText(url);
    const target = path.join(root, '.brain', 'upstream', source.id, file);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content, 'utf8');
    written.push(target);
  }
  // Then redeploy via adapters
  return written;
}
```

### 7.3 الجدولة (Background)
- `setInterval` كل 24 ساعة في `autoBackground.ts` الموجود.
- عند بدء VS Code: فحص واحد.
- زر يدوي في sidebar: **"Check for Updates"**.

### 7.4 تجربة المستخدم
1. إشعار VS Code: `🆕 3 upstream skills have updates. [View] [Skip]`
2. إذا ضغط View: تُفتح webview بـdiff side-by-side.
3. زر **"Apply All"** أو **"Apply Selected"** أو **"Dismiss"**.

---

## 8) مراحل التنفيذ للوكيل الرخيص

> **الإجمالي المتوقع: 12–16 ساعة من العمل الموزّع.**
> كل مرحلة منفصلة وقابلة للاختبار.

### المرحلة 0: التحضير (15 دقيقة)
- [ ] رفع version إلى `3.0.0` في `package.json`.
- [ ] إنشاء المجلدات الجديدة: `src/savings/`, `src/methodology/`, `src/graph/`, `src/adapters/`, `src/updater/`, `src/mcp/tools/`, `docs/features/ar/`, `docs/features/en/`.

### المرحلة 1: Savings Layer (3 ساعات)
- [ ] `src/savings/ponytail.ts` — من v2 plan.
- [ ] `src/savings/caveman.ts` — جديد، modes lite/full/ultra/wenyan.
- [ ] `src/savings/claudeLean.ts` — قواعد drona23.
- [ ] `src/savings/tokenMeter.ts` — heuristic counter (4 chars ≈ 1 token).
- [ ] `src/savings/contextCompressor.ts` — يقلّص الـcontext bundle.
- [ ] `src/savings/index.ts` — orchestrator يفعّل/يُلغي.

### المرحلة 2: Methodology Layer (2 ساعة)
- [ ] `src/methodology/specKit.ts` — من v2 plan.
- [ ] `src/methodology/superpowers.ts` — skills engine بسيط (parse SKILL.md، حلّ روابط `@skill-name`).

### المرحلة 3: Universal Adapter (4 ساعات)
- [ ] `src/adapters/types.ts` — الواجهة.
- [ ] `src/adapters/registry.ts` — التسجيل + `deployToAllAgents`.
- [ ] 12 adapter (كل واحد ~30 سطر).
- [ ] دالة `INI Brain: Install for All Agents` في extension.ts.

### المرحلة 4: Knowledge Graph (2 ساعة)
- [ ] `src/graph/codeGraph.ts` — استخدم `projectScanner` الموجود.
- [ ] `src/graph/conceptExtractor.ts` — regex على headings/JSDoc.
- [ ] `src/graph/mermaidRenderer.ts` — يُرجع Mermaid text.
- [ ] `src/ui/graphWebview.ts` — Webview بسيط يعرض Mermaid.

### المرحلة 5: Auto-Update (2 ساعة)
- [ ] `src/updater/upstreamSources.ts`.
- [ ] `src/updater/repoSync.ts`.
- [ ] `src/updater/diffViewer.ts` — webview بسيط.
- [ ] Commands + إعدادات.

### المرحلة 6: MCP Tools (1 ساعة)
- [ ] إعادة تنظيم `mcp/server.ts` لاستخدام `tools/*.ts`.
- [ ] إضافة 10 tools جديدة.

### المرحلة 7: UI Sidebar (1 ساعة)
- [ ] `src/ui/savingsDashboard.ts` — عرض إحصاءات.
- [ ] تحديث `sidebarProvider.ts` لإضافة الـcards الجديدة.

### المرحلة 8: التوثيق ثنائي اللغة (2 ساعة)
- [ ] 9 ملفات `docs/features/ar/*.md`.
- [ ] 9 ملفات `docs/features/en/*.md`.
- [ ] تحديث `README.md` الرئيسي (قسم What's New).
- [ ] تحديث `AGENTS.md` الرئيسي.

### المرحلة 9: الاختبار والتغليف (30 دقيقة)
- [ ] `scripts/savings-smoke.cjs`.
- [ ] `scripts/adapter-smoke.cjs`.
- [ ] `scripts/updater-smoke.cjs`.
- [ ] `npm run compile && npm run smoke:all && npm run package`.
- [ ] النتيجة: `ini-brain-ai-universal-3.0.0.vsix`.

---

## 9) التوثيق ثنائي اللغة

### 9.1 محتوى كل ملف

**عربي (`docs/features/ar/<feature>.md`):**
```markdown
# اسم الميزة

## ما هي؟
[شرح بسيط بالعربي في 2-3 أسطر]

## ماذا تفعل بالضبط؟
[تفصيل تقني بالعربي]

## كيف أفعّلها؟
1. Command Palette → ...
2. ...

## ما الأوامر التي أستخدمها؟
| الأمر | الوظيفة | المثال |
|------|---------|--------|
| `/caveman full` | تفعيل full | ... |

## أمثلة عملية
### قبل
```
[نص طويل]
```
### بعد
```
[نص مضغوط]
```

## كيف ألغي تفعيلها؟
...

## الأسئلة الشائعة
**س:** ...
**ج:** ...

## المصدر الأصلي
[رابط الريبو الأصلي + رخصة]
```

**إنجليزي (`docs/features/en/<feature>.md`):** نفس الشكل بالإنجليزي.

### 9.2 ملف Commands Reference (الأهم للمستخدم)

`docs/features/ar/commands-reference.md`:
```markdown
# مرجع الأوامر الكامل / Full Commands Reference

## القسم 1: أوامر VS Code Command Palette (Ctrl+Shift+P)

### Core (الأساسية)
| الأمر | الوصف | الاختصار المقترح |
|------|-------|----------------|
| `INI Brain: Scan Project` | فحص المشروع وبناء الذاكرة | `Ctrl+Alt+S` |
| ...

### Savings (توفير التوكنات)
| الأمر | الوصف |
|------|-------|
| `INI Brain: Enable All Savings` | تفعيل كل ميزات التوفير |
| `INI Brain: Show Token Dashboard` | داشبورد التوفير |
| ...

## القسم 2: Slash Commands في الـAI Chat

### إذا كنت تستخدم Cline
```
/caveman full           # تفعيل ضغط الردود
/ponytail-review        # راجع الكود
/spec-new auth-feature  # spec جديد
/memory-save "decision: chose JWT" # احفظ قرار
/context refactor login # احصل على context
```

### إذا كنت تستخدم Claude Code
```
/caveman ultra
/graphify
/skills using-superpowers
```

### إذا كنت تستخدم Codex CLI
```
codex run /ponytail-audit
```

### إذا كنت تستخدم Cursor
في ملف `.cursorrules` الـskills تعمل تلقائياً.
أيضاً `@ini-brain` في chat للوصول للذاكرة.

### إذا كنت تستخدم Gemini CLI
```bash
gemini --skill caveman
gemini run /ponytail
```

## القسم 3: MCP Tools (تلقائية)
يستخدمها الوكيل بدون تدخلك:
- `ini_brain_get_context` — يجلب سياق المشروع.
- `ini_brain_save_memory` — يحفظ ذكريات تلقائياً.
- ...

## القسم 4: سيناريوهات الاستخدام الشائعة

### سيناريو 1: ابدأ مشروع جديد
1. افتح المشروع في VS Code.
2. `INI Brain: Guided Setup` → اتبع المعالج.
3. `INI Brain: Enable All Savings` → فعّل التوفير.
4. `INI Brain: Install for All Agents` → نشر للوكلاء.
5. الآن أي وكيل تفتحه سيستخدم ذاكرتك + يوفّر التوكنات.

### سيناريو 2: feature جديد
1. `INI Brain: Create Spec` → اكتب الـ"ماذا".
2. `INI Brain: Generate Plan` → اكتب الـ"كيف".
3. `INI Brain: Break into Tasks` → قسّم.
4. في وكيلك المفضل: `/spec-do` → اطلب تنفيذ المهمة التالية.

### سيناريو 3: مراجعة كود
1. افتح الملف.
2. `INI Brain: Ponytail Review Current File`.
3. اقرأ الاقتراحات.
4. أرسل النتيجة لوكيلك مع `/ponytail-review`.

### سيناريو 4: فهم المشروع
1. `INI Brain: Build Knowledge Graph`.
2. `INI Brain: Show Knowledge Graph`.
3. تستكشف الـgraph بصرياً.
4. `INI Brain: Find Impact` على ملف → ترى التأثير.
```

---

## 10) قائمة فحص نهائية للوكيل الرخيص

### قبل البدء
- [ ] أنا أفهم أن المشروع zero-deps حالياً ولن أضيف dependencies إلا للضرورة القصوى.
- [ ] أعرف أن كل ميزة جديدة يجب أن تكون `default: false`.
- [ ] أنا التزم بـ TypeScript strict.
- [ ] أحترم الـadapters Pattern وأضع كل أداة جديدة في مكانها الصحيح.

### أثناء التنفيذ
- [ ] بعد كل ملف جديد: `npm run compile` لاكتشاف الأخطاء فوراً.
- [ ] أنشئ smoke test لكل وحدة كبيرة.
- [ ] أضع تعليق attribution في رأس كل ملف يستخدم محتوى من ريبو خارجي.
- [ ] لا أعدّل ملفات الـcore الموجودة إلا إذا كان لا بد — أضيف فقط.

### بعد التنفيذ
- [ ] `npm run smoke:all` ينجح.
- [ ] `npm run package` ينتج `ini-brain-ai-universal-3.0.0.vsix`.
- [ ] الـREADME محدّث بقسم 3.0.0.
- [ ] `docs/features/ar/` و `docs/features/en/` مكتملان (9 ملفات لكل لغة).
- [ ] الإضافة تعمل في VS Code (اختبار يدوي).
- [ ] الـMCP server يعمل (اختبار `npm run smoke:mcp`).
- [ ] حفظت قرار التصميم في INI Brain memory.

### ما يجب ألا تفعل
- ❌ لا تضف React/D3/heavy libraries — Mermaid يكفي.
- ❌ لا تضف Python dependency — كل شيء TypeScript.
- ❌ لا تكسر backwards compatibility — الإصدارات 2.x.x تبقى تعمل.
- ❌ لا تجلب أي تحديث upstream تلقائياً بدون موافقة المستخدم.
- ❌ لا تحفظ أي API key أو token في الكود.
- ❌ لا تنسخ كود محتوى يخالف رخصته. كل الريبوهات MIT لذا الإسناد كافٍ.

---

## 11) ملخص الـDeliverables النهائي

عند انتهاء التنفيذ سيكون لدى المستخدم:

### A) إضافة VS Code قوية
- 25+ command في Command Palette.
- Sidebar مع dashboards (Memory, Savings, Graph).
- WebView للـKnowledge Graph.

### B) دعم 12+ وكيل AI تلقائياً
- Claude, Codex, Cline, Cursor, Windsurf, Antigravity, Gemini, Copilot, OpenCode, Kimi, Kiro + Universal AGENTS.md.

### C) 7 طبقات ميزات
1. **Memory** (موجود).
2. **Caveman Savings** (output -70٪).
3. **Ponytail Savings** (code -54٪).
4. **Claude Lean** (Claude rules).
5. **Spec-Kit Methodology**.
6. **Knowledge Graph + Viz**.
7. **Superpowers Skills Engine**.

### D) MCP Server موسّع
- ~20 tool متاح لأي MCP client.

### E) Auto-Update System
- يتابع 7 ريبوهات upstream.
- يطلب موافقة قبل التطبيق.

### F) توثيق كامل ثنائي اللغة
- 18 ملف feature docs (ar + en).
- 1 commands reference شامل.
- README محدّث.

### G) Smoke tests
- 5 سكربتات اختبار تدور في < 30 ثانية.

---

## 12) ملاحظات نهائية

### للمستخدم النهائي (أنت يا صديقي)
- **بعد التنفيذ:** ستحصل على `.vsix` ضخم بإمكانيات جبارة.
- **التوفير المتوقع:** 60–80٪ من تكاليف API الـAI لديك.
- **الوقت المتوقع للتنفيذ:** 12–16 ساعة موزّعة على 9 مراحل.
- **التكلفة على وكيل رخيص (Haiku/GPT-4o-mini):** ~$5–10 لكل التنفيذ.

### للوكيل الرخيص المنفّذ
- اقرأ هذا الملف **مرة واحدة** ثم اشتغل على المراحل بالترتيب.
- استخدم `ini_brain_search_memory` للوصول لقرار v3.0.0 المحفوظ.
- بعد كل مرحلة: `ini_brain_save_memory` بنوع `session` لتذكّر التقدم.
- إذا توقفت: `ini_brain_search_memory "v3.0.0 progress"` ستعطيك آخر نقطة.

### قرار حفظ الذاكرة
بعد الانتهاء، احفظ:
```
decision: "Completed v3.0.0 integration: Caveman + Ponytail + Spec-Kit + Graphify + Superpowers + Universal Adapter + Auto-Update. 25+ commands, 12 agents supported, 7 feature layers, bilingual docs."
```

---

**نهاية الخطة v3.0.0 — جاهزة للتنفيذ.**
**إجمالي الملف: ~900 سطر = ~30,000 توكن إدخال للوكيل الرخيص. كفاية لتنفيذ كل المشروع.**
