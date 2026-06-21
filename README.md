# INI Brain AI Universal

Local-first AI productivity platform for VS Code and MCP clients. INI Brain scans a workspace, builds a durable `.brain/` knowledge base, generates `AGENTS.md`, exposes focused project context through MCP, and helps multiple coding agents share the same workflow, memories, quality guards, and project map.

Current version: **3.1.0**

Repository: [github.com/inisoliman/ini-brain-ai-universal](https://github.com/inisoliman/ini-brain-ai-universal)

## Highlights In 3.1.0

- Added memory lifecycle metadata: `confidence`, `expiresAt`, `pinned`, and `origin`.
- Added safe local memory compaction with dry-run preview, duplicate merging, retention, and pinned-memory protection.
- Added MCP memory maintenance tools: `ini_brain_memory_stats` and `ini_brain_memory_compact`.
- Added `frontend-design-guard`, a generated quality guard for UI layout, accessibility, contrast, responsive behavior, state coverage, and screenshot verification.
- Kept the extension local-first: no AgentMemory or Impeccable runtime service is bundled or required.
- Kept the existing v3 platform: VS Code sidebar, Auto Mode, Spec-Kit, Knowledge Graph, token savings, universal agent adapters, upstream update checks, MCP tools, and bilingual docs.

## What It Builds Locally

INI Brain creates and refreshes these workspace assets:

- `AGENTS.md`: operating guide for AI coding agents.
- `.brain/project_map.json`: language and file inventory.
- `.brain/dependency_graph.json`: dependency map used by explain/impact workflows.
- `.brain/compact_context.md`: compact project context for LLMs.
- `.brain/memories.json`: durable local memory with optional lifecycle metadata.
- `.brain/workflow.md`: project workflow guidance.
- `.brain/quality_gates.md`: verification and review checklist.
- `.brain/skills/`: generated skills and quality guards.
- `.brain/backups/`: Auto Mode backups for overwritten files.
- `.specify/`: optional Spec-Kit workspace for specs, plans, and tasks.

## VS Code Features

The activity bar view **INI Brain AI -> Brain** includes:

- Scan Project and Rebuild Brain.
- Ask AI chat with project context.
- Copy Chat Task for Cline.
- Auto Mode with preview, confirmation, backup, and restore.
- Generate Project from `project_request.md`.
- Agent Guide and Skills/Workflow generation.
- Onboarding, Explain File, and Analyze Impact.
- Quality Guards generation, including Clean Code, Test, Karpathy, and Frontend Design guards.
- Save/Search Memory and Memory Profile.
- Copy MCP Config and Install MCP for Cline.
- Settings panel with OpenAI-compatible provider URL, model, API key, timeout, and Auto Mode options.
- Token Savings, Knowledge Graph, Spec-Driven Development, Agent Adapters, and Upstream Updates cards.

Command Palette entries use the `INI Brain:` prefix. Hidden compatibility aliases for old `projectBrain.*` command IDs are also registered so older shortcuts and integrations keep working.

## MCP Tools

INI Brain exposes these MCP tools:

- `ini_brain_auto_brief`
- `ini_brain_status`
- `ini_brain_get_context`
- `ini_brain_search_memory`
- `ini_brain_save_memory`
- `ini_brain_list_memories`
- `ini_brain_memory_stats`
- `ini_brain_memory_compact`
- `ini_brain_project_profile`
- `ini_brain_onboarding`
- `ini_brain_explain`
- `ini_brain_impact`
- `ini_brain_generate_agent_guide`
- `ini_brain_suggest_skills`
- `ini_brain_generate_workflow`
- `ini_brain_savings_status`
- `ini_brain_measure_tokens`
- `ini_brain_graph_build`
- `ini_brain_graph_impact`
- `ini_brain_spec_list`
- `ini_brain_spec_read`
- `ini_brain_spec_create`
- `ini_brain_skills_list`
- `ini_brain_skills_resolve`

The MCP server also injects the INI Brain operating protocol through `instructions`, so compatible clients learn to call `ini_brain_auto_brief` and `ini_brain_get_context` before editing.

## Memory Lifecycle

The memory lifecycle work is inspired by AgentMemory concepts, but INI Brain remains the owner of storage and retrieval. Memories stay in the workspace under `.brain/memories.json`; no external memory server, database, or network service is required.

Lifecycle behavior:

- Old memory entries remain readable and receive safe defaults.
- Important memories can be pinned so compaction never deletes them.
- Temporary memories can use `expiresAt` and are removed only when expired and unpinned.
- Near duplicates are merged only when kind matches and concepts overlap.
- `ini_brain_memory_compact` defaults to dry-run preview; pass `apply=true` only when you want to write changes.

## Frontend Design Guard

The frontend guard is inspired by Impeccable-style UI review workflows. It is not a dependency and it does not call an external service. INI Brain generates it into `.brain/skills/`, `.codex/skills/`, `.cline/skills/`, and `.clinerules/skills/` so agents can apply it when UI, webview, dashboard, or app screens change.

It checks layout overflow, accessibility, contrast, responsive behavior, visual hierarchy, loading/empty/error states, and screenshot verification.

## Quick Install

```powershell
git clone https://github.com/inisoliman/ini-brain-ai-universal.git
cd ini-brain-ai-universal
powershell -ExecutionPolicy Bypass -File .\scripts\install-all.ps1
```

The installer:

1. Verifies Node.js.
2. Runs `npm install` and `npm run compile`.
3. Adds the MCP server to `~/.codex/config.toml`.
4. Adds the MCP server to Claude Desktop.
5. Adds the MCP server to Cline.

Skip flags:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-all.ps1 -SkipBuild -SkipCodex -SkipClaude -SkipCline
```

## Manual Build

```powershell
npm install
npm run compile
npm run package
```

The VSIX output is:

```text
ini-brain-ai-universal-3.1.0.vsix
```

Install in VS Code:

```powershell
code --install-extension .\ini-brain-ai-universal-3.1.0.vsix --force
```

## Codex MCP Setup

Preferred automatic setup:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-all.ps1 -SkipClaude -SkipCline
```

Manual Codex config:

```toml
[mcp_servers.ini-brain-ai]
command = "node"
args = ["C:/path/to/ini-brain-ai-universal/dist/mcp/server.js"]
startup_timeout_sec = 120
```

After changing Codex MCP config, restart Codex so the server and tool list reload.

## AI Provider Settings

AI-assisted VS Code features are optional. Configure them from **INI Brain: Settings** or **INI Brain: Configure AI Provider**:

- `iniBrain.apiBaseUrl`
- `iniBrain.modelName`
- `iniBrain.requestTimeoutMs`
- API key stored in VS Code SecretStorage
- `iniBrain.autoModeConfirmEachChange`
- `iniBrain.backupRetention`

No API key is written to repository files.

## Daily Workflow

1. Open a workspace in VS Code.
2. Run **INI Brain: Scan Project** or let the automatic scan refresh `.brain/`.
3. Use **INI Brain: Ask AI** or connect an MCP client.
4. Ask the agent to call `ini_brain_auto_brief` and `ini_brain_get_context` before editing.
5. Save durable discoveries with `ini_brain_save_memory`.
6. Use Explain File, Analyze Impact, Knowledge Graph, Spec-Kit, or Memory Stats when the task needs deeper context.

## Safety Model

- Local-first by default.
- `.brain/` context and memory stay inside the workspace.
- Secrets are stored in VS Code SecretStorage, not in repository files.
- Auto Mode requires explicit user confirmation before writing.
- Auto Mode refuses absolute paths and paths outside the workspace.
- Existing files are backed up before overwrite/delete.
- Protected repository internals are not modified.
- Memory compaction defaults to dry-run preview.

## Arabic Summary

INI Brain AI Universal هي إضافة محلية لـ VS Code وMCP تساعد وكلاء الذكاء الاصطناعي على فهم المشروع والعمل من نفس الذاكرة والسياق. الإصدار 3.1.0 يضيف دورة حياة أقوى للذاكرة، أدوات MCP لإحصاءات وتنظيف الذاكرة، و`frontend-design-guard` لمراجعة واجهات المستخدم قبل التسليم.

كل شيء يبقى محلياً داخل المشروع: لا يتم تشغيل AgentMemory أو Impeccable كاعتمادات runtime، ولا يتم إرسال ذاكرة المشروع إلى خدمة خارجية.

الدليل العربي المختصر:

- [docs/features/ar/overview.md](docs/features/ar/overview.md)
- [docs/features/ar/memory-lifecycle.md](docs/features/ar/memory-lifecycle.md)
- [docs/features/ar/frontend-design-guard.md](docs/features/ar/frontend-design-guard.md)
- [docs/install-arabic-guide.md](docs/install-arabic-guide.md)

## Acknowledgements

INI Brain integrates ideas and MIT-licensed material from:

- [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)
- [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)
- [drona23/claude-token-efficient](https://github.com/drona23/claude-token-efficient)
- [github/spec-kit](https://github.com/github/spec-kit)
- [obra/superpowers](https://github.com/obra/superpowers)
- [safishamsi/graphify](https://github.com/safishamsi/graphify)
- [alexgreensh/token-optimizer](https://github.com/alexgreensh/token-optimizer)
- [rohitg00/agentmemory](https://github.com/rohitg00/agentmemory) for memory-lifecycle inspiration only.
- [pbakaus/impeccable](https://github.com/pbakaus/impeccable) and [impeccable.style](https://impeccable.style/) for frontend review workflow inspiration only.
