# PfotenTechnik Layout Engine 31.1.7

Diese Version korrigiert die doppelte Maskierung der JavaScript-RegExp-Literale in 31.1.6.

Die Bereinigung erkennt und entfernt nun tatsächlich:

- `.comparison-hero` und Nachfahren
- `.comparison-hero__*`
- `.comparison-hero--*`
- vergleichsspezifische `.dark`, `.theme-dark` und `[data-theme]`-Regeln

`.comparison-hero-filters` bleibt erhalten.

```bash
node 3/apply-pfotentechnik-layout-engine-31.1.7.mjs
```
