# PfotenTechnik Topical Authority Quality 1.2.0

Enthält die Punkte 1 und 3:

1. Robuster Audit ohne Abhängigkeit von exakter CSS-Formatierung.
2. Verbesserte Clusterlogik mit gewichteten Primärsignalen, Typregeln,
   Ausschlüssen und Regressionstests.

## Installation

ZIP in den Repository-Root entpacken und ausführen:

```bash
node 2/install-topical-authority-quality-1.2.0.mjs
```

## Validierung

```bash
npm --workspace apps/pfotentechnik run test:topical-authority
npm --workspace apps/pfotentechnik run audit:topical-authority:strict
npm --workspace apps/pfotentechnik run build
```

Vor Änderungen wird ein Backup in `.patch-backups/` erzeugt.
