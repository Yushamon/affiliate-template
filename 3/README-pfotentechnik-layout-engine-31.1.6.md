# PfotenTechnik Layout Engine 31.1.6

Diese Version verwendet für Migration und Test dieselbe exakte Legacy-Definition.

Als alte Hero-Generation gelten Selektoren mit:

- `.comparison-hero` gefolgt von Leerraum, etwa `.comparison-hero h1`
- `.comparison-hero__*`
- `.comparison-hero--*`

Nicht betroffen ist `.comparison-hero-filters`.

Die CSS-Bereinigung wertet alle flachen Regelblöcke aus, auch innerhalb von Media Queries, und entfernt passende Regeln vollständig.

## Ausführung

```bash
node 3/apply-pfotentechnik-layout-engine-31.1.6.mjs
```
