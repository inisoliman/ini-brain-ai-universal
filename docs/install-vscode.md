# Install INI Brain AI Universal For VS Code

Version: 2.0.1

## From Source

```powershell
cd ini-brain-ai-universal
npm install
npm run compile
npm run package
code --install-extension .\ini-brain-ai-universal-2.0.1.vsix --force
```

Reload VS Code after installation.

## First Use

1. Open any project folder.
2. Open the INI Brain AI sidebar.
3. For old projects, run **Scan Project**.
4. For new or empty projects, run **Guided Setup**.
5. Use **Install Integrations** or **Copy MCP Config** for your agent.

## Automatic Behavior

When `iniBrain.autoScan` is enabled, the extension detects missing or stale project memory and refreshes context safely. It never generates a new project or applies code changes automatically.

## AI Provider

Run **INI Brain: Configure AI Provider** to set:

- OpenAI-compatible API base URL
- model name
- API key

The API key is stored in VS Code SecretStorage.

---

# تثبيت INI Brain AI Universal على VS Code

الإصدار: 2.0.1

## من المصدر

```powershell
cd ini-brain-ai-universal
npm install
npm run compile
npm run package
code --install-extension .\ini-brain-ai-universal-2.0.1.vsix --force
```

أعد تحميل VS Code بعد التثبيت.

## أول استخدام

1. افتح أي مجلد مشروع.
2. افتح الشريط الجانبي الخاص بـ INI Brain AI.
3. للمشاريع القديمة استخدم **Scan Project**.
4. للمشاريع الجديدة أو الفارغة استخدم **Guided Setup**.
5. استخدم **Install Integrations** أو **Copy MCP Config** لتوصيل الوكيل الذي تستخدمه.

## السلوك التلقائي

عند تفعيل `iniBrain.autoScan` تكتشف الإضافة إن كانت ذاكرة المشروع ناقصة أو قديمة، ثم تحدث السياق بأمان. لا تقوم الإضافة بإنشاء مشروع جديد أو تطبيق تعديلات كود تلقائيًا.

## مزود الذكاء الاصطناعي

استخدم **INI Brain: Configure AI Provider** لضبط:

- رابط API المتوافق مع OpenAI
- اسم الموديل
- مفتاح API

يتم تخزين مفتاح API داخل VS Code SecretStorage.
