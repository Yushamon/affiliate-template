# PfotenTechnik Comparison CSS Consolidation 17.1.0

Der Patch räumt die Comparison-CSS-Architektur tatsächlich auf:

- sieben CSS-Imports werden auf `comparison-system.css` reduziert
- vorhandene Regeln werden in bisheriger Reihenfolge konsolidiert
- exakt identische Regelblöcke werden entfernt
- alte CSS-Dateien bleiben nur als nicht importierte Referenz erhalten
- kein zusätzlicher Hotfix-Import wird angelegt

Gleichzeitig werden die funktionellen Probleme behoben:

- mobile Außenabstände zentral auf 16 px
- separater Block „Empfehlungen nach Einsatzzweck“ entfernt
- Einsatzzwecke in „Alternativen nach Bedarf“ integriert
- Kartenansicht mobil als konsistenter Ausgangszustand
- Tabellenansicht horizontal scrollbar und wieder sichtbar

## Ausführen

```bash
node 3/apply-pfotentechnik-comparison-css-consolidation-17.1.0.mjs
```

Ohne Build:

```bash
node 3/apply-pfotentechnik-comparison-css-consolidation-17.1.0.mjs --skip-checks
```
