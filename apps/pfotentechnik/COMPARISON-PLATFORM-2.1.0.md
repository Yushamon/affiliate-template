# Comparison Platform 2.1.0

Enthält Audit, Report, Integrity und Metadata.

## Befehle

```powershell
npm run comparison:audit
npm run comparison:audit:strict
npm run comparison:report
npm run comparison:integrity
npm run comparison:metadata:check
npm run comparison:metadata
```

Reports werden unter `reports/comparison-platform/` abgelegt.

Der Metadata-Migrator ergänzt nur fehlende `comparisonData`-Blöcke. Bestehende Daten werden nicht überschrieben.
