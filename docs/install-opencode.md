# OpenCode integration

Version: 3.4.0

Build with `npm run compile`. In VS Code select **INI Brain: Install Integrations → OpenCode** to copy native instructions. The source installer targets detected clients; select explicitly with `-Clients opencode` in PowerShell. No global workspace pin is added.

Merge into the existing OpenCode configuration (project `opencode.json` or global `~/.config/opencode/opencode.json`):

```json
{
  "mcp": {
    "ini-brain-ai": {
      "type": "local",
      "command": ["node", "C:/path/to/ini-brain-ai-universal/dist/mcp/server.js"],
      "enabled": true
    }
  }
}
```

OpenCode uses `mcp`, an array `command`, and optional `environment`, not generic `mcpServers`/`args`/`env`. The installer preserves existing environment, enabled state, timeouts and unrelated keys, creates a backup before atomic replacement, and refuses malformed input unchanged. A detected `opencode.jsonc` takes precedence for installation safety: automatic merge refuses unchanged with manual instructions, rather than creating a competing JSON file or stripping comments. The dependency-free packaged runtime does not include the development-only JSONC parser.

Skills use `.opencode/skills/<name>/SKILL.md`, with YAML `name` matching the directory and a 1–1024 character description. Names are lowercase alphanumeric with single hyphens, maximum 64 characters. Commands use `.opencode/commands/<name>.md`; project guidance is the shared root `AGENTS.md`. Generated files carry a content hash; edits by the user prevent automatic replacement/removal. Legacy flat skill files remain untouched; review and remove them manually only after checking the new native file.

Verify with `opencode mcp list`, then call `ini_brain_status`, `ini_brain_auto_brief`, and `ini_brain_get_context`. If the host supplies no current project root, pass `workspace` on every call. Fixture/protocol tests do not prove a particular OpenCode UI/version was exercised.

Sources checked October 27, 2026: [skills](https://opencode.ai/docs/skills/), [MCP](https://opencode.ai/docs/mcp-servers/), [commands](https://opencode.ai/docs/commands/), [rules](https://opencode.ai/docs/rules/).
