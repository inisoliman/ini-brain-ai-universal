# Spec: 3.4.0 Reliable ZadLoop and OpenCode Integration

Status: implementation authorized. The user delegated engineering choices and requested completion without another design gate.

## Intent

Keep the existing architecture while making shared memory, workspace selection and integration installation safe for multiple agents and desktop hosts.

## User stories and acceptance

- Shared agents save/search/compact without losing inserts or access counters. Corrupt/wrong-shape data and IO errors are surfaced, never replaced with an empty store. Only ENOENT initializes empty; legacy normalization and pinned protection remain.
- Project tools fail closed without a safe unambiguous workspace. Diagnostic status/auto_brief remain available. Explicit invalid selections do not fall back; explicit safe empty projects can initialize. A/B interleaving has no sticky selection.
- MCP roots use client capability negotiation, pending response IDs and change invalidation. Multiple projects require a per-call workspace.
- OpenCode receives native `mcp` config and validated `.opencode/skills/<name>/SKILL.md` frontmatter, documented commands and root AGENTS semantics. Existing user files/configuration survive migration and removal.
- ZadLoop is selectable and gets a verified integration or honest manual command/args export, never a guessed settings schema or skills folder.
- Installers preserve unrelated keys and own-entry env/options/permissions, back up before atomic updates, refuse malformed/wrong-shape configs unchanged, and are idempotent. Verification writes only isolated fixtures.
- Golden guidance consistently says status, auto_brief, focused context; no-roots hosts pass workspace every call. Documentation distinguishes protocol tests from real UI verification.
- Original upstream checksums/licenses remain exact with LF checkout rules; nested agent worktrees are excluded from scanning and packaging.
- Current release references and VSIX are 3.4.0; all six required acceptance commands pass and archive contents are inspected.

## Constraints and non-goals

Node stdlib, TypeScript core independent of VS Code, existing CJS smoke/PowerShell conventions. No redesign, real global configuration writes, commits/push/releases, dependency downloads, secrets, edits outside the repository or nested worktrees. Preserve preexisting dirty work. No promise that every model obeys server instructions or that a desktop client reveals a project it did not send.

## Verification

See the executable task/command matrix in `docs/superpowers/plans/2026-10-27-v3.4.0-reliable-integrations.md`. All new regressions join `smoke:all`; real UI testing is explicitly reported separately.
