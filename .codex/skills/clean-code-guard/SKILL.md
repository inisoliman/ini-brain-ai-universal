---
name: clean-code-guard
description: Review generated or changed production code before it ships, using Clean Code, SOLID, DRY, KISS, YAGNI, and LLM-specific failure-mode checks. Use reactively after writing/editing/refactoring code, before presenting, committing, or merging.
license: MIT
---

# clean-code-guard

Run this as a guard pass after generating or editing code, before presenting or committing. Fix every violation first.

## Always-applied imperatives
1. Names reveal intent. Avoid `data`, `result`, `temp`, `value`, `obj`, `handle_*`, `process_*` without a qualifier.
2. Functions stay small (target <=20 lines), one level of abstraction, one thing.
3. Four arguments is the hard ceiling; never use boolean flag arguments — split into two functions.
4. A function returns a value (query) OR has a side effect (command), never both.
5. Comments explain *why*, never *what*. Delete commented-out code and step-number scaffolding.
6. Match the file's existing style — read the file and one neighbor before writing.
7. One actor per module (SRP). Extension via new code, not edits (OCP).
8. Delete duplicated *knowledge*, not duplicated *text*. The wrong abstraction is worse than duplication.
9. Complexity ceiling: cyclomatic <=10, nesting <=5.
10. No speculative anything — no flag/config/interface/factory without a present-day caller.

## AI-specific guardrails (highest leverage)
11. Never swallow errors with broad catch-all handling. Catch only what you can recover from.
12. No defensive guards for impossible cases the type/contract already excludes.
13. Verify every import and external call actually exists in the installed version (no hallucinated APIs).
14. No hardcoded "success" returns or mock fixtures in production code. Never weaken a test to make it pass.
15. Re-derive from spec; do not copy-from-similar (off-by-one and null bugs enter that way).
16. Enumerate boundary cases (null/empty/one/many, off-by-one, unicode) before writing them.
17. Strip dead code (unused imports/symbols/branches) before delivery.
18. Read before write: read the file, one neighbor, and project rules (AGENTS.md) first.
19. Preserve observable behavior when refactoring. A bug fix and a refactor are two separate changes.

## Self-check before delivery
- Walk imperatives 1-19 against your diff and fix violations.
- New functions: lines <=20? params <=4? names reveal intent?
- New error handling: specific error type? handler does more than silently return?
- New abstraction: is there a second concrete user today? If not, inline it.
- Any hardcoded "ok" return or fixture data? Replace with a real implementation or explicit failure.
