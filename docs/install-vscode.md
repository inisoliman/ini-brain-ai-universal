# Install INI Brain AI Universal For VS Code

Version: 3.2.0

## From Source

```powershell
git clone https://github.com/inisoliman/ini-brain-ai-universal.git
cd ini-brain-ai-universal
npm install
npm run compile
npm run package
code --install-extension .\ini-brain-ai-universal-3.2.0.vsix --force
```

Reload VS Code after installation.

On first activation, the extension automatically merges its packaged MCP server
into detected Codex, Claude Desktop, and Cline settings. It preserves existing
servers and never pins the global configuration to the currently open workspace.
Restart an already-running client once to load the new MCP configuration.

## First Use

1. Open any project folder.
2. Open the **INI Brain AI** activity bar view.
3. Run **INI Brain: Scan Project** for existing projects.
4. Run **INI Brain: Guided Setup** for new or empty projects.
5. Use **INI Brain: Copy MCP Config** or the install docs for your agent.

## Automatic Behavior

When `iniBrain.autoScan` is enabled, the extension safely refreshes `.brain/` and `AGENTS.md` when the workspace context is missing or stale. It does not apply code changes automatically.

Auto Mode is different: it is an explicit command, shows proposed file changes in the Output panel, asks for confirmation, and backs up overwritten files under `.brain/backups`.

## AI Provider

Run **INI Brain: Settings** or **INI Brain: Configure AI Provider** to set:

- OpenAI-compatible API base URL
- model name
- API request timeout
- Auto Mode confirmation and backup retention
- API key, stored in VS Code SecretStorage

## Arabic Summary

1. انسخ المستودع من GitHub.
2. شغل `npm install` ثم `npm run compile` ثم `npm run package`.
3. ثبت ملف `ini-brain-ai-universal-3.2.0.vsix` داخل VS Code.
4. عند أول تفعيل، الإضافة تدمج MCP تلقائياً في Codex وClaude Desktop وCline إذا وجدت إعداداتهم.
5. مفتاح API اختياري ويتم حفظه في VS Code SecretStorage وليس داخل ملفات المشروع.
