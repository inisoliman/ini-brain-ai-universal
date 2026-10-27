# Desktop Hosts And Workspace Resolution

Version: 3.4.0

Release 3.4.0: project-dependent calls fail closed for unsafe or unresolved roots; multiple advertised projects require per-call `workspace`. Only the matching pending `roots/list` response is accepted, and roots changes invalidate the old selection immediately. Explicit nonexistent paths never fall back. Explicit safe empty project directories may initialize; home/application directories may not. Status is diagnostic and does not create an index. The prior known-project registry is read-only compatibility data, never automatic project selection or automatic global writes.

This document explains how INI Brain AI Universal decides which project a session
belongs to, why a desktop host can break that decision, and what the host must
provide for per-project memory to work automatically.

It is written for two readers: an integrator wiring INI Brain into a desktop host,
and a host maintainer who wants each conversation to keep its own `.brain/`.

## The Contract In One Sentence

The MCP server must learn the conversation's project folder **at connect time or
per call**; a stdio server cannot infer it if the host launches one process for
the whole application and reports no project.

## How Resolution Works Today

Resolution order lives in `src/mcp/workspace.ts`:

1. `explicitWorkspace` — the `workspace` tool argument. Authoritative; used
   verbatim.
2. `INI_BRAIN_WORKSPACE` — deliberate dedicated configuration pin. A nonexistent pin errors instead of falling back; avoid setting it globally for shared multi-project clients.
3. `clientWorkspace` — the single unambiguous folder reported through MCP `roots`. Pending/ambiguous roots block implicit project operations, even when cwd has markers.
4. `CODEX_WORKSPACE`, `CODEX_CWD`, `WORKSPACE`, `INIT_CWD`, `PWD`, then process cwd.

Explicit tool paths and the dedicated environment pin are used as selected; fallback candidates climb to their nearest project marker. Safety checks still reject home/application paths. Startup and initialization perform no scans. Status is diagnostic-only; refresh is scoped to a resolved project tool call, with no recurring MCP timer bound to a previous root.

Two folders are refused as workspaces and are never trusted:

- **The user home directory** (`USERPROFILE`, `HOME`, `HOMEDIRVE`+`HOMEPATH`,
  `os.homedir()`). A `.brain` or `AGENTS.md` living there does not make home a
  project.
- **Application install directories** — a path under `AppData\Local\Programs`,
  `%APPDATA%`, `Program Files`, `/Applications`, `Library/Application Support`,
  or a path crossing an actual `app.asar` / `app.asar.unpacked` packaging segment. An ordinary project `resources/` folder is not an application marker. Under application-location trees, a real project or subdirectory remains usable when `.git` exists at that project or an ancestor below the application-location root. `package.json` alone is not VCS proof: installed hosts ship package manifests. Actual asar paths remain blocked.

An untrusted workspace never triggers a background scan, so `.brain/` is never
created there.

## The Failure This Prevents

A desktop host that starts one MCP process for the entire application leaves
`process.cwd()` pointing at the install folder. If that folder ships its own
`AGENTS.md` — some hosts do — the server would treat the installed program as the
project and write project memory inside the application directory: a `.brain/`
with `memories.json`, `project_map.json`, and skill files created inside an
installed program.

INI Brain now refuses that directory structurally, so the failure mode is closed
even when the host reports nothing useful.

## What A Host Should Provide

### Preferred — MCP `roots`

Declare the capability and answer `roots/list` with the conversation's folder:

```js
new Client({ ..., capabilities: { roots: { listChanged: true } } })
```

```json
{ "roots": [{ "uri": "file:///C:/work/my-project", "name": "my-project" }] }
```

On Windows the URI must be `file:///C:/...`. INI Brain accepts `file:///`, strips
a `localhost` authority, and rejects relative paths and non-`file://` schemes.

Send `notifications/roots/list_changed` when the user switches project in an
open conversation, so the server re-resolves. INI Brain requests `roots/list`
after `notifications/initialized` and also honours roots supplied on
`initialize`; it waits up to 1500 ms for the answer before the first tool call.

### Strongest — a per-conversation `cwd`

Set the child process working directory to the conversation's folder. INI Brain
resolves `process.cwd()` at step 4, so a correct `cwd` fixes **every** MCP server
that follows the common convention, not only this one. Where a host already
stores a per-conversation path, this is the highest-leverage fix.

### Acceptable — the `workspace` tool argument

Every INI Brain tool accepts an optional `workspace` string. A host that injects
a system-prompt rule telling the agent to pass its own project folder on every
call works today, but it is the weakest option: it depends on the model obeying
for every call. An omission on an unresolved host now fails closed; it never remembers the last explicit workspace.

### Also supported — `INI_BRAIN_WORKSPACE`

Useful when a host can set environment variables per server entry and the value
is genuinely project-scoped. A single global value pins every conversation to one
project; that is usually not what the user wants.

## What The Host Must Never Do

- Never pass the application install folder or the user home directory as a
  workspace, by environment variable, `cwd`, `roots`, or tool argument.
- If the project cannot be determined, report nothing rather than guessing the
  process working directory.

## Behaviour When No Project Is Resolved

Instead of failing silently, the server:

- marks `workspaceTrusted: false` in `ini_brain_status`, with the reason, and
  appends `knownProjects` — the recently used real project folders, newest
  first — when any are recorded;
- prefixes `ini_brain_auto_brief` with an explicit warning naming the wrong path,
  listing `knownProjects`, and instructing the agent to re-call with the correct
  `workspace` before relying on any context;
- refuses to scan, so no `.brain/` is created in the wrong place.

The known-project list is stored at `~/.ini-brain/projects.json` and contains
only folders that passed the trust check. It is a recovery aid for hosts without
`roots`, not a substitute for reporting the project.

## Verifying A Host Integration

From the host's own launch directory:

```powershell
node dist/mcp/server.js
```

then send `initialize` followed by a `tools/call` for `ini_brain_status`. Confirm:

- `workspace` equals the conversation's project folder, not the install folder;
- `workspaceTrusted` is `true`;
- status alone creates no project files; then explicitly call `ini_brain_generate_agent_guide` (or scoped `ini_brain_auto_brief` with refresh enabled) and verify `.brain/metadata.json` appears only in the selected project, never the startup/install folder.

The repository ships `scripts/workspace-detection-smoke.cjs` and
`scripts/mcp-smoke.cjs`, which cover the home refusal, the application refusal,
the client-root path, and project creation inside the reported folder:

```powershell
npm.cmd run test:workspace
npm.cmd run smoke:mcp
```

## Known Limitation

A host that provides neither `roots` nor a per-conversation `cwd` cannot have
automatic per-project memory, because one process cannot serve several projects
with one working directory. Such a host should add `cwd` support or answer
`roots/list`; the fallbacks above keep the failure safe but not automatic.

## Arabic Summary

لكل محادثة مجلد مشروعها، ولا بد أن يعرف خادم INI Brain ذلك. إن كان مضيف سطح
المكتب يشغّل عملية واحدة لكل التطبيق ولا يعلن مجلد المحادثة، فلن يتعرف الخادم
على المشروع. الحل الأقوى من جهة المضيف: تمرير `cwd` لكل محادثة، أو دعم MCP
`roots`. والخادم يرفض مجلد المنزل ومجلد تثبيت البرامج، فلا يُنشأ `.brain/`
في المكان الخطأ أبداً.
