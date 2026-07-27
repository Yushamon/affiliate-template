# PfotenTechnik Product Operations Platform 1.0.2

Dieser Installer erweitert `Yushamon/affiliate-template` um die Preis-, Affiliate-, Verfügbarkeits-, Empfehlungs- und Pflegeverwaltung.

## Installation

Repository vorher aktualisieren und einen sauberen Arbeitsbaum sicherstellen.

### Windows PowerShell

```powershell
node .\apply-pfotentechnik-product-operations-platform-1.0.2.mjs --publish
```

### macOS / Linux

```bash
node ./apply-pfotentechnik-product-operations-platform-1.0.2.mjs --publish
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


## Hotfix 1.0.2

- erkennt das Produkt-Schema strukturell statt über einen fragilen Whitespace-Anker
- setzt eine durch 1.0.0 begonnene, aber vor dem ersten Commit abgebrochene Phase 1 sicher fort
- akzeptiert dabei ausschließlich unveränderte Dateien, die exakt dem mitgelieferten Phase-1-Payload entsprechen

## Hotfix 1.0.2

- setzt nach bereits committeden Phasen 1–3 direkt bei Phase 4 fort
- erkennt die von einem abgebrochenen Phase-4-Lauf erzeugten Test-, Dokumentations- und Auditdateien sicher
- behandelt bestehende globale Produkt- und Vergleichsaudits als informative Bestandsprüfung statt als Product-Operations-Blocker
- Product-Operations-Tests, Price-Intelligence-Tests, strikter Product-Operations-Audit und der Build bleiben verpflichtend
