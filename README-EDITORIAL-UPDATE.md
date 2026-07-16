# PfotenTechnik Homepage Editorial Update

Erstellt: 2026-07-16 19:05:56 CEST

## Vollständige Ersatzdateien

```text
apps/pfotentechnik/src/domain/home/buildHomepageModel.ts
packages/affiliate-core/src/components/home/HomeHero.astro
packages/affiliate-core/src/components/home/HomeNavigation.astro
packages/affiliate-core/src/components/home/home.css
```

## Enthalten

- kompakter Hero ohne doppelte Kennzahlen
- Trust-Aussagen als ruhige Badges
- stärkerer Fokus auf Bild und Haupt-CTA
- redaktioneller Einstieg „Schnelle Orientierung“
- vier visuelle Einstiegskarten mit eigenen SVG-Icons
- Karten aus den vorhandenen `decisionLinks`, keine hart verdrahteten Routen
- responsive Zwei-Spalten-Darstellung auf Mobilgeräten
- aktueller Zeitstempel in Europe/Berlin

## Build

```bash
rm -rf apps/pfotentechnik/dist apps/pfotentechnik/.astro
npm run build:pfotentechnik
npm run preview:pfotentechnik
```
