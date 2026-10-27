# Project Workflow

## 1. Intake
- If MCP is available, call `ini_brain_status` and verify the workspace first.
- Call `ini_brain_auto_brief` once for the task, then `ini_brain_get_context` before editing.
- If setup guidance is useful, show `ini_brain_smart_setup_plan`; never apply it without explicit user approval.
- Read the request and current project context.
- Read AGENTS.md and `.brain/compact_context.md`.
- Check `.brain/tasks.md` and `.brain/decisions.md` when relevant.

## 2. Skill Selection
- Open `.brain/skills.md`.
- Available skills: General Project Maintenance, Node Package Management, TypeScript Development, VS Code Extension Development, VS Code Webview UI, Agent Memory and Context Engineering.

## 3. Spec-Kit Slash Flow For New Work
- Use `/constitution -> /specify -> /clarify -> /plan -> /tasks -> /implement` for new projects, major features, or ambiguous requests.
- `/constitution`: ensure `.specify/memory/constitution.md` exists and reflects project principles.
- `/specify`: create a spec that states what to build, why, user stories, acceptance criteria, non-functional needs, and out-of-scope items.
- `/clarify`: ask or record the missing decisions before designing.
- `/plan`: define architecture, boundaries, data model, risks, and verification strategy.
- `/tasks`: split the plan into small tasks that can be implemented and verified independently.
- `/implement`: take the next unchecked task, make the smallest compatible change, run checks, and update memory.
- Skip the full flow for small fixes where context + impact + verification is enough.

## 4. Execution
- Keep changes small and compatible.
- Do not write secrets.
- Preserve generated markers and user-authored content.

## 5. Verification
- Run the relevant checks from `.brain/quality_gates.md`.
- Report any checks that could not run.

## 6. Memory
- Update `.brain/tasks.md` for notable pending work.
- Update `.brain/decisions.md` for durable decisions.