# AI Agent Operating Guide

This repository contains INI Brain AI Universal version 2.0.1.

## Required Reading

- `README.md`
- `docs/install-vscode.md`
- `docs/install-codex.md`
- `docs/install-cline.md`
- `docs/install-antigravity.md`
- `docs/install-generic-mcp.md`

## Architecture

- `src/core/` contains editor-independent project intelligence.
- `src/mcp/` exposes the local MCP server.
- `src/integrations/` describes target-specific adapters.
- `src/onboarding/` detects new, old, stale, and empty projects.
- `src/providers/` contains optional external AI provider integrations.
- `src/ui/` contains VS Code webview UI.
- `src/extension.ts` registers VS Code commands and coordinates services.

## Rules

- Do not write secrets or API keys into repository files.
- Keep the core independent from VS Code APIs.
- Keep MCP tools compact and deterministic by default.
- External AI provider features must be optional.
- New project generation must require explicit user action.
- Preserve backward compatibility where practical.

## Verification

Run these before packaging:

```powershell
npm run compile
npm run package
```

If dependencies are not installed:

```powershell
npm install
```

---

<!-- INI:BRAIN:START -->
# INI Brain AI Universal Agent Guide

Generated: 2026-06-20T13:57:43.687Z
Workspace: C:\Users\helen\Downloads\vs\exbrain.all\ini-brain-ai-universal
Indexed files: 92

## Required Reading
- `.brain/compact_context.md`
- `.brain/workflow.md`
- `.brain/skills.md`
- `.brain/quality_gates.md`
- `.brain/decisions.md`
- `.brain/tasks.md`

## Detected Skills
- General Project Maintenance: .brain/skills/general-project-maintenance.md
- Node Package Management: .brain/skills/node-package-management.md
- TypeScript Development: .brain/skills/typescript-development.md
- VS Code Extension Development: .brain/skills/vscode-extension-development.md
- VS Code Webview UI: .brain/skills/vscode-webview-ui.md
- Agent Memory and Context Engineering: .brain/skills/agent-memory-and-context.md

## Core Files
- docs/plans/PLAN-v4-FINAL-part2.md
- docs/plans/PLAN-v4-FINAL-self-contained.md
- src/extension.ts
- docs/plans/PLAN-ponytail-and-speckit-integration.md
- src/mcp/server.ts
- src/core/brainStore.ts
- src/core/agentGuide.ts
- src/graph/knowledgeGraph.ts
- src/core/types.ts
- src/savings/tokenMeter.ts
- docs/plans/PLAN-v3-master-integration.md
- src/core/memoryStore.ts
- src/core/insightBuilder.ts
- src/core/pathUtils.ts
- src/methodology/superpowers.ts
- src/updater/repoSync.ts
- src/methodology/specKit.ts
- src/adapters/registry.ts
- src/savings/ponytail.ts
- src/savings/caveman.ts
- src/core/autoBackground.ts
- src/core/projectScanner.ts
- src/mcp/workspace.ts
- src/onboarding/projectOnboarding.ts
- src/savings/claudeLean.ts

## Workflow
1. Read this file and `.brain/compact_context.md` first.
2. Select the matching skill from `.brain/skills.md`.
3. Plan the change, implement minimally, and verify.
4. Save durable decisions or discoveries into memory when tools are available.

## Hard Rules
- Do not write secrets/API keys/tokens into repository files.
- Do not modify `.git/` or `.brain/backups/`.
- Prefer small, compatible changes.
- Verify before claiming completion.
<!-- INI:BRAIN:END -->
