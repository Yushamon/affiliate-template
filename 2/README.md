# PfotenTechnik Comparison Token + CSS Baseline 1.0.1

Korrektur der Validierungsreihenfolge aus Version 1.0.0.

## Ursache

Der Performance-Audit prüft gerenderte Dateien unter `apps/pfotentechnik/dist`.
Version 1.0.0 führte den Audit vor dem Astro-Build aus. Bei einem unvollständigen
oder alten `dist` wurden deshalb vorhandene Routen fälschlich als fehlend gemeldet.

## Korrektur

Die Reihenfolge lautet nun:

1. Design Token Audit
2. Design System Check
3. Astro Build
4. Performance Audit

Tokenisierung und CSS-Baseline bleiben gegenüber 1.0.0 unverändert.

## Ausführen

```powershell
node ./2/apply-pfotentechnik-comparison-token-and-css-baseline-1.0.1.mjs
```

Bei einem Fehler werden CSS-Datei und Baseline weiterhin vollständig
zurückgerollt.
