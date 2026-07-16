# PfotenTechnik Trinkbrunnen-Vergleiche V1.1

Erstellt: **2026-07-16 14:48:01 CEST**

Dieses Paket erzeugt zwei vollständige Vergleichsseiten aus den tatsächlich vorhandenen Produkt-Markdowns:

```text
apps/pfotentechnik/src/content/comparisons/beste-trinkbrunnen-fuer-katzen.md
apps/pfotentechnik/src/content/comparisons/beste-trinkbrunnen-fuer-hunde.md
```

## Warum ein Generator enthalten ist

Die vorhandenen Produkt-Slugs werden nicht geraten. Das Skript liest deinen lokalen Produktbestand, erkennt Trinkbrunnen über Kategorie, Tags, Titel und Einsatzzweck und schreibt die richtigen Slugs in beide Vergleichsseiten.

Generische Trinkbrunnen werden in beide Seiten aufgenommen. Produkte mit klarer Katzen- oder Hunde-Eignung werden entsprechend zugeordnet.

## Installation

ZIP im Repository-Root entpacken. Danach zunächst nur Vorschau:

```bash
node apps/pfotentechnik/scripts/generate-water-fountain-comparisons.mjs
```

Dateien tatsächlich erzeugen:

```bash
node apps/pfotentechnik/scripts/generate-water-fountain-comparisons.mjs --write
```

Falls bereits gleichnamige Dateien bestehen und bewusst ersetzt werden sollen:

```bash
node apps/pfotentechnik/scripts/generate-water-fountain-comparisons.mjs --write --force
```

## Bericht

Das Skript erzeugt zusätzlich:

```text
apps/pfotentechnik/reports/trinkbrunnen-comparison-generation.md
```

Dort stehen:

- alle gefundenen Trinkbrunnen-Produkte
- erkannte Zielgruppe
- fehlende Vergleichswerte je Produkt

## Vergleichskriterien

- Kapazität
- Material
- Lautstärke
- Filter
- Reinigung
- Stromversorgung
- Eignung für Katzen beziehungsweise Hunde

Vorhandene Specs und redaktionelle Angaben werden verwendet. Fehlende Werte bleiben ehrlich als `Keine Angabe` sichtbar.

## Build

```bash
rm -rf apps/pfotentechnik/dist apps/pfotentechnik/.astro
npm run build:pfotentechnik
npm run preview:pfotentechnik
```

Die Seiten sind anschließend erreichbar unter:

```text
/vergleiche/beste-trinkbrunnen-fuer-katzen/
/vergleiche/beste-trinkbrunnen-fuer-hunde/
```


## Korrektur in V1.1

Der Parser unterstützt jetzt das im Repository tatsächlich verwendete Inline-YAML:

```yaml
category: { key: trinkbrunnen, label: Trinkbrunnen, path: /trinkbrunnen/ }
tags: [trinkbrunnen, katzen, app]
specs:
  - { label: Kapazität, value: "3 Liter" }
decision: { bestFor: [Katzen, App], attention: [Filterkosten] }
```

Erstellt: **2026-07-16 15:02:00 CEST**
