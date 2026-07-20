# PfotenTechnik UI Fix 3.6.6

## Änderungen

### Score-Badge

- deutlich hellere Zahl
- sichtbarer Rahmen
- heller grüner Hintergrund
- bessere Lesbarkeit für Werte wie `95 / 100`

### Herstellerkarten

- dunkler Karten- und Inhaltsbereich
- helle Überschriften
- lesbarer Beschreibungstext
- passende Akzentfarben für Typ, Bewertung und Link
- angepasste Rahmen und Schatten

### Herstellerbilder

- höheres Seitenverhältnis
- mobil 4:3 statt flachem 16:9
- kein zusätzlicher Zoom
- kontrollierte Bildposition
- mehr vom Motiv sichtbar

## Installation

```bash
node pfotentechnik-ui-fix-3.6.6/install-ui-fix-3.6.6.mjs
npm run build:pfotentechnik
```

Danach den Dev-Server neu starten.

## Rollback

```bash
node pfotentechnik-ui-fix-3.6.6/rollback-ui-fix-3.6.6.mjs
```
