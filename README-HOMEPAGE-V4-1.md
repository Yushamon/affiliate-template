# PfotenTechnik Homepage V4.1

Erstellt: 2026-07-16 19:21:27 CEST

## Änderung

Der bisherige Dashboard-artige Bereich „Ich suche gerade …“ wurde vollständig ersetzt.

Neu:

- vier redaktionelle Vergleichskarten
- direkte Links zu den jeweiligen Vergleichsseiten
- echte Anzahl der verglichenen Modelle aus `comparison.items`
- echtes Aktualisierungsdatum aus den Comparison-Daten
- Hero-Bild des jeweiligen Vergleichs
- Desktop zwei Spalten
- Mobile eine redaktionelle Kartenliste
- keine hart verdrahteten Modellzahlen
- fehlende Comparison-Seiten werden automatisch ausgeblendet

## Vollständige Ersatzdateien

```text
apps/pfotentechnik/src/domain/home/buildHomepageModel.ts
packages/affiliate-core/src/home/model.ts
packages/affiliate-core/src/components/home/HomePage.astro
packages/affiliate-core/src/components/home/HomeNavigation.astro
packages/affiliate-core/src/components/home/home.css
```

## Erwartete Vergleichsrouten

```text
/vergleiche/beste-futterautomaten-fuer-katzen/
/vergleiche/beste-futterautomaten-fuer-hunde/
/vergleiche/beste-trinkbrunnen-fuer-katzen/
/vergleiche/beste-trinkbrunnen-fuer-hunde/
```

## Build

```bash
rm -rf apps/pfotentechnik/dist apps/pfotentechnik/.astro
npm run build:pfotentechnik
npm run preview:pfotentechnik
```
