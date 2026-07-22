# INI Brain AI Universal

Local-first AI productivity platform for VS Code and MCP clients. INI Brain scans a workspace, builds a durable `.brain/` knowledge base, generates `AGENTS.md`, exposes focused project context through MCP, and helps multiple coding agents share the same workflow, memories, quality guards, project map, and code-intelligence tools.

Current version: **3.3.0**.

Repository: [github.com/inisoliman/ini-brain-ai-universal](https://github.com/inisoliman/ini-brain-ai-universal)

## Highlights

- Local workspace brain: `.brain/`, `AGENTS.md`, compact context, memories, workflow, quality gates, and generated skills.
- MCP server for Codex, Claude Desktop, Claude Code, Cline, Kilo Code, Roo Code, Gemini CLI, Cursor, VS Code MCP clients, and any stdio MCP-compatible client.
- Automatic client detection: the server reads MCP `clientInfo` and reports the connected client in `ini_brain_status`.
- Workspace trust guard: if a client launches the server outside the project, background scanning stays off and status explains how to fix it instead of scanning the wrong directory.
- Automatic golden prompt through MCP `instructions`, so compatible agents learn to call `ini_brain_auto_brief` and `ini_brain_get_context`.
- Memory lifecycle metadata: `confidence`, `expiresAt`, `pinned`, and `origin`.
- Safe local memory compaction with dry-run preview and pinned-memory protection.
- Code Intelligence tools: `codebase-memory-mcp` is preferred when installed; INI Brain Lite Graph is the automatic fallback.
- Upstream Vault: original upstream -> project mirror -> bundled snapshot fallback for important upstream references.
- Quality guards: Clean Code, Test, Karpathy, and Frontend Design.
- Spec-Kit, token savings, Knowledge Graph, onboarding, explain/impact, Auto Mode, and universal agent adapters.

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
- `.brain/upstream/`: applied upstream skill/reference snapshots.
- `.specify/`: optional Spec-Kit workspace for specs, plans, and tasks.
- `.codex/skills/`, `.cline/skills/`, and `.clinerules/skills/`: lightweight mirrors for agents that support their own skill folders.

## Recommended Workspace Layout

Use `.brain/` and `AGENTS.md` as the source of truth. Agent-specific folders such as `.codex/`, `.cline/`, and `.clinerules/` should be generated mirrors, not separate brains.

```text
your-project/
  AGENTS.md
  .brain/
    compact_context.md
    memories.json
    workflow.md
    quality_gates.md
    skills/
  .codex/skills/
  .cline/skills/
  .clinerules/skills/
  .specify/
```

Avoid independent folders like `claude-brain/`, `cline-brain/`, or `codex-brain/` unless you intentionally want isolated behavior. Separate brains drift apart.

## Quick Install

```powershell
git clone https://github.com/inisoliman/ini-brain-ai-universal.git
cd ini-brain-ai-universal
powershell -ExecutionPolicy Bypass -File .\scripts\install-all.ps1
```

The installer verifies Node.js, runs `npm install` and `npm run compile`, then writes MCP configuration for Codex, Claude Desktop, and Cline. The VS Code extension additionally auto-detects and configures Claude Code, Gemini CLI, Cursor, Kilo Code, and Roo Code when those clients are present.

Optional and skip flags:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-all.ps1 -InstallCodeIntel
powershell -ExecutionPolicy Bypass -File .\scripts\install-all.ps1 -SkipBuild -SkipCodex -SkipClaude -SkipCline
```

The installer does not clone upstream repositories. Advanced
`codebase-memory-mcp` installation is opt-in through `-InstallCodeIntel`; without
it, the built-in Lite Graph remains active.

The official install and update source is
[github.com/inisoliman/ini-brain-ai-universal](https://github.com/inisoliman/ini-brain-ai-universal/).
The VS Code extension automatically merges its packaged MCP server into detected
Codex, Claude Desktop, Claude Code, Gemini CLI, Cursor, Cline, Kilo Code, and Roo
Code settings. Existing MCP servers are preserved.
Restart an already-running client once after first installation.

## Codex Windows App

The Codex Windows app uses the same Codex MCP configuration as Codex CLI. If the installer updated `~/.codex/config.toml`, restart Codex and open a project.

For best automatic behavior:

1. Install INI Brain once with `scripts/install-all.ps1`.
2. Open the target project in VS Code and run **INI Brain: Scan Project** at least once.
3. Restart the Codex Windows app.
4. Start a new Codex task for the target project.
5. Confirm the MCP tool list contains `ini_brain_auto_brief`.

No startup text needs to be copied manually. The MCP initialization instructions
tell Codex to verify the workspace with `ini_brain_status`, run
`ini_brain_auto_brief`, load focused context, and preview Smart Setup before any
approved apply action.

## MCP Tools

Core tools:

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

Feature tools:

- `ini_brain_savings_status`
- `ini_brain_measure_tokens`
- `ini_brain_compare_tokens`
- `ini_brain_graph_build`
- `ini_brain_graph_impact`
- `ini_brain_spec_list`
- `ini_brain_spec_read`
- `ini_brain_spec_create`
- `ini_brain_skills_list`
- `ini_brain_skills_resolve`

Code Intelligence tools:

- `ini_brain_code_status`
- `ini_brain_code_index`
- `ini_brain_code_architecture`
- `ini_brain_code_search`
- `ini_brain_code_trace`
- `ini_brain_code_changes`
- `ini_brain_code_query`

Spec-Kit slash-flow tools:

- `ini_brain_spec_constitution` maps to `/constitution`.
- `ini_brain_spec_create` maps to `/specify`.
- `ini_brain_spec_clarify` maps to `/clarify`.
- `ini_brain_spec_plan` maps to `/plan`.
- `ini_brain_spec_tasks` maps to `/tasks`.
- `ini_brain_spec_next_task` helps `/implement` pick the next unchecked task.

## Automatic Spec-Kit Flow

For a new project, unclear request, or large feature, INI Brain should guide agents through:

```text
/constitution -> /specify -> /clarify -> /plan -> /tasks -> /implement
```

This is important because it prevents the agent from jumping into code before the rules, scope, open questions, architecture, and tasks are clear. For small fixes, simple edits, or quick questions, INI Brain intentionally uses the lighter context workflow so the process does not become heavy.

## Optional Engineering Workflow Pack

Run **INI Brain: Enable Engineering Workflow Pack** to add six compact, on-demand
skills: product discovery, engineering plan review, systematic investigation,
unified review, security review, and release readiness. The pack adapts selected
workflow ideas from gstack but does not bundle its browser daemon, telemetry,
cookie tools, deployment runtime, or Bun dependencies.

The complete pack is not injected into every prompt. Skills are stored locally and
loaded only when an agent selects the matching workflow.

## Network and Download Behavior

- Activating or scanning with the extension performs local filesystem work only.
- Installing INI Brain installs this project's npm development dependencies; it
  does not clone acknowledged upstream repositories.
- `codebase-memory-mcp` is installed only when `install-all.ps1` receives the
  explicit `-InstallCodeIntel` switch.
- **Check Upstream** requests small GitHub commit metadata only after the user runs
  the command.
- **Apply Upstream** downloads only the curated files listed for that source, never
  a full repository clone.

## Code Intelligence

INI Brain exposes one stable MCP surface and selects the strongest local engine automatically:

```text
Agent
  -> INI Brain MCP
      -> Primary: codebase-memory-mcp, when installed and available
      -> Fallback: INI Brain Lite Graph, always available
```

The advanced engine is optional. INI Brain does not silently download or execute binaries. If `codebase-memory-mcp` is installed on PATH, INI Brain uses it for indexing, search, architecture, traces, changes, and graph queries. If it is not installed, INI Brain returns to the built-in Lite Graph and keeps working.

Useful optional commands:

```text
ini_brain_code_status
```

```text
ini_brain_code_index
ini_brain_code_architecture
```

```text
ini_brain_code_search: authentication middleware
```

## Upstream Vault

The updater now uses a resilient source order:

1. Original upstream repository.
2. Mirror path in this repository under `resources/upstreams/`.
3. Bundled local snapshot from `resources/upstreams/`.

This protects important references if an upstream repository is renamed, deleted, unavailable, or rate-limited. The main branch stores curated lightweight snapshots and license metadata. Full upstream repositories that permit public redistribution are stored as `git bundle` assets in the permanent `upstream-archives` GitHub Release, rather than being committed into normal project history. The vault is shared by all supported clients; it is not Codex-only.

Automation included:

- `.github/workflows/sync-upstream-vault.yml`: daily/manual snapshot refresh and reviewed PR creation.
- `.github/workflows/archive-upstreams.yml`: daily/manual full `git bundle` archives as both run artifacts and permanent GitHub Release assets.
- `scripts/upstream-vault-smoke.cjs`: verifies snapshot checksums.
- `scripts/sync-upstream-vault.cjs`: refreshes curated snapshots.
- `scripts/archive-upstreams.cjs`: creates full bundle archives from the manifest.

See [Upstream Vault and Permanent Backups](docs/upstream-vault.md) for the complete source list, licensing boundary, restore instructions, and automatic-update flow.

## Automatic Agent Protocol

Compatible MCP clients receive INI Brain startup instructions automatically from the server during initialization. Users should not paste a startup prompt into every new conversation.

The automatic protocol asks the agent to:

1. Call `ini_brain_status` and verify the workspace and `.brain`.
2. Call `ini_brain_auto_brief` once for the current task.
3. Call `ini_brain_get_context` before editing.
4. Preview Smart Setup with `ini_brain_smart_setup_plan` when useful.
5. Never call `ini_brain_smart_setup_apply` until the user explicitly approves.
6. Save durable decisions or fixes with `ini_brain_save_memory` after finishing.

## VS Code Features

The activity bar view **INI Brain AI -> Brain** includes scanning, Ask AI, Auto Mode, Generate Project, Agent Guide generation, memory tools, onboarding, explain/impact, quality guards, MCP config, provider settings, token savings, Knowledge Graph, Spec-Kit, agent adapters, and upstream update cards.

Command Palette entries use the `INI Brain:` prefix. Hidden compatibility aliases for old `projectBrain.*` command IDs are also registered.

## Manual Build

```powershell
npm install
npm run compile
npm run smoke:all
npm run audit:public
npm run package
```

The VSIX output is:

```text
ini-brain-ai-universal-3.3.0.vsix
```

Install in VS Code:

```powershell
code --install-extension .\ini-brain-ai-universal-3.3.0.vsix --force
```

## Safety Model

- Local-first by default.
- `.brain/` context and memory stay inside the workspace.
- Secrets are stored in VS Code SecretStorage, not in repository files.
- Auto Mode requires explicit user confirmation before writing.
- Auto Mode refuses absolute paths and paths outside the workspace.
- Existing files are backed up before overwrite/delete.
- Protected repository internals are not modified.
- Memory compaction defaults to dry-run preview.
- Advanced Code Intelligence is used only when the binary is already installed and available.

## Arabic Summary

INI Brain AI Universal إضافة محلية لـ VS Code وMCP تساعد وكلاء الذكاء الاصطناعي على فهم المشروع والعمل من نفس الذاكرة والسياق. المصدر الأساسي هو `.brain/` و`AGENTS.md`، أما مجلدات `.codex/` و`.cline/` فهي مرايا خفيفة وليست عقولاً منفصلة.

إذا كان `codebase-memory-mcp` مثبتاً يتم استخدامه كمحرك Code Intelligence أقوى، وإذا لم يكن موجوداً يعمل Lite Graph الداخلي مباشرة. كذلك يحفظ Upstream Vault ملفات منتقاة وخفيفة من المشاريع المرجعية حتى لا تضيع الخصائص المهمة إذا تغيرت الريبوهات الأصلية.

## Acknowledgements

INI Brain integrates ideas and MIT-licensed material from:

- [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)
- [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)
- [drona23/claude-token-efficient](https://github.com/drona23/claude-token-efficient)
- [github/spec-kit](https://github.com/github/spec-kit)
- [obra/superpowers](https://github.com/obra/superpowers)
- [garrytan/gstack](https://github.com/garrytan/gstack) for the optional compact Engineering Workflow Pack; no gstack runtime is bundled.
- [safishamsi/graphify](https://github.com/safishamsi/graphify)
- [alexgreensh/token-optimizer](https://github.com/alexgreensh/token-optimizer)
- [DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp) for optional advanced code-intelligence integration.
- [amElnagdy/delegate-skills](https://github.com/amElnagdy/delegate-skills) for safe delegation workflow inspiration and curated reference snapshots.
- [amElnagdy/guard-skills](https://github.com/amElnagdy/guard-skills) for quality-guard research and curated reference snapshots.
- [rohitg00/agentmemory](https://github.com/rohitg00/agentmemory) for memory-lifecycle inspiration only.
- [pbakaus/impeccable](https://github.com/pbakaus/impeccable) and [impeccable.style](https://impeccable.style/) for frontend review workflow inspiration only.
