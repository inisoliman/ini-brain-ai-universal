# Frontend Design Guard

`frontend-design-guard` هو جارد جودة يتم توليده تلقائياً لمراجعة واجهات المستخدم، Webviews، Dashboards، وشاشات التطبيقات. الفكرة مستلهمة من منهجيات مراجعة UI مثل Impeccable، لكنها تعمل محلياً كمهارة داخل INI Brain ولا تحتاج إلى تشغيل Impeccable.

## ماذا يراجع؟

- مشاكل التخطيط مثل تداخل النصوص، قص الأزرار، أو ظهور تمرير أفقي غير مقصود.
- الوصول: أسماء للعناصر التفاعلية، حالات focus، استخدام لوحة المفاتيح، الأدوار، وحالات disabled/loading.
- التباين بين النصوص والأيقونات والخلفيات وحالات التركيز.
- التجاوب على أحجام ضيقة وعريضة.
- وضوح التسلسل البصري وحجم العناوين داخل الحاويات.
- حالات loading وempty وerror وdisabled وsuccess والمحتوى الطويل.
- التحقق من خلال لقطة شاشة أو تشغيل فعلي قبل اعتبار الواجهة جاهزة.

## أين يتم توليده؟

عند توليد دليل الوكلاء، تكتب INI Brain الجارد في:

- `.brain/skills/frontend-design-guard.md`
- `.codex/skills/frontend-design-guard/SKILL.md`
- `.cline/skills/frontend-design-guard.md`
- `.clinerules/skills/frontend-design-guard.md`

استخدمه مع `clean-code-guard` و`test-guard` عندما يتغير أي سطح UI.
