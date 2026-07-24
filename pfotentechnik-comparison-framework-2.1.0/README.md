# PfotenTechnik Comparison Framework 2.1.0

## Ergebnis

Das Kernsystem entscheidet Empfehlungen zentral. Bestehende `winnerSlug`- und `alternativeSlug`-Werte bleiben als Fallback erhalten. Nach der Migration werden alle vorhandenen Vergleichsdateien über `automaticRecommendations.enabled: true` an die Engine angebunden.

## Installation auf dem Mac

```bash
node ./pfotentechnik-comparison-framework-2.1.0/apply-comparison-framework-2.1.0.mjs
node ./apps/pfotentechnik/scripts/migrate-comparison-framework-2.1.mjs
node ./apps/pfotentechnik/scripts/migrate-comparison-framework-2.1.mjs --write
npm run build:pfotentechnik
```

## Automatisch unterstützt

- Trinkbrunnen: Hundegröße, Mehrhunde- und Mehrkatzenhaushalte
- Futterautomaten: Preis-Leistung, Smart/App, Kamera
- GPS-Tracker: Gewicht, Akkulaufzeit, Abo
- generische Vergleiche: Gesamt-, Preis-Leistungs- und Premium-Einordnung
- automatische Gewinner, Alternativen, Badges und Szenariokarten

Vor jeder Änderung werden Backups unter `.comparison-framework-2.1.0-backup` beziehungsweise neben migrierten Markdown-Dateien angelegt.
