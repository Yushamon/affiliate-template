# PfotenTechnik Hero Update, sicherer Patch

Erstellt: 2026-07-16 17:11:06 CEST

Dieses Paket basiert auf dem aktuell committed, funktionierenden V3-Stand.

## Vollständige Ersatzdateien

```text
apps/pfotentechnik/src/domain/home/buildHomepageModel.ts
packages/affiliate-core/src/components/home/HomeHero.astro
packages/affiliate-core/src/components/home/home.css
```

## Bewusst begrenzte Änderungen

- Hero mobil von 720 auf 650 Pixel Mindesthöhe reduziert
- Abstand oberhalb des Hero um 12 Pixel reduziert
- Bildfokus leicht nach oben verschoben
- lesbares, abgestuftes Overlay
- mobile H1 etwas kleiner und kontrollierter umgebrochen
- kompaktere Abstände bei Unterzeile, Buttons und Vertrauenspunkten
- alle drei Kennzahlen bleiben sichtbar, stehen mobil aber in einer kompakten Reihe
- keine Änderung an anderen Homepage-Komponenten

## Build

```bash
rm -rf apps/pfotentechnik/dist apps/pfotentechnik/.astro
npm run build:pfotentechnik
npm run preview:pfotentechnik
```
