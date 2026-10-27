# INI Brain 3.4.0 reliability and integrations

## البدء السريع

1. ابنِ المشروع بـ `npm.cmd run compile` ثم `npm.cmd run package` وثبّت `ini-brain-ai-universal-3.4.0.vsix`.
2. افتح مجلد مشروعك، ثم اختر **INI Brain: Install Integrations** وحدد OpenCode أو ZadLoop أو عميلك. OpenCode له إعداد `mcp` أصلي؛ ZadLoop يقدم إعداداً يدوياً موثقاً ولا يكتب إعدادات عامة تلقائياً.
3. شغّل `ini_brain_status` أولاً وتأكد أن `workspace` هو المشروع المقصود، ثم `ini_brain_auto_brief` للمهمة، ثم `ini_brain_get_context` قبل التعديل.
4. في ZadLoop أو أي مضيف لا يرسل جذر المشروع، مرر `workspace` المطلق في **كل** استدعاء، بما فيه الذاكرة والحالة. عند الانتقال من A إلى B غيّر الوسيط وأعد فحص الحالة؛ لا يوجد اختيار سابق لاصق.

صياغة احتياطية قصيرة عند عدم احترام العميل لتعليمات MCP؛ ليست مطلوبة في كل محادثة ولا تضمن طاعة النموذج:

```text
استخدم INI Brain: افحص ini_brain_status أولاً، ثم ini_brain_auto_brief، ثم ini_brain_get_context قبل التعديل. مرر مجلد هذه المحادثة في workspace مع كل استدعاء، ولا تستخدم مجلد التطبيق أو مشروعاً آخر. احفظ القرارات المهمة في النهاية.
```

## Compatibility matrix

| Client/path | Implemented contract | Automated evidence | Real UI tested for this release |
|---|---|---|---|
| VS Code extension | Existing commands, selectable integrations, packaged core | compile, public command audit, VSIX inspection | No |
| OpenCode | Native `mcp` config, SKILL.md, commands, root AGENTS | Native output/ownership/config fixtures | No |
| ZadLoop/dsh-mcp-client | Verified manual stdio/plugin fields; no guessed automatic file merge | No-roots handshake, explicit A/B isolation | No |
| Codex | Preserving conservative TOML update; unsupported syntax refused | Installer fixtures and idempotence | No |
| Cline/Kilo/Roo/Claude/Gemini/Cursor | Existing JSON shapes; preserve own-entry options | Isolated detected-client fixtures | No |
| MCP roots | Client capability, matching response ID, changes, multi-root refusal | Protocol child-process regression | Not a UI test |

JSONC and complex TOML automatic edits are intentionally refused unchanged with manual merge instructions. No dependency install is needed for this release. Installer clients can be targeted with `-Clients opencode` or a PowerShell array; absent clients are skipped. Advanced Code Intelligence remains opt-in with `-InstallCodeIntel`. No global project workspace pin is generated.

Installer validation is conservative, not a general config repair/parser service. TOML accepts only simple scalar values and flat arrays in the supported JSON/TOML intersection, with column-zero unpadded table headers; indented/padded headers, Unicode escapes and other unsupported syntax require manual merge unchanged. JSON syntax and required object shapes are checked with `JSON.parse`; duplicate JSON object keys are not detected and follow its last-key-wins behavior. Avoid automatic installation on duplicate-key documents: merge manually after resolving duplicates.

The PowerShell smoke is Windows-only and explicitly skips on other platforms before creating fixtures; generic integration/installer fixtures still run. The skip branch has not been exercised on a real non-Windows host in this verification. MCP startup/initialize/status do not scan; resolved tool calls refresh on demand without a recurring MCP timer. Lifecycle tests await all child closes before removing their verified fixture, with bounded shutdown and visible failures.

## Memory integrity and recovery

Save, search counters and compaction share one exclusive `memories.json.lock` transaction and atomic sibling-file rename. Only missing files initialize empty; malformed/wrong-shape data and IO errors propagate. Legacy defaults and pinned behavior remain. Contention times out after approximately five seconds and never age-evicts a live lock.

If a process crashes holding a lock: stop **all** INI Brain writers for that project, inspect the lock PID and confirm no writer remains, back up the memory and lock files, then manually remove only the abandoned lock and retry. Never remove a lock merely because it is old. No destructive migration is performed. Atomic rename requires a local filesystem with exclusive-create/rename semantics; network filesystems should be independently validated.

## Release verification

Required gates: `npm.cmd run compile`, `npm.cmd run test:workspace`, `npm.cmd run test:mcp-config`, `npm.cmd run smoke:all`, `npm.cmd run audit:public`, `npm.cmd run package`. New memory/process, MCP isolation, integration preservation, PowerShell installer and scanner regressions are wired into `smoke:all`. Actual command outcomes are recorded in the implementation task ledger, not inferred from this checklist.
