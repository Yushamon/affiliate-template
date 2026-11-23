# Technische Validierung

Prüftag 23.11.2026. Vollständiger Production Build: **391 HTML-Dokumente**, erfolgreich.
Die Abschlussprüfungen verwenden diesen Build; kein Fast-Build, Push oder Deployment.
Die Kommandozeilen und Exitcodes stehen in `validation-commands.json`, Rohlogs in `logs/`.

## Bestand gegen Endstand

- Vollständige ursprüngliche App-Suite mit ursprünglichen Inhaltsdateien und eigenem Production Build:
  **1.217 Tests, 1.214 bestanden, drei fehlgeschlagen** (`app-tests-baseline.log`, `build-baseline-verification.log`).
- Finale vollständige App-Suite: **1.222 Tests, 1.203 bestanden, 19 fehlgeschlagen**, keine übersprungen.
  Die fünf neuen gezielten Regressionen bestehen. **16 zusätzliche Fehlschläge** sind echte
  historische Byte-/Feld-/Berichts-Snapshotkonflikte durch die dokumentierten neuen Inhaltsänderungen.
  Sie werden weder als vorbestehend noch als bestanden ausgegeben. Details: `baseline-comparison.json`.
- Die drei Ausgangsfehler betreffen zwei Compact-Product-Checks, die nicht veröffentlichte Granary-2-Routen
  erwarten, sowie eine alte DOG-6-XL-Prüfung, die später hinzugekommene Fremdtests verbietet.
- Shared Core: **26/26 bestanden**.

Die historischen Tests und deren alten Quellmanifeste wurden nicht verändert. Dadurch gibt es ausdrücklich
**keine vollständig grüne Gesamtfreigabe**. Vor einem späteren Release müssen die neuen redaktionellen
Änderungen in die historischen Freigabeverträge integriert werden, ohne Score-, Angebots- und
Experimentschutz zu lockern. Neue Tests prüfen außerdem fehlende Live-Belege, Statushistorien,
alle GPS-Entscheidungshinweise und modellgebundene Firmwarezuordnung.

## Inhalts-, SEO- und Datenprüfungen

- Content-Quality strikt: 269 indexierbare Seiten, **0 harte Fehler, 0 Warnungen**.
- Editorial-Lint strikt: **0 Fehler, 231 Warnungen**; exakt dieselbe Anzahl wie vor der Änderung.
  Der Strict-Exitcode ist deshalb 1, nicht „grün“.
- Canonical-/URL-Konsistenz, Sitemap-/Build-Output strikt, interne Links und Linkziele, Vergleichsschema
  sowie redaktionelle Transparenz: bestanden. Build-Output: **0 Fehler, 0 Warnungen**.
- Product Standard 3: bestanden, Bestandswarnungen im Log ausgewiesen.
- Product-Data strikt: **14 Fehler, 120 Warnungen**; Operations strikt: **88 Fehler, neun Hinweise**.
  Die Ausgaben sind bytegleich zu den getrennten Läufen mit unveränderten Quellen.
- Alter Score-Audit: weiterhin fehlgeschlagen, komplette Ausgabe ebenfalls bytegleich zur Baseline.
  Keine Scores, Teilnoten oder Rankings verändert, keine automatische Rekalibrierung.
- `ratings:check`: scheitert bereits am fehlenden Paket `yaml` seines bestehenden Skripts.
  Keine neue Abhängigkeit zur Umgehung installiert.
- Produktdaten-/Affiliate-Invarianten: alle 110 Quellen verglichen. `score`, `rating`, `ratings`, `price`,
  `offers`, `affiliate`, `seo`, `productUrl`, `publishedAt` und `updatedAt` unverändert.
  Die gesponserten Ziele bleiben auch im kompletten HTML-Dokumentbestand identisch.
- Generierte Astro-Produktdaten für alle 14 GPS-Produkte auf Akku-/Versorgungskonsistenz geprüft:
  `generated-product-check.json`. Das ist getrennt von der realen Live-Prüfung.

## Render-, Schema- und Experimentbelege

`scope-and-render-validation.json` prüft alle 391 Dokumente. Genau fünf öffentliche Hauptinhalte ändern
sich; daneben ändern sich sieben interne Noindex-/Admin-Ansichten abgeleiteter Daten.
Alle vorgesehenen Ergänzungen sind als sichtbare Marker im finalen Hauptinhalt vorhanden.
Es entstehen keine neuen oder entfernten Routen, Canonicals, Robots-Signale oder gesponserten Ziele.

Review-/Offer-/AggregateRating-Werte bleiben geschützt. Beim One RFID ändern sich ausschließlich der
beabsichtigte Review-Urteiltext und die korrigierte erste positive Note; die CAT-FAQ wird konsistent
im FAQ-Schema aktualisiert. JSON-LD lässt sich parsen; Vergleichsschema-Audit besteht.

**20/20 Experimentquellen hashgleich**, darunter zehn Kontrollen. Die vollständigen DOMs bleiben nach
eng begrenzter Aliasnormalisierung derselben Bildquellen gleich. Drei Kontroll- und fünf Test-HTMLs sind
sogar roh bytegleich. Die übrigen unterscheiden sich ausschließlich durch Optimizer-Dateinamen wie
`hero`/`comparison`/`gallery-1` bei gleichem Eingangsbildhash und unveränderten HTML-Abmessungen,
Texten, Attributen, Linkzielen und Schema. Bildquellen, CSS und Komponenten wurden nicht verändert.
Vorher-Snapshots und Original-Experiment-HTML sind komprimiert archiviert. Diese Buildvariation wird
nicht als redaktioneller Eingriff oder Experimentergebnis ausgegeben.

## Mobile und Dark Mode

Je fünf tatsächliche Änderungsseiten, 360/390/1366 px und Light/Dark: **30 Vorher- und 30 Nachherprüfungen**.
Der strikte Einzelcheck besteht jeweils nur **14/30**: Produktseiten besitzen bereits vorher bei offenen
Details einen horizontalen Überstand von 12 px. **Kein zusätzlicher Überstand, kein zusätzlich defektes Bild,
keine Theme- oder H1-Regression** im Vergleich (`visual-comparison.json`).
Das Bestandsproblem wird nicht durch globale CSS-Änderungen außerhalb dieses Auftrags behoben.
Screenshots von mobilen Produkt- und Ratgeberansichten wurden visuell geprüft; beide Farbschemata bleiben erhalten.

## Nachweisqualität und Arbeitsbaum

Die Prüfung enthält reale Fehlerausgaben und keine pauschale Erfolgsbehauptung.
Automatisch aktualisierte alte Auditberichte wurden in `generated-audit-evidence/` kopiert und anschließend
auf ihren ursprünglichen Git-Stand zurückgestellt. Liste: `restored-generated-files.json`.
Vorherige Untersuchungen und 35.5-Locks bleiben unverändert. `git diff --check` besteht.
Das neue Befundregister validiert zwölf Datensätze ohne Fehler.

Reproduktion: `scripts/run-validation.py` führt die vollständigen Prüfungen gegen den aktuellen Build aus.
`verify-output.mjs --archived` reproduziert den bestandenen Vergleich ausschließlich aus den dauerhaften Snapshots. Die initiale Raw-HTML-
Arbeitskopie lag unter `/tmp/35.6-html-before.json.gz`. Die dauerhaften Vergleichssnapshots liegen im
Berichtverzeichnis. Ein neuer Quellenabruf mit `fetch-evidence.py` benötigt einen neuen Ausgabepfad und
überschreibt die Originalbeobachtung nicht. Browserchecks benötigen lokalen Listen-/Chrome-Zugriff.
