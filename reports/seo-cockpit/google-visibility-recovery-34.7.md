# PFOTENTECHNIK 34.7 — GOOGLE VISIBILITY RECOVERY

Stand: 07.09.2026. **Der Einbruch beginnt am 25.07.; ein technischer Auslöser für den gesamten Domainverlust ist nicht bewiesen.** Drei aktuelle lokale Serving-/Konsolidierungsbefunde sind real: ein gelöschter Produktalias ohne Redirect, www mit 200 statt Hostredirect und ein Homepage-Fallback mit 200 für unbekannte Pfade. Eine eindeutig zuordenbare Alias-301 wurde lokal ergänzt. Keine Content-, Title-, Meta-, H1- oder Hoständerungen, kein Deployment.

**Datenstand ist nicht Berichtsdatum:** Der angekündigte Export vom 07.09. wurde weder in den bereitgestellten Dateien noch im Repository einschließlich versteckter Backups gefunden. Die aktuellsten lokalen Google/Bing-Payloads sind vom 03.09., Ende 02.09. GSC-Konfiguration, OAuth-Client und Token sind lokal nicht vorhanden; kein API-Abruf möglich. Nach dem Exportpfad wurde während der Arbeit gefragt. Positionen vom 03.09. und 05.09. bleiben Angaben aus dem Auftrag, keine hier verifizierten Exportwerte. Dieser Bericht ersetzt nicht die fehlenden Daten durch Schätzungen.

## TIMELINE

- **July visibility peak:** 13.–19.07. 339 Impressionen / 9 Klicks; 20.–26.07. 280 / 9. Das rollierende Fenster 18.–24.07. erreicht 366 / 11.
- **collapse begins:** 25.07. — von 74 Impressionen am 24.07. auf 2 am 25.07. (−97,3%), 5 am 26.07. und 8 am 27.07. Der Wochenvergleich 280 → 20 entspricht −92,9%.
- **current state:** 06.08.–02.09. 48 Impressionen / 0 Klicks, CTR 0%, Ø Position 33,0; 27.08.–02.09. 13 / 0. Am 02.09. eine Impression bei Position 2.
- **recovery evidence:** NEIN. Gute Positionen auf Einzelimpressionen ersetzen keinen über mehrere URLs anhaltenden Volumenanstieg.

| Zeitraum | Klicks | Imp. | CTR % | Ø Pos. | aktive Queries* | aktive URLs* | URLs ≤10* | URLs ≤20* | URLs mit Imp.* |
|---|---|---|---|---|---|---|---|---|---|
| 2026-07-13–2026-07-19 | 9 | 339 | 2.65 | 22.2 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| 2026-07-20–2026-07-26 | 9 | 280 | 3.21 | 20.5 | 53 | 93 | 40 | 61 | 93 |
| 2026-07-27–2026-08-02 | 1 | 20 | 5 | 51 | 11 | 18 | 9 | 9 | 18 |
| 2026-08-03–2026-08-09 | 0 | 17 | 0 | 36.4 | 7 | 11 | 4 | 5 | 11 |
| 2026-08-10–2026-08-16 | 0 | 5 | 0 | 19 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| 2026-08-17–2026-08-23 | 0 | 13 | 0 | 24.8 | 4 | 21 | 17 | 17 | 21 |
| 2026-08-24–2026-08-30 | 0 | 18 | 0 | 45.3 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| 2026-08-31–2026-09-02 | 0 | 2 | 0 | 11.5 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |

\* Nur offengelegte Zeilen eines exakt passenden Exports. UNKNOWN bedeutet fehlende Dimension, nicht 0. Das letzte Fenster enthält nur drei verfügbare Tage. Die Tabelle bis aktuell kann wegen des fehlenden 07.09.-Exports nicht weitergeführt werden. Positionen wurden mit Impressionen gewichtet, CTR aus Klicks/Impressionen berechnet. GSC-Reporting-Tage und Commitzeiten (+02:00) werden nicht als dieselbe Zeitzone oder als Deploymentzeiten interpretiert. URL-/Query-Zeilen sind keine vollständigen Propertyzählungen; mehrere URL-Impressionen können auf eine Property-Impression entfallen.

**Datenrebaseline:** 53 eindeutige historische Dashboard-Payloads (29 Google, 24 Bing) aus Git und einem zusätzlichen Originalbackup gesichtet. Die bestehenden JSON-Schnittstellen und `search/normalizer.mjs` werden wiederverwendet; keine zweite Importpipeline, keine Kopien kompletter Roh-Exporte. Tageswerte werden aus der jüngsten verfügbaren Beobachtung je Datum gelesen; überlappende Fenster nicht summiert. Kleinere nachträgliche Revisionen, etwa 325 → 326 Impressionen am frühen 15.–21.07.-Snapshot, sind separat erfasst.

**Wichtiger Integritätsbefund:** `3dc0987` (27.07.) und `dc73a31` (29.07.) ersetzten URL-Namen innerhalb bereits gespeicherter GSC-Payloads bei unverändertem `generatedAt`. Darunter waren künstliche `/vergleiche/-…`-Pfade. Zusätzlich ist der am 27.07. in `d50e45c` gespeicherte Export gegenüber dem zeitgleichen Originalbackup bereits umgeschrieben. Alle drei bearbeiteten Fassungen wurden aus URL-/Query-Auswertungen ausgeschlossen; die ursprünglichen Payloads bleiben enthalten. Dies erklärt falsche historische URL-Zuordnungen, nicht den Einbruch der Property-Tagesreihe. Siehe [Datenintegrität](visibility-34.7-evidence/data-integrity.json), [Quellenmanifest](visibility-34.7-evidence/source-manifest.json) und [Tagesdaten / Revisionen](visibility-34.7-evidence/timeline.json).

34.5, 34.6, frühere 34.0-Baseline, Recovery, Signal-Focus, SEO-Cockpit, Search-Reports, Quality Operations, Canonical-/URL-/Link-/Schema-/Content-Audits wurden als Kontext gesichtet; veraltete Prüfergebnisse nicht als aktuelle Validierung übernommen. Dateinachweise und Prüfsummen: [Reportinventar](visibility-34.7-evidence/report-inventory.json). Quality Operations meldet aktuell 152 aktive Findings, 0 Release-Blocker, 0 Regressionen; zwei fehlende Fachquellen werden dort ausgewiesen. Das ist keine Aussage über Googles Qualitätsbewertung.

## CHANGE CORRELATION TABLE

281 Commits mit öffentlichen Dateien zwischen 20.07. und 05.08. wurden anhand der Dateilisten und SEO-relevanten Diffs gesichtet; reine Admin-/Dashboard-Dateien sind nicht als öffentliche Contentänderungen gezählt. Die vollständige Tabelle enthält Datum, Commit, Bereich, Effekt, Evidenz und LOW/MEDIUM-Bewertung. [Alle Änderungen](visibility-34.7-evidence/change-correlation.md) · [Diff-Auszüge und Dateilisten](visibility-34.7-evidence/change-correlation.json).

| Datum | Commit / Änderung | Bereich | Potenzieller SEO-Effekt | Evidenz / Gegenprüfung | Wahrscheinlichkeit als Einbruchsbeitrag |
|---|---|---|---|---|---|
| 20.–24.07. | laufende Content-/Produkt-/Navigationsänderungen | mehrere Cluster / Templates | häufige Neubewertung, veränderte interne Signale | Quelldokumente 158 am 19.07. → 185 am 24.07.; keine Deploynachweise | MEDIUM |
| 23.07. 15:22 +02 | `0d4806c`: `petkit-yumshare-solo.md` gelöscht | historischer Produktalias | Ranking-/Linksignale erreichen den bestehenden gleichen Produktowner nicht über 301 | alte Datei heißt ausdrücklich YumShare Solo 2; 12 historische Impressionen, Ø9,3; live 200/Homepage | HIGH lokal, LOW als alleinige Domainursache |
| 23.07. 20:21 +02 | `4009be1`: SiteRuntimeFixes | globales Layout / JS | verändert Kaufberatungs-CTA und entfernt generische Statuszeile | Skript ersetzt weder Hauptcontent noch Canonicals/noindex; primärer Inhalt bleibt statisch | LOW |
| 24.07. 23:29 +02 | `fdd7f8b`: Nassfutter-Vergleich verschoben | Comparison / Redirect / Navigation | URL-Ownership und Recrawl ändern sich unmittelbar vor dem Tagesbruch | alte Route entfernt, neue Route plus 301 vorhanden; keine sitewide Sperre | MEDIUM |
| 25.07. 20:52 / 21:32 +02 | `bb47058`, `0225caf`: weitere Vergleichsredirects | Katzen/Hunde/zwei Katzen/ohne WLAN/Kamera | Bündelung alter Pfade auf `/vergleiche/` | strukturell real; spät am Bruchtag, nicht beweisbar davor deployed | MEDIUM |
| 25.07. 21:47 +02 | `a022fb5`: Canonical-Pfadnormalisierung / Sitemapfilter | Astro / beide Layouts / Head | absolute Pfade und Parameter konsolidiert; interne Admin/API/Error-URLs ausgeschlossen | bevorzugter Host unverändert; kein pauschales noindex; lastmod-Parsing verbessert | LOW |
| 26.–27.07. | `80de509`, `3dc0987`, `3f8db2d` und verwandte Moves | Produkte / Preise / Comparison-Plattform / Links | weitere Konsolidierung, zeitweilig fehlerhafte Pfad-Rewrites möglich | Großteil nach Bruchbeginn; `3dc0987` mutiert auch gespeicherte Suchdaten | LOW als Auslöser, MEDIUM für Fortdauer |
| 27.–31.07. | Layout-/CSS-/Navigations-/Foundation-Refactors | global / ProductExperience / Breadcrumb-/Linkumfeld | Darstellungs-/Prominenzänderungen, keine belegte Content-Crawlsperre | geprüfte Diff-Auszüge; aktuelles HTML vollständig; Änderungen überwiegend nach Bruch | LOW |
| 01.–05.08. | Produktgalerie, Katzenklappen, weitere Datenpflege | ProductExperience / Content / Media | weitere Produkt-/Layout-Neubewertung möglich | kein Beleg, dass diese späteren Änderungen den 25.07. verursacht haben | NONE als initialer Auslöser |
| vor Peak bis heute | kein PfotenTechnik-`404.html`; www-Redirect nicht im Repo | Cloudflare Pages Serving | unbekannte Pfade werden Homepage-Duplikate, www zusätzliche Hostvariante | aktueller Livebefund; keine Einführung am 25.07. nachgewiesen | LOW als datierter Auslöser |

`docs/MONOREPO.md` beschreibt Cloudflare Pages, Build `npm run build:pfotentechnik`, Output `apps/pfotentechnik/dist`. Verifizierte Deployment-IDs, Release-Zeitpunkte, Edge-/WAF-/Cache-Regeln und Botlogs sind nicht vorhanden. `server: cloudflare` bestätigt den aktuellen Edge, nicht seine historische Konfiguration. Commitkorrelation ist daher ausdrücklich keine Kausalität.

Quelldokumente: 140 (13.07.), 158 (19.07.), 185 (24.07.), 182 (25.07.), 183 (27.07.), 201 (05.08.), 246 aktuell. +32,1% bis 24.07. ist echte schnelle Expansion; Umzüge zwischen Collections beeinflussen die Anzahl. Kein Nachweis, dass Google diese Menge als „zu viel“ wertet. [Expansion](visibility-34.7-evidence/content-expansion.json).

## HOST / CANONICAL — WWW / NON-WWW DIAGNOSTIC

- **preferred host:** `https://pfotentechnik.de` — Astro `site`, Projekt-Domain, Layout-Canonical und robots/Sitemap sind konsistent.
- **www status:** HTTPS-www antwortet 200; auch die geprüfte Mehrkatzen-Unterseite. Canonical und OG zeigen jeweils denselben non-www-Pfad.
- **current problem: YES** — fehlende Hostweiterleitung plus unbekannte Pfade mit 200; keine fehlerhafte Canonical-Angabe auf den vorhandenen geprüften Canonical-Seiten.

| Aufruf | Kette | Ziel / Canonical |
|---|---|---|
| `http://pfotentechnik.de/` | 301 → 200 | HTTPS non-www / self |
| `https://pfotentechnik.de/` | 200 | non-www / self |
| `http://www.pfotentechnik.de/` | 301 → 200 | HTTPS **www** / Canonical non-www |
| `https://www.pfotentechnik.de/` | 200 | www bleibt erreichbar / Canonical non-www |
| `/trinkbrunnen-fuer-mehrere-katzen` | 308 → 200 | Slashvariante / self |
| Mehrkatzen-Pfad mit `?utm_source=…` | 200 | parameterfreier non-www-Canonical |
| `/futterautomat-ohne-wlan/` | 301 → 200 | `/vergleiche/beste-futterautomaten-ohne-wlan/`, self |
| `/ratgeber/futterautomat-ohne-wlan/` | **200** | Homepage / Homepage-Canonical; kein historischer GSC-Beleg für diesen Pfad |
| zufälliger nicht vorhandener Pfad, `/404/` | **200** | bytegleiche Homepage / Homepage-Canonical |
| `/produkt/petkit-yumshare-solo/` | **200 vor Deployment** | Homepage; lokale neue 301 noch nicht veröffentlicht |
| `/was-tun-wenn-der-futterautomat-klemmt/` | **200** | Homepage; Löschung bereits 16.07., 4 historische Impressionen |

Zeitgestempelte Header, Ketten, Canonicals und Body-Hashes: [Live-HTTP-Evidenz](visibility-34.7-evidence/live-http.json). Die erste DNS-Sandboxabfrage scheiterte; obige Ergebnisse stammen aus den anschließend erfolgreich ausgeführten externen HTTP-GETs. Kein nachgeahmter Googlebot-Zugriff; botabhängige WAF-Regeln bleiben ungetestet.

**Hosthistorie:** Der Originalexport 15.–21.07. enthält 9 www-Seitenzeilen, 23 Impressionen und 1 Klick. Im damaligen längeren Fenster sind es 11 Zeilen / 57 Impressionen / 1 Klick. Fenster nicht addieren. Seit dem neuen Suchnormalisierer am 22.07. werden Host, Protokoll und Parameter aus `page` entfernt. Aktuelle www-Impressionen sind deshalb **UNKNOWN**, ausdrücklich nicht „nur historisch“. [Unveränderte www-Belege](visibility-34.7-evidence/historical-www.json).

**Gesamtsuche:** 45 Vorkommen im Arbeitsbaum einschließlich versteckter Backups, jeweils klassifiziert: Normalisierer/Audits, Tests, Admin-Anzeige oder inaktive Backups; kein aktiver öffentlicher Contentlink auf www. Dependencies, Git-Objektdatenbank und Buildcache ausgeschlossen; generiertes HTML separat geprüft. [Jedes Vorkommen mit Datei/Zeile](visibility-34.7-evidence/www-repository-occurrences.json). Auf allen 258 gerenderten Canonical-Seiten null www-Referenzen, damit auch keine www-URLs in JSON-LD/OG/Ankern. Kein hreflang vorhanden. RSS und robots/Sitemap-Verweise ebenfalls non-www.

**404-Ursache:** Es fehlt ein Top-Level `404.html` im Build. Das beobachtete 200/Homepage-Verhalten entspricht dem dokumentierten Cloudflare-Pages-SPA-Fallback ohne diese Datei. Das ist eine stark gestützte Serving-Erklärung, keine bestätigte Einführung am Einbruchstag. [Cloudflare: Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/).

Keine Hostmigration implementiert. Für eine separate Korrektur zuerst tatsächliche Edge-Regel-/Deployzuständigkeit prüfen; dann www-Pfad und Query unverändert nach apex weiterleiten. Für unbekannte Pfade einen echten 404-Response herstellen und auf Preview/Edge testen. Keine Catch-all-301 zur Homepage und kein Erraten eines Ersatzpfads für gelöschte Ratgeber.

## GOOGLE DISCOVERY / INDEXABILITY

Frischer Produktionsbuild: **371 HTML-Routen, 258 indexierbare Canonical-Seiten, 113 beabsichtigte noindex-/interne Routen**. Live- und Build-Sitemap enthalten exakt dieselben 258 URLs. Keine Sitemap-Candidate-URL mit alternativem Host, noindex oder falschem Canonical im lokalen Audit; keine Canonical-Ketten oder mehrfachen Canonical-Ziele. Alle 258 Hauptinhalte stehen in servergeneriertem HTML, alle haben mehr als 100 main-Wörter; keine exakten main-Duplikate. Der bestehende Content-Audit meldet zusätzlich 0 Near-Duplicate-/Intent-/Owner-Konflikte. Das beweist keine umfassende redaktionelle Qualität und keine Google-Indexaufnahme.

Robots: `Allow: /`, korrekter Sitemapverweis. Auf den geprüften Live-Seiten kein X-Robots-Tag/noindex. lastmod: keine zukünftigen Werte, 12 Sitemap-URLs ohne lastmod, übrige aus Contentdaten; kein pauschales tägliches Aktualisieren aller URLs. Der Sitemapindex trägt das Builddatum. Die in der Kohorte dokumentierten Gitdaten sind getrennt vom redaktionellen `updatedAt`: die letzte größere Änderung ist ein transparenter Proxy (≥40 hinzugefügte+gelöschte Quellzeilen), kein sicherer semantischer Rewrite-Nachweis.

**Auditgrenze:** Bisherige grüne Prüfungen kontrollieren gebaute URLs und bekannte Redirects. Sie erkennen weder unbegrenzt viele unbekannte 200-Homepfade noch einen gelöschten historischen GSC-Pfad ohne Redirect automatisch. Die neue Diagnostik ergänzt genau diese Lücke. 258/258 Sitemapparität ist kein Beweis für 258 im Google-Index. URL Inspection, Google-selected canonical, Crawlingstatistik, Seitenindexierung, manuelle Maßnahmen und Security-Reports fehlen.

Gerenderter Graph: 5.886 sinnvolle Header/Main-Kanten; 7.110 All-document-Kanten; ein echter Orphan `/futterautomat-berater/`, vier schwache Seiten. Alle erreichbaren indexierbaren Seiten maximal drei Klicks tief; der Orphan und eine bewusst wenig prominente Utility werden separat erfasst. Kein gemessener GSC-Bedarf des Orphans, deshalb kein unbegründeter Linkumbau. [Rendering / Sitemap / Hostprüfung](visibility-34.7-evidence/rendering-host-sitemap.json) · [Validierung](visibility-34.7-evidence/validation.json).

## TOP-RANKING COHORT

- **URLs analyzed:** 118 historische URL-Identitäten; 107 unterschiedliche heutige Zielpfade, inklusive eines noch ungeklärten gelöschten Ratgebers. Aliasse bleiben als historische Identitäten sichtbar und werden nicht zu künstlichem Traffic addiert.
- **Top 10 signals:** 94 mit mindestens einem beobachteten Fenster-Mittel ≤10; im einheitlichen aktuellen 3m-Kontext nur 59, im 28d-Kontext 20. Häufig 1–wenige Impressionen, keine 94 stabilen Top-10-Rankings.
- **Top 20 signals:** 104 mit mindestens einem Fenster-Mittel ≤20.
- **strongest cluster:** Nach absoluter Zahl **Futterautomaten** (55 Kohorten-URLs, 45 Top-10-Fenstersignale); Trinkbrunnen besonders dicht (26, davon 23; 17 im einheitlichen 3m-Kontext). Damit wird die Trinkbrunnen-Hypothese gestützt, aber eine absolute Führung nicht behauptet.

[Komplette lesbare Kohorte](visibility-34.7-evidence/cohort.md) · [Alle verlangten Felder einschließlich Queries, Hubs, Canonical, Sitemap, Änderungsdaten und Überlappungen](visibility-34.7-evidence/cohort.json).

**Muster:** Im vergleichbaren Seitenexport fallen 20.–26.07. → 27.07.–02.08. Produkte von 44 auf 4 Seitenimpressionen, Guides von 94 auf 3 und Vergleiche von 126 auf 12. Der Verlust betrifft also mehr als das Vergleichstemplate. Diese Seitenzählungen sind keine Propertysummen. [Templatevergleich](visibility-34.7-evidence/template-patterns.json).

Starke interne Verlinkung allein stabilisiert nicht: `/smarte-futterautomaten/` hat 257 sinnvolle eingehende Seiten, aber aktuell nur 3 Impressionen im 28d-Fenster; Eversweet Ultra erhält mit 4 Eingängen weiterhin 2 Impressionen bei Position 8. Mehrkatzen, Material und mehrere ältere Guides sind im aktuellen Fenster nicht offengelegt. Für „ältere URLs sind stabiler“ oder „größere letzte Änderung verursacht Verlust“ reichen die fehlenden aktuellen Zeilen und die häufigen gemeinsamen Eingriffe nicht; kein statistisch belastbarer Alter-/Link-/Rewrite-Effekt.

## TRINKBRUNNEN CLUSTER

53 bestehende Clusterseiten einschließlich Hubs, Produkte, Vergleiche und Ratgeber geprüft. **Die 6/6 NO-CHANGE-Entscheidungen aus 34.6 bleiben bestehen.** Auch im aktuellen 28d-Export bis 02.09. fehlt jede dieser sechs Seitenzeilen; nicht als 0-Impressionen-Beweis auslegen. Kein konkreter neuer Intent- oder CTR-Fehler nachgewiesen.

Mehrkatzen deckt Anzahl/Verteilung ab; Wasserstellen allgemeine Standorte; laute Pumpe Symptomdiagnose; Pumpenreinigung Wartung; ohne Filter Betrieb/Folgekosten; Kalk Entkalkung; Materialvergleich Hygiene/Materialwahl. Produktseiten besitzen Marken-/Modellintents, die Vergleichsseiten Auswahlintents. Die offengelegten 3m-Querypaare bestätigen mehrere dieser Zuordnungen, aber nicht vollständige Queryabdeckung jeder URL. Materialguide und Edelstahlprodukt sind ohne geteilte problematische Query kein Kannibalisierungsfall.

53/53 über den vorhandenen Clustergraph erreichbar; relevante Seiten liegen in Tiefe 1–3. Die Mehrkatzen-Seite hat 32 sinnvolle Eingänge, laute Pumpe 7, Materialvergleich 22; konkrete gerenderte Main-Anker sind im Cluster-JSON nachprüfbar. Keine thematische Isolation und kein belegter falsch zugeordneter Anker. Breite Queries „katzenbrunnen vergleich“ und „beste katzenbrunnen“ verteilen sich auf Hub und Vergleich: **POSSIBLE**, kein Nachweis wiederholt schädlicher Wechsel. [Clusterbericht](visibility-34.7-evidence/trinkbrunnen-cluster.md) · [Anchor-Texte, Hub-/Spoke-Kanten und Einzelseiten](visibility-34.7-evidence/trinkbrunnen-cluster.json).

## GOOGLE VS BING

| Fenster | Google Klicks / Imp. / Pos. | Bing Klicks / Imp. / Pos. | URL-Overlap | Google-only* | Bing-only* | exakter Query-Overlap |
|---|---|---|---|---|---|---|
| 06.08.–02.09. | 0 / 48 / 33,0 | 4 / 74 / 5,2 | 7 | 22 | 20 | 0 |
| 05.06.–02.09. | 20 / 732 / 23,7 | 4 / 74 / 5,2 | 20 | 113 | 7 | 1 |

\* „only“ bedeutet nur in den bereitgestellten Zeilen dieses Fensters beobachtet. Bing liefert im 3m-Fenster lediglich vier periodische August-/Septemberbeobachtungen; kein vergleichbar vollständiger Juli-Kontrollzeitraum. Seine älteren lokalen Payloads waren teils leer und belegen nicht, dass Google und Bing im Juli identisch crawlen konnten. Keine Interpolation der periodischen Bingpunkte auf Kalendertage.

Der 28d-Overlap umfasst die Katzen-/Zwei-Katzen-Futterautomatenvergleiche, PETKIT Eversweet Ultra, PETLIBRO One RFID sowie drei Tier-Ratgeber. Die einzige exakte Queryüberschneidung im längeren Fenster ist **„petkit eversweet ultra“**. Bing-Klicks sind auf Brunnenreinigung, filterlosem Brunnen, Pumpenreinigung und GPS-Funktionsratgeber belegt. Kommerzielle Produktseiten erhalten Bing-Impressionen, aber im aktuellen Export keinen belegten Produktklick; keine Conversion-/Umsatzdaten vorhanden.

**meaningful divergence:** Bing hat im gleichen aktuellen Zeitraum 4 Klicks und 74 Impressionen bei besseren beobachteten Positionen, Google 0 / 48. Das spricht gegen eine universelle Unzugänglichkeit und gegen vollständiges Intent-Versagen aller Inhalte. Die kleinen, verschiedenen Querymengen beweisen weder gute Conversion noch eine ausschließlich Google betreffende technische Ursache. Bing hat keine pageQueries-Dimension; keine erfundenen Bing-Query→URL-Verknüpfungen. [URL- und Querymengen mit Einzelmetriken](visibility-34.7-evidence/google-vs-bing.json).

## CANNIBALIZATION

- **CONFIRMED: 0** Fälle eines wiederholt schädlichen URL-Wechsels.
- **POSSIBLE: 11** echte Query-Überlappungskandidaten; darunter Katzenbrunnen-Vergleich, Futterautomat-Katze-Vergleich, Hund-Test, Marken-/Hub-Mix. Nicht pauschal als Ursache bewerten.
- **NO EVIDENCE: 3** historische Aliasgruppen: Zwei-Katzen-Futterautomat, Katze-Test alt/neu, YumShare Solo-Kamera alt/neu. Gleicher aktueller Owner nach den bekannten bzw. hier ergänzten Redirects, kein Modellgenerationenkonflikt.

Die Analyse verwendet tatsächliche `pageQueries` aus Originalfenstern, vereinheitlicht nur Queryschreibweise und zeigt unabhängige 7d-Fenster, soweit sie eine offengelegte Zuordnung besitzen. Für die meisten Kandidaten existieren nur überlappende 3m-Beobachtungen, keine auswertbare Wechselzeitreihe. Ein fehlender Wochenquery wird nicht als Wechsel interpretiert. Kein bestätigtes Product-vs-Guide- oder Produktgenerationsproblem. Der Solo-Alias wurde laut alter Datei bereits als Solo **2** bezeichnet: die 301 korrigiert einen ausgelassenen Umzug, keine neue Inhaltszusammenlegung. [Query-to-URL-Beobachtungen und Klassifikation](visibility-34.7-evidence/query-url-analysis.json).

## ROOT CAUSE — DECISION MATRIX

**confirmed:** lokale Serving-/Aliasfehler und ein nachträglich veränderter Export; **keine bestätigte sitewide Einbruchsursache**. **likely:** URL-Konsolidierung als lokaler Mitfaktor. **possible:** breite Neubewertung nach Expansion/Migration, Discovery-/Trust-Volatilität. **rejected als aktueller Befund:** sitewide noindex, robots-Sperre, fehlender HTML-Hauptcontent, Sitemap-Hostkonflikt, bewiesene Kannibalisierung. Historische Edge-Ausfälle oder andere Google-interne Bewertungen sind damit nicht ausgeschlossen.

Confidence ist die subjektive Sicherheit, dass die Kategorie wesentlich zum **gesamten Domainverlust** beitrug — nicht die Sicherheit, dass ein lokaler Defekt existiert. Keine gemessenen Wahrscheinlichkeiten, keine auf 100 zu summierenden Anteile.

| Ursache | Evidenz dafür | Evidenz dagegen | Confidence 0–100 | mögliche Auswirkung | Handlungsbedarf |
|---|---|---|---|---|---|
| technischer Fehler | Solo-Alias am 23.07. gelöscht, heute 200/Startseite; unbekannte Pfade ebenfalls 200. | 258 vorhandene Canonicals technisch sauber; nur 12 historische Solo-Impressionen; kein Ausfall- oder Crawlprotokoll. | 35 | Lokaler Verlust belegt; sitewide Wirkung unbewiesen. | Solo-301 vorbereitet; 404-Serving separat beheben/verifizieren. |
| Host-/Canonical-Problem | www und apex gleichzeitig 200; frühe Originalexporte enthalten www. | www Canonical/OG zeigen korrekt apex; kein aktueller Hostsplit verfügbar. | 30 | Zusätzliche Konsolidierungsarbeit möglich. | Keine Hostmigration; Edge-Regel und Google-selected canonical prüfen. |
| Sitemap-/Discovery-Problem | URL-Migrationen und fehlender 404-Fallback können Discovery verwirren. | Live und Build exakt 258 kanonische URLs, robots Allow, keine zukünftigen lastmod. | 15 | Keine aktuelle Sitemap-Sperre belegt. | Sitemap beibehalten; Alt-URL-Recovery beobachten. |
| Rendering-Problem | Historische JS-Nachbearbeitung ab 23.07.; Edge-SPA-Fallback für unbekannte Pfade. | Primärinhalt und Links auf allen 258 kanonischen Seiten im HTML, keine leeren main-Bereiche. | 5 | Kein client-only Hauptcontentfehler belegt. | Keine Template-/JS-Umbauten. |
| interne Verlinkung | Ein echter Orphan /futterautomat-berater/; vier schwache URLs. | Rankende Kohorte erreichbar, tiefe Seiten überwiegend <=3; keine Isolation der Trinkbrunnen-Ziele. | 15 | Lokaler IA-Befund, keine plausible Gesamterklärung. | Orphan-Ownership separat prüfen, keine kosmetischen Links. |
| Kannibalisierung | 11 Query-Überlappungskandidaten nach Aliasbereinigung. | Keine wiederholten schädlichen Wechsel in unabhängigen Zeitfenstern nachgewiesen; 3 Aliasfälle keine Konkurrenz. | 10 | Kleine Intent-Reibung möglich, nicht belegt. | Keine Zusammenlegung, keine Titles ändern. |
| Sitewide Qualitätsproblem | Knappe Google-Ausspielung trotz Contentumfang; redaktionelle Evidenz historisch teilweise unvollständig. | Passende Top-10- und Bing-Signale; lokale QA ohne harte Fehler. QA misst nicht Googles Qualitätsurteil. | 25 | Mögliche Neubewertung; nicht diagnostiziert. | Keine pauschale Content-Reaktion; ausgewählte URL-Inspection. |
| Thin/Duplicate Content | Unbekannte URLs liefern identische Homepage; das erzeugt technische Duplikate. | 258 kanonische main-Inhalte >100 Wörter, keine exakten main-Duplikate; Content-Audit ohne Near-Duplicate-Konflikte. | 15 | Serving-Duplikate konkreter als Thin-Content-Hypothese. | 404-Fallback als gesonderten technischen Auftrag behandeln. |
| algorithmischer Neubewertungstest | Abrupter Volumenverlust, einzelne relevante Rankings bleiben; mehrere Seitentypen betroffen. | Kein bestätigtes Update, keine Google-interne Klassifikation; technische/strukturelle Alternativen offen. | 50 | Kompatible Arbeitshypothese, kein Nachweis eines Google-Tests. | Stabil halten, 14 Tage getrennte Kohorten beobachten. |
| junge Domain / Trust | Kurze beobachtete Suchhistorie; großer relativer Ausschlag bei kleinem absoluten Volumen. | Registrierungsalter und externe Autorität unbekannt; Repositoryalter ist nicht Domainalter. | 40 | Plausible, schwach messbare Alternative. | Nicht als erwiesene Sandbox/Trust-Sperre bezeichnen. |
| zu große Content-Expansion in kurzer Zeit | 140 auf 185 Quelldokumente zwischen 13. und 24.07. (+32,1%); 201 am 05.08. | Quelldokumente sind keine indexierten URLs; Zuwachs kann angemessen sein, kein Grenzwert belegt. | 35 | Expansion plus Migration als Neubewertungsfaktor möglich. | Keine weitere Expansion als Recovery-Maßnahme. |
| externe Signalschwäche | Geringes Suchvolumen kompatibel mit wenig externer Bekanntheit. | Kein Backlink-, Referral- oder Link-GSC-Export; keine Messung vorhanden. | 25 | Nicht quantifizierbar. | Datenlücke schließen, keine spekulative Linkkampagne. |
| normale Discovery-Volatilität | Einzelne Top-10-Signale bei 0–wenigen täglichen Impressionen nach kurzem Peak. | Über Wochen >90% weniger Volumen; mehrere Serving-/Migrationsbefunde verhindern Entwarnung. | 50 | Kompatibel, aber nicht als alleinige Erklärung bestätigt. | Beobachten und belegte technische Lücken gezielt isolieren. |
| URL-Migration / strukturelle Konsolidierung | Solo-Löschung 23.07., Nassfutter-Move 24.07., Vergleichsmoves 25.–27.07.; Tagesbruch 25.07. | Viele Vergleichsmoves nach Bruch; unveränderte Guides ebenfalls schwach; Deploy/Crawlzeiten unbekannt. | 55 | Wahrscheinlicher lokaler Mitfaktor, nur möglicher siteweiter Mitfaktor. | Eine klare fehlende Alias-301; übrige Migrationen nicht zurückrollen. |
| Mess-/Exportartefakt | Drei historische Snapshots nachträglich umgeschrieben; Hostnormalisierung vernichtet Dimension. | Unveränderte Property-Tagesreihen und aktuelle Originalpayloads bestätigen Einbruch. | 5 | Verzerrt URL-/Hostanalyse, erklärt nicht Gesamtvolumenverlust. | Manipulierte Fassungen ausschließen; Rohdaten mit Host erhalten. |

Google nennt technische Ausfälle, URL-Umzüge und algorithmische Veränderungen als getrennte Ursachen und empfiehlt Seitenindexierungs-/Crawlstatistiken zur Unterscheidung. Diese fehlenden Quellen verhindern hier eine endgültige Root-Cause-Zuordnung. Die Graphform allein beweist keinen „Discovery-Test“ oder Trust-Filter. [Google: Traffic-Rückgänge diagnostizieren](https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops).

## IMPLEMENTATION

- **files changed (Production):** `apps/pfotentechnik/public/_redirects` — exakt zwei Zeilen für `/produkt/petkit-yumshare-solo` und `/produkt/petkit-yumshare-solo/` nach `/produkt/petkit-yumshare-solo-2/`, jeweils 301, plus erklärender Kommentar.
- **technical fixes:** eine historische URL-Identität repariert; Ziel besteht, benennt dasselbe Produkt, ist indexierbar und selbstkanonisch; keine Redirectkette. Fehler live und durch Löschcommit belegt, Ursache verstanden, risikoarme additive Regel, source/build-Regression prüfbar.
- **content changes:** 0. Keine Änderungen an bestehenden Zielseiten, Snippets, H1, Schema, Layouts oder internen Links.
- **NO CHANGE count:** 118/118 Kohorteninhalte; 117/118 historische URL-Identitäten ohne neuen Redirect; ausdrücklich 6/6 geschützte 34.6-URLs unverändert.
- **Diagnose/Test:** `scripts/seo/diagnose-visibility-34.7.mjs` nutzt vorhandene Daten/Normalisierer und Git; `test/visibility-recovery-34.7.test.mjs` prüft eindeutige dauerhafte Aliasauflösung, bestehenden Owner und fehlende Kette.
- **Reports:** diese MD/JSON-Dateien sowie `visibility-34.7-evidence/` mit Quellen, Zeitreihen, Matrizen, Kohorten, Live-/Validierungsevidenz; vollständige Dateiliste in `changed-files.json`.
- **Deployment:** nicht ausgeführt. Die öffentliche Solo-URL liefert bis zu einer Veröffentlichung weiterhin den dokumentierten alten Response. Kein Live-Recovery-Versprechen.

**Bewusst offen:** www-Weiterleitung und echter 404-Fallback verlangen eine separat verifizierte Hosting-Korrektur. Für diesen Batch fehlen die tatsächlichen Cloudflare-Regeln/Deploymentkontrolle und ein Edge-Regressionstest; deshalb keine pauschale Host- oder Catch-all-Regel. Der gelöschte Klemmt-Ratgeber hat keinen zweifelsfrei identischen Ersatzowner; keine geratenen Redirectziele. Der Orphan verlangt weiter eine Ownershipentscheidung. Diese Befunde werden nicht als erledigt markiert.

## VALIDATION

| Prüfung | Ergebnis |
|---|---|
| PfotenTechnik kompletter Testlauf nach Änderung | **734/734 PASS** (vor Änderung 733/733) |
| Zusätzlicher Shared-Core-Testlauf | **10 PASS / 1 FAIL**, vorbestehender SyntaxError in `packages/affiliate-core/src/linking/linkEngine.test.ts:126`; ungültige Regex, Datei identisch zu HEAD; nicht durch diesen Batch verursacht |
| Vollständiger Production-Release-Preflight nach Änderung | **23/23 PASS**, inklusive eigenem Production Build |
| Production Build | **371 Seiten PASS**, regulär, kein Fast-Build |
| Indexability / canonical | **258 indexierbar**, 0 Fehler; 113 beabsichtigt ausgeschlossene Routen |
| Redirects | **34 normalisierte permanente Umzüge** lokal geprüft, keine Ketten-/Zielkonflikte; neue Solo-Regel noch nicht live |
| Sitemap / robots | **258/258** Live-/Build-Parität; robots korrekt; kein zukünftiges lastmod |
| Schema | **0 ungültige JSON-LD-Blöcke**, bestehender Comparison-Schema-Vertrag PASS |
| rendered links / duplicate URLs | **0 defekte gerenderte Linkziele**, keine Canonical-Zielduplikate; unbekannte Live-Pfade separat fehlerhaft |
| orphan detection | **1 bestehender echter Orphan**, 4 bestehende schwache Seiten; keine neue Isolation |
| 34.5 / 34.6 Regression | bestehende Release-Verträge und aktuelle Gesamttests bestanden; alle sechs Contentdateien unverändert |
| HTTP/HTTPS / www | HTTPS-Erzwingung vorhanden; www nicht weitergeleitet; dokumentierter offener Hostbefund |
| new blockers | kein neu eingeführter Production-Blocker; drei neu diagnostizierte lokale Serving-/Recoverybefunde, davon Solo lokal vorbereitet; vorbestehender Shared-Core-Testfehler offen |
| Screenshots | 0 — keine UI-Änderung |

Es wird ausdrücklich **nicht** behauptet, dass jeder Workspace-Test grün ist oder dass lokal bestandene Tests die ungelösten Edge-Befunde aufheben. Vollständige Logs: [Validierung](visibility-34.7-evidence/validation.json).

## CONCLUSION

1. **Nachweisbarer technischer Grund für den gesamten Google-Einbruch? Nein.** Nachweisbare lokale Fehler ja; der fehlende Solo-Redirect liegt zeitlich passend vor dem 25.07. und betrifft eine ehemals rankende URL, erklärt mit 12 historischen Impressionen aber nicht den Gesamtabfall.
2. **Wahrscheinlicher struktureller Grund? Lokal ja, sitewide nur möglich.** Viele URL-Konsolidierungen und schnelle Expansion liegen im Umfeld; Guides und Produkte verlieren ebenfalls, spätere Umzüge können den anfänglichen Bruch nicht allein erklären.
3. **Eher Domain-/Trust-/Discovery-Volatilität? Mit der Evidenz vereinbar, nicht bewiesen.** Nach Ausschluss aktueller Crawl-/Rendering-Sperren ist eine Neubewertung eine vernünftige Arbeitshypothese. Wegen realer technischer Lücken, fehlender Google-Indexdaten und fehlender Deploymenthistorie ist „nur junge Domain/Trust“ zu stark.
4. **Jetzt ändern oder stabil halten? Inhalte und bestehende Rankings bewusst stabil halten.** Eine eindeutige fehlende Same-product-301 ist vorbereitet. 404-/www-Serving gezielt als getrennte technische Korrektur verifizieren, keine Contentexpansion und keine pauschalen SEO-Optimierungen. 34.6 bleibt 6/6 NO CHANGE.
5. **15 primär zu beobachtende URLs bis 21.09.:**

1. `/vergleiche/beste-futterautomaten-ohne-wlan/`
2. `/produkt/petkit-yumshare-solo-2/`
3. `/produkt/petkit-eversweet-ultra/`
4. `/produkt/petlibro-polar-wet-food-feeder/`
5. `/trinkbrunnen-fuer-mehrere-katzen/`
6. `/katzentrinkbrunnen-laut-pumpe/`
7. `/katzentrinkbrunnen-ohne-filter/`
8. `/wie-viele-wasserstellen-katze/`
9. `/kalk-katzentrinkbrunnen-entfernen/`
10. `/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/`
11. `/katzenwasser-taeglich-wechseln/`
12. `/filter-im-katzentrinkbrunnen-wechseln/`
13. `/produkt/petlibro-stainless-steel-fountain/`
14. `/futterautomat-richtig-reinigen/`
15. `/vergleiche/beste-trinkbrunnen-fuer-katzen/`

Zusätzlich Solo-Altalias als reine Redirectkontrolle, nicht als sechzehnte zu optimierende Contentseite. Nach autorisiertem Deployment beide Slashvarianten 301 → Ziel 200 prüfen. Für die 15 URLs tägliche Property-/URL-Impressionen und Klicks, ursprünglichen Host, Queryzuordnung, Google-selected canonical und letztes Crawldatum erfassen. Am 14.09. und 21.09. vollständige Wochen vergleichen; keine Wiederholung von Metadatenänderungen bei Einzelimpressionen. Für CTR-/Positionsinterpretationen mindestens 20 Impressionen in einem vollständigen vergleichbaren Fenster verlangen (Arbeitsregel aus 34.6, keine Google-Vorgabe).

**Noch benötigte Belege:** tatsächlicher 07.09.-Export; `date × original absolute URL` und `date × query × URL` mit unverändertem Host; Indexierungs-/URL-Inspection-/Crawl-/Security-/Manual-Action-Status; Deploy-/Cloudflare-/Botlogs vom 20.07.–05.08.; optional Bing-Juli-Daten und echte Conversion-/Linkdaten. Solange diese fehlen, bleibt die sitewide Ursache ausdrücklich offen.

## Reproduktion

```sh
npm --workspace apps/pfotentechnik test
node apps/pfotentechnik/scripts/seo/release-preflight.mjs
node apps/pfotentechnik/scripts/seo/audit-production-baseline.mjs --out /tmp/pf347-baseline
node apps/pfotentechnik/scripts/seo/diagnose-visibility-34.7.mjs
```

Der Diagnosescript liest vorhandene Dashboards, Git und das im Quellenmanifest benannte Originalbackup vom 27.07. und erzeugt die analytischen JSON-Tabellen. Dieses lokale Backup ist zur Reproduktion der unveränderten URL-Zuordnung erforderlich; fehlt es, bricht der Script ausdrücklich ab. Live-HTTP-Evidenz und redaktionelle Kausalitätsbewertung sind datierte Momentaufnahmen, keine automatisch aktualisierte GSC-Synchronisation. Fach-Audits erzeugen ihre üblichen Reports; ihre generierten Aktualisierungen wurden zusammen mit den 34.7-Dateien während der Arbeit durch einen extern entstandenen Commit `b3724be` erfasst. Dieser Commit wurde nicht durch den Agenten erstellt oder rückgängig gemacht. Die vollständige Änderungsliste vergleicht den Ausgangsstand `7a30ac5` mit dem abschließenden Arbeitsbaum.
