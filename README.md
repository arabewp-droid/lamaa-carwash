# لمعة — موقع مغسلة وعناية فاخرة بالسيارات

موقع عربي (RTL) مبني على **Express** مع HTML/CSS/JS خفيفة، بدون أطر أمامية.

## التشغيل محليًا

```bash
npm install
npm start
```

ثم افتح `http://localhost:3000`.

## النشر

- يعمل على أي استضافة Node.js (Render، Railway، Heroku، VPS …).
- أمر البدء: `npm start` — المنفذ يُقرأ من `process.env.PORT` تلقائيًا.
- لا توجد متغيرات بيئة مطلوبة.

## الهيكل

```
server.js            خادم Express + واجهة /api/booking
public/
  index.html         الصفحة الرئيسية
  404.html
  css/style.css
  js/main.js         التفاعلات والحركة
  images/            صور الموقع
  videos/hero.mp4    فيديو الواجهة
```

## ملاحظات

- طلبات الحجز تُتحقق منها على الخادم وتُحفظ مؤقتًا في الذاكرة وتُطبع في السجل؛ اربطها بقاعدة بيانات أو بريد عند الحاجة داخل `server.js`.
- عدّل رقم الهاتف/واتساب والعنوان في `public/index.html`.
