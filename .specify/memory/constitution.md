# Project Constitution

> Governing principles for this project. All specs/plans must comply.

## Principles

1. **Quality first.** No feature ships without input validation and error handling.
2. **Minimal surface.** Prefer stdlib > platform > existing dep > new code.
3. **Reversibility.** Every change must be revertible in one commit.
4. **Documentation.** Public APIs require a one-line docstring.
5. **Testing.** Non-trivial logic ships with at least one runnable check.

## Out of Scope

- Auto-deploying to production without human approval.
- Storing secrets in repository files.
- Modifying `.git/` or `.brain/backups/`.

_Edit this file to match your project's actual standards._
