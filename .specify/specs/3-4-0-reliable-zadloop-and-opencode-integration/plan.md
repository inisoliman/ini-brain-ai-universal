# Architecture: reliable integrations 3.4.0

Detailed implementation plan: `docs/superpowers/plans/2026-10-27-v3.4.0-reliable-integrations.md`.

## Boundaries and interfaces

- `MemoryStore.transaction<T>(update)` serializes mutation across processes using exclusive sibling lock creation. Callback receives normalized entries and returns `{entries?, result}`. A unique sibling temporary file is synced and renamed atomically. Save, search counters, replaceAll and compaction use the same transaction. Read errors other than ENOENT propagate. No destructive migration or timed lock eviction.
- `resolveWorkspace` retains explicit subdirectory semantics and rejects invalid explicit paths. Server performs a safe project dispatch guard. Roots negotiation is client-capability driven, responses correlate pending IDs and roots changes invalidate previous selection. Per-call workspace never changes default/shared state.
- Integration registry exposes OpenCode native config and ZadLoop manual export if schema is unproven. OpenCode adapter validates names/frontmatter and preserves user-owned files. Installer validates config shapes, merges only managed command fields, retains env/options/permissions, backs up originals and atomically updates. JSONC refuses unchanged if no safe comment-preserving editor exists.
- Scanner excludes nested agent worktrees narrowly. Snapshot checkout enforces LF without changing upstream manifests. Package excludes local/generated artifacts while retaining installation guides.

## Risks and recovery

Abandoned memory locks fail safely; stop writers and verify ownership before manual removal. Malformed/unsupported client config is never repaired destructively; provide manual merge instructions. No-roots desktop hosts require explicit workspace every call. Real UI behavior remains unverified unless separately exercised.

## Verification

CJS regressions run RED before code and GREEN after. Isolated fixtures exercise concurrent child processes and installation. Final gates: compile, test:workspace, test:mcp-config, smoke:all, audit:public, package. Inspect VSIX ZIP metadata/entries for version, docs, exclusions. User authorized all design choices; no design gate pending.
