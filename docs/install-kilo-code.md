# Install INI Brain AI Universal For Kilo Code

Version: 3.3.0

## Build

```powershell
git clone https://github.com/inisoliman/ini-brain-ai-universal.git
cd ini-brain-ai-universal
npm install
npm run compile
```

## Kilo Code MCP Settings

The VS Code extension automatically merges the INI Brain server into detected
Kilo Code installations when it starts (see `iniBrain.mcp.autoInstall`). To do
it manually, open or create the Kilo Code MCP settings file. On Windows it is
commonly under VS Code global storage:

```text
%APPDATA%\Code\User\globalStorage\kilocode.kilo-code\settings\mcp_settings.json
```

Merge this server config:

```json
{
  "mcpServers": {
    "ini-brain-ai": {
      "command": "node",
      "args": ["C:/path/to/ini-brain-ai-universal/dist/mcp/server.js"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

If Kilo Code starts MCP servers outside the project folder, pass the optional
`workspace` tool argument or set `INI_BRAIN_WORKSPACE` for that project. When
the resolved folder has no project markers, INI Brain now reports the workspace
as untrusted in `ini_brain_status` and disables background scanning there
instead of scanning the wrong directory.

Reload Kilo Code MCP servers or reload VS Code.

## Automatic Client Detection

The MCP server reads `clientInfo` from the MCP initialize handshake and reports
the detected client in `ini_brain_status` (`client.name`, `client.version`).
No configuration is needed; Kilo Code sessions identify themselves
automatically. The same detection works for Cline, Roo Code, Codex, Claude
Desktop, Claude Code, Gemini CLI, Cursor, and any MCP client that sends
standard `clientInfo`.

## Skills and Commands

The VS Code extension mirrors generated skills into `.kilo/skills/` and
commands into `.kilo/command/` when you run Scan Project, Generate Agent Guide,
or Install Skills for All Agents. The shared root `AGENTS.md` stays the single
source of truth.

## Arabic Summary

- ابن السيرفر بـ `npm install` و`npm run compile`.
- إضافة VS Code تضيف إعداد MCP إلى Kilo Code تلقائياً عند التفعيل، أو أضفه يدوياً في `mcp_settings.json`.
- أعد تحميل Kilo Code أو VS Code بعد أول تركيب.
- يتعرف الخادم على Kilo Code تلقائياً من بيانات `clientInfo` ويعرضه في `ini_brain_status`.
- المهارات تُنسخ إلى `.kilo/skills/` والأوامر إلى `.kilo/command/`.
