# Superpowers - Composable Skills

## What Is It?
A skills system where skills can reference each other with `@skill-name`.

## How It Works
- Skills live in `.brain/skills/name.md`.
- A skill can reference `@other-skill`.
- The engine resolves the chain automatically.

## MCP Tools
- `ini_brain_skills_list` - list skills.
- `ini_brain_skills_resolve` - resolve a chain.

## Source
github.com/obra/superpowers (MIT).
