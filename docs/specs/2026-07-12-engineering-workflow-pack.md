# Engineering Workflow Pack

## Goal

Add a compact, optional engineering workflow inspired by the useful methodology in
`garrytan/gstack` without vendoring its runtime, browser daemon, telemetry, or
Claude-specific assumptions.

## User stories

- As a user, I can enable one workflow pack and make it available to the AI agents
  already detected in my workspace.
- As an agent, I can select a focused workflow for product discovery, engineering
  planning, investigation, review, security, or release readiness.
- As a user on a limited connection, installing or activating INI Brain does not
  clone upstream repositories or install optional code-intelligence software.
- As a user evaluating token savings, I see measured estimates and limitations,
  not universal percentage claims.

## Acceptance criteria

- Enabling the pack writes six compact skills to `.brain/skills/` and mirrors them
  only to detected agent folders.
- Disabling the pack removes only files owned by the pack.
- No gstack runtime dependency is added.
- Upstream checks fetch commit metadata only; applying gstack fetches only its
  curated license/reference files.
- The all-in-one installer does not install `codebase-memory-mcp` unless explicitly
  requested.
- Token comparison reports baseline, optimized estimate, saved estimate, and
  reduction percentage derived from the supplied texts.

## Out of scope

- Browser daemon, cookie import, remote pairing, telemetry, deployment automation,
  iOS tooling, and automatic GitHub PR creation.
- Claiming a fixed token-saving percentage across models or tasks.

