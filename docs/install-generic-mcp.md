# Install INI Brain AI Universal For Generic MCP Clients

Version: 2.0.1

Any stdio MCP-compatible client can use INI Brain AI Universal.

## Build

```powershell
cd ini-brain-ai-universal
npm install
npm run compile
```

## Server

```text
node C:/path/to/ini-brain-ai-universal/dist/mcp/server.js
```

Workspace detection:

- If the MCP client starts the server from the project root, no environment variable is required.
- If the MCP client starts servers from a central folder, set `INI_BRAIN_WORKSPACE` or pass the optional `workspace` argument in tool calls.

Optional environment:

```text
INI_BRAIN_WORKSPACE=C:/path/to/your/project
```

## JSON Config

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

## Tool List

- `ini_brain_status`
- `ini_brain_get_context`
- `ini_brain_search_memory`
- `ini_brain_save_memory`
- `ini_brain_project_profile`
- `ini_brain_generate_agent_guide`
- `ini_brain_suggest_skills`
- `ini_brain_generate_workflow`

## Minimal Flow

1. Call `ini_brain_generate_agent_guide` once per project.
2. Call `ini_brain_get_context` before each coding task.
3. Call `ini_brain_search_memory` when old decisions may matter.
4. Call `ini_brain_save_memory` after important discoveries.

---

# تثبيت INI Brain AI Universal لأي عميل MCP عام

الإصدار: 2.0.1

أي عميل MCP يدعم stdio يمكنه استخدام INI Brain AI Universal.

## البناء

```powershell
cd ini-brain-ai-universal
npm install
npm run compile
```

## السيرفر

```text
node C:/path/to/ini-brain-ai-universal/dist/mcp/server.js
```

اكتشاف المشروع:

- إذا كان عميل MCP يشغل السيرفر من جذر المشروع فلا تحتاج إلى متغير بيئة.
- إذا كان العميل يشغل السيرفر من مجلد مركزي، اضبط `INI_BRAIN_WORKSPACE` أو مرر وسيط `workspace` الاختياري في استدعاءات الأدوات.

متغير البيئة الاختياري:

```text
INI_BRAIN_WORKSPACE=C:/path/to/your/project
```

## إعداد JSON

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

## قائمة الأدوات

- `ini_brain_status`
- `ini_brain_get_context`
- `ini_brain_search_memory`
- `ini_brain_save_memory`
- `ini_brain_project_profile`
- `ini_brain_generate_agent_guide`
- `ini_brain_suggest_skills`
- `ini_brain_generate_workflow`

## أبسط طريقة استخدام

1. استدع `ini_brain_generate_agent_guide` مرة واحدة لكل مشروع.
2. استدع `ini_brain_get_context` قبل كل مهمة برمجية.
3. استدع `ini_brain_search_memory` عندما تكون القرارات القديمة مهمة.
4. استدع `ini_brain_save_memory` بعد الاكتشافات المهمة.
