# Clarifications and delegated decisions

The user authorized engineering decisions and implementation to completion; no further design gate is pending.

- Audience: existing VS Code/MCP users including no-roots ZadLoop desktop and OpenCode.
- Success: six acceptance commands pass, a reviewed 3.4.0 VSIX contains no private/generated leaks, and regression evidence covers memory concurrency, workspace isolation and safe client updates.
- Memory: exclusive filesystem lock with bounded waiting, no age eviction; manual abandoned-lock recovery only after stopping all writers. Transaction includes read, transform and atomic commit.
- Workspace: per-call explicit path is authoritative; invalid/unsafe is refused, safe empty explicit project is supported. No last-workspace cache. Multiple roots require explicit per-call selection.
- OpenCode: official native layout/schema; JSONC comments must be preserved or manual merge refused unchanged.
- ZadLoop: inspect installed documentation read-only; unproven schema means manual UI command/args export and unsupported auto-install, not guessing.
- Installation: only detected/targeted clients; preserve user env/options, backup original before atomic update, malformed input remains unchanged. Tests use isolated repository fixtures.
- Compatibility claims: protocol/fixture tests are not real UI tests. No automatic project discovery claim without client data.
- Scope and constraints: no commits/publishing, global writes, outside-repository edits, nested worktree changes, unnecessary dependency installs or unrelated cleanup.
