# Header Navigation 13.1.0

## Behoben

- doppeltes Burger-Icon entfernt
- SVG-Menü- und Schließen-Zustand sauber getrennt
- dynamische Navigation aus Content-Frontmatter im ProjectLayout beendet
- projectConfig ist wieder die verlässliche Quelle der Hauptnavigation
- Vergleiche und Kaufberatung ergänzt
- mobile Navigation in Orientierung, Produktwelten und Mehr entdecken gegliedert
- aktiver Menüpunkt, Escape, Outside-Click und Viewport-Wechsel berücksichtigt
- mobile Menüfläche scrollbar und Dark-Mode-fähig
- Kaufberatung im Mobilmenü dezent hervorgehoben, ohne Header-CTA

## Desktop-Reihenfolge

1. Vergleiche
2. Futterautomaten
3. Trinkbrunnen
4. GPS-Tracker
5. Wissen & Ratgeber
6. Hersteller
7. Kaufberatung

## Geänderte Dateien

- packages/affiliate-core/src/components/Header.astro
- packages/affiliate-core/src/layouts/AffiliateLayout.astro
- apps/pfotentechnik/src/layouts/ProjectLayout.astro
- apps/pfotentechnik/src/project.config.ts
- apps/pfotentechnik/test/header-navigation-13.1.0.test.mjs
