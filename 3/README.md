# PfotenTechnik Comparison Release Closure 14.0.11

Behebt den durch 14.0.10 ausgelösten YAML-Fehler und stellt den inzwischen
vorhandenen Ratgeber zu Trockenfutter/Nassfutter für Hunde wieder her.

## Enthalten

- Repariert fehlende Leerzeichen nach YAML-Schlüsseln, insbesondere `src:../../...`
- Erkennt die neue Hundefutter-Seite automatisch
- Verlinkt den tatsächlichen Canonical beziehungsweise Slug
- Stellt Trinkbrunnen-Vertiefungen nur wieder her, wenn die Zielseite real existiert
- Parst alle Vergleichs-Frontmatter vor dem Build
- Führt Build und Release-Audit aus
- Erstellt Backups und einen Report

## Ausführen

```bash
node 3/pfotentechnik-comparison-release-closure-14.0.11.mjs --check
node 3/pfotentechnik-comparison-release-closure-14.0.11.mjs
```

Ein Revert von 14.0.10 ist nicht nötig.
