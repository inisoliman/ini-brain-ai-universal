# Engineering Workflow Pack Implementation Plan

1. Add a focused TypeScript module that renders, installs, and removes six skills.
2. Register VS Code commands and sidebar actions for enabling/disabling the pack.
3. Add a curated gstack upstream entry and third-party attribution.
4. Make advanced code intelligence an explicit installer option.
5. Add measured token comparison and remove unverified UI percentage claims.
6. Add smoke tests, compile, and run the full local verification suite.

## Design boundaries

- `.brain/skills/` remains the source of truth.
- Existing adapters perform agent-specific mirroring.
- Skill bodies stay compact and do not inject all workflows into every prompt.
- All network and optional dependency operations require an explicit user action.

