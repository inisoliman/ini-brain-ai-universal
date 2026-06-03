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
