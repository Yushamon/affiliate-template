# PfotenTechnik Design System 3.3

Dieser Installer korrigiert die verbliebenen Dark-Mode-Probleme auf:

- Produktseiten
- Homepage
- Homepage-FAQ
- Advisor-CTA
- Wissensübersicht `/wissen/`
- Footer

Die bereits funktionierenden Wissensartikel und das Inhaltsverzeichnis bleiben bestehen.

## Installation

Im Root von `affiliate-template`:

```bash
node pfotentechnik-design-system-3.3-complete-darkmode/install-design-system-3.3.mjs
npm run build:pfotentechnik
npm run dev:pfotentechnik
```

## Wichtig

Version 3.3 wird absichtlich als letzter Style-Layer geladen. Sie überschreibt die noch vorhandenen fest codierten Light-Mode-Farben in den jeweiligen Komponenten.

## Prüfen

```text
/
 /wissen/
 /produkt/petkit-eversweet-max-2-uvc/
```

Zusätzlich auf der Homepage:

- Vergleichskarten
- FAQ
- Advisor-CTA
- Statistikbereich
- Footer

## Rollback

```bash
node pfotentechnik-design-system-3.3-complete-darkmode/rollback-design-system-3.3.mjs
```
