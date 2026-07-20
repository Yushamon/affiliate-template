# PfotenTechnik Trust Panel Fix 3.6.4

## Änderungen

- entfernt die Kachel `Praxistest – Nicht behauptet`
- ersetzt `Prüfstatus` durch `Bewertungsgrundlage`
- zeigt dort die tatsächlichen Quellen der Bewertung
- formuliert transparent und nutzerfreundlich:
  `Für dieses Modell wurde kein eigener mehrmonatiger Praxistest durchgeführt.`
- reduziert das Faktenraster von drei auf zwei Spalten

## Neue Darstellung

- Bewertungsgrundlage
- Zuletzt geprüft

## Installation

```bash
node pfotentechnik-trust-panel-fix-3.6.4/install-trust-panel-fix-3.6.4.mjs
npm run build:pfotentechnik
```

## Rollback

```bash
node pfotentechnik-trust-panel-fix-3.6.4/rollback-trust-panel-fix-3.6.4.mjs
```
