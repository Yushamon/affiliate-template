# Vorgesehener Release-Diff 35.6 / 35.6.1

Die Freigabe gilt für die einzeln aufgeführten Kandidatendateien, relativ zum Ausgangscommit
`8f3bae47761007b9c5725f5a4add70ff0f898385`. Sie gilt nicht für den gesamten aktuellen Branch.

Während der Prüfung wurde extern der lokale Commit `47bcdb6639bb0fc8e5e200059aa0524785ecb2ba` erstellt.
Er enthält auch die drei ausdrücklich ausgeschlossenen parallelen Produktänderungen sowie abgeleitete
Alt-Auditdateien. Dieser Auftrag verändert weder den Commit noch diese Dateien. Ein späteres Release
muss die hier abgegrenzten Dateiversionen verwenden; ein pauschales Veröffentlichen dieses Commits wäre
ein anderer, ungeprüfter Umfang.

## Redaktionelle Änderungen aus 35.6

Genau fünf bestehende Seiten: Granary Camera (F.A.Z.-Fremdtest und feste Kameraperspektive), Granary WiFi
(Firmware AF103/PLAF103), One RFID (Firmware/Modellbezug und begrenzte Futtertrennung), Tractive CAT 6 Mini
(manuelles LIVE in Bluetooth-Reichweite) und GPS-Funktionsratgeber (zuletzt übermittelter Akkustand).
35.6.1 ändert diese fünf Dateien nicht weiter. Kein neues Produkt und keine neue Seite.

## Prüfkorrekturen aus 35.6.1

Exakt gehashte Vorher-/Nachherrevisionen und eng begrenzte Feldfreigaben ersetzen veraltete historische
Ganzdateierwartungen. Ursprüngliche Dokumente bleiben komprimiert erhalten. Der historische Schreiblauf
verweigert jede Überlagerung neuerer Evidenz vor dem ersten Schreibzugriff. Aktuelle fachliche Verträge
werden zusätzlich direkt geprüft. Acht neue Regressionstests schützen die Grenzen.

Die drei alten Testfehler sind als überprüfbare Verträge korrigiert: tatsächliche Provisionsberechtigung
bestimmt sponsored; Entwürfe werden ausdrücklich nicht als öffentliche Seiten erwartet; DOG-6-XL-Evidenz
wird strukturell und inhaltlich auf Fremdtestkennzeichnung geprüft. Keine Produktfunktion geändert.

Der Experimentvergleich akzeptiert ausschließlich bewiesene Bildaliasidentitäten und nachweislich
unveränderte CSS-Bündel mit zwei vom Dateipfad abhängigen Astro-Scope-IDs. Komponentenquellen und
sämtliche sonstigen CSS-Bytes müssen identisch bleiben. Keine Normalisierung im Website-Output.

## Gezielte Snapshots

Fünf Dateien: Entscheidungshinweisreport 35.7 als JSON/Markdown (nur vier Quellhashwerte),
Indexationsreport 36.1 als JSON/Markdown und dessen Cockpit-Projektion. Inhaltliche Begründungen und
Originalfreigaben bleiben erhalten. Genau eine zusätzliche automatische Quellen-Titel-Verlinkung von
Granary Camera zu `/futterautomat-katze/`, keine entfernte Kante. Keine globale Snapshoterneuerung.
Die Original-Baselines und Experimentlocks aus 35.4/35.5 bleiben unverändert.

## Befundregister und Dokumentation

Zwölf Befunde aus 35.6; in 35.6.1 wird ausschließlich die P570-Handbuchzuordnung bei PTE-0011 präzisiert.
Alle Statuswerte bleiben erhalten. Kein Übergang von lokaler Korrektur zu live verifiziert.
Registervalidierung prüft Zeitfolge und tatsächliche Live-Quelle. Dokumentation erklärt die historischen
Prüfverträge. Die alten 35.6-Berichte bleiben unveränderte damalige Nachweise; die Folgeberichte enthalten
die vollständige Fehleranalyse, Rohlogs, Quellenabrufe, Ausschlüsse und Freigabegrenzen.

## Explizit ausgeschlossen

Die drei vom Nutzer parallel bearbeiteten Dateien Cat Mate Elite 355W, Catit PIXI Smart Trinkbrunnen und
PETLIBRO Air WiFi bleiben vollständig erhalten. Sie sind nicht Bestandteil des getesteten Kandidaten.
Zusätzlich sind sechs abgeleitete Alt-Auditdateien (CSS-Architektur, Product Standard 3, Image-Alt-Audit,
je JSON/Markdown) gegenüber dem Ausgangscommit außerhalb dieses Release-Diffs. Ihre aktuellen lokalen
Versionen bleiben erhalten; Prüfausgaben liegen separat im Nachweisverzeichnis. Vollständige Pfade und
Hashes: `final-scope-check.json` und `excluded-local-changes.json`.

## Prüfung unbeabsichtigter Effekte

668 relevante Quelldateien im Kandidaten stimmen mit dem Aufgabenstart überein, einschließlich aller
20 Experimentquellen, Komponenten, Bewertungslogik und Routingdateien. Gegenüber vor 35.6 entstehen
genau die fünf erwarteten öffentlichen Hauptinhaltsänderungen. 391 HTML-Routen, Canonicals, Robots und
gesponserte Kaufziele bleiben gleich. Keine neuen Redirects, Score-/Rankingänderungen oder
Metadatenänderungen. Vorhandene Schema-Ausgaben spiegeln die beabsichtigten FAQ-/Urteilstexte wider.
Der Indexations-Cockpitdatensatz ist die einzige beabsichtigte Änderung unter `src/data`.

## Vollständige Dateiliste

`release-files.json` enthält Kategorie und SHA-256 jedes Kandidatenpfads; `release-paths.txt` dieselben
Pfade zeilenweise. Diese zwei Manifestdateien enthalten zur Vermeidung einer Selbstreferenz keinen
eigenen Inhaltshash. Die übrigen Berichtshashes werden nach Abschluss aller Dokumente erfasst.
Kein Staging, Commit, Push, Deployment oder Release wurde durch diesen Auftrag ausgeführt.

Dateiumfang nach Kategorie:

- Dokumentation und Prüfnachweise: 185 Dateien.
- Gezielte Snapshot-Aktualisierung: 5 Dateien.
- Befundregister und Validierung: 2 Dateien.
- Testkorrekturen und Prüfverträge 35.6.1: 20 Dateien.
- Redaktion 35.6: 5 Dateien.

Einzelpfade:

- `apps/pfotentechnik/docs/editorial-findings.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/docs/product-evidence-validation.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/decision-facts-quality-35.7.json` — Gezielte Snapshot-Aktualisierung.
- `apps/pfotentechnik/reports/decision-facts-quality-35.7.md` — Gezielte Snapshot-Aktualisierung.
- `apps/pfotentechnik/reports/indexation-improvements-36.1.json` — Gezielte Snapshot-Aktualisierung.
- `apps/pfotentechnik/reports/indexation-improvements-36.1.md` — Gezielte Snapshot-Aktualisierung.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/README.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/candidate-proof.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/excluded-local-changes.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/existing-test-issues.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/experiment-integrity.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/final-scope-check.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/content-quality/cannibalization-report.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/content-quality/cannibalization-report.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/content-quality/content-inventory.csv` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/content-quality/content-inventory.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/content-quality/content-inventory.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/content-quality/indexation-decisions.csv` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/product-data-audit.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/product-data-audit.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/product-standard-3/product-standard-3-enrichment-latest.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/product-standard-3/product-standard-3-enrichment-latest.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/product-standard-3/product-standard-3-latest.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/product-standard-3/product-standard-3-latest.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/product-standard-3/product-standard-3-release-latest.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/product-standard-3/product-standard-3-release-latest.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/seo-release/build-output-latest.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/seo-release/build-output-latest.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/seo-release/preflight-latest.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/seo-release/production-http-latest.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/seo-release/production-http-latest.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/url-consistency/url-consistency-audit.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/reports/url-consistency/url-consistency-audit.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/research/indexation-improvements-36.1/image-alias-verification.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/generated-audit-evidence/research/indexation-improvements-36.1/verification.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/git-start.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/independent-audit-comparison.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/indexation-snapshot-edits.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/app-before.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/app-tests.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/build-output.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/build.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/candidate-proof.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/content-quality.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/core-tests.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/decision-facts.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/editorial-lint.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/evidence-tests.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/existing-corrections.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/experiment.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/findings.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/focused-1.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/guards.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/indexation-focused.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/internal-links.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/internal-targets.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/operations.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/product-standard.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/products.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/ratings.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/schema.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/scores.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/logs/url-consistency.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/original-test-failures.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/release-diff.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/release-files.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/release-gates.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/release-gates.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/release-paths.txt` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/remaining-issues.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/restored-generated-files.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/scripts/check-sources.py` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/scripts/run-validation.py` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/scripts/verify-candidate.mjs` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/snapshot-edits.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/snapshot-resolution.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/solo-model-verification.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/source-checks.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/starting-file-hashes.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/test-failure-analysis.csv` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/test-failure-analysis.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/test-failure-analysis.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/validation-commands.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-release-35.6.1/validation.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/README.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/affected-canonicals.csv` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/baseline-comparison.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/baseline.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/build-before-manifest.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/cross-product-error-audit.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/editorial-changes.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/evidence-ledger.csv` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/experiment-html-before.json.gz` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/content-quality/cannibalization-report.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/content-quality/cannibalization-report.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/content-quality/content-inventory.csv` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/content-quality/content-inventory.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/content-quality/content-inventory.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/content-quality/indexation-decisions.csv` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/design-system/css-architecture-latest.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/design-system/css-architecture-latest.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/internal-linking/internal-link-audit.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/internal-linking/internal-link-audit.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/internal-linking/internal-link-migration.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/internal-linking/internal-link-target-audit.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/internal-linking/internal-link-target-audit.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/product-data-audit.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/product-data-audit.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/product-standard-3/product-standard-3-latest.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/product-standard-3/product-standard-3-latest.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/seo-release/build-output-latest.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/seo/image-alt-audit-latest.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/seo/image-alt-audit-latest.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/reports/url-consistency/url-consistency-audit.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-audit-evidence/research/indexation-improvements-36.1/image-alias-verification.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/generated-product-check.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/independent-test-comparison.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/app-tests-baseline.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/app-tests.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/build-after.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/build-baseline-verification.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/build-before.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/build-output.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/comparison-schema.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/content-quality.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/core-tests.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/editorial-before.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/editorial-lint.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/editorial-transparency.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/evidence-regression.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/findings.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/internal-links.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/internal-targets.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/product-data-baseline.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/product-data.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/product-operations-baseline.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/product-operations.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/product-standard.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/ratings.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/scope-and-render.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/scope-archived-reproduction.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/scores-baseline.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/scores.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/source-access.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/url-consistency.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/visual-baseline.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/logs/visual.log` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/manufacturer-update-review.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/page-review.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/petlibro-firmware-review.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/remaining-issues.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/rendered-before.json.gz` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/research-findings.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/restored-generated-files.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/review-html-before.json.gz` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/scope-and-render-validation.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/scripts/fetch-evidence.py` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/scripts/run-validation.py` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/scripts/verify-output.mjs` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/scripts/visual-check.mjs` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/source-access.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/source-catalog.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/source-observations.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/tractive-accuracy-review.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/validation-commands.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/validation.md` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual-baseline/_produkt_petlibro-granary-camera-feeder_dark.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual-baseline/_produkt_petlibro-granary-camera-feeder_light.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual-baseline/_produkt_petlibro-granary-wifi-feeder_dark.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual-baseline/_produkt_petlibro-granary-wifi-feeder_light.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual-baseline/_produkt_petlibro-one-rfid-smart-feeder_dark.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual-baseline/_produkt_petlibro-one-rfid-smart-feeder_light.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual-baseline/_produkt_tractive-cat-6-mini_dark.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual-baseline/_produkt_tractive-cat-6-mini_light.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual-baseline/_wie-funktionieren-gps-tracker_dark.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual-baseline/_wie-funktionieren-gps-tracker_light.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual-baseline/results.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual-comparison.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual/_produkt_petlibro-granary-camera-feeder_dark.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual/_produkt_petlibro-granary-camera-feeder_light.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual/_produkt_petlibro-granary-wifi-feeder_dark.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual/_produkt_petlibro-granary-wifi-feeder_light.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual/_produkt_petlibro-one-rfid-smart-feeder_dark.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual/_produkt_petlibro-one-rfid-smart-feeder_light.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual/_produkt_tractive-cat-6-mini_dark.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual/_produkt_tractive-cat-6-mini_light.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual/_wie-funktionieren-gps-tracker_dark.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual/_wie-funktionieren-gps-tracker_light.png` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/reports/product-evidence-update-35.6/visual/results.json` — Dokumentation und Prüfnachweise.
- `apps/pfotentechnik/research/editorial-findings.json` — Befundregister und Validierung.
- `apps/pfotentechnik/research/product-evidence-35.6/changes.json` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/research/product-evidence-35.6/originals.json.gz` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/research/product-evidence-35.6/style-scope-reference.json` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/scripts/decision-consequences/report.mjs` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/scripts/indexation/verify.mjs` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/scripts/product-evidence/approved-changes.mjs` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/scripts/product-evidence/check-findings.mjs` — Befundregister und Validierung.
- `apps/pfotentechnik/scripts/product-evidence/style-scope-proof.mjs` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/scripts/product-freshness/apply.mjs` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/scripts/product-freshness/approved-changes.mjs` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/scripts/product-integration/verify.mjs` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/src/content/pages/wie-funktionieren-gps-tracker.md` — Redaktion 35.6.
- `apps/pfotentechnik/src/content/products/petlibro-granary-camera-feeder.md` — Redaktion 35.6.
- `apps/pfotentechnik/src/content/products/petlibro-granary-wifi-feeder.md` — Redaktion 35.6.
- `apps/pfotentechnik/src/content/products/petlibro-one-rfid-smart-feeder.md` — Redaktion 35.6.
- `apps/pfotentechnik/src/content/products/tractive-cat-6-mini.md` — Redaktion 35.6.
- `apps/pfotentechnik/src/data/seo/indexation-dashboard.json` — Gezielte Snapshot-Aktualisierung.
- `apps/pfotentechnik/test/compact-product-purchase.test.mjs` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/test/decision-consequences-35.9.test.mjs` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/test/editorial-evidence-update-35.6.test.mjs` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/test/external-evidence-batch-3-33.6.2.test.mjs` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/test/gift-guide-37.0.test.mjs` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/test/gift-guide-37.1.test.mjs` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/test/indexation-improvements-36.1.test.mjs` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/test/product-evidence-release-35.6.1.test.mjs` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/test/product-freshness-36.0.test.mjs` — Testkorrekturen und Prüfverträge 35.6.1.
- `apps/pfotentechnik/test/release-gate-37.4.test.mjs` — Testkorrekturen und Prüfverträge 35.6.1.
