---
name: frontend-design-guard
description: Review frontend, webview, dashboard, and app UI changes for layout, accessibility, responsive behavior, visual hierarchy, state coverage, and screenshot-verified quality before shipping.
license: MIT
---

# frontend-design-guard

Run this after creating or changing frontend UI, webviews, dashboards, app screens, or visual components. It is framework-agnostic and complements clean-code-guard and test-guard.

## Required Checks
1. Layout: no overlapping text, clipped controls, horizontal page overflow, unstable hover resizing, or nested cards used as page structure.
2. Accessibility: interactive controls have names, focus states, keyboard paths, semantic roles, and visible disabled/loading affordances.
3. Contrast: text, icons, focus rings, and important state colors remain readable in light/dark or configured themes.
4. Responsive behavior: verify mobile, tablet, and desktop widths; controls wrap cleanly and long labels do not escape their containers.
5. Visual hierarchy: headings match their container scale, primary actions are obvious, dense tools stay scannable, and decorative treatment does not compete with work content.
6. State coverage: loading, empty, error, disabled, success, and long-content states are represented or deliberately out of scope.
7. Screenshot verification: inspect real rendered screenshots or browser captures before calling the UI done.

## Browser Verification
- Start the app or extension view in the smallest realistic local environment.
- Capture at least one desktop and one narrow viewport screenshot when the surface is responsive.
- Check the console for runtime errors and accessibility warnings that are visible in the chosen toolchain.
- Exercise the main interaction path, including one failure or empty state when available.

## Self-check
- Would a first-time user know the primary action without explanatory helper copy?
- Can all visible text fit when translated or when data is longer than the happy path?
- Did verification use the real UI instead of only reading code?
