# INI Brain AI Universal

Local-first AI productivity platform for VS Code and MCP clients. INI Brain scans a workspace, builds a durable `.brain/` knowledge base, generates `AGENTS.md`, exposes focused project context through MCP, and helps multiple coding agents share the same workflow, memories, quality guards, and project map.

Current version: **3.0.0**

Repository: [github.com/inisoliman/ini-brain-ai-universal](https://github.com/inisoliman/ini-brain-ai-universal)

## Highlights In 3.0.0

- Restored the classic VS Code sidebar actions from the previous release: Ask AI, Auto Mode, Generate Project, Onboarding, Explain File, Analyze Impact, Quality Guards, Restore Backup, Settings, Memory Profile, Copy for Cline, and Install MCP.
- Added safe Auto Mode apply flow: previews AI-generated file changes, asks for confirmation, writes workspace-relative files only, and backs up overwritten files to `.brain/backups`.
- Added token-saving workflows: Caveman Mode, Ponytail Mode, Claude Lean, token measurement, and a local savings dashboard.
- Added local Spec-Driven Development: create specs, generate implementation plans, break specs into tasks, and open the next task for an agent.
- Added a Knowledge Graph layer: build a code graph, render Mermaid, and inspect blast radius for a file.
- Added universal agent adapters for Claude, Codex, Cline, Cursor, Windsurf, Antigravity, Gemini, Copilot, OpenCode, Kimi, Kiro, and generic MCP clients.
- Added upstream update checks for bundled skills and workflows.
- Added bilingual feature docs in `docs/features/ar` and `docs/features/en`.
- Kept the v2.x core: local memory, auto brief, onboarding, file explanation, impact analysis, quality guards, Cline/Codex MCP config, and generated agent guidance.

## What It Builds Locally

INI Brain creates and refreshes these workspace assets:

- `AGENTS.md`: operating guide for AI coding agents.
- `.brain/project_map.json`: language and file inventory.
- `.brain/dependency_graph.json`: dependency map used by explain/impact workflows.
- `.brain/compact_context.md`: compact project context for LLMs.
- `.brain/memory.jsonl`: durable local memory.
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
- Quality Guards generation.
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
ini-brain-ai-universal-3.0.0.vsix
```

Install in VS Code:

```powershell
code --install-extension .\ini-brain-ai-universal-3.0.0.vsix --force
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
6. Use Explain File, Analyze Impact, Knowledge Graph, or Spec-Kit when the task needs deeper context.

## Safety Model

- Local-first by default.
- `.brain/` context and memory stay inside the workspace.
- Secrets are stored in VS Code SecretStorage, not in repository files.
- Auto Mode requires explicit user confirmation before writing.
- Auto Mode refuses absolute paths and paths outside the workspace.
- Existing files are backed up before overwrite/delete.
- Protected repository internals are not modified.

## Arabic Summary

INI Brain AI Universal هو نظام محلي لفهم المشروع وتغذية وكلاء الذكاء الاصطناعي بسياق دقيق. الإصدار 3.0.0 يعيد أزرار الإصدار السابق داخل الواجهة، ويضيف Auto Mode آمن مع معاينة ونسخ احتياطي، ويوفر Memory وMCP وSpec-Kit وKnowledge Graph وتوفير التوكنات ودعم Codex/Cline/Claude وغيرهم.

الدليل العربي المختصر موجود هنا:

- [docs/features/ar/overview.md](docs/features/ar/overview.md)
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
