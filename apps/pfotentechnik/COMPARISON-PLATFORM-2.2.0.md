# Comparison Platform 2.2.0

Diese Version ersetzt die Audit-Engine vollständig und atomar.

## Befehle

```bash
npm run comparison:audit
npm run comparison:audit:strict
npm run comparison:report
npm run comparison:integrity
npm run comparison:fix:check
npm run comparison:fix
```

Der normale Audit liefert immer einen Report und endet erfolgreich.
Nur der strikte Audit sowie der Integrity-Check können den Prozess mit Code 1 beenden.

Der Autofix ergänzt ausschließlich sichere Standardfelder:
- tableTitle
- cardsTitle
- faq: []
