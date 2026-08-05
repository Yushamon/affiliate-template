# pfotentechnik-product-mobile-layout-closure-28.3.1

Korrigiert den fehlerhaften Test aus 28.3.0.

Der Test verbot `48px` in der gesamten Hero-Datei und beanstandete dadurch
den legitimen Desktop-Abstand `gap: clamp(24px, 4vw, 48px)`.

28.3.1 prüft ausschließlich die mobile Full-Bleed-Regel, verlangt genau
einen Treffer und entfernt das leere mobile Media-Query.

```bash
node 3/apply-pfotentechnik-product-mobile-layout-closure-28.3.1.mjs
```
