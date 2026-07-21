# PfotenTechnik Score Calibration 1.0

## Korrektur

Der PETLIBRO One RFID Smart Feeder hatte drei widersprüchliche Bewertungsebenen:

- `rating: 4.7` = 94/100
- `score: 93`
- sichtbare Kriterien im Mittel = 90/100

Zusätzlich waren die Kriterien für einen redaktionell eingeordneten Artikel mit unbekanntem Produktstatus zu großzügig.

Neue Bewertung:

| Kriterium | Alt | Neu |
|---|---:|---:|
| App | 90 | 84 |
| Portionierung | 90 | 88 |
| Reinigung | 90 | 76 |
| Zuverlässigkeit | 90 | 84 |
| Sicherheit | 100 | 88 |
| Preis-Leistung | 80 | 72 |
| **Gesamtscore** | **93** | **82** |

Der neue Gesamtscore ist der gerundete Durchschnitt:

```text
(84 + 88 + 76 + 84 + 88 + 72) / 6 = 82
```

`rating` wird entsprechend auf `4.1` gesetzt.

## Warum konservativer?

Ein Score ab 90 signalisiert eine nahezu außergewöhnliche Spitzenleistung. In der Produktdatei ist der Status jedoch `editorial-review`, der Produktstatus `unknown`, und mehrere technische Angaben sind nicht vom Hersteller ausgewiesen. Daher ist 82 („sehr gut“) glaubwürdiger als 93 („hervorragend“).

## Installation

```bash
node pfotentechnik-score-calibration-1.0/install-score-calibration-1.0.mjs
node scripts/audit-pfotentechnik-product-scores.mjs
npm run build:pfotentechnik
```

## Rollback

```bash
node pfotentechnik-score-calibration-1.0/rollback-score-calibration-1.0.mjs
```
