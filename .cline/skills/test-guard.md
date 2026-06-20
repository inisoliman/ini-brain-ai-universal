---
name: test-guard
description: Review or write tests so they actually verify behavior. Use after generating tests, before relying on them, or when asked to add/fix tests.
license: MIT
---

# test-guard

Run this when writing or reviewing tests. Tests must fail for the right reason and verify real behavior.

## Imperatives
1. A test must be able to fail. If it cannot fail, it tests nothing.
2. Test behavior and contracts, not implementation details.
3. No hardcoded fixture values masquerading as assertions on real output.
4. Never disable, skip, or weaken a test to make a suite pass — fix the code or the test honestly.
5. Cover boundaries: null/empty/one/many, error paths, and the documented edge cases.
6. One logical assertion focus per test; name the test after the behavior it pins down.
7. Tests must be deterministic — no reliance on time, ordering, network, or randomness without control.
8. For bug fixes: write a test that reproduces the bug first, then make it pass.

## Self-check
- Did I run the tests and watch them pass for the right reason?
- Would these tests catch a regression if the implementation broke?
- Are there any always-true assertions or `expect(true).toBe(true)` placeholders? Remove them.
