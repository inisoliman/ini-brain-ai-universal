# 📚 Plans Directory — Reading Order

This directory contains the implementation plans for INI Brain AI Universal v3.0.0.

## ⭐ For the Implementation Agent — Read in This Order

### 1. **`PLAN-v4-FINAL-self-contained.md`** (Part 1)
- Phases 0 to 2 (Preparation, package.json, Savings Layer).
- Contains complete code for Ponytail, Caveman, Claude-Lean, Token-Meter.
- **Start here.**

### 2. **`PLAN-v4-FINAL-part2.md`** (Part 2)
- Phases 3 to 11 (Methodology, Adapters, Graph, Updater, MCP, Extension, UI, Docs, Packaging).
- Contains complete code for all 12 adapters and remaining features.
- **Read after finishing Part 1.**

---

## 📜 Historical Plans (Archive — Do NOT Implement These)

These are earlier iterations kept for reference only. **v4 supersedes them entirely.**

- `PLAN-ponytail-and-speckit-integration.md` (v2 — Ponytail + Spec-Kit only)
- `PLAN-v3-master-integration.md` (v3 — added Caveman, Superpowers, Graphify, Auto-Update)

> Do not mix instructions from v2/v3 with v4. v4 is self-contained and final.

---

## 🎯 Quick Status

- **Target version:** `ini-brain-ai-universal@3.0.0`
- **Total plan size:** ~5000 lines / ~120K tokens
- **Implementation time:** 12–16 hours
- **Cost on Haiku 4.5:** ~$10–15
- **Phases:** 12 (0 through 11)
- **New files created:** ~40 TypeScript + ~20 docs + 3 smoke tests
- **Files modified:** `extension.ts`, `mcp/server.ts`, `ui/sidebarProvider.ts`, `package.json`, `README.md`
- **Zero new npm dependencies.**

## 🚀 Quick Start for the Cheap Agent

```
1. Read `PLAN-v4-FINAL-self-contained.md` completely.
2. Read `PLAN-v4-FINAL-part2.md` completely.
3. Execute phases in order: 0 → 1 → 2 → ... → 11.
4. After each phase: `npm run compile` to verify.
5. After each phase: save progress via `ini_brain_save_memory`.
6. If stuck: search memory for "v4 progress" to find last position.
7. Final step: run `npm run package` to produce `.vsix`.
```

## ✅ Success Criteria

- `npm run compile` succeeds with zero errors/warnings.
- `npm run smoke:all` passes.
- `ini-brain-ai-universal-3.0.0.vsix` is generated.
- Extension loads in VS Code and shows 35+ INI Brain commands.
- `INI Brain: Enable All Savings` deploys skills to all detected agents.
