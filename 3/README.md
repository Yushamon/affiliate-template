# PfotenTechnik Topical-Authority-Plan

## Installation

1. ZIP in das Root-Verzeichnis von `affiliate-template` entpacken.
2. Aus dem Repository-Root ausführen:

```bash
node 3/pfotentechnik-topical-authority/install-topical-authority-plan.mjs
```

3. Danach bauen:

```bash
npm --workspace apps/pfotentechnik run build
```

Die Aufgaben erscheinen anschließend im SEO-Copilot als priorisierte Work Packages.

## Inhalt

Der Plan berücksichtigt den aktuellen Repository-Stand:

- starke bestehende Cluster: Futterautomaten, GPS-Tracker, Trinkbrunnen
- größte echte Lücke: Katzenklappen
- fehlende kaufnahe Ergänzungen bei Trinkbrunnen
- Restlücken im GPS-Cluster
- notwendige Konsolidierung im Futterautomaten-Cluster
- begrenztes Glossar-System
- Hersteller nur gekoppelt an reale Produktabdeckung
- Haustierkameras und automatische Katzentoiletten als spätere Expansion

Der Installer erstellt vor Änderungen ein Backup unter `.patch-backups/`.
