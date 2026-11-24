# Validierung und tatsächlich ausgeführte Prüfungen

## Ergebnisse

- Beide angehängten ZIPs per Python-Standardbibliothek `zipfile`/`csv` vollständig gelesen, keine Extraktion in bestehende Quellverzeichnisse; SHA-256 in `data-inventory.md`.
- Alle acht genannten Coverage-Meilensteine direkt in `Diagramm.csv` bestätigt. 192→70 ergibt 122 beziehungsweise 63,54 %. Letzter vorhandener Diagrammtag 16.11.; 23.11. ist der Exporttag.
- Sechs Ausschlussgründe summieren auf 351, mit 70 positiven insgesamt 421. Kategorien 130/74/57/80/7/3 stimmen. Die drei leeren frühen Indexwerte wurden nicht zu null gemacht.
- 92 Performance-Tageszeilen, 79 Impressionen, null Klicks; Länder-/Gerätesummen ebenfalls 79; Seiten 171, offengelegte Queries 19, Produkt-Snippets fünf als Teilansicht. Keine dimensionenübergreifende Addition.
- URL-Join: 269 aktuelle Sitemap-URLs, alle 259 alten enthalten; zehn Neuzugänge. 278 archivierte exakte Coverage-Identitäten, 49 historische Mappingzeilen und 52 neue Performance-URLs unter Wahrung ihrer Originalidentität zusammengeführt. Matrix: 332 eindeutige URLs, davon 63 historische/alternative; keine doppelten Schlüssel.
- Historische positive Kohorte 90; neue Performancezeile bei 36, ohne exportierte Zeile 54. Historisch gecrawlt negativ: elf/91 mit Zeile; gefunden negativ: zwei/78. Keine davon als heute indexiert oder nicht indexiert klassifiziert.
- 11 heutige Canonicals mit historischem Übergang negativ→positiv zwischen den archivierten Exporten. Kein historischer positiver Vorher-/aktueller negativer Nachher-URL-Beleg; Verlust-CSV deshalb null Datenzeilen.
- GSC-Konfigurationsprüfung gibt ausschließlich Präsenzbooleans aus: bestehende Loader einschließlich `.gsc`-Fallbacks liefern keinen Client, Token oder Konfiguration; `GOOGLE_SEARCH_CLIENT_ID`/`GOOGLE_SEARCH_CLIENT_SECRET` fehlen. Keine Secrets gelesen/ausgegeben, kein API-Aufruf, keine Quota beansprucht.
- Genau zwei neue HTTP-Abrufe für die aktuelle Canonical-Inventur, beide 200; kein neuer technischer Crawl. Keine neue Content-/Linkanalyse, kein Build und keine App-Tests **für diesen reinen Datenauftrag** erforderlich oder als SEO-Beleg ausgegeben.
- Bestehendes 20er-Experiment, Lock, Baseline und Evaluator gelesen. Veröffentlichung laut Nutzer erfolgt; genauer Livezeitpunkt und aktuelle Status-/Performance-Schnittfenster fehlen. Keine Inhaltsprüfung oder Änderungen an den Experimentseiten durch 35.7.

## Ausgeführte Werkzeuge/Befehle

`unzip -l` für beide Originalarchive; `rg --files` und gezieltes `rg` für 35.3–35.6, Inspection-/Deployment-/Backlink- und Monitoringquellen; `git status --short`/`git log` zur Abgrenzung. Python-Standardbibliothek für CSV-/XML-/SHA-/URL-Mengenprüfung. `node --input-type=module` mit dem bestehenden Search-Konfigurationsmodul für Präsenzprüfung (keine Ausgabe von Konfigurationswerten). `urllib.request` für die beiden Sitemapdateien. Die Analyse wurde mit `python3 /tmp/analyze-deindexation-35.7.py` erzeugt; zentrale Summen und Eindeutigkeiten sind im Skript assertiert. Google-Primärdokumentation zu Performanceaggregation und Inspection gelesen. Abschließende CSV- und Berichtskonsistenzprüfung sowie `git diff --check` separat ausgeführt.

Die Statusmatrix nennt ihre Originalquellen/Referenzdaten zeilenweise. Reproduktion der wesentlichen Zähler: `sum(Impressionen)` jeweils **innerhalb** einer Dimension; exakter URL-Join von `Seiten.csv` auf `indexation-feature-matrix.csv`; aktuelle Canonicals ausschließlich aus den zwei Sitemap-XMLs. Keine historischen Statuswerte aus heutigen Daten rekonstruiert.

## Abgrenzung paralleler Commerce-Arbeit

Während dieses Auftrags wurde die vom Nutzer erneut verlangte Commerce-Korrektur separat umgesetzt und real ausgeführt: serverseitiger Gesamtlauf über 110 Produkte, 70 Produkte/73 Quellen erfolgreich bestätigt, 40 Produkte ohne Erfolg; 74 Produktdateien ändern sich einschließlich Fehlversuchsmetadaten. Das ist kein 35.7-SEO-Eingriff und kein Indexierungsbeleg. Redaktionelle Inhalte/Scores blieben dabei geprüft erhalten. Die dafür ausgeführten 94 Regressionstests, Builds und Browserprüfungen sind keine Wiederholung des SEO-Audits. Bestehende und parallel gestagte Dateien werden nicht zurückgesetzt oder in einen SEO-Commit einbezogen. Von mir kein Staging/Commit/Push/Deployment/Indexierungsantrag.
