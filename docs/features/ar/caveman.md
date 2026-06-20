# Caveman — ضاغط ردود الـAI

## الفائدة
~70٪ توفير في output tokens.

## التفعيل
`INI Brain: Enable Caveman Mode` أو `iniBrain.caveman.enabled = true`.

## الأوضاع
- `lite`: حذف الحشو.
- `full` (افتراضي): تلغرافي.
- `ultra`: ضغط أقصى.
- `wenyan`: كثافة كلاسيكية.

## الأوامر في الـChat
- `/caveman [lite|full|ultra|wenyan]`
- `/caveman-commit`
- `/caveman-pr`
- `/caveman-doc`

## ما لا يُضغط
كود، URLs، paths، error messages، math، لغة المستخدم.

## المصدر
github.com/JuliusBrussee/caveman (MIT).
