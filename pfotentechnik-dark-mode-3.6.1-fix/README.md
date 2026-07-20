# PfotenTechnik Dark Mode 3.6.1 Fix

## Warum dieser Patch nötig ist

Die ursprünglichen 3.6-Regeln sind in der konsolidierten CSS-Datei vorhanden. Viele ältere Komponentenregeln besitzen jedoch:

- spezifischere Selektoren,
- `!important`,
- eigene Variablen wie `--pt-theme-*` und `--v4-*`.

Dadurch wurden allgemeine 3.6-Regeln trotz späterer Position teilweise überstimmt.

## Was 3.6.1 korrigiert

- setzt die bestehenden `--pt-theme-*`-Variablen direkt,
- setzt die Produktvariablen `--v4-*`,
- verwendet die tatsächlichen Selektoren von Home 3/4,
- korrigiert Vergleichsempfehlungen, Filter, FAQ und mobile Karten,
- korrigiert Product Review V4, Trust Panel und Alternativkarten,
- korrigiert Conversion Journey und Premium Blocks,
- korrigiert das Footer-Icon,
- nutzt gezielt `!important` an den Konfliktstellen,
- unterstützt System-Dark-Mode und manuelle Dark-Theme-Attribute.

## Installation

Im Root von `affiliate-template`:

```bash
node pfotentechnik-dark-mode-3.6.1-fix/install-dark-mode-3.6.1.mjs
npm run build:pfotentechnik
```

Danach lokale Vorschau neu starten:

```bash
npm run dev:pfotentechnik
```

Auf dem Smartphone Browser-Cache leeren oder im Inkognito-Fenster testen.

## Kontrolle

```bash
tail -n 30 apps/pfotentechnik/src/styles/pfotentechnik-design-system.css
```

Dort muss der Abschlussmarker erscheinen:

```text
End PfotenTechnik Dark Mode 3.6.1 Corrective Layer
```

## Rollback

```bash
node pfotentechnik-dark-mode-3.6.1-fix/rollback-dark-mode-3.6.1.mjs
```
