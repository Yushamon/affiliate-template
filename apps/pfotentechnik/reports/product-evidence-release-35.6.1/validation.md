# Vollständige Validierung 35.6.1

Prüftag: 23.11.2026. Geprüfter Ausgangscommit `8f3bae47761007b9c5725f5a4add70ff0f898385`, Branch `main`.
Die fünf lokalen Inhaltsänderungen und das Befundregister aus 35.6 sind erhalten.

## Prüfumfang und isolierter Kandidat

Zum Start wurde die komplette App-Suite im tatsächlichen Arbeitsbaum ausgeführt: **1.222 Tests,
1.203 bestanden, 19 fehlgeschlagen**, keine übersprungen (`logs/app-before.log`).
Die ältere unabhängige Baseline aus 35.6 bestätigt drei Fehler vor den damaligen Inhaltsänderungen.

Während der Prüfung änderte der Nutzer parallel drei Dateien. Der Nutzer hat ausdrücklich festgelegt:
„Separat erhalten und aus 35.6.1 ausschließen“. Diese Dateien wurden nicht zurückgesetzt.
Der Kandidat unter `/tmp/pfotentechnik-release-35.6.1` enthält für genau diese drei Pfade den zum
Aufgabenstart belegten Stand. `excluded-local-changes.json` dokumentiert die Abgrenzung.
Alle abschließenden Ergebnisse gelten für diesen exakten Release-Diff, nicht für ein ungeprüftes
Deployment des gesamten parallel veränderten Working Trees.

Die isolierte Kopie verwendet dieselben installierten Abhängigkeiten; zwei Unicode-CSV-Dateinamen wurden
beim ersten Kopieren wegen Git-Pfadquotierung übersehen und anschließend unverändert kopiert.
Ein erster Zwischenlauf startete vor Abschluss des kalten Builds und war dadurch nicht aussagekräftig.
Ein Versuch, das gemeinsame Paket aus der Kopie zu symlinken, scheiterte an Astros virtuellen Style-Modulen;
die Kopie verwendet wieder echte Paketdateien. Diese E-Fälle wurden behoben und die endgültigen Prüfungen
anschließend in Abhängigkeitsreihenfolge durchgeführt. Keine Tests wurden deshalb deaktiviert.

## Ausgeführte Befehle und Ergebnisse

Alle einzelnen Kommandos, Arbeitsverzeichnisse und Exitcodes stehen in `validation-commands.json`.
Der vollständige Production Build wurde davor separat ausgeführt; Kommando
`npm run build:pfotentechnik`, Kandidaten-Root als Arbeitsverzeichnis, Exit 0 (`logs/build.log`).
**391 HTML-Dokumente**, kein Fast-Build.

- Gesamte finale App-Suite: **1.230/1.230 bestanden**, 0 fehlgeschlagen, 0 übersprungen.
- Core: **26/26 bestanden**.
- 35.6- und 35.6.1-Evidenzregressionen: **13/13 bestanden** (fünf plus acht).
- Content-Quality strikt: **269 indexierbare Seiten, 0 harte Fehler, 0 Warnungen**.
- URL-/Canonical-Konsistenz, Build-/Sitemap-Output, interne Links und interne Linkziele strikt: PASS.
- Vergleichsschema: PASS. JSON-LD sämtlicher 391 Dokumente zusätzlich parsebar.
- Product Standard 3: PASS mit ausgewiesenen Bestandswarnungen.
- Befundregister: zwölf Datensätze, 0 Fehler. Keine neuen Live-Statusbehauptungen.
- Entscheidungshinweisreport `--check`: PASS, Originalhinweise und Freigaben erhalten.
- Experimentverifikation: 20 äquivalente Dokumente, 205 Linkkanten, PASS.
- Zusätzlicher Kandidatenbeleg: **668 Quellen unverändert gegenüber Aufgabenstart**,
  genau fünf öffentliche Inhaltsunterschiede gegenüber dem Stand vor 35.6, unveränderte Canonicals,
  Robots-Signale, gesponserte Ziele und Routen (`candidate-proof.json`).

## Tatsächlich weiterhin rote Bestandsprüfungen

- Editorial-Lint strikt: Exit 1, **0 Fehler, 231 Warnungen**; Ausgangsstand ebenfalls 231.
- Produktdaten strikt: Exit 1, **14 Fehler und 120 Warnungen**.
- Operations strikt: Exit 1, **88 Fehler und neun Hinweise**.
- Altes Score-Audit: Exit 1; Konflikte zwischen expliziten Scores/Rating-Rohwerten und dem alten
  ungewichteten Mittelwert-/90+-Prüfvertrag.
- `ratings:check`: Exit 1, Ausführung scheitert am bereits fehlenden Paket `yaml` des bestehenden Skripts.

Die Produktdaten-, Operations- und Score-Logs sind **bytegleich** zu den unabhängigen unveränderten
Baselineläufen aus 35.6 (`independent-audit-comparison.json`). Sie sind keine neuen Fehler und werden
nicht als bestanden gezählt. Einzelne Auswirkungen und Folgeaufträge stehen in `remaining-issues.md`.
Keine Daten-/Scoremigration wurde zur Erzeugung grüner Ergebnisse durchgeführt.

## Render- und Releasegrenzen

Die fünf beabsichtigten Änderungen sind im finalen Hauptinhalt sichtbar. Der Vergleich schützt
sämtliche Affiliate-Ziele, Metadaten und Publikations-/Aktualisierungsdaten. Die korrigierten One-RFID-
Urteil-/Vorteilstexte und die CAT-FAQ werden konsistent in ihrem vorhandenen Schema ausgegeben.
Keine neue Route und kein neuer Redirect. Bewertungslogik, Produkt- und Vergleichsreihenfolge sind unverändert.

35.6.1 verändert keine Layout-, Komponenten- oder CSS-Quellen. Der frühere mobile 12-px-Überstand bei
offenen Produktdetails bleibt ein separat belegtes Bestandsproblem; der 35.6-Vergleich dokumentiert keine
zusätzliche Layoutregression. Es wird kein neuer Browserlauf in 35.6.1 behauptet.

Abschließender `git diff --check`: PASS. Automatisch neu geschriebene Alt-Auditdateien aus dem ersten
Lauf sind von beabsichtigten Snapshotänderungen getrennt; die ursprünglichen Auditdateien wurden erhalten,
die neuen Ausgaben unter `generated-audit-evidence/` gesichert. Keine Veröffentlichung und kein Push.
