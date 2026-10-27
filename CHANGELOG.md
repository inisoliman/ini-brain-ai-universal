# Changelog

## 3.4.0 — 2026-10-27

- Serialize shared memory save, search counters and compaction with a bounded exclusive lock and atomic writes; refuse corrupt/wrong-shape stores and IO failures without erasing originals. No time-based live-lock eviction or destructive migration.
- Fail closed for unresolved/unsafe MCP project tools; preserve diagnostic status/brief, explicit empty project initialization and per-call A/B isolation. Correlate roots response IDs, invalidate changed roots and refuse multi-project guessing.
- Add native OpenCode skill/config layout and selectable OpenCode/ZadLoop integrations. Preserve edited generated files and legacy skill files. ZadLoop exports verified manual fields; automatic profile merge remains unsupported.
- Share validated preserving installer logic across extension and PowerShell, retain custom env/options, back up originals and update atomically. Refuse unsupported JSONC/complex TOML unchanged. Target detected clients; advanced Code Intelligence stays opt-in.
- Unify status-first guidance, explicit workspace fallback and Arabic project-switch instructions. Separate protocol fixtures from unverified real UI behavior.
- Enforce LF upstream snapshots without changing manifest hashes, exclude nested agent worktrees from scanning, and tighten VSIX exclusions.

See `docs/release-3.4.0.md` for compatibility and memory-lock recovery.
