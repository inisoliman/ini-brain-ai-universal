# INI Brain AI Universal v3.2 - Code Intelligence and Delegation

## Goal

Integrate the useful capabilities of `DeusData/codebase-memory-mcp` and
`amElnagdy/delegate-skills` without replacing INI Brain's local project memory,
golden prompt, agent adapters, or safe review workflow.

Both upstream projects are MIT licensed. Any reused source or substantial
derived implementation must retain attribution and the applicable MIT notice.

## Architecture Decision

INI Brain remains the single user-facing brain and MCP server.

- `.brain/` and `AGENTS.md` remain the source of truth.
- The existing TypeScript graph remains the zero-dependency fallback.
- `codebase-memory-mcp` becomes an optional local code-intelligence provider.
- Delegation is explicit and never commits, pushes, or expands scope automatically.
- Agent-specific folders remain generated compatibility mirrors.
- No external repository, binary, or network service is required for the default install.

## Why This Integration Is Useful

### From codebase-memory-mcp

- Tree-sitter indexing across a much wider language set than the current lite graph.
- Function/class/call graphs instead of import-only relationships.
- Structural, full-text, and semantic graph search with lower context-token usage.
- Call-path tracing, dead-code discovery, architecture summaries, and change impact.
- Cross-service links for HTTP, GraphQL, gRPC, events, and infrastructure files.
- Persistent local SQLite graph and optional shared compressed graph artifact.
- Fast CLI mode that INI Brain can call without exposing a second MCP server to users.

### From delegate-skills

- A repeatable brief -> dispatch -> wait -> review -> land workflow.
- Structured delegation reports and resumable runs.
- Task queues with one bounded task per delegated run.
- Reviewer ownership: delegated agents never commit.
- Explicit re-running of project quality gates instead of trusting self-reports.

## Phase 0 - Licensing, Supply Chain, and Capability Detection

- Record upstream repository URL, pinned commit, license, and integration type.
- Add a machine-readable upstream manifest under `resources/upstreams/`.
- Detect `codebase-memory-mcp`, `codex`, and `opencode` without installing them.
- Never download or execute an upstream binary silently.
- If optional installation is offered, verify release checksums/signatures and require approval.
- Keep a version-pinned source snapshot or release metadata in a separate archival process;
  do not copy the 89 MB upstream Git history into every user project or VSIX.

Verification:

- Missing optional binaries do not break scan, memory, MCP, or VS Code activation.
- Attribution and license audit passes.

## Phase 1 - Code Intelligence Provider Interface

Create a provider interface with two implementations:

1. `LiteCodeIntelligenceProvider`: wraps the existing TypeScript graph.
2. `CodebaseMemoryProvider`: calls the installed binary in CLI mode with `shell: false`.

Provider operations:

- availability and version
- index repository
- architecture summary
- structural/semantic search
- code search
- call-path trace
- changed-file impact
- graph query
- project list/status

Selection policy:

- `auto`: use codebase-memory when available, otherwise lite.
- `lite`: always use the built-in provider.
- `advanced`: require codebase-memory and return a clear installation error if unavailable.

No raw command string construction. Pass executable arguments as an array and validate all
workspace paths before process execution.

## Phase 2 - Unified MCP Tools

Expose stable INI Brain tools rather than leaking an upstream-specific API:

- `ini_brain_code_status`
- `ini_brain_code_index`
- `ini_brain_code_architecture`
- `ini_brain_code_search`
- `ini_brain_code_trace`
- `ini_brain_code_changes`
- `ini_brain_code_query`

Requirements:

- Compact output and pagination to protect token budgets.
- Read-only annotations except indexing and persisted ADR operations.
- Timeouts, cancellation, output-size limits, and actionable errors.
- Provider name/version included in every response.
- Existing graph tools remain backward compatible.

## Phase 3 - Memory and ADR Bridge

- Keep durable project decisions in INI Brain memory.
- Allow selected architecture findings to be saved through `ini_brain_save_memory`.
- Import/export ADR summaries without creating two competing sources of truth.
- Store provider state under `.brain/providers/codebase-memory.json`.
- Keep large SQLite/cache artifacts outside `.brain/` by default; store only references and hashes.

## Phase 4 - Safe Delegation Service

Implement a local TypeScript delegation service inspired by `delegate-skills`:

- Generate a self-contained brief using INI Brain context, AGENTS.md, and actual project gates.
- Support Codex CLI first, then OpenCode behind capability detection.
- Use `spawn(executable, args, { shell: false })` for Windows-safe execution.
- Store runs under `.brain/delegations/<run-id>/`:
  - `brief.md`
  - `events.jsonl`
  - `result.json`
  - `review.md`
- Support read-only and workspace-write modes.
- Support resume and sequential queues.
- Never run `git add`, `git commit`, `git push`, or destructive cleanup.
- Require an explicit user request before dispatch because delegation can consume tokens/cost.

MCP tools:

- `ini_brain_delegate_prepare`
- `ini_brain_delegate_run`
- `ini_brain_delegate_status`
- `ini_brain_delegate_review`
- `ini_brain_delegate_queue`

## Phase 5 - Skills and Agent Adapters

Generate two new skills:

- `code-intelligence-workflow`
- `safe-delegation-workflow`

Deploy through existing adapters to Codex App/CLI, Claude, Cline, Cursor, Windsurf,
Antigravity, Gemini, Copilot, OpenCode, Kimi, Kiro, and the universal fallback.

The skills describe when to use advanced graph queries, when lite search is enough, how to
write a bounded brief, and how to independently review delegated work.

## Phase 6 - VS Code Experience

Add restrained sidebar commands:

- Code Intelligence status/provider
- Index or refresh graph
- Architecture overview
- Search/trace current symbol
- Analyze working-tree changes
- Prepare delegation brief
- Review delegation result

Display optional dependency status clearly. Do not advertise unavailable advanced features as
active, and do not install binaries from a button without an approval/verification screen.

## Phase 7 - Client Support Matrix

### Direct local MCP support

- Codex Windows app and Codex CLI: shared Codex MCP configuration.
- Claude Desktop/Claude Code: MCP configuration plus generated skills.
- Cline in VS Code: Cline MCP JSON plus generated rules/skills.
- VS Code: native extension commands and the local MCP server.
- Other stdio MCP clients: generic configuration.

### ChatGPT

Plain ChatGPT cannot consume a machine-local stdio server directly. Add an optional remote MCP
transport only as a separate, opt-in deployment:

- Streamable HTTP transport.
- Authentication and per-workspace authorization.
- TLS, rate limits, audit logs, and read-only default.
- No public tunnel enabled automatically.
- Clear warning that remote access changes the local-only privacy boundary.

ChatGPT Codex/local project experiences that use the Codex MCP configuration can use the normal
local path; the general ChatGPT web product requires the remote connector path supported by that
product/account.

## Phase 8 - Upstream Resilience

- Add both projects to the upstream source registry with pinned commits.
- Archive license, manifest, selected documentation, and checksums.
- Prefer a reproducible source/build archive outside user projects.
- Do not vendor every upstream file into `.brain/` or every generated workspace.
- If an upstream disappears, retain the last approved compatible provider release and source
  metadata while respecting its MIT license.

## Phase 9 - Tests and Release Gates

- Provider contract tests using a fake executable.
- Windows path/space/Unicode tests.
- Missing binary, timeout, malformed JSON, oversized output, and cancellation tests.
- Delegation brief and result-schema tests.
- Tests proving no commit/push occurs.
- MCP annotations and dry-run tests.
- Adapter deployment tests across all supported agent formats.
- End-to-end smoke against a small fixture repository.

Release commands:

```powershell
npm.cmd run compile
npm.cmd run smoke:all
npm.cmd run audit:public
npm.cmd run package
```

## Recommended Delivery Order

1. Provider interface and read-only code-intelligence tools.
2. VS Code status/index/search experience.
3. Delegation brief generation and read-only delegation.
4. Workspace-write delegation with mandatory independent review.
5. Optional remote MCP bridge for ChatGPT after a separate security review.

This order delivers useful local improvements early while keeping the default extension small,
private, and compatible with machines that do not install either optional upstream tool.
