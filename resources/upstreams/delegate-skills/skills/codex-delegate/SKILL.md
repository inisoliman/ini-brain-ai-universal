---
name: codex-delegate
description: Delegate a bounded coding task to a separate Codex CLI implementer, then review the diff and gates yourself before landing.
license: MIT
source: amElnagdy/delegate-skills
snapshot: curated-reference
---

# Codex Delegate Reference

This snapshot preserves the key delegation contract used by INI Brain. It is a reference, not a runtime dependency.

Use delegation only when the human explicitly asks for it and the task is large enough to justify a separate implementer run.

## Loop

1. Write a self-contained brief with the task, constraints, real gate commands, action-safety limits, and structured output contract.
2. Dispatch to the implementer CLI in a workspace-write sandbox.
3. Wait for a structured result.
4. Review the working-tree diff yourself.
5. Re-run the real gates yourself.
6. Commit only after human-approved review policy and passing gates. The implementer must never commit.

## Brief Shape

```xml
<task>
Concrete goal, current state, exact files or areas, and what must stay untouched.
</task>

<verification_loop>
Run the real project commands before finishing and fix failures.
</verification_loop>

<action_safety>
Keep changes scoped. Do not run git add or git commit. Leave work uncommitted for review.
</action_safety>

<structured_output_contract>
Report what changed, files touched, gate outcomes, and anything left open.
</structured_output_contract>
```

## Review Rules

- Treat the implementer report as a claim, not proof.
- Review test changes before trusting green tests.
- Re-run compile, tests, lint, or project-specific gates locally.
- Check for scope creep, missing edge cases, broad catch handlers, hardcoded success, unused code, and speculative abstractions.
- Use a delta brief for rework instead of absorbing hidden scope changes silently.
