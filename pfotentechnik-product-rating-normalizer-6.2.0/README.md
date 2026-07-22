# PfotenTechnik Product Rating Normalizer 6.2.0

Dieser Patch korrigiert die Bewertungsdurchschnitte **für alle Produkte** und verhindert, dass `rating`, `score` und `ratings` künftig auseinanderlaufen.

## Einheitliche Berechnung

Für jedes Produkt mit numerischem `ratings`-Objekt gilt:

```text
Durchschnitt = Summe aller Einzelbewertungen / Anzahl der Einzelbewertungen
rating = Durchschnitt auf eine Nachkommastelle gerundet
score = Durchschnitt × 20, auf eine ganze Zahl gerundet
```

Beispiel Tractive CAT 6 Mini:

```text
(4,7 + 4,8 + 4,5 + 4,7 + 4,0) / 5 = 4,54
rating = 4,5
score = 91
```

## Was der Patch macht

1. durchsucht alle Dateien unter  
   `apps/pfotentechnik/src/content/products/*.md`
2. liest das YAML-Frontmatter mit dem bereits im Projekt verfügbaren `yaml`-Paket
3. validiert alle Einzelwerte auf den Bereich `0–5`
4. berechnet `rating` und `score` neu
5. ändert nur die beiden Top-Level-Zeilen, nicht das übrige Frontmatter
6. schreibt einen Audit-Report
7. ergänzt zwei npm-Kommandos:

```bash
npm run ratings:fix
npm run ratings:check
```

`ratings:check` beendet sich mit Fehlercode, sobald ein Produkt inkonsistente Werte besitzt. Das eignet sich später auch für CI.

## Installation

Im Root von `affiliate-template`:

```bash
node pfotentechnik-product-rating-normalizer-6.2.0/install-product-rating-normalizer-6.2.0.mjs
npm run build:pfotentechnik
```

## Report

Nach der Installation:

```text
apps/pfotentechnik/reports/product-rating-normalization-6.2.0.json
```

Dort stehen alle korrigierten Produkte mit:

- bisherigen Werten
- exaktem Durchschnitt
- neuem `rating`
- neuem `score`

## Sicherheit

Vor jeder Änderung wird ein vollständiges Backup aller Produktdateien und der `package.json` angelegt:

```text
.product-rating-normalizer-6.2.0-backup-<timestamp>/
```
