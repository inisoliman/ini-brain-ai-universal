# Changelog

## 3.4.1 — 2026-10-27

- Diagnose the real ZadLoop misconfiguration: a stale `...-3.3.0` `args` path still pointing at the old extension folder, an `INI_BRAIN_WORKSPACE` env resolving to the ZadLoop app folder, and an unsupported `startupTimeoutMs` field (dsh-mcp-client documents `toolCallTimeoutMs`, not `startupTimeoutMs`). Installing the VSIX does not update an independently configured `args` path.
- Add `scripts/doctor-zadloop.cjs` (`--server`/`--workspace`/`--expect-version`, exit codes 0/1/2/3/4/5, sanitized output, target workspace untouched) and its regression suite `scripts/doctor-zadloop-smoke.cjs`, wired as `smoke:doctor-zadloop` inside `smoke:all`.
- Document the verified manual ZadLoop/DeepSeek Harness steps (profile `cordis.patch.yml`, replace only the existing ini-brain insert, keep `dsh-system-prompt` `personaSuffix`, explicit `workspace` on every call) in `README.md`, `docs/install-zadloop.md`, and the ZadLoop integration instructions.
- The ZadLoop GUI was not reloaded, restarted, or verified automatically; the user performs the profile edit and verification command.

## 3.4.0 — 2026-10-27

- Serialize shared memory save, search counters and compaction with a bounded exclusive lock and atomic writes; refuse corrupt/wrong-shape stores and IO failures without erasing originals. No time-based live-lock eviction or destructive migration.
- Fail closed for unresolved/unsafe MCP project tools; preserve diagnostic status/brief, explicit empty project initialization and per-call A/B isolation. Correlate roots response IDs, invalidate changed roots and refuse multi-project guessing.
- Add native OpenCode skill/config layout and selectable OpenCode/ZadLoop integrations. Preserve edited generated files and legacy skill files. ZadLoop exports verified manual fields; automatic profile merge remains unsupported.
- Share validated preserving installer logic across extension and PowerShell, retain custom env/options, back up originals and update atomically. Refuse unsupported JSONC/complex TOML unchanged. Target detected clients; advanced Code Intelligence stays opt-in.
- Unify status-first guidance, explicit workspace fallback and Arabic project-switch instructions. Separate protocol fixtures from unverified real UI behavior.
- Enforce LF upstream snapshots without changing manifest hashes, exclude nested agent worktrees from scanning, and tighten VSIX exclusions.

See `docs/release-3.4.0.md` for compatibility and memory-lock recovery.
