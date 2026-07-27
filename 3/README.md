# PfotenTechnik Product Operations Platform 1.0.0

Dieser Installer erweitert `Yushamon/affiliate-template` um die Preis-, Affiliate-, Verfügbarkeits-, Empfehlungs- und Pflegeverwaltung.

## Installation

Repository vorher aktualisieren und einen sauberen Arbeitsbaum sicherstellen.

### Windows PowerShell

```powershell
node .\apply-pfotentechnik-product-operations-platform-1.0.0.mjs --publish
```

### macOS / Linux

```bash
node ./apply-pfotentechnik-product-operations-platform-1.0.0.mjs --publish
```

Der Installer:

1. erstellt `agent/product-operations-platform`,
2. migriert alle Produktdateien,
3. erstellt vier logisch getrennte Commits,
4. führt Tests, Audits und den PfotenTechnik-Build aus,
5. pusht den Branch und öffnet mit GitHub CLI einen Draft-PR.

Ohne `--publish` bleiben die geprüften Commits lokal. `--skip-build` ist nur für Diagnosezwecke vorgesehen und erfüllt nicht die Abschlusskriterien.

## Voraussetzungen

- Node.js ab 22.12
- installierte Workspace-Abhängigkeiten
- Git
- für `--publish`: GitHub CLI `gh` mit aktivem Login
- sauberer Git-Arbeitsbaum

Backups der ersetzten Dateien landen unter `.patch-backups/` und werden nicht committed.
