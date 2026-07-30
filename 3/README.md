# PfotenTechnik Comparison Information Gain 20.1.0

Der Patch erweitert alle 24 Vergleichsseiten um konkrete, seitenspezifische Kaufberatung. Er enthält keine Änderungen an Layout, Komponenten, Produktdaten oder automatisch erzeugten Reports.

## Enthalten

- Entscheidungshilfen zwischen den tatsächlich verglichenen Modellen
- klare Ausschlusskriterien und nicht passende Einsatzfälle
- typische Fehlkäufe und praktische Vorabtests
- Alltagstipps zu Portionierung, Kühlung, Akkureserve, Reinigung und Ortung
- korrigierte Einordnung problematischer Empfehlungen
- aktualisierter redaktioneller Datenstand vom 30. Juli 2026

## Installation

ZIP in die Wurzel von `affiliate-template` entpacken. Danach zuerst die Vorprüfung ausführen:

```bash
node ./pfotentechnik-comparison-information-gain-20.1.0/apply-pfotentechnik-comparison-information-gain-20.1.0.mjs --check
```

Wenn `Konflikte: 0` erscheint:

```bash
node ./pfotentechnik-comparison-information-gain-20.1.0/apply-pfotentechnik-comparison-information-gain-20.1.0.mjs
```

Der normale Lauf führt die vorhandenen Vergleichs-, Metadaten-, Schema-, Content-Quality- und Linkziel-Audits sowie den PfotenTechnik-Produktions-Build aus.

## Optionen

```text
--check             Nur Vorprüfung
--force             Abweichende Vergleichsdateien nach Backup überschreiben
--skip-validation   Audits und Build auslassen
--commit            Nur die 24 Vergleichsdateien lokal committen
--help              Hilfe anzeigen
```

`--force` ist nur sinnvoll, wenn parallele Änderungen an den Vergleichsdateien geprüft wurden. Der Installer legt vorher vollständige Backups unter `.patch-backups/` an und erzeugt dort ein Rollback-Skript.

Ohne `--commit` bleibt der Git-Stand uncommitted. Ein Push oder Pull Request wird nie automatisch erstellt.
