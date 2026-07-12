# Install INI Brain AI Universal For Antigravity

Version: 3.2.0

Antigravity-style agent environments can use INI Brain through generic MCP configuration and repository instruction files.

## Build

```powershell
git clone https://github.com/inisoliman/ini-brain-ai-universal.git
cd ini-brain-ai-universal
npm install
npm run compile
```

## Configure MCP

If your Antigravity installation exposes MCP server settings, add:

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

If the UI uses a different shape, keep the same command and args:

- command: `node`
- args: `C:/path/to/ini-brain-ai-universal/dist/mcp/server.js`

Only add `INI_BRAIN_WORKSPACE` when the host starts MCP servers outside the project folder and cannot pass the optional `workspace` tool argument.

## Recommended Agent Instruction

```md
Use INI Brain project memory before editing. Call ini_brain_auto_brief and ini_brain_get_context for the task, search memory when prior decisions may matter, and save durable findings after finishing.
```

## Project Files

Run Scan Project from the VS Code extension first, or call `ini_brain_generate_agent_guide` through MCP. This creates:

- `AGENTS.md`
- `.brain/compact_context.md`
- `.brain/workflow.md`
- `.brain/skills.md`
- `.brain/quality_gates.md`

## Arabic Summary

استخدم إعداد MCP العام أعلاه. بعد ذلك اطلب من الوكيل بدء العمل بـ `ini_brain_auto_brief` و`ini_brain_get_context` قبل أي تعديل.
