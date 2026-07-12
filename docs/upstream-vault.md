# Upstream Vault and Permanent Backups

INI Brain records every approved external source in one auditable vault. The vault is source-level, not client-level: a backed-up skill or workflow can be deployed through INI Brain adapters to Codex, Claude, Cline, VS Code, Cursor, Windsurf, Gemini, Copilot, OpenCode, Kiro, and other supported clients.

## What Is Stored

`resources/upstreams/manifest.json` is the source of truth. Each source records its repository, branch, last approved commit, license, purpose, snapshot policy, and archive policy.

For curated sources, selected license and reference files are committed under `resources/upstreams/<source>/` with SHA-256 checksums. These files are the safe, lightweight fallback used in this order:

1. Original upstream repository.
2. Mirror path on this repository's `main` branch.
3. Bundled snapshot in the installed extension.

Full Git history for every archive-eligible source is stored as a `.bundle` in the permanent `upstream-archives` GitHub Release. Each refresh also includes `archive-manifest.json` with the archived commit, SHA-256, and size.

## Covered Sources

| Source | Role | Snapshot | Full archive |
| --- | --- | --- | --- |
| `DietrichGebert/ponytail` | runtime skill | yes | yes |
| `JuliusBrussee/caveman` | runtime skill | yes | yes |
| `drona23/claude-token-efficient` | runtime skill | yes | yes |
| `github/spec-kit` | runtime workflow | yes | yes |
| `obra/superpowers` | runtime workflow | yes | yes |
| `safishamsi/graphify` | runtime reference | yes | yes |
| `DeusData/codebase-memory-mcp` | optional code-intelligence engine | yes | yes |
| `amElnagdy/delegate-skills` | delegation workflow | yes | yes |
| `amElnagdy/guard-skills` | quality guards | yes | yes |
| `rohitg00/agentmemory` | memory research | yes | yes |
| `pbakaus/impeccable` | frontend-review research | yes | yes |
| `alexgreensh/token-optimizer` | token-optimization reference | metadata only | no |

## Automatic Refresh

Two Actions run daily and can be started manually on `main`:

1. **Sync Upstream Vault** reads the manifest, finds the latest commit for each curated source, downloads the listed files from that exact commit, recalculates checksums, then opens or updates the `automation/sync-upstream-vault` pull request.
2. **Archive Upstreams** reads the same manifest, makes full Git bundles for every archive-eligible source, uploads a run artifact, then replaces the assets of the permanent `upstream-archives` Release.

The snapshot Action does not change the extension automatically. It creates a pull request. You review the files, licenses, commit IDs, and checksums, then merge it only when you approve. The archive Action is backup-only: it never installs, executes, or merges upstream code into INI Brain.

## License Boundary

`alexgreensh/token-optimizer` is recorded as metadata only. Its PolyForm Noncommercial license does not permit automatic public mirroring for all possible users, so no source files or Git bundle are published until compatible redistribution permission is confirmed.

## Running It Manually

1. Open the repository's **Actions** page.
2. Run **Sync Upstream Vault** on `main`, then review and merge its generated pull request if you approve the update.
3. Run **Archive Upstreams** on `main` to refresh permanent backups immediately.
4. Open **Releases**, select `upstream-archives`, and download the relevant `.bundle` and `archive-manifest.json`.

To restore an archive locally:

```powershell
git clone path\to\guard-skills.bundle guard-skills-restored
```

## Verification

```powershell
node scripts\sync-upstream-vault.cjs
node scripts\upstream-vault-smoke.cjs
node scripts\archive-upstreams.cjs
npm.cmd run smoke:workflows
```

`upstream-vault-smoke` checks every curated file checksum and ensures every runtime updater source has a matching manifest record.
