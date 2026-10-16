# Google Indexing Recovery Audit – PfotenTechnik

Stand: **16.10.2026**. Anwendung: `apps/pfotentechnik`. **Kein Deployment, keine Indexierungsanforderung und keine automatische Content-Konsolidierung ausgeführt.**

## Diagnose

**Eine konkrete Ursache für Googles Nichtindexierung ist mit dem vorhandenen Datenbestand nicht bewiesen.** Der aktuelle Build und die bereits vorhandenen HTTP-Beobachtungen zeigen keinen gemeinsamen technischen Indexierungsblocker der betroffenen URLs. Der Teilbestand „gecrawlt, nicht indexiert“ enthält jedoch konkrete, überprüfbare Ansatzpunkte: ähnliche Vergleichsentscheidungen, teils schwache thematische Priorisierung und überwiegend redaktionell abgeleitete Produktinformationen. Diese Befunde rechtfertigen einen kontrollierten Versuch, keine Massenänderungen.

Keine dieser Hypothesen erklärt allein alle 73 aktuellen Crawled-URLs: Vergleichsähnlichkeit betrifft konkret sechs Vergleichsfälle; sehr wenige eingehende Quellen betreffen sieben Seiten. Hersteller-/Produkt-Eigenständigkeit ist gesondert zu prüfen, nicht pauschal aus der Template-Nutzung abzuleiten.

Die wichtigste fehlende Information ist, **welche Version Google tatsächlich verarbeitet und welche Canonical-URL Google gewählt hat**. Die vorhandenen Coverage-Exporte beantworten das nicht. Es fehlt außerdem ein aktueller, ausdrücklich als indexiert bestätigter Vergleichsbestand. Deshalb ist ein Qualitätsvergleich „abgelehnt gegenüber indexiert“ derzeit nicht möglich.

Google unterscheidet Crawling, Verarbeitung und Indexierung; das Erfüllen technischer Anforderungen garantiert keine Aufnahme. Siehe die Primärquellen [technische Voraussetzungen](https://developers.google.com/search/docs/essentials/technical), [Ablauf der Google-Suche](https://developers.google.com/search/docs/fundamentals/how-search-works) und [URL-Prüfung](https://support.google.com/webmasters/answer/9012289). Daraus wird hier keine konkrete Entscheidung über PfotenTechnik abgeleitet.

## 1. Datenbestand und vollständige URL-Inventur

Die vorhandenen Exporte sind vollständig verfügbar:

- `reports/google-indexing-fix/coverage-input.json`: **84** „Gecrawlt – zurzeit nicht indexiert“ und **78** „Gefunden – zurzeit nicht indexiert“, zusammen **162 exakte, unterschiedliche URLs**.
- Originaldateinamen und SHA-256 der beiden XLSX-Exporte sind erhalten. Die Original-Arbeitsmappen selbst liegen hier nicht vor.
- `reports/google-indexing-fix/http-observations.json`: frühere eigene HTTP-Prüfungen mit Zeitstempeln, Redirect-Ketten und HTML-/Header-Signalen. Das sind **keine Googlebot-Logs oder URL-Inspection-Ergebnisse**. Sie wurden nicht als neue Live-Messung ausgegeben.
- Google Search Analytics und Bing: vorhandene Snapshots vom 16.10.2026 für **18.09.–15.10.2026**. Google: **12 Impressionen, null Klicks**; Bing: **408 Impressionen, 32 Klicks**. Historische Suchleistung ist kein heutiger URL-Indexstatus. Providerwerte bleiben getrennt.

Aktueller Production Build: **374 HTML-Dokumente**. Davon **259 aktuelle öffentliche URLs ohne dokumentierte Indexierungssperre**, alle mit eigenem passendem HTML-Canonical und Sitemap-Eintrag:

| Seitentyp | Anzahl |
| --- | ---: |
| Produkte | 103 |
| Hersteller | 33 |
| Vergleiche | 28 |
| Sechs Hauptkategorien | 6 |
| Ratgeber einschließlich redaktioneller Entscheidungsartikel | 76 |
| Sonstige, einschließlich Startseite, Indizes, sekundärer Hubs, Berater und Rechtliches | 13 |

Die übrigen **115** Build-Dokumente sind separat mit Robots-/Canonical-/Sitemap-Signalen dokumentiert, insbesondere Admin-/Preview-/Fehlerseiten. Sie werden nicht als zusätzliche indexierte oder abgelehnte Google-URLs ausgegeben. Die bestehende URL-Consistency-Prüfung zählt in ihrer eigenen technischen Klassifikation 261 Dokumente einschließlich Fehlerseiten; das ist ein anderer Nenner, keine zusätzliche Google-Coverage.

**Vollständige Inventur:** [url-inventory.csv](current/url-inventory.csv), einschließlich Canonical, Meta-Robots, Sitemap, Seitentyp, Cluster, konkretem Intent-Gegenstand, eingehender Links, Klicktiefe und Überschneidungskandidaten. [snapshot.json](current/snapshot.json) ergänzt sämtliche Quell-URLs der eingehenden Links, Überschriften, Quellpfade, Leistungsdaten und exakte Google-Beobachtungen. [Ausgeschlossene Build-Seiten](current/excluded-build-pages.json).

Zählweise: eingehende Links sind **eindeutige Quellseiten**, keine wiederholten Anker. Klicktiefe ist der kürzeste HTML-Linkweg ab Startseite. Zusätzlich werden Header/Hauptinhalt und ausschließlich Hauptinhalt unterschieden. Die sechs globalen Kategorie-Links erzeugen jeweils 258 eingehende Quellseiten; kontextuelle Hauptinhalt-Quellen betragen dagegen 114 Futterautomaten, 64 Trinkbrunnen, 52 GPS, 28 Katzenklappen, 28 Katzentoiletten und 21 Kameras. Linkanzahl allein ist kein Qualitäts- oder Google-Prioritätsbeweis.

Die Typenzuordnung wird frisch aus Inhalt und Route bestimmt. Damit wird beispielsweise `/produkt/neakasa-riko/` korrekt als Produkt erfasst statt wie im alten, gecachten Inventar als Utility. Redaktionelle Ratgeber werden nicht mehr allein wegen ihres allgemeinen Layouts unter „Sonstige“ gezählt. `taxonomyVersion: 2` kennzeichnet diese Änderung im Monitoring; Typenzahlen eines älteren Audits sind damit nicht als SEO-Effekt zu vergleichen.

## 2. Strikte Trennung der Indexierungsbelege

| Beobachtungsebene | Ergebnis | Bedeutung |
| --- | --- | --- |
| Exakte GSC-Export-URLs | 84 crawled, 78 discovered | Direkt überlieferte negative Exportbeobachtungen |
| Davon exakte aktuelle Canonicals | 73 crawled, 78 discovered | **151** aktuelle kanonische URLs mit direktem negativem Statusbeleg |
| Weitere aktuelle Canonicals | **108 unbekannt** | Kein direkter Statusbeleg im vorhandenen Export |
| Explizite aktuelle Indexiert-Belege | **nicht vorhanden** | Null importierte positive Belege ist **keine Behauptung, die Website habe null indexierte Seiten** |
| Elf weitere Export-URLs | historische, www- oder Slash-Varianten | Getrennt vom Status ihrer aktuellen Ziele erhalten |

HTTP 200, Sitemap-Mitgliedschaft, Suchimpressionen und das von der Website deklarierte Canonical werden niemals in einen aktuellen Google-Indexierungsstatus umgewandelt. Insbesondere wird ein negativer Status einer www-/Slash-Variante nicht auf ihre aktuelle kanonische Ziel-URL übertragen. Die elf Varianten erklären einen Teil des rohen URL-Bestands, **nicht** die Nichtindexierung der übrigen 151 Canonicals.

## 3. Separate Analyse der 84 gecrawlten URLs

**Alle 84 Einzelbefunde:** [crawled-urls.md](current/crawled-urls.md), vollständig und maschinenlesbar: [crawled-cohort.json](current/crawled-cohort.json).

Die 84 Export-URLs bestehen aus **73 exakten aktuellen Canonicals plus elf Varianten**. Für Inhalts-/Linkmerkmale wird der 73er-Teilbestand verwendet, damit Alias-URLs keine mehrfachen Inhaltsseiten vortäuschen:

| Merkmal | Aktuelle 73 Canonicals |
| --- | --- |
| Seitentyp | 25 Produkte, 35 Ratgeber, sechs Hersteller, sechs Vergleiche, ein sekundärer Themenhub |
| Themenkonzentration | 38 Futterautomaten, 21 Trinkbrunnen, ein GPS-Vergleich; übrige Hersteller-/Ernährungs-/Gesundheitsthemen |
| Erreichbarkeit | 64 URLs auf Tiefe 2, neun auf Tiefe 3; keine unerreichbar |
| Interne eingehende Quellseiten | Median acht; sieben URLs haben höchstens zwei |
| Gerenderter Haupttext | Median 1.593 Wörter, teilweise inklusive gemeinsamer Inhaltsmodule; kein Qualitätsurteil durch Wortzahl |
| Produkt-Dokumentationsstatus | 21 `editorial-review`, vier `manufacturer-data` |
| Explizites eigenes Hands-on-Feld | drei `false`, 22 fehlend; keine ausdrücklich bestätigten eigenen Praxistests daraus ableitbar |
| Exact-/Near-Duplikate im bestehenden Inhaltsverfahren | keine nachgewiesen; manuelle Intent-Überschneidungen bleiben möglich |

**Eingrenzung:** Ein gemeinsamer technischer Crawlblocker oder pauschal „zu tiefe/zu kurze/verwaiste Seiten“ passt nicht zu diesem Teilbestand. Schon der Exportstatus besagt, dass Google die URLs zuvor gecrawlt hat. Die Linkmenge erklärt die Gruppe ebenfalls nicht allein: `/produkt/petkit-yumshare-dual-hopper/` hat 55 und `/hersteller/petlibro/` 50 eingehende Quellen. Beide sind dennoch als gecrawlt, nicht indexiert exportiert.

**Wichtig:** Keine aktuelle Canonical-URL aus den Clustern Haustierkameras, automatische Katzentoiletten oder Katzenklappen gehört zu dieser Crawled-Gruppe. Ihre zentralen Hubs/Vergleiche liegen überwiegend in „gefunden, nicht indexiert“. Eine Erklärung für diese Cluster darf nicht aus den 84 Crawled-URLs erfunden werden. Die Referenzgruppe außerhalb der 73 ist außerdem überwiegend „gefunden“ oder „unbekannt“, nicht nachweislich indexiert.

## 4. Bestätigte Probleme, Hypothesen und fehlende Belege

| Klasse | URL-Bezug und konkreter Befund | Konsequenz |
| --- | --- | --- |
| **Nachgewiesener gemeinsamer technischer Indexierungsfehler** | Im aktuellen Build und in den vorhandenen HTTP-Beobachtungen für die untersuchten Canonicals **nicht nachgewiesen** | Keine Canonical-, Robots-, Sitemap- oder Redirect-Massenänderung |
| **Bestätigte schwache Kontextverknüpfung** | `/produkt/petlibro-one-rfid-smart-feeder/` hatte nur den Hersteller als eingehende Quelle; im Mehrtier-Vergleich war derselbe Modellname bereits fachlich in der RFID-Tabelle genannt | Genau diesen vorhandenen Modellnamen verlinkt: eine zusätzliche Quelle, **1 → 2**, Tiefe bleibt 3. Der bare Exportpfad bleibt ein separater negativer Aliasbeleg; kein neuer Status für das Slash-Ziel behauptet |
| **Bestätigter Audit-Fehlalarm** | `/kaufberatung/?world=gps`, `?world=fountain` und „Alle Anliegen“ wurden als drei schädliche Self-Links gemeldet | Bestehende Linkprüfung erkennt ausschließlich diese belegten Zustands-/Resetlinks des vorhandenen Wizards. Gewöhnliche Self-Links bleiben prüfbar. Keine Website-Links entfernt |
| **Plausible Qualitätshypothese** | Kleine Katzen-GPS-Seite und allgemeiner Katzenvergleich zeigen dieselben Finalisten, Gewicht/Tragesystem/Passform und ähnliche Entscheidungsbühne | Beide einzeln inspizieren, kleine Tracker-Seite in den kontrollierten Versuch aufnehmen; Google-Canonical-Konkurrenz ist unbekannt |
| **Plausible Qualitätshypothese** | App-, Berufstätigen-, Offline- und Akku-Vergleiche teilen wesentliche Auswahlmuster; eigene Detailabschnitte sind vorhanden | Keine automatischen Zusammenführungen. App-Seite als konkreten Crawled-Fall prüfen; Akku/Berufstätige nicht fälschlich derselben Statusgruppe zuordnen |
| **Plausible Priorisierungshypothese** | `/seniorenhunde-richtig-versorgen/` hat nur `/wissen/` als eingehende Quelle; kleine GPS-Seite hat zwei Quellen | Beide beobachten. Allenfalls je ein fachlich begründeter Folgeversuch, kein Linkpaket |
| **Plausible Eigenständigkeitshypothese** | `/hersteller/petkit/` enthält allgemeine Aussagen zu Design/Käuferlob; `/hersteller/petlibro/` trennt konkrete Gerätefamilien stärker | Zuerst beide gerenderten Google-Versionen prüfen. Unbelegte Allgemeinaussage gegebenenfalls später gezielt prüfen, keine Erfahrungen erfinden |
| **Fehlender Google-Beleg** | Kein tatsächlicher `googleCanonical`, kein URL-Inspection-Verdict, kein verifizierter Googlebot-Zugriff mit ausgelieferter Version | Keine Behauptung einer fremdgewählten Canonical oder einer erneuten Ablehnung der aktuellen Fix-Version |

Eine zwischenzeitlich untersuchte Überschriftenanpassung des versteckten Beraters wurde **nicht beibehalten**. Der leere JS-Wizard-Titel wird von einem allgemeinen H1-Zähler mitgezählt; daraus folgt kein belegter Google-Blocker. Der Audit erzeugt keine kosmetischen Änderungen, um eine hypothetische Ursache zu „beheben“.

Ausführliche inhaltsbezogene Prüfung **aller sechs Cluster**, einschließlich tatsächlicher Gemeinsamkeiten, unterscheidender Abschnitte und URL-bezogener Empfehlungen: [cluster-analysis.md](cluster-analysis.md).

## 5. Googlebot- und URL-Prüfdaten: was fehlt

Die Repository-Sichtung von Berichten, Daten und Google-Provider-Code ergab **keine tatsächlichen Googlebot-Access-Logs, keine Crawl-Stats-Exporte und keine URL-Inspection-Ergebnisse**. Die bestehende GSC-Anbindung implementiert Search Analytics/Sites; sie liefert hier keine URL-Inspection-Entscheidungen. Das Monitoring erfindet diese nicht.

Die 84 Crawled-Zeilen enthalten `lastCrawledRaw` als numerischen Excel-Rohwert. Der historische Import bewahrt aber weder das Arbeitsmappen-Dateisystem 1900/1904 noch geprüfte ISO-Crawlzeiten. Die Rohwerte bleiben unverändert sichtbar. Ohne Originalarbeitsmappe oder Inspection-Daten wird daraus keine verifizierte Googlebot-Zeit und insbesondere kein Crawl der aktuell veränderten Version behauptet. Künftige XLSX-Importe bewahren `dateSystem` zusätzlich.

Nicht bestimmbar sind derzeit:

- Googles tatsächlich gewählte Canonical je URL und ob Google Inhalte als Duplikat einer anderen Seite bewertet;
- Indexstatus der 108 nicht exportierten aktuellen Canonicals und die Gesamtzahl indexierter Seiten;
- ob und wann Google die deployed Review-Korrektur oder den separat bearbeiteten Commerce-Fix verarbeitet hat;
- Googlebot-Abrufhäufigkeit, Hosting-/Renderingfehler speziell bei Googlebot oder ausgelieferte Dokumentversion je Crawl;
- eine kausale Wirkung von externen Links, einer Domain-/Qualitätsbewertung oder bestimmter Inhaltsmodule;
- ob die manuell dokumentierten Intent-Überschneidungen tatsächlich Google-Kannibalisierung verursachen;
- ein Indexierungserfolg nach den hier vorgenommenen Änderungen: Es liegt **kein neuer Google-Export** vor.

## 6. Priorisierte 12 URLs und kontrollierter Versuch

**Verbindlicher Maßnahmenplan für die weitere Prüfung:** [experiment-plan.md](current/experiment-plan.md). Für jede der zwölf exakten Crawled-URLs stehen konkreter Befund und begründete Maßnahme nebeneinander. [Vollständiges Versuchsprotokoll](experiment-protocol.md), [leere Erfassungsvorlage](current/experiment-observations-template.csv).

Vier Fälle werden nach tatsächlicher erfolgreicher URL-Prüfung für eine **einmalige manuelle Indexierungsanforderung** vorgeschlagen: kleiner Katzen-GPS-Vergleich, App-Futterautomatenvergleich, YumShare Solo 2 und Hersteller PETLIBRO. Acht URLs bleiben zunächst unveränderte Beobachtungsfälle. Kein Antrag wurde ausgeführt. Die Auswahl ist explorativ, nicht randomisiert; Unterschiede im Verlauf belegen keine alleinige Ursache.

T0 auf einer stabilen veröffentlichten Version erfassen, danach gespeicherte Google-Beobachtungen und Exporte an T+7/T+14/T+28 vergleichen. Erst bei belegtem erneutem Crawl oder einer konkret anderen Google-Canonical-Entscheidung eine einzelne weiterführende Änderung testen. Der separate Commerce-Release bleibt ein dokumentiertes Ereignis, kein unkontrolliert mitlaufender Erfolgsnachweis.

Zusätzlich bleiben [20 clusterübergreifende Beobachtungsziele](current/prioritized-urls.md) mit Begründung, Linksignalen und vorhandenen GSC-Leistungsdaten dokumentiert. Sie ersetzen nicht die fokussierte 12er-Versuchsgruppe.

## 7. Reproduzierbarer Audit und GSC-Import

Erweitert wurde der bestehende `audit-production-baseline.mjs`; es gibt keinen zweiten Website-Crawler und keine neue Verwaltungsoberfläche. Der neue Recovery-Zweig verwendet dessen Build-Inventar und Redirectauflösung sowie den vorhandenen Content-Quality-Parser. Der Importer unterstützt weiterhin XLSX und zusätzlich BOM-/Komma-/Semikolon-CSV.

Ab Repository-Wurzel:

```sh
npm run build --workspace=@affiliate-sites/pfotentechnik
node apps/pfotentechnik/scripts/seo/audit-production-baseline.mjs --recovery --coverage apps/pfotentechnik/reports/google-indexing-fix/coverage-input.json --observed-at 2026-10-16 --out reports/google-indexing-recovery/current
```

Für eine echte spätere Messung **neue Eingabedatei und neues Ausgabeverzeichnis** verwenden und `--previous` auf den vorigen Snapshot setzen:

```sh
node apps/pfotentechnik/scripts/seo/audit-production-baseline.mjs --recovery --coverage /tmp/gsc-new.json --observed-at YYYY-MM-DD --previous apps/pfotentechnik/reports/google-indexing-recovery/current/snapshot.json --out reports/google-indexing-recovery/next
```

`--observed-at` bezeichnet das tatsächliche Export-/Beobachtungsdatum, nicht den Zeitpunkt eines neuen Google-Crawls. Originale Statusstrings, Herkunft, Roh-Crawlwerte und SHA-256 bleiben erhalten. `status-changes.json` trennt beobachtete Statuswechsel, neu vorhandene/fehlende Beobachtungen, Bestands-/Linkänderungen und Änderungen je Seitentyp; priorisierte URLs sind markiert. Gleiches Quelldatei-Hash wird ausdrücklich als **keine neue Google-Messung** ausgewiesen. Ein nicht mehr im Nichtindexiert-Export enthaltener Eintrag wird ohne positiven Beleg `unknown`.

Beispiele für tatsächliche Exporte:

```sh
python3 apps/pfotentechnik/scripts/seo/import-gsc-coverage.py --out /tmp/gsc-new.json /pfad/crawled.xlsx /pfad/discovered.xlsx /pfad/indexed.xlsx
# CSV mit URL- und Status-Spalte, beispielsweise der befüllten Erfassungsvorlage:
python3 apps/pfotentechnik/scripts/seo/import-gsc-coverage.py --out /tmp/gsc-inspected.json /pfad/inspection-observations.csv
# Reine einheitliche URL-Liste nur mit explizitem, tatsächlich belegtem Status:
python3 apps/pfotentechnik/scripts/seo/import-gsc-coverage.py --status 'Indexiert' --out /tmp/gsc-indexed.json /pfad/indexed-urls.csv
```

Ein XLSX ohne eigenes Problem-/Statusfeld benötigt ebenfalls `--status`. Verschiedene Statusgruppen nur anhand ihrer tatsächlichen Metadaten oder Statusspalte zusammenführen. Niemals Indexiert aus HTTP, Sitemap oder leerem Status ergänzen. Die leere Versuchsvorlage muss vor einem Import tatsächlich ausgefüllt werden; sie wird sonst korrekt zurückgewiesen.

Der beigefügte Vorher-/Nachher-Vergleich verwendet bewusst dieselben vorhandenen Exporte: **kein beobachteter Google-Statuswechsel**. Der nachgewiesene Unterschied ist die eine zusätzliche interne Linkquelle. Die neu präzisierte Seitentyp-Taxonomie wird separat gekennzeichnet.

## 8. Konkrete Implementierungsänderungen

- `src/content/comparisons/beste-futterautomaten-fuer-mehrtierhaushalte.md`: genau ein bestehender Modellname als passender Produktlink, keine Textumschreibung.
- `scripts/audit-internal-link-targets.mjs` und `scripts/internal-linking-utils.mjs`: eng begrenzte Erkennung der funktionalen Berater-Navigation, mit Negativtests für normale Self-Links.
- `scripts/seo/audit-production-baseline.mjs`: Recovery-Option, Kontextlinks und Weitergabe vorhandener Auditdaten.
- `scripts/seo/indexing-recovery.mjs`: Inventur, exakte GSC-Belege, Snapshot-Vergleich, Status-/Typentrennung, Inhaltskandidaten.
- `scripts/seo/indexing-recovery-cohort.mjs`: separate vollständige Crawled-Gruppe und Versuchsausgabe mit leeren Google-Inspection-Feldern.
- `scripts/seo/indexing-recovery-priorities.json` und `indexing-recovery-experiment.json`: begründete Beobachtungs-/Versuchsziele.
- `scripts/seo/import-gsc-coverage.py`: CSV-Unterstützung, explizite Statuspflicht bei statuslosen Exporten, Bewahrung des XLSX-Dateisystems.
- `test/indexing-recovery-audit.test.mjs`: Regressionen für fehlende/konfligierende Statusbelege, URL-Varianten, Monitoring, Import und die exakte Versuchsgruppe.

Die bestehenden Review-Regeln und Preis-/Affiliate-Implementierungen wurden für diesen Auftrag nicht geändert. Keine neuen Seiten, Canonical-/Sitemap-/Robots-Änderungen, Redirects, Massenlinks oder Deindexierungen.

## 9. Abschlussvalidierung

| Prüfung | Ergebnis |
| --- | --- |
| Fokussierte Recovery-/Coverage-Regressionen | **18/18 PASS** |
| Vollständige Anwendungstestsuite | **951/951 PASS**, keine übersprungenen Tests |
| Production Build | **PASS**, 374 Seiten, 1 min 17 s |
| Technischer Source-/Build-SEO-Audit | **PASS** |
| Strikte interne Linkziel-Prüfung | **PASS**, 374 Seiten, null Fehler/Warnungen |
| Strikte URL-/Canonical-/Sitemap-Prüfung | **PASS**, null Fehler/Warnungen |
| Recovery-Inventur | **PASS**, 259 URLs, keine fehlenden/falschen Canonicals, keine fehlenden Sitemap-Einträge, keine gebrochenen internen Dokumentlinks, keine verwaisten/unerreichbaren öffentlichen URLs |
| Separate Crawled-Gruppe | **PASS**, 84 exakte Export-URLs vollständig; 73 Canonicals und elf Varianten getrennt |
| Versuchsgruppe | **PASS**, alle zwölf exakten URLs aus der Crawled-Gruppe, vier Anfrage-/acht Beobachtungsfälle, keine automatisch ausgeführte Aktion |
| `git diff --check` | **PASS** |

Logs und zusammengefasste Ergebnisse: [validation.txt](validation.txt), [technical-seo.txt](technical-seo.txt), [internal-links.txt](internal-links.txt), [canonical-sitemap.txt](canonical-sitemap.txt). Ein allgemeiner Metadatenzähler findet weiterhin den leeren, versteckten Wizard-H1 auf `/kaufberatung/`; dies wird als nicht belegter Google-Blocker dokumentiert und nicht kosmetisch geändert.

**Keine Google-Wirkung behauptet:** Das wiederverwendete Export-Hash ist unverändert und es gibt keinen neuen positiven Indexierungsbeleg. Die Änderungen sind technisch geprüft; vor einer Wirkungsbewertung ist der dokumentierte kontrollierte Versuch mit echten Google-Beobachtungen erforderlich. Keine automatischen Deployments.
