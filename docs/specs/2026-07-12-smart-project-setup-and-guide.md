# Smart Project Setup And Visual Guide

## Goal

Make INI Brain easy for a first-time user and useful automatically: inspect the
current workspace, recommend the smallest helpful feature packs, require approval,
then materialize only curated files from the bundled Upstream Vault.

## User stories

- As a beginner, I can open one Arabic guide and understand every VS Code button.
- As a Codex Windows user, I can connect MCP and verify it with a copyable prompt.
- As a Cline or Claude user, I can follow a short client-specific setup path.
- As a new-project builder, I can preview a smart setup plan before files are written.
- As a user on a limited connection, smart setup does not clone repositories or
  silently install binaries.

## Acceptance criteria

- Smart setup detects project size, languages, frontend signals, and installed agents.
- A deterministic plan recommends focused packs with plain-language reasons.
- Applying requires explicit package IDs and writes only INI Brain/agent guidance,
  curated `.brain/upstream/` snapshots, and optional local graph artifacts.
- VS Code exposes preview/apply commands; MCP exposes equivalent plan/apply tools.
- An Arabic multi-page HTML guide explains installation, every sidebar control,
  Codex Windows, Cline, Claude, other agents, smart setup, token savings, and fixes.
- Pages are keyboard accessible, responsive, and visually verified at desktop and
  narrow widths.

## Out of scope

- Cloning full upstream repositories during project setup.
- Installing global programs or optional binaries without a separate explicit action.
- Editing application source files as part of smart setup.

