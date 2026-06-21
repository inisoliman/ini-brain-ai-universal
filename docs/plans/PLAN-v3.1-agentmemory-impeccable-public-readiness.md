# v3.1 AgentMemory + Impeccable Public Readiness Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the useful parts of AgentMemory and Impeccable without replacing INI Brain's local-first project brain, MCP protocol, or VS Code workflow.

**Architecture:** Keep INI Brain as the owner of project context, memory, skills, and quality gates. Add optional modules behind explicit commands and MCP tools: a stronger memory lifecycle inspired by AgentMemory, and frontend/design review skills inspired by Impeccable. No network service, database, or global state should be required for the default install.

**Tech Stack:** TypeScript, VS Code Extension API, local JSON/Markdown files, stdio MCP, existing `.brain/` storage.

---

## Position

AgentMemory is useful for memory lifecycle ideas: better memory types, compaction, retention, search, and hooks. INI Brain already has local memory, auto brief, and MCP tools, so the right move is to extend INI Brain's memory model rather than embed another memory server.

Impeccable is useful as a frontend/design-quality workflow. INI Brain already has generic clean-code and test guards; the right move is to add optional design/release guards for UI work rather than make Impeccable a hard dependency.

## Files

- Modify: `src/core/types.ts` for memory metadata fields.
- Modify: `src/core/memoryStore.ts` for retention, dedupe, and scored retrieval.
- Create: `src/core/memoryCompactor.ts` for safe local memory compaction.
- Modify: `src/mcp/server.ts` to expose memory maintenance tools.
- Modify: `src/core/guardSkills.ts` to add optional frontend/design guard.
- Modify: `src/core/agentGuide.ts` to generate the new guard.
- Create: `scripts/memory-smoke.cjs` for local smoke checks.
- Modify: `package.json` to add `smoke:memory`.
- Modify: `README.md` and `docs/features/*` to document the additions.

## Task 1: Memory Metadata Foundation

**Files:**
- Modify: `src/core/types.ts`
- Modify: `src/core/memoryStore.ts`
- Test: `scripts/memory-smoke.cjs`

- [ ] Add optional metadata to `MemoryEntry`: `confidence`, `expiresAt`, `pinned`, and `origin`.
- [ ] Keep old memories readable by defaulting missing fields.
- [ ] Add a smoke test that writes an old-shape memory and verifies it still reads.
- [ ] Run `npm.cmd run compile`.
- [ ] Run `node scripts/memory-smoke.cjs`.

## Task 2: Memory Dedupe And Retention

**Files:**
- Create: `src/core/memoryCompactor.ts`
- Modify: `src/core/memoryStore.ts`
- Test: `scripts/memory-smoke.cjs`

- [ ] Add deterministic text normalization for memory similarity.
- [ ] Merge near-duplicate memories only when the newer entry has the same kind and overlapping concepts.
- [ ] Never delete pinned memories.
- [ ] Expire memories only when `expiresAt` is in the past.
- [ ] Run `npm.cmd run compile`.
- [ ] Run `node scripts/memory-smoke.cjs`.

## Task 3: MCP Memory Maintenance Tools

**Files:**
- Modify: `src/mcp/server.ts`
- Test: `scripts/mcp-smoke.cjs`

- [ ] Add `ini_brain_memory_compact` as a local-write MCP tool.
- [ ] Add `ini_brain_memory_stats` as a read-only MCP tool.
- [ ] Include dry-run output before destructive compaction.
- [ ] Run `npm.cmd run smoke:mcp`.

## Task 4: Impeccable-Inspired Frontend Guard

**Files:**
- Modify: `src/core/guardSkills.ts`
- Modify: `src/core/agentGuide.ts`

- [ ] Add `frontend-design-guard` as an optional generated guard.
- [ ] Cover layout overflow, accessibility, contrast, responsive behavior, visual hierarchy, loading/empty/error states, and screenshot verification.
- [ ] Keep it framework-agnostic.
- [ ] Run `npm.cmd run compile`.
- [ ] Generate an agent guide in a temp project and verify the guard appears under `.brain/skills/`, `.codex/skills/`, `.cline/skills/`, and `.clinerules/skills/`.

## Task 5: Public Documentation

**Files:**
- Modify: `README.md`
- Create or modify: `docs/features/en/memory-lifecycle.md`
- Create or modify: `docs/features/en/frontend-design-guard.md`
- Create or modify: `docs/features/ar/memory-lifecycle.md`
- Create or modify: `docs/features/ar/frontend-design-guard.md`

- [ ] Document what was borrowed conceptually from AgentMemory and Impeccable.
- [ ] Document that neither project is bundled as a runtime dependency.
- [ ] Document local-first behavior and privacy boundaries.
- [ ] Run `npm.cmd run audit:public`.

## Task 6: Release Verification

**Files:**
- Modify: `package.json`

- [ ] Add `smoke:memory` to `smoke:all`.
- [ ] Run `npm.cmd run compile`.
- [ ] Run `npm.cmd run smoke:all`.
- [ ] Run `npm.cmd run audit:public`.
- [ ] Run `npm.cmd run package`.
- [ ] Inspect VSIX contents and verify it excludes `src/**`, `.brain/**`, `.codex/**`, `docs/plans/**`, `scripts/**`, old VSIX archives, and machine-local files.
