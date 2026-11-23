# Release-Gates

**Empfehlung: READY WITH KNOWN ISSUES.** Alle erforderlichen Gates sind für den dokumentierten,
isoliert geprüften Release-Diff erfüllt. Die strikt roten, nachweislich unabhängigen und nicht kritischen
Bestandsaudits K01–K06 werden nicht zu PASS umetikettiert; K07 bleibt eine Recherchefrage ohne Ergebnistransfer.
Die acht Gates sind keine automatische Veröffentlichungserlaubnis.

## G1 · PASS · Production Build

391 HTML-Dokumente, vollständiger Build Exit 0. Beleg: [logs/build.log](logs/build.log).

## G2 · PASS · Keine ungeklärten neuen Testfehler

1230 App-, 26 Core- und 13 gesonderte Evidenzprüfungen bestanden. Beleg: [logs/app-tests.log](logs/app-tests.log).

## G3 · PASS · Snapshot-Konflikte geklärt

Alle 16 Einzelentscheidungen umgesetzt; ursprüngliche Prüfungen aktiv und erfolgreich. Beleg: [snapshot-resolution.md](snapshot-resolution.md).

## G4 · PASS · Redaktionelle Korrekturen belegt

Fünf vorhandene 35.6-Revisionen beibehalten, Originalquellen erneut geprüft; Solo ohne Ergebnistransfer offen. Beleg: [source-checks.json](source-checks.json).

## G5 · PASS · Experiment unverändert

20 Quellen/HTML-Dokumente und 205 Zugänge erhalten; technische Aliasse nur mit Beweis normalisiert. Beleg: [candidate-proof.json](candidate-proof.json).

## G6 · PASS · Canonicals, Links und Schema

Strikte URL-/Sitemap-/Linkprüfungen und Schema erfolgreich; keine neue Route. Beleg: [logs/build-output.log](logs/build-output.log).

## G7 · PASS · Keine unbeabsichtigten Änderungen

668 Quellinvarianten; keine neuen Produkt-/Score-/Kauf-/Metadatenänderungen; drei Nutzerdateien ausgeschlossen. Beleg: [release-files.json](release-files.json).

## G8 · PASS · Befundregister konsistent

Zwölf gültige Datensätze; ursprüngliche Statuswerte unverändert, nur PTE-0011-Evidenz präzisiert. Beleg: [candidate-proof.json](candidate-proof.json).

Eine vollständig grüne App-Suite liegt vor; nicht sämtliche zusätzlichen Alt-Audits sind grün.
Die Freigabe gilt nicht für die drei ausdrücklich ausgeschlossenen parallelen Nutzeränderungen.
Kein Push, kein Deployment, kein Release und kein Indexierungsantrag wurden ausgeführt.
