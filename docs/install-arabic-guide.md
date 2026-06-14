 # 📘 دليل تثبيت INI Brain AI على Codex و Claude (نسخة عربية)

> **خلاصة سريعة:** الإضافة جاهزة بالفعل ومدعومة. لا تحتاج إلى إنشاء بلجن جديد — فقط ابني سيرفر MCP مرة واحدة، وأضفه لإعدادات Codex و Claude.

---

## 🧠 الفكرة باختصار

`INI Brain AI Universal` ليست إضافة VS Code فقط. إنها **سيرفر MCP محلي** يتكلم مع أي عميل ذكاء اصطناعي يدعم بروتوكول MCP (وهذا ما يدعمه Codex و Claude Desktop و Cline).

عند توصيله بـ Codex أو Claude يصبح لديهم **13 أداة** جديدة تلقائيًا:

| الأداة | الوظيفة |
|---|---|
| 🌟 **`ini_brain_auto_brief`** | **(جديد)** يُستدعى تلقائياً في بداية أي مهمة - يحمل AGENTS.md + السياق + الذاكرة + البرومبت الذهبي |
| `ini_brain_status` | حالة المشروع |
| `ini_brain_get_context` | بناء سياق ذكي لأي مهمة |
| `ini_brain_search_memory` | بحث في ذاكرة المشروع |
| `ini_brain_save_memory` | حفظ ذاكرة دائمة |
| 🆕 `ini_brain_list_memories` | عرض آخر الذكريات |
| `ini_brain_project_profile` | ملف تعريف المشروع |
| 🆕 `ini_brain_onboarding` | دليل بداية المشروع (entry points + hotspots) |
| 🆕 `ini_brain_explain` | شرح ملف معين (deps، exports، dependents) |
| 🆕 `ini_brain_impact` | تحليل تأثير تغيير ملفات (blast radius) |
| `ini_brain_generate_agent_guide` | توليد AGENTS.md و .brain/ |
| `ini_brain_suggest_skills` | اقتراح المهارات |
| `ini_brain_generate_workflow` | توليد سير العمل |

## ✨ ما الجديد في 2.1.0

### 1. لا حاجة لكتابة البرومبت الذهبي بعد الآن!
البرومبت يأتي تلقائياً مع كل اتصال (في `instructions` الـ MCP)، والوكيل (Codex/Claude) يقرأه قبل أي مهمة. كما يمكنك استدعاء `ini_brain_auto_brief` في بداية كل محادثة لتلقي:
- AGENTS.md كاملاً
- ملخص المشروع
- آخر القرارات والمهام
- الذكريات المرتبطة
- البرومبت الذهبي

### 2. فحص في الخلفية تلقائياً
عند بدء سيرفر MCP يقوم بـ:
- فحص `.brain/` — إن كان غير موجود أو أقدم من 24 ساعة، يبدأ scan في الخلفية فوراً.
- تشغيل `fs.watch` على `src/`, `lib/`, `app/`, `pages/`, إلخ — أي تعديل ملف يُعيد توليد `.brain/` و `AGENTS.md` بعد 5 ثوانٍ.
- كل استدعاء أداة يتأكد من حداثة السياق قبل العمل.

### 3. أدوات تحليل متقدمة
- `ini_brain_onboarding`: للمشاريع الجديدة، يعطيك entry points و complexity hotspots بدون LLM.
- `ini_brain_explain`: لشرح ملف قبل تعديله.
- `ini_brain_impact`: لمعرفة الملفات المتأثرة قبل أي تعديل.

---

## ⚡ التثبيت التلقائي (موصى به)

أنشأت لك سكربت واحد يقوم بكل شيء:

```powershell
cd "C:\Users\helen\Downloads\vs\exbrain.all\ini-brain-ai-universal"
powershell -ExecutionPolicy Bypass -File .\scripts\install-all.ps1
```

السكربت سيقوم بـ:
1. ✅ التحقق من Node.js
2. ✅ `npm install` ثم `npm run compile` (يبني `dist/mcp/server.js`)
3. ✅ إضافة السيرفر تلقائيًا إلى `~/.codex/config.toml`
4. ✅ إضافة السيرفر تلقائيًا إلى Claude Desktop
5. ✅ إضافة السيرفر تلقائيًا إلى Cline (إن كان مثبتًا)

### معاملات اختيارية

```powershell
# تخطّي البناء (إذا كان dist/ موجود)
.\scripts\install-all.ps1 -SkipBuild

# تثبيت لـ Codex فقط
.\scripts\install-all.ps1 -SkipClaude -SkipCline

# تثبيت لـ Claude فقط
.\scripts\install-all.ps1 -SkipCodex -SkipCline
```

---

## 🔧 التثبيت اليدوي

### المتطلبات
- Node.js 18+ (لديك v24 ✅)
- Codex CLI أو Claude Desktop مثبتين

### الخطوة 1: بناء السيرفر مرة واحدة

```powershell
cd "C:\Users\helen\Downloads\vs\exbrain.all\ini-brain-ai-universal"
npm install
npm run compile
```

يجب أن يظهر الملف:
```
ini-brain-ai-universal\dist\mcp\server.js
```

---

### الخطوة 2: تثبيت على Codex CLI

#### الطريقة (أ) - أمر تلقائي:
```powershell
codex mcp add ini-brain-ai -- node "C:/Users/helen/Downloads/vs/exbrain.all/ini-brain-ai-universal/dist/mcp/server.js"
```

#### الطريقة (ب) - يدويًا:
افتح الملف `C:\Users\helen\.codex\config.toml` (أنشئه إن لم يكن موجود) وأضف:

```toml
[mcp_servers.ini-brain-ai]
command = 'node'
args = ['C:/Users/helen/Downloads/vs/exbrain.all/ini-brain-ai-universal/dist/mcp/server.js']
startup_timeout_sec = 120
```

ثم شغّل Codex من جذر مشروعك:
```powershell
cd C:\path\to\your\project
codex
```

---

### الخطوة 3: تثبيت على Claude Desktop

افتح ملف الإعدادات:
```
%APPDATA%\Claude\claude_desktop_config.json
```

أو من Claude Desktop: **Settings → Developer → Edit Config**

أضف (أو ادمج) هذا:

```json
{
  "mcpServers": {
    "ini-brain-ai": {
      "command": "node",
      "args": [
        "C:/Users/helen/Downloads/vs/exbrain.all/ini-brain-ai-universal/dist/mcp/server.js"
      ],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

> ⚠️ مهم: **أغلق Claude Desktop تمامًا** (من شريط المهام أيضًا) ثم افتحه. لن تكفي إعادة التحميل العادية.

بعد التشغيل ستجد أيقونة 🔨 أسفل مربع المحادثة، اضغطها لرؤية أدوات `ini_brain_*`.

---

### الخطوة 4 (اختيارية): Cline داخل VS Code

أنشئ أو عدّل الملف:
```
%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

```json
{
  "mcpServers": {
    "ini-brain-ai": {
      "command": "node",
      "args": [
        "C:/Users/helen/Downloads/vs/exbrain.all/ini-brain-ai-universal/dist/mcp/server.js"
      ],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

---

## ✅ التحقق من نجاح التثبيت

### في Codex:
```
> استدعِ أداة ini_brain_status
```
يجب أن يعيد لك معلومات عن المشروع الحالي.

### في Claude Desktop:
1. افتح محادثة جديدة.
2. اكتب: `استخدم ini_brain_status لإظهار حالة المشروع في C:/path/to/your/project`
3. سيظهر طلب موافقة، اقبله.

---

## 🎯 البرومبت الذهبي — أصبح تلقائياً!

في الإصدار 2.1.0 لم يعد عليك كتابة أي شيء. السيرفر يرسل البرومبت الذهبي تلقائياً عبر `instructions` في رسالة `initialize` التي يقرأها العميل (Codex/Claude) عند بدء كل جلسة.

البرومبت المُحقن:
```
INI Brain protocol for every coding task:
1. At the START of any task, call ini_brain_auto_brief once...
2. Before editing files, call ini_brain_get_context...
3. Use ini_brain_search_memory whenever past decisions may matter.
4. Use ini_brain_explain on a file before changing it...
5. After finishing, call ini_brain_save_memory...
```

### إن لم يلتزم العميل بالبروتوكول تلقائياً، فقط اكتب:
```
ابدأ بـ ini_brain_auto_brief
```
أو بالإنجليزية:
```
Start with ini_brain_auto_brief
```
هذا الأمر القصير يكفي. الأداة بنفسها تُحمّل كل شيء (AGENTS.md + السياق + الذاكرة + البروتوكول).

---

## 🛠️ سير العمل اليومي الكامل

1. **شغّل أي عميل** (Codex/Claude/Cline) من جذر المشروع — السيرفر يكتشف المسار تلقائياً.
2. **لا تحتاج فحصاً يدوياً** — `.brain/` و `AGENTS.md` يتم توليدهما/تحديثهما في الخلفية تلقائياً عند بدء MCP وعند تغيّر أي ملف.
3. **اكتب مهمتك مباشرة** أو ابدأ بـ `ابدأ بـ ini_brain_auto_brief` لضمان أن العميل يقرأ السياق.
4. **العميل سيستدعي الأدوات بنفسه** كما هو موجّه في البروتوكول الذهبي.
5. **عند انتهاء المهمة**، اطلب: `احفظ ما تعلمناه كذاكرة دائمة` (يستدعي `ini_brain_save_memory`).

---

## ❓ حل المشاكل

| المشكلة | الحل |
|---|---|
| `dist/mcp/server.js` غير موجود | شغّل `npm run compile` داخل مجلد `ini-brain-ai-universal` |
| Codex لا يرى الأدوات | تأكد من المسار في `~/.codex/config.toml` ثم أعد فتح Codex |
| Claude لا يرى الأدوات | أغلق Claude **بالكامل** (Quit من system tray) وافتحه |
| الأدوات تعمل لكن لا تجد ملفات المشروع | شغّل العميل من جذر المشروع، أو مرّر الوسيط `workspace: "C:/path/to/project"` |
| `npm install` يفشل | تحقق من اتصال الإنترنت ومن وجود Node.js 18+ |

### التشخيص السريع
لاختبار السيرفر يدويًا:
```powershell
node "C:\Users\helen\Downloads\vs\exbrain.all\ini-brain-ai-universal\dist\mcp\server.js"
```
يجب أن يطبع `[INI Brain MCP] running locally for ...` ثم ينتظر.

---

## 📁 المسارات المهمة

| المسار | الوصف |
|---|---|
| `dist/mcp/server.js` | السيرفر المُجمَّع (يُشغَّل بـ node) |
| `~/.codex/config.toml` | إعدادات Codex |
| `%APPDATA%/Claude/claude_desktop_config.json` | إعدادات Claude Desktop |
| `%APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` | إعدادات Cline |
| `<project>/.brain/` | ذاكرة وسياق المشروع |
| `<project>/AGENTS.md` | دليل الوكلاء للمشروع |

---

## 🔁 تحديث السيرفر مستقبلًا

```powershell
cd C:\Users\helen\Downloads\vs\exbrain.all\ini-brain-ai-universal
git pull              # إن كنت من مستودع git
npm install
npm run compile
```
لا حاجة لإعادة تعديل الإعدادات — المسار ثابت.
