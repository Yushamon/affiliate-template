# Indexation Gap Analysis & Recovery-Experiment 35.5

03.11.2026 · **259 Canonicals analysiert, zehn Testseiten überarbeitet, zehn Kontrollen unverändert. Kein Release.**

Die gefundene Gruppe ist deutlich jünger; bei bereits gecrawlten Seiten trennen Textlänge, Quellenzahl und Standardsprache indexierte von nicht indexierten Seiten nicht zuverlässig. Besonders Ratgeber sind in der negativen Gruppe sogar länger. Konkrete Entscheidungslücken rechtfertigen gezielte Arbeit, keine pauschale Qualitäts- oder KI-Abwertungsdiagnose.

- [Indexation Gap Analysis](indexation-gap-analysis.md): Tabellen, Effektgrößen, Typ-/Clustervergleich und alle zwölf Entscheidungsfragen.
- [Ähnlichkeitsanalyse](content-similarity-analysis.md) und [91er-Qualitätsevidenz](quality-evidence-review.md): Bereinigung, Textbelege, Gegenbeispiele und offene Prüfungen.
- [Externe Referenz](competitive-benchmark.md): fünf tatsächlich sichtbare und abgerufene Referenzen, Grenzen und korrigierter Catit-Slugverdacht.
- [Experimentauswahl](experiment-selection.md), [Änderungen](experiment-changes.md), [Baseline](experiment-baseline.csv): fester Seed, zehn Paare, Nutzen und Quellen.
- [56-Tage-Messplan](monitoring-plan.md): aktuelle Vor-Release-GSC-Messung noch manuell ergänzen; keine automatische Einreichung.
- [Validierung](validation.md) und [verbleibende Risiken](remaining-risks.md).

Build, 1.005 App-Tests, 26 Core-Tests, Content-Quality, SEO-/Schema-/Linkkontrollen und 60 Browserprüfungen bestanden. Strenger Editorial-Lint bleibt wegen 231 Bestandswarnungen rot (zuvor 232), ohne Fehler oder neue Warnungen. Genau zehn Contentdateien geändert; vorherige Arbeit erhalten.

## Daten und Reproduktion

`indexation-feature-matrix.csv` ist die vollständige Ausgangsmatrix; `feature-methods.json` erläutert die Indikatoren. `group-statistics.json` und `exploratory-effect-sizes.csv` enthalten alle betrachteten Strata. `historical-performance-observations.csv` wahrt originale Identitäten und Zeitfenster. `selection-input-feature-matrix.csv` erhält exakt den Stand, aus dem die Zuteilung erfolgte; anschließend ergänzte Provenienz-/Intent-/Performance-/Textbelegfelder änderten keine Zuteilung.

Die komprimierten Baselinearchive können mit `scripts/restore-analysis-inputs.py` in das aufgabeneigene temporäre Verzeichnis entpackt werden. `scripts/compare-groups.py` reproduziert die deskriptive Statistik aus der fertigen Matrix. `scripts/select-experiment.py` bestätigt bei vorhandenem Lock die Zuordnung, statt sie zu überschreiben. Der normale Vorher-Extractor verweigert ein Überschreiben nach dem Lock; für Renderkontrollen ist `--after` vorgesehen. SHA-Manifest: `evidence-manifest.json`.

Die Monitoring-Vorlage verwendet die Zustände `indexed`, `crawled-not-indexed`, `discovered-not-indexed`, `not-indexed`, `unknown`, `error` oder leer. Nur aus einem archivierten aktuellen GSC-Beleg eintragen, nie aus HTTP oder fehlenden Performancezeilen. Bis zur tatsächlichen Veröffentlichung und vollständigen 56-Tage-Beobachtung gibt es kein Experimentergebnis.
