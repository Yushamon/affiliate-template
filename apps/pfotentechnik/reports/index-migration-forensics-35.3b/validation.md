# 35.3B – Validierung

## Frisch ausgeführt

| Prüfung | Ergebnis | Evidenz |
| --- | --- | --- |
| Vollständige App-Tests: `npm --workspace apps/pfotentechnik test` | **1.005 bestanden**, 0 fehlgeschlagen, 0 übersprungen; einschließlich 14 neuer Migrationsregressionen | `tests.log` |
| Shared-Core-Tests: `npm run test:affiliate` | **26 bestanden**, 0 fehlgeschlagen | `core-tests.log` |
| Vollständiger PfotenTechnik-Produktionsbuild: `npm run build:pfotentechnik` | **374 Seiten**, erfolgreich | `build.log` |
| `audit-url-consistency.mjs --strict` | **259 indexierbare**, 115 noindex/Admin-HTML-Seiten; 0 Fehler, 0 Warnungen | `url-audit.log`, `url-consistency-validation.json` |
| `audit-release-build-output.mjs --strict` | **0 Fehler, 0 Warnungen**; öffentliche Host-, Canonical-, Sitemap-, Schema-/RSS-/Linksignale | `build-audit.log`, `build-output-validation.json` |
| Alle 96 Regeln gegen frisch gebaute Ziel-HTMLs | **96/96 bestanden**, 301, genau ein Hop, finale 200, eigenes Canonical, kein noindex; kein Redirectquellpfad in Sitemap | `local-redirect-validation.json` |
| Historische Live-GETs mit manueller Redirectverfolgung | **178 geprüft**, 102 bestanden, **76 Vertragsverletzungen** vor Deployment; keine Schleifen/temporären Redirects | `historical-http-live.json`, Einordnung in `technical-fixes.md` |

Die lokale Regelsimulation verwendet den tatsächlich gebauten `_redirects`-Inhalt und die gebauten HTML-Dateien. Sie ist keine Cloudflare-Emulation und kein Live-Nachher-Test. Die von den 49 historischen Pfaden verschiedenen 31 Ziel-/Kontroll-URLs umfassen die bestehenden Aliasziele und die zuvor falsche Übersicht als Kontrollziel.

## Wiederverwendete Prüfungen

35.3 hatte bereits alle 183 negativen GSC-URLs und sämtliche 259 Sitemapziele live geprüft, zusätzlich die damals 70 Legacy-Regelvarianten und Host-/404-Proben. 34.8 enthält echte September-Vorher-/Nachher-Belege. Diese Ergebnisse sind zeitlich eingeordnete Vorbefunde; sie ersetzen weder historische Deploymentartefakte noch die heutige gezielte Prüfung zusätzlicher Canonical-Fehlpfade.

Der ältere separate `audit-recommendation-engine-4.mjs` hat laut 35.4 zwei bereits im unveränderten HEAD fehlende Marker (`buildMoneyPageNextSteps`, `buildManufacturerNextSteps`). Dieser Legacy-Audit wird durch 35.3B nicht repariert und nicht als bestanden ausgegeben; die oben aufgeführte vollständige aktuelle App-/Core-Testsuite besteht.

## Datentreue und Schutz bestehender Arbeit

- Exakter Coverage-Abgleich: 278 verschiedene beobachtete URLs; heutige 259 Canonicals vollständig zugeordnet, 90 indexiert / 91 gecrawlt / 78 gefunden. 19 Varianten werden separat erhalten. Keine Statusübertragung über Redirects, Host- oder Slashnormalisierung.
- 27 alte migrierte/konsolidierte Content-/Advisorpfade ergeben 23 heutige Ziele; Vergleichsteil 21 → 17. Sieben zusätzliche Root-Aliase, 14 beschädigte Canonical-Pfade und ein ersatzlos entfallener Ratgeber werden getrennt klassifiziert.
- Original-GSC-Dashboardstände nach SHA geprüft; bekannte umgeschriebene Stände ausgeschlossen. Performancefenster überlappen und dürfen nicht summiert werden. Keine Google-selected Canonical erfunden.
- `1970-01-01` bleibt als Rohwert erhalten; kein echter Crawlzeitpunkt daraus abgeleitet. Coverage-Diagramm endet 23.10., einzelne URL-Crawldaten am 24.10.; Exportdatei vom 02.11.
- Vorhandene 35.4-Änderungen vor Beginn gehasht und nach Abschluss geprüft. Durch Build/Audits neu erzeugte Standardreports werden als Validierungsevidenz hier archiviert; zuvor unveränderte generierte Reports anschließend auf ihren Ausgangsstand zurückgesetzt.
- Kein Deployment, kein Push, keine externe Schreibaktion. Deshalb ist der aktuelle Livezustand nach den lokalen Aliasfixes ausdrücklich ungeprüft/unverändert.

## Dateien zur Prüfung

`historical-url-map.csv`: Pfad, heutiges Ziel, Evidenzklasse, Git-Entfernung, erster Redirect, Git-Lücke, tatsächliche Livekette und lokales Ziel. `index-status-comparison.csv`: vollständige 259er-Kohorte mit Status, Typ, Altersevidenz, Crawldatum und exakten alten Statuszeilen. `historical-gsc-observations.csv` sowie `gsc-exact-url-observations.csv`: ursprüngliche Identitäten ohne Statusübertragung. `historical-performance-observations.csv`: 3.104 passende historische Performancezeilen, getrennt von Coverage. Quellen und SHA-Werte: `evidence-manifest.json`, `historical-gsc-sources.json`, `coverage-source-catalog.json`.

Die komprimierte Git-Metadaten-Evidenz `git-content-history.json.gz` lässt sich mit `scan-git-history.py` aus der vorhandenen Git-Historie erneuern. Sie umfasst Blob-Identitäten, Slugs, Canonicals, Publikationswerte, Dateipfade sowie Autor-/Committerdaten. `malformed-path-history.json` bewahrt die tatsächlichen betreffenden Quellzeilen der drei entscheidenden Juli-Zustände. Git-Daten bleiben von Livebelegen getrennt.
