# PfotenTechnik CSS Lossless Dedup 1.0.1

Der Installer bereinigt ausschließlich:

1. exakt identische Deklarationen innerhalb derselben CSS-Regel,
2. vollständig identische Regeln im selben CSS-Kontext.

Nicht verändert werden:

- Regeln mit abweichenden Werten,
- die Reihenfolge unterschiedlicher Overrides,
- Media-Query-Kontexte,
- Selektoren mit nur ähnlichen Deklarationen,
- Comparison CSS,
- PremiumRenderer,
- Herstellerseiten.

## Ausführen

```bash
node 3/apply-pfotentechnik-css-lossless-dedup-1.0.1.mjs
```

## Validierung

Der Installer führt aus:

```bash
npm run build:pfotentechnik
npm --workspace apps/pfotentechnik run design-system:components:audit
npm --workspace apps/pfotentechnik run design-system:audit
npm --workspace apps/pfotentechnik run audit:performance:strict
```

Bei einem Fehler wird die geänderte CSS-Datei automatisch wiederhergestellt.

Report:

```text
apps/pfotentechnik/reports/design-system/css-lossless-dedup-validation-latest.json
```
