# Datenbestand und Prüfgrenzen · 23.11.2026

Primärquellen sind die tatsächlich angehängten ZIPs unter `/Users/boris.buckowitz/Downloads/`.
Der Auftrag nennt beim Coverage-ZIP zusätzlich `(1)`; bereitgestellt wurde die Datei ohne diesen Zusatz.
Sie ist vorhanden und wurde unverändert verwendet. ZIP-Zeitstempel sind Exportmetadaten, keine URL-Statuszeiten.

- `pfotentechnik.de-Coverage-2026-11-23.zip`: SHA-256 `7d2ce8bbb45865de3e5a780d5d9addbdfc85c8ae50df6f952108f1cd12de3b18`. Vier CSV-Dateien; 84 Diagrammtage vom 25.08. bis 16.11., erste drei Indexierungswerte fehlen. Sechs Ausschlusskategorien, keine URL-Liste. Metadaten: alle bekannten Seiten.
- `pfotentechnik.de-Performance-on-Search-2026-11-23.zip`: SHA-256 `5c30d3cff29fbea9f4f75d1147b891f841d6685ada1b8374c80c948b3b9caac3`. Sieben CSV-Dateien, 92 Tage vom 22.08. bis 21.11., 52 exakte Seiten, sieben offengelegte Suchanfragen, 22 Länder, zwei Geräteklassen. Filter: Web (textbasiert), letzte drei Monate. Keine Query×Seite-/Land×Seite-Matrix.
- 35.3, `google-index-recovery-35.3/`: technische Live-/Build-/Canonical-/Robots-/Sitemapbefunde vom 02.11. wiederverwendet. Die 183 Ausschlussbeobachtungen enthalten 169 damalige Canonicals und 14 Varianten. Keine neue Vollprüfung.
- 35.3B, `index-migration-forensics-35.3b/`: `gsc-exact-url-observations.csv` mit 278 exakten URLs und Statusspalten der Exporte 16.10./02.11.; `historical-url-map.csv` mit 49 Zuordnungen, darunter 27 migrierte Pfade mit 23 Zielen. HTTP-Belege vom 02.11. bleiben mit ihrem damaligen Datum gekennzeichnet. Bereits geprüfte Performance-Archive/Gitstände liefern keine zusätzliche Coverage-Historie.
- 35.4, `editorial-quality-recovery-35.4/inputs/`: 95 positive, 105 gecrawlte negative, 78 gefundene negative Original-URL-Zeilen; SHA-geprüfte Herkunft laut `input-manifest.json`. Die jeweiligen Diagramme enden am 23.10.; einzelne Crawlwerte reichen bis 24.10. **02.11. bezeichnet das archivierte Export-/Beobachtungsdatum, keinen bewiesenen URL-Statuszeitpunkt oder Google-Crawl jeder Zeile.** Status und Crawlzeit bleiben getrennt.
- 35.5, `indexation-gap-analysis-35.5/`: unveränderte Merkmalsmatrix für 259 Canonicals, `group-statistics.json`, Originalquellen-/Performancekatalog, Experimentlock und 20er-Baseline. Die Merkmale haben Referenzdatum 02.11.; sie werden weder neu gecrawlt noch als heutige Qualitätswerte ausgegeben.
- 35.6/35.6.1: Evidenz- und Freigabeberichte zur Abgrenzung genutzt; keine erneute Produkt-/Firmwareprüfung. Sie erklären keine Google-Statusänderung.
- **Neu erforderlich:** zwei öffentliche Sitemapabrufe vom 23.11. um 13:55:11 UTC: `sitemap-index.xml` und `sitemap-0.xml`, beide HTTP 200. Ergebnis: 269 aktuelle Canonicals; alle 259 alten noch enthalten, zehn hinzugekommen. Dies bestimmt den aktuellen Nenner und ist keine neue technische Gesamtprüfung. Lokales vorhandenes Sitemapartefakt stimmt in der URL-Menge überein.
- GSC-Zugang am 23.11. initial um 13:53:37 UTC und abschließend um 20:29:27 UTC geprüft: Die vorhandenen Loader `loadGoogleClient(false)`, `loadGoogleToken(false)` und `loadGoogleConfig(false)` liefern alle keinen Zugang. Dabei sind auch die Legacy-Pfade unter `.gsc` berücksichtigt. Die tatsächlich verwendeten Umgebungsvariablen `GOOGLE_SEARCH_CLIENT_ID` und `GOOGLE_SEARCH_CLIENT_SECRET` sind ebenfalls nicht gesetzt. Keine Inspection-API-Abfrage möglich, null Quotenverbrauch, keine Zugangsdaten ausgegeben. Kein interaktives Login begonnen.
- Keine geeigneten externen Backlink-/Referring-Domain-Zeitreihen unter `research`, `reports` oder `src/data` gefunden. Die Datei mit „comparison-global-backlink“ beschreibt interne Vergleichszuordnung, keine externen Backlinks. Keine Zahlen geschätzt.

## Identitäten und fehlende Werte

Exakte GSC-URLs bleiben unverändert: www, fehlender Slash und Altpfade werden nicht zu Coverage-Belegen einer Zielseite zusammengeführt. Zusätzliche Zielzuordnungen stehen separat mit Herkunft. Keine Statusübertragung über Redirects. Unbekannt ist `unknown` beziehungsweise leeres Messfeld, niemals `not-indexed` oder null Impressionen. `1970-01-01` ist ein fehlender Crawlwert, kein tatsächlicher Google-Crawl.

Ein konkreter Stichtagskonflikt ist sichtbar: Der positive 95er-Export wird als 02.11.-Archiv geführt, sein Diagramm endet aber am 23.10. mit 95. Der neue Propertyverlauf bestätigt am 23.10. ebenfalls 95, am 24.10. und 02.11. jedoch nur 89. Deshalb werden die 90 positiven heutigen Canonicals ausdrücklich als historische Exportkohorte behandelt, nicht als zeitgleicher 02.11.-Indexbestand. Google-selected Canonicals und einzelne Statuszeitpunkte fehlen; die Tabellen-Crawlwerte sind kein Ersatz.

Die Statusmatrix enthält 332 exakte Identitäten: 269 heutige Canonicals und 63 historische/alternative URLs. Alle aktuellen URL-Statuswerte bleiben unbekannt. Die jüngste **Property-Aggregation** endet am 16.11.; das Exportdatum 23.11. macht daraus keinen URL-Befund vom 23.11.

## Bewusst entfallene Wiederholungen

HTTP-/Robots-/Canonical-Vollaudit, Redirectmigration, 259er-Text-/Linkmetrikberechnung, Produktrecherche und erneute Experimentinhaltsprüfung: bereits beantwortet, kein neuer URL-Befund widerspricht ihnen. Wiederholt wurde ausschließlich die Sitemap-Inventur, weil 259 historische und 269 heutige URLs sonst falsch verglichen würden. Keine neue technische Einzelkorrektur begründbar.

Diese SEO-Auswertung schreibt ausschließlich in ihr Berichtsverzeichnis. Die separat erneut angeforderte Commerce-Fehlerbehebung und der echte Preisprüflauf vom 23.11. gehören nicht zu 35.7. Deren Produktänderungen dürfen nicht als SEO-Maßnahme oder Experimentwirkung interpretiert werden.

GSC-Tagesdaten behalten ihre Original-Datumslabels (Search-Console-Tagesaggregation in Pacific Time); keine scheinexakte Umrechnung in europäische Kalendertage. Erhebungszeitpunkte der eigenen Abrufe sind ausdrücklich UTC, der wöchentliche Plan nutzt das lokale Datum Europe/Berlin.

Die zehn Neuzugänge gegenüber 35.5, sämtlich ohne historischen 35.5-Status:

- `https://pfotentechnik.de/hersteller/brook/`.
- `https://pfotentechnik.de/hersteller/mova/`.
- `https://pfotentechnik.de/hersteller/philips/`.
- `https://pfotentechnik.de/hersteller/satellai/`.
- `https://pfotentechnik.de/produkt/brook-glass-pet-fountain/`.
- `https://pfotentechnik.de/produkt/catit-pixi-standard-trinkbrunnen/`.
- `https://pfotentechnik.de/produkt/mova-suretrack-pro/`.
- `https://pfotentechnik.de/produkt/philips-pet-series-paw3210-02/`.
- `https://pfotentechnik.de/produkt/satellai-collar-go/`.
- `https://pfotentechnik.de/ratgeber/technikgeschenke-haustiere/`.

Prüfsummen der unverändert wiederverwendeten Zuordnungseingaben:

- `indexation-gap-analysis-35.5/indexation-feature-matrix.csv`: `1fffb1032bdd028c3a2696e500b052b9b1ce1776a9fcded2bd4d11f013b9859f`.
- `index-migration-forensics-35.3b/gsc-exact-url-observations.csv`: `25e7f0cf319967e5331c50f2a99860a9cc154556c916dcf474e5895cdf352350`.
- `index-migration-forensics-35.3b/historical-url-map.csv`: `bbde612cc14d59e0a5b8e02c0b098a21680f1c630631501ada494d7b0669880b`.
