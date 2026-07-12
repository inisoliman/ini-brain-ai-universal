# Caveman - AI Response Compressor

## Benefit
Designed to reduce output verbosity. Actual token reduction varies by model, task, and prompt; measure it in your client.

## Enable
`INI Brain: Enable Caveman Mode` or set `iniBrain.caveman.enabled = true`.

## Modes
- `lite`: remove filler.
- `full` (default): telegraphic style.
- `ultra`: maximum compression.
- `wenyan`: classical-density style.

## Chat Commands
- `/caveman [lite|full|ultra|wenyan]`
- `/caveman-commit`
- `/caveman-pr`
- `/caveman-doc`

## Never Compressed
Code, URLs, paths, error messages, math, and the user's language.

## Source
github.com/JuliusBrussee/caveman (MIT).
