# CSS Architecture Audit Accuracy 21.1.3

Korrigiert die überhöhte `!important`-Zählung bei gruppierten Selektoren.

Bisher wurde ein Block wie:

```css
.a, .b, .c { color: red !important; }
```

fälschlich als drei `!important`-Deklarationen gezählt. Nach dem Patch wird korrekt eine Deklaration gezählt.

```bash
node 3/apply-pfotentechnik-css-architecture-audit-accuracy-21.1.3.mjs
cat apps/pfotentechnik/reports/design-system/css-architecture-latest.md
```
