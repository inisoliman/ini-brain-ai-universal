# دليل تثبيت INI Brain AI Universal

الإصدار: 3.1.0

## الفكرة

INI Brain AI Universal إضافة VS Code وخادم MCP محلي. تفحص المشروع، تنشئ `.brain/` و`AGENTS.md`، ثم توفر أدوات MCP لوكلاء مثل Codex وClaude وCline حتى يحصلوا على سياق المشروع والذاكرة قبل التعديل.

## التثبيت السريع

```powershell
git clone https://github.com/inisoliman/ini-brain-ai-universal.git
cd ini-brain-ai-universal
powershell -ExecutionPolicy Bypass -File .\scripts\install-all.ps1
```

يمكن تخطي بعض الأهداف:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-all.ps1 -SkipClaude -SkipCline
```

## تثبيت VS Code

```powershell
npm install
npm run compile
npm run package
code --install-extension .\ini-brain-ai-universal-3.1.0.vsix --force
```

بعد التثبيت:

1. افتح أي مشروع.
2. افتح لوحة **INI Brain AI**.
3. شغل **INI Brain: Scan Project**.
4. استخدم **Ask AI** أو **Copy MCP Config** حسب الأداة التي تعمل بها.

## إعداد Codex

```powershell
codex mcp add ini-brain-ai -- node "C:/path/to/ini-brain-ai-universal/dist/mcp/server.js"
```

أو يدوياً داخل `~/.codex/config.toml`:

```toml
[mcp_servers.ini-brain-ai]
command = "node"
args = ["C:/path/to/ini-brain-ai-universal/dist/mcp/server.js"]
startup_timeout_sec = 120
```

افتح Codex من جذر المشروع الذي تريد العمل عليه.

## إعداد Cline أو Claude أو أي عميل MCP

استخدم نفس الفكرة العامة:

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

إذا كان العميل يشغل السيرفر من مجلد مركزي وليس من جذر المشروع، أضف `INI_BRAIN_WORKSPACE` أو مرر وسيط `workspace` في استدعاءات الأدوات.

## أهم أدوات MCP

- `ini_brain_auto_brief`
- `ini_brain_get_context`
- `ini_brain_search_memory`
- `ini_brain_save_memory`
- `ini_brain_memory_stats`
- `ini_brain_memory_compact`
- `ini_brain_onboarding`
- `ini_brain_explain`
- `ini_brain_impact`
- `ini_brain_generate_agent_guide`
- `ini_brain_graph_build`
- `ini_brain_spec_create`
- `ini_brain_savings_status`

## حراس الجودة والمهارات

عند تشغيل Scan Project أو Generate Agent Guide يتم إنشاء:

- `.brain/skills/clean-code-guard.md`
- `.brain/skills/test-guard.md`
- `.brain/skills/karpathy-guidelines.md`
- `.brain/skills/frontend-design-guard.md`
- `.codex/skills/<skill>/SKILL.md`
- `.cline/skills/<skill>.md`
- `.clinerules/skills/<skill>.md`
- `.brain/quality_gates.md`

هذه الملفات تجعل وكلاء الذكاء الاصطناعي يستخدمون نفس قواعد الجودة داخل المشروع.

## Auto Mode

Auto Mode لا يكتب ملفات تلقائياً بدون موافقتك. السلوك الصحيح:

1. يطلب من المزود خطة وتعديلات بصيغة JSON.
2. يعرض التعديلات المقترحة في Output.
3. يطلب تأكيداً قبل الكتابة.
4. يحفظ نسخة احتياطية من الملفات القديمة داخل `.brain/backups`.

## حل المشاكل

| المشكلة | الحل |
|---|---|
| `dist/mcp/server.js` غير موجود | شغل `npm run compile` |
| Codex لا يرى الأدوات | تأكد من مسار `server.js` ثم أعد فتح Codex |
| Cline لا يرى الأدوات | أعد تحميل MCP servers أو أعد تشغيل VS Code |
| السياق من مشروع خاطئ | شغل العميل من جذر المشروع أو استخدم `INI_BRAIN_WORKSPACE` |
