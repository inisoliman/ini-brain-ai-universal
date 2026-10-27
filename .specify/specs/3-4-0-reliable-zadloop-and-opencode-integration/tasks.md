# Tasks: reliable integrations 3.4.0

- [x] Read existing guidance, preserve dirty baseline and write concrete backbone plan/spec/decisions.
- [x] T010 Add memory corruption/concurrency/lock regressions, capture RED, implement transactions and atomic writes, verify GREEN.
- [x] T020 Add workspace/protocol isolation regressions, capture RED, implement guard/roots ID correlation, verify GREEN.
- [x] T030 Verify OpenCode documentation and ZadLoop available local schemas; implement native selectable integrations and safe installation with RED/GREEN evidence.
- [x] T040 Preserve upstream hashes with LF, exclude nested worktrees with regression, unify compact startup guidance.
- [x] T050 Update 3.4.0 public references, Arabic quick start and compatibility matrix; package exclusions.
- [x] T100 Review changed files and impact; run all six acceptance commands and inspect VSIX contents.
- [x] T200 Record actual results, durable decisions, limitations and artifact path without publishing.

## Evidence ledger

Observed evidence, October 27, 2026:

- RED `node scripts/memory-reliability-smoke.cjs`: corrupt-store rejection missing; RED concurrency-only: 1 retained versus 24 expected. GREEN after transaction: existing memory smoke and reliability smoke; three repeated Windows multi-process runs passed. A full gate exposed Windows delete-pending EPERM; bounded sharing-contention retries fixed it without lock eviction.
- RED `node scripts/mcp-isolation-smoke.cjs`: server advertised client-only roots capability. GREEN after guard/ID correlation. Review added packaged-host package.json fixture: RED trusted=true; GREEN after requiring VCS marker for app-tree exception.
- RED `node scripts/integration-reliability-smoke.cjs`: missing native SKILL.md layout. GREEN native schema/ownership/config preservation/JSONC refusal. Review added first-time Codex case: RED missing config refused; GREEN original-state fix plus TOML env/options/idempotence/malformed cases.
- RED actual Windows PowerShell fixture installer: malformed JSON returned success and overwrote. GREEN shared helper preserves original and reports failure; valid repeated install/backups pass. Initial test runner needed installed Windows PowerShell rather than unavailable pwsh executable.
- RED scanner nested Kilo checkout indexed; GREEN narrow exclusion retains normal guidance. RED vault exact hashes for three files; GREEN LF-only normalization, manifest unchanged.
- Full six-command acceptance chain passed once: compile=0, test:workspace=0, test:mcp-config=0, smoke:all=0, audit:public=0, package=0. Subsequent reviewed fixes require final rerun and rebuilt package.
- Fresh reader review attempt failed before returning findings; author performs explicit source review and lead independently reviews afterward. No independent review claim.
- Root package-lock.json was absent; generated offline via `npm.cmd install --package-lock-only --offline --ignore-scripts --no-audit --no-fund` (exit 0), without dependency installation/download. Both root versions 3.4.0.

Ruling: JSONC and complex TOML automatic merges refuse unchanged rather than shipping an unpackaged development parser or lossy parser. ZadLoop verified plugin fields are exported manually; stable automatic profile merge target remains unproven. Cost: manual setup for these cases.
Ruling: status is diagnostic-only and does not trigger indexing; existing MCP smoke now requests guide generation explicitly. Cost: callers requiring a fresh index must request generation or use enabled project refresh.
Ruling: real projects under application trees need .git, not package.json alone; installed applications ship package manifests. Cost: non-VCS projects inside app-data trees must move to a safe project directory.


Final observed acceptance after review fixes: `npm.cmd run compile`=0; `npm.cmd run test:workspace`=0; `npm.cmd run test:mcp-config`=0; `npm.cmd run smoke:all`=0; `npm.cmd run audit:public`=0; `npm.cmd run package`=0 (job pwsh-168). `git diff --check`=0. Indented TOML regression reproduced duplicate keys (2 vs 1), fixed horizontal whitespace matching and precommit output validation; full suite green.

Final VSIX `ini-brain-ai-universal-3.4.0.vsix`: version 3.4.0, 166 entries, 377766 bytes, zero excluded/private generated entries, zero missing new install/release/changelog docs. SHA256 `3CA82B60A6F8EE5CEDA2042D3ACCD7E50AAF72D459CB8EA633A22745ED8382A8`. Package/lock/server/AGENTS current versions align. Snapshot checksum gate passes unchanged manifest. No real UI tested, no global client configuration writes, no commits/push/releases. Author source review performed; independent reader failed to return findings and lead review remains separate.

Ruling: work in the current root without commits or separate worktree, as explicitly requested. Preserve all existing dirty work and out-pack. Task 1 transaction interface is consumed directly by compaction; no other replaceAll callers were found.
