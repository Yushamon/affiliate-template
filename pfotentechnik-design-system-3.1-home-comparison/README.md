# PfotenTechnik Design System 3.1

Dieser Fix betrifft ausschließlich:

- Homepage
- Vergleichsseiten

Die bereits funktionierenden Wissensseiten und das neue Inhaltsverzeichnis
werden nicht verändert.

## Installation

Im Root von `affiliate-template`:

```bash
node pfotentechnik-design-system-3.1-home-comparison/install-design-system-3.1.mjs
npm run build:pfotentechnik
npm run dev:pfotentechnik
```

## Behobene Probleme

### Homepage

- zu dunkle oder fast unsichtbare Überschriften
- Light-Mode-Farben in dunklen Sektionen
- weiße Vergleichskarten im Dark Mode
- zu blasse Beschreibungstexte
- eigene `--home3-*`-Variablen werden auf das Theme abgebildet

### Vergleichsseiten

- weiße Empfehlungskarten im Dark Mode
- weiße Produkttitel auf weißen Karten
- blasse Hersteller- und Beschreibungstexte
- helle Bildflächen ohne Dark-Mode-Anpassung
- Secondary Buttons und Sticky Bar
- Filter, Tabellen und Verdict Cards
- eigene `--comparison-*`-Variablen werden auf das Theme abgebildet

## Rollback

```bash
node pfotentechnik-design-system-3.1-home-comparison/rollback-design-system-3.1.mjs
```
