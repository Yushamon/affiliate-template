# PfotenTechnik Produkt-Score-Neukalibrierung 2.0

Dieses Paket prüft sämtliche Markdown-Dateien unter:

```text
apps/pfotentechnik/src/content/products/
```

und korrigiert zu hohe oder widersprüchliche Bewertungen.

## Neue Grundregeln

- Der Gesamtscore ist immer der gerundete Mittelwert der sichtbaren Einzelkriterien.
- Eine rein redaktionelle Einordnung wird konservativer bewertet als ein bestätigter Praxistest.
- Ein unbekannter Produktstatus reduziert Score und Obergrenze.
- Nicht ausgewiesene Spezifikationen reduzieren die Evidenz.
- 90+ ist ohne bestätigten Praxistest ausgeschlossen.
- 95+ bleibt belegten Ausnahmeprodukten vorbehalten.
- `rating`, `score` und `ratings` werden konsistent gehalten.

## Score-Bedeutung

| Score | Bedeutung |
|---:|---|
| 95–100 | Referenzklasse |
| 90–94 | Hervorragend |
| 85–89 | Sehr gut |
| 80–84 | Gut |
| 75–79 | Empfehlenswert |
| 70–74 | Solide |
| unter 70 | Mit deutlichen Einschränkungen |

## Installation

```bash
node pfotentechnik-product-score-recalibration-2.0/install-product-score-recalibration-2.0.mjs
npm run build:pfotentechnik
```

Der Installer führt zuerst einen Dry-Run aus, schreibt anschließend alle Änderungen und erzeugt:

```text
apps/pfotentechnik/reports/product-score-recalibration-2.0.json
```

Der Report enthält für jedes Produkt:

- alten Score
- rechnerischen bisherigen Score
- neuen Score
- alte und neue Einzelkriterien
- Evidenzobergrenze
- unbekannte Spezifikationen
- konkrete Gründe für die Abwertung

## Nur prüfen

```bash
node scripts/recalibrate-pfotentechnik-product-scores.mjs
```

## Anwenden

```bash
node scripts/recalibrate-pfotentechnik-product-scores.mjs --apply
```

## Rollback

```bash
node pfotentechnik-product-score-recalibration-2.0/rollback-product-score-recalibration-2.0.mjs
```
