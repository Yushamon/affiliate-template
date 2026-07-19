# PfotenTechnik Design System 3.0

## Installation

Das Verzeichnis im Root von `Yushamon/affiliate-template` entpacken und dort ausführen:

```bash
node pfotentechnik-design-system-3.0/install-design-system-3.0.mjs
npm run build:pfotentechnik
npm run dev:pfotentechnik
```

## Was geändert wird

### Inhaltsverzeichnis

Diese Datei wird vollständig ersetzt:

```text
packages/affiliate-core/src/components/TableOfContents.astro
```

Das neue Inhaltsverzeichnis hat:

- ruhige Card statt dunklem Balken
- eindeutige Typografie
- nummerierte Abschnitte
- Icon und animierten Chevron
- gute mobile Darstellung
- vollständige Light-/Dark-Mode-Farben
- ausschließlich Theme-Variablen

### Artikel und PremiumBlocks

Neu erstellt wird:

```text
apps/pfotentechnik/src/styles/pfotentechnik-design-system-v3.css
```

Die Datei korrigiert:

- weißen Artikelblock im Dark Mode
- weiße Überschriften auf weißem Hintergrund
- zu blassen Fließtext
- PremiumBlocks und Kurzantworten
- Tabellen
- FAQ
- Formulare
- Produkt- und Vergleichskarten innerhalb von Ratgebern
- Bildunterschriften
- Linkfarben

Die Datei wird nach Brand System 1.0 und 2.0 geladen, sodass sie veraltete harte Component-Farben zuverlässig überschreibt.

## Kontrolle

Besonders prüfen:

```text
/futterautomat-richtig-reinigen/
/smarte-futterautomaten/
```

sowie einen langen medizinischen Ratgeber.

## Rollback

```bash
node pfotentechnik-design-system-3.0/rollback-design-system-3.0.mjs
```
