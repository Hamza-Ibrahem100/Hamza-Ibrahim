# 📂 خريطة وتقسيم ملفات الميزات (Features Directory Index)

تم تقسيم وتطوير السكشنات والميزات الأساسية في هذا المشروع إلى أجزاء مستقلة ومُنظمة لتسهيل الوصول والتعديل السريع على الكود، مع الالتزام التام بقواعد Shopify الرسمية.

---

## 🎯 1. سكشن الشبكة التفاعلية (Tisso In The Wild Grid)
ميزة عرض الصور في شبكة 3x2 مع زار الـ Hotspot والنوافذ المنبثقة للطلب المباشر مع عروض الـ Bundles.

* 📄 **السكشن الأساسي (Liquid Section)**: 
  * [`sections/tisso-wild-grid.liquid`](file:///c:/Users/Mass/Downloads/theme_export__hamza-ibrahim-48-teststore-myshopify-com-horizon__20JUL2026-0817pm/sections/tisso-wild-grid.liquid)
* 🎨 **ملف التنسيقات (CSS)**: 
  * [`assets/tisso-wild-grid.css`](file:///c:/Users/Mass/Downloads/theme_export__hamza-ibrahim-48-teststore-myshopify-com-horizon__20JUL2026-0817pm/assets/tisso-wild-grid.css)
* ⚡ **ملف البرمجة والتفاعل (JS)**: 
  * [`assets/tisso-wild-grid.js`](file:///c:/Users/Mass/Downloads/theme_export__hamza-ibrahim-48-teststore-myshopify-com-horizon__20JUL2026-0817pm/assets/tisso-wild-grid.js)
* 🧩 **مكون النافذة المنبثقة (Popup Modal Snippet)**: 
  * [`snippets/tisso-wild-modal.liquid`](file:///c:/Users/Mass/Downloads/theme_export__hamza-ibrahim-48-teststore-myshopify-com-horizon__20JUL2026-0817pm/snippets/tisso-wild-modal.liquid)

---

## 🎯 2. سكشن منتجات شبكة مخصصة (Custom Product Grid)
ميزة بطاقات المنتجات المخصصة مع زر الـ Quick View وشريط خيارات الألوان والمقاسات.

* 📄 **السكشن الأساسي (Liquid Section)**: 
  * [`sections/custom-grid.liquid`](file:///c:/Users/Mass/Downloads/theme_export__hamza-ibrahim-48-teststore-myshopify-com-horizon__20JUL2026-0817pm/sections/custom-grid.liquid)
* 🎨 **ملف التنسيقات (CSS)**: 
  * [`assets/custom-grid.css`](file:///c:/Users/Mass/Downloads/theme_export__hamza-ibrahim-48-teststore-myshopify-com-horizon__20JUL2026-0817pm/assets/custom-grid.css)
* ⚡ **ملف البرمجة والتفاعل (JS)**: 
  * [`assets/custom-grid.js`](file:///c:/Users/Mass/Downloads/theme_export__hamza-ibrahim-48-teststore-myshopify-com-horizon__20JUL2026-0817pm/assets/custom-grid.js)
* 🧩 **مكون النافذة المنبثقة (Modal Snippet)**: 
  * [`snippets/custom-grid-modal.liquid`](file:///c:/Users/Mass/Downloads/theme_export__hamza-ibrahim-48-teststore-myshopify-com-horizon__20JUL2026-0817pm/snippets/custom-grid-modal.liquid)

---

## 🎯 3. ميزات إضافية ذات صلة (Other Custom Sections)
* 🖼️ **Gift Guide Hero**: [`sections/gift-guide-hero.liquid`](file:///c:/Users/Mass/Downloads/theme_export__hamza-ibrahim-48-teststore-myshopify-com-horizon__20JUL2026-0817pm/sections/gift-guide-hero.liquid)
* 🎨 **Tisso Illustrations Collage**: [`sections/tisso-illustrations-collage.liquid`](file:///c:/Users/Mass/Downloads/theme_export__hamza-ibrahim-48-teststore-myshopify-com-horizon__20JUL2026-0817pm/sections/tisso-illustrations-collage.liquid)

---

## 💡 كيف تعدل على أي ميزة بسرعة؟
1. للتعديل على **التصميم أو الألوان**: افتح ملف `.css` المقابل للميزة في مجلد `assets/`.
2. للتعديل على **طريقة عمل الـ Popups أو السلة (AJAX/Fetch)**: افتح ملف `.js` المقابل في مجلد `assets/`.
3. للتعديل على **محتوى النافذة المنبثقة HTML**: افتح ملف الـ `.liquid` الخاص بالـ Modal في مجلد `snippets/`.
4. للتعديل على **إعدادات الثيم (Schema / Layout)**: افتح ملف السكشن الأساسي في مجلد `sections/`.
