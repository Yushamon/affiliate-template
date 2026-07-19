# PfotenTechnik Brand System 2.0

## Installation

ZIP im Root von `Yushamon/affiliate-template` entpacken und dort ausführen:

```bash
node pfotentechnik-brand-system-2.0/install-brand-system-2.0.mjs
npm run build:pfotentechnik
npm run dev:pfotentechnik
```

## Was integriert wird

Der Installer erstellt:

```text
apps/pfotentechnik/src/styles/pfotentechnik-brand-system-v2.css
```

und lädt die Datei in:

```text
apps/pfotentechnik/src/layouts/ProjectLayout.astro
```

direkt nach dem bisherigen Brand System 1.0. Dadurch überschreibt Version 2.0 alte Light-only-Regeln, ohne die vorhandene Datei zu zerstören.

## Abgedeckte Bereiche

- Header und Burger-Menü
- mobile Navigation
- Homepage und Hero-Oberflächen
- Ratgeber-Fließtext
- Inhaltsverzeichnis
- Kurzantwort- und Premium-Blöcke
- FAQ und Accordions
- Tabellen
- Formulare und Filter
- Produkt-, Vergleichs- und Herstellerkarten
- Chips und Badges
- Hinweis-, Warn-, Erfolgs- und Fehlerboxen
- Bildbeschriftungen
- Code-Blöcke
- High-Contrast-Modus
- Reduced Transparency
- Reduced Motion bleibt mit dem vorhandenen System kompatibel

## Theme-Prinzip

Version 2.0 ergänzt semantische Variablen:

```css
--pt-theme-canvas
--pt-theme-surface
--pt-theme-surface-2
--pt-theme-text
--pt-theme-text-soft
--pt-theme-text-muted
--pt-theme-border
--pt-theme-accent
```

Bestehende Variablen wie `--surface`, `--text`, `--muted`, `--border` und `--primary` werden auf diese Tokens abgebildet. Dadurch profitieren sowohl neue als auch ältere Komponenten.

## Test

Mindestens prüfen:

```text
/
 /smarte-futterautomaten/
 /vergleiche/beste-futterautomaten-fuer-katzen/
 /produkt/<ein-produkt>/
```

Im Browser zwischen hellem und dunklem Gerätemodus wechseln und anschließend hart neu laden.

## Rollback

```bash
node pfotentechnik-brand-system-2.0/rollback-brand-system-2.0.mjs
```
