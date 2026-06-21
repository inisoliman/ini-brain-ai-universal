---
name: karpathy-guidelines
description: Behavioral guidelines to reduce common LLM coding mistakes. Use when writing, reviewing, or refactoring code to avoid overcomplication, make surgical changes, surface assumptions, and define verifiable success criteria.
license: MIT
---

# karpathy-guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Bias toward caution over speed; for trivial tasks use judgment.

## 1. Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - do not pick silently.
- If a simpler approach exists, say so. If something is unclear, stop and name it.

## 2. Simplicity First
- Minimum code that solves the problem. No features beyond what was asked.
- No abstractions for single-use code. No flexibility/configurability that was not requested.
- If you wrote 200 lines and it could be 50, rewrite it.

## 3. Surgical Changes
- Touch only what you must. Do not "improve" adjacent code, comments, or formatting.
- Match existing style. Remove only orphans YOUR change created; leave pre-existing dead code (mention it).
- Every changed line should trace directly to the request.

## 4. Goal-Driven Execution
- Turn tasks into verifiable goals ("add validation" -> "write tests for invalid inputs, then make them pass").
- For multi-step tasks, state a brief plan with a verify-check per step.
