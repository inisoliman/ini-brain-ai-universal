# Frontend Design Guard

`frontend-design-guard` is a generated quality guard for frontend UI, VS Code webviews, dashboards, and app screens. It is inspired by Impeccable-style UI review workflows, but it is implemented as a local INI Brain skill and does not require Impeccable at runtime.

## What It Checks

- Layout overflow, clipping, unstable hover resizing, and accidental overlap.
- Accessibility names, focus states, keyboard paths, roles, and disabled/loading affordances.
- Contrast for text, icons, focus rings, and important states.
- Responsive behavior across narrow and desktop widths.
- Visual hierarchy, scannability, and appropriate heading scale.
- Loading, empty, error, disabled, success, and long-content states.
- Screenshot or browser verification before calling UI work complete.

## Where It Is Generated

During agent guide generation, INI Brain writes the guard to:

- `.brain/skills/frontend-design-guard.md`
- `.codex/skills/frontend-design-guard/SKILL.md`
- `.cline/skills/frontend-design-guard.md`
- `.clinerules/skills/frontend-design-guard.md`

Use it alongside `clean-code-guard` and `test-guard` whenever UI behavior changes.
