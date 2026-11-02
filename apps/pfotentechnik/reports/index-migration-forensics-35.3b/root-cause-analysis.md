# 35.3B – Entscheidungsvorlage

**Die Migration enthält belegte technische Fehler. Als wesentliche Erklärung des bis Oktober fortgesetzten siteweiten Indexrückgangs wird sie durch die verfügbaren Daten jedoch nicht gestützt.** Ein lokaler oder vorübergehender Beitrag ist plausibel; sein Anteil lässt sich nicht seriös beziffern. Eine alleinige redaktionelle Qualitätsursache ist ebenfalls nicht bewiesen.

## 1. Wie viele Seiten wurden migriert?

Git belegt **27 frühere öffentliche Pfade mit 23 heutigen Canonical-Zielen**: 21 Vergleichspfade → 17 Vergleichsziele, zwei Produktaliaspfade → zwei Produkte, drei Ratgeber-/Hub-Pfade → drei Ziele und ein Advisor → ein Ziel. Dies umfasst Konsolidierungen und die Entfernung paralleler Intentseiten; es waren nicht 27 unabhängige heutige Inhalte. Git belegt die Routenfähigkeit im Quellstand, nicht den Livegang jedes Zwischenstands.

Sieben zusätzliche Root-Redirects für Trinkbrunnen-/GPS-Vergleiche belegen keine früheren Root-Seiten: Diese Vergleiche wurden bereits unter `/vergleiche/` angelegt. Die 14 beschädigten Canonical-/Linkpfade sind historische Signale, keine weiteren migrierten Inhalte. Ein ersatzlos entfallener Klemmt-Ratgeber wird separat geführt. Insgesamt dokumentiert `historical-url-map.csv` 49 unterschiedliche historische Pfade mit diesen Evidenzklassen.

## 2. Wie viele sind heute nicht indexiert?

Im **am 02.11. exportierten GSC-Stand**, dessen Coverage-Diagramm am 23.10. endet, sind von den 23 aktuellen Migrations-/Konsolidierungszielen **17 indexiert und sechs negativ erfasst**: vier „Gecrawlt“ und zwei „Gefunden“. Das ist kein Live-Indexabruf.

Die sechs Ziele: `/berater/futterautomat/`, `/futterautomat-bei-stromausfall/`, `/katzenklappen/`, `/produkt/petkit-yumshare-solo-2/`, `/vergleiche/beste-futterautomaten-mit-kamera/` und `/vergleiche/beste-futterautomaten-ohne-wlan/`. Von den 17 Vergleichszielen sind 15 indexiert und zwei „Gecrawlt“; keines ist „Gefunden“.

## 3. Gibt es einen statistisch auffälligen Nachteil?

| Kohorte | Migriert: indexiert / gecrawlt / gefunden | Unverändert: indexiert / gecrawlt / gefunden | Fisher, zweiseitig |
| --- | --- | --- | --- |
| Alle aktuellen Canonicals | 17 / 4 / 2 (n=23) | 73 / 87 / 76 (n=236) | p=0,000102 |
| Nur Vergleiche | 15 / 2 / 0 (n=17) | 4 / 1 / 6 (n=11) | p=0,0104 |
| Nur Vergleiche, beide Gruppen bis 27.07. im Git vorhanden | 15 / 2 / 0 (n=17) | 4 / 1 / 2 (n=7) | p=0,1265 |

Unbereinigt sind migrierte Ziele **häufiger** indexiert: 73,9 % gegenüber 30,9 %. Bei den frühen Vergleichen sind es 88,2 % gegenüber 57,1 %. Dieser alters-/typnähere Vergleich ist bei einer Kontrollgruppe von sieben Seiten statistisch nicht eindeutig. Er liefert jedenfalls keinen beobachteten Migrationsnachteil. Keine Aussage „Migration verbessert Indexierung“ ableiten.

Methode: aktuelle Canonicals als Einheit, exakte Exportidentitäten, Fisher-Test auf indexiert gegen beide negativen Zustände zusammen. Die beiden Rohvergleiche werden durch Seitentyp, Cluster und Publikationsalter verzerrt; vier späte native Vergleiche sind sämtlich „Gefunden“. Der Altersfilter verwendet erste belegte Content-/Routenexistenz im Git einschließlich alter Slugs, keine nachträglich aktualisierten `updatedAt`-Werte. Er ersetzt keine zeitgleiche Veröffentlichungskohorte. Weitere Einschränkungen: nicht randomisiert, kleine Gruppen, gemeinsame Templates/Cluster, keine Ausgangsindexierung je URL, keine Korrektur für explorative Mehrfachvergleiche. Kein kausaler Effekt und keine „erholten/verlorenen“ Einzel-URLs berechenbar. Detaildaten stehen in `index-status-comparison.csv` und `cohort-summary.json`.

Letzte echte Export-Crawldaten: Migrationsziele mit Datum 03.08.–24.10., Median 13.10.; unveränderte Ziele 13.07.–24.10., Median 15.09. Bei Vergleichen Median 13.10. versus 20.09. Das ist ein selektiver Snapshot, keine Crawlrate. `1970-01-01` wird als unbekannt geführt. Daten bis 24.10. in URL-Zeilen und Diagrammende 23.10. werden unverändert erhalten, nicht künstlich synchronisiert.

## 4. Gab es Redirect-/Canonical-Lücken?

Ja, siehe `migration-timeline.md`:

- 15 entfernte Root-Vergleiche ohne Redirect im Git für 45:39 Minuten am 27.07.
- 14 falsche Canonicals für 14:53 Minuten im Git; fehlerhafte interne Links bleiben bis zum Abendcommit. Ob Google diese Zustände sah, ist unbekannt.
- Solo-Alias ohne Redirect vom 23.07. bis zum Septemberfix im Git. Am 07.09. belegen Liveproben tatsächlich einen falschen Homepage-200-Fallback sowie www-200. Nachher-Proben belegen den Fix.
- Heute 13 ehemalige fehlerhafte Canonical-Pfade mit 404, einer mit unspezifischer Weiterleitung. Diese Recovery-Lücken sind lokal korrigiert.
- Heute 35 geprüfte www-Legacy-Varianten mit Host- und Pfadredirect in zwei permanenten Schritten. Keine Schleifen oder temporären Redirects. Die Anforderung „höchstens ein Hop“ ist live damit nicht überall erfüllt; siehe `technical-fixes.md`.

Ein 404 während der kurzen Juli-Quellcode-Lücke ist **nicht** nachgewiesen: Das erst im September beobachtete Hosting lieferte unbekannte Pfade als Homepage-200. Dies darf weder rückwirkend als durchgehendes Verhalten noch als historische 404-Serie ausgegeben werden.

## 5. Ist Migration eine wesentliche Ursache?

**Für einzelne URLs und kurzfristige Signalverwirrung plausibel; als dominante fortbestehende siteweite Ursache wenig gestützt. Vertrauen: mittel in diese Abgrenzung, niedrig in jede quantitative Ursachenzuweisung.** Die technische Fehlkonfiguration selbst ist mit hohem Vertrauen belegt. Fehlende Deployment-/Googlebotdaten verhindern, ihr damaliges Ausmaß zu bestimmen.

## 6. Was spricht gegen die Haupterklärung?

Der erste Performance-Einbruch am 25.07. liegt vor dem Canonical-/Linkfehler vom 27.07. Mitte August sind noch bis zu 198 URLs als indexiert gemeldet. Die großen Indexsprünge folgen erst im September/Oktober, auch nach dem verifizierten Hostingfix. 15 von 17 migrierten Vergleichszielen sind im jüngsten Export indexiert. 163 von 236 unveränderten Canonicals sind negativ. Eine ausschließlich auf migrierte Inhalte begrenzte Störung passt dazu nicht. Die genaue zeitversetzte Google-Verarbeitung bleibt trotzdem offen.

## GSC: Was tatsächlich über Alt und Neu bekannt ist

Es liegen 95 positive, 105 „Gecrawlt“- und 78 „Gefunden“-URL-Beobachtungen vor: 278 verschiedene exakte URLs. Davon sind 259 heutige Canonicals: 90 positiv, 91 „Gecrawlt“, 78 „Gefunden“. Die übrigen 19 sind Varianten/Altpfade; ihr Status wird nicht auf ein heutiges Ziel übertragen.

- Alt und Neu positiv: Berufstätige und Seniorenkatzen. Die alte Berufstätigen-URL hat als letzten Crawl 21.07.; der positive Exportstatus beweist weder heutiges Serving noch eine Google-selected Canonical.
- Alt und Neu negativ: beide Kamera-URLs stehen auf „Gecrawlt“.
- Alt negativ, Neu positiv: Große-Hunde-Root versus aktueller Vergleich.
- Alt positiv, Neu negativ: alter Advisor versus `/berater/futterautomat/` („Gefunden“). Alter Advisor zuletzt am 31.08. gecrawlt, vor seiner Oktoberumstellung. Nicht daraus folgern, Google habe den aktuellen Zielpfad definitiv abgelehnt.
- Alle anderen Alt-/Neu-Paare enthalten teilweise unbekannte Altzustände. Fehlende Altzeile bedeutet nicht „nicht indexiert“. Insbesondere kein Fortbestehen alter Google-Canonicals behaupten.

Der Oktoberexport enthält 84+78 negative Beobachtungen; es fehlt ein gleichzeitiger vollständiger positiver URL-Export. Die Augustzahl 196/198 ist nur aggregiert vorhanden. Es fehlt eine URL-genaue Vorher-/Nachher-Coverage-Kohorte. Die 68 „Weiterleitung“ und 64 „Alternative mit richtigem Canonical“ der Übersicht dürfen weder addiert noch als 132 verlorene Inhalte gewertet werden. Die sieben 404- und drei noindex-Fälle sind nur als aggregierte Kategorien verfügbar; deren URL-Zuordnung fehlt.

Alle verfügbaren vorhandenen GSC-Quellen werden im Quellenkatalog berücksichtigt: Oktober- und November-Coverage, Coverage-Übersicht, 25 anhand SHA geprüfte und nicht verworfene historische GSC-Dashboardstände sowie die Original-Performance-ZIPs vom 07.09. und 21.09. Drei durch URL-Umschreibung veränderte Snapshots bleiben wie in 34.7 ausgeschlossen; ein inzwischen veränderter WORKTREE-Snapshot ist nicht als damaliger Originalstand nutzbar. 3.104 passende Performance-Zeilen stehen separat, einschließlich überlappender Zeitfenster: **nicht aufsummieren und nicht als Coverage-Status ausgeben**. Exakte URL und normalisierter Pfad ohne belegten Host werden unterschieden. Kein Export enthält eine belastbare Google-selected-Canonical-Historie.

## 7. Welche Alternativen sind besser belegt?

| Hypothese | Belege | Gegenbelege / Lücke | Bewertung |
| --- | --- | --- | --- |
| Hosting-/Hostkonsolidierung | 34.7/34.8 live belegte www-200, Soft-404-Homepage und Solo-Aliasverlust | Ab 07.09. korrigiert; indexierte Zahl sinkt weiter; kein damaliges Zugriffs-/5xx-Protokoll | Historischer Fehler hoch belegt, Umfang des Rankingeffekts offen |
| Verzögerte Discovery/Konsolidierung | 78 exakte heutige Canonicals „Gefunden“, darunter alle vier späten Vergleiche; alter Advisorstatus vor Migration | Keine täglichen URL-Inspection-/Crawlzeitreihen; „Gefunden“ ist keine Garantie späterer Aufnahme | Mit Daten vereinbar; mittleres Vertrauen, keine alleinige Ursache |
| Inhaltliche Auswahl/Qualität/Intentüberschneidung | Viele unveränderte gecrawlte Ziele negativ; 35.4 dokumentiert Wiederholungen, wenig konkrete Eigenbeobachtung und Intentnähe; Repository wächst von 140 Dokumenten am 13.07. auf 201 am 05.08. und 246 am 07.09. | Technische und redaktionelle QA messen Googles Qualitätsurteil nicht; viele standardisierte Seiten sind zugleich indexiert; fehlende Bewertungen/Manuelle-Maßnahmen-Daten | Prüfenswerte Arbeitshypothese, keine nachgewiesene Abwertung oder KI-/Spamdiagnose |
| Umfangreiche Content-/Linkänderungen | Gleichzeitig Migration, UI-/Methodik-/Linkrevisionsarbeit im Juli; spätere Commerce-/Redaktions-/Advisor-Änderungen zeitnah zu Indexsprüngen | Änderungen vermischt, kein kontrollierter Rollout, keine belastbare Deploymentkorrelation | Änderungen hoch belegt; Wirkung nicht isoliert |
| Temporäre siteweite Crawl-/noindex-Sperre | Kein entsprechender Git-Befund; öffentliche Collection-Versionen ohne expliziten noindex-Start; robots unverändert Allow | Header-/Cloudflarekonfigurationen nicht historisch vollständig gespeichert; drei noindex-Fälle der GSC ohne URL-Liste | Nicht belegt; historische Serverfehler weder bestätigt noch ausgeschlossen |
| Siteweite aktuelle Routing-/Sitemap-/Renderingstörung | 35.3 vollständiger Liveaudit; frischer Build 259 Canonicals, öffentliche Inhalte im HTML, konsistente aktuelle Ziele | Historische Deploymentartefakte fehlen; www-Legacyketten und fehlerhafte historische Aliasziele separat | Aktuell keine passende systematische Blockade belegt |

Die besser belegten **Sachverhalte** sind historische Hostingfehler, umfangreiche Änderungen und breiter Ausschluss auch unveränderter Seiten. Keine Alternative ist als tatsächliche Hauptursache stärker kausal nachgewiesen. Keine Google-Abwertung, algorithmische Testphase, manuelle Maßnahme oder Spamstrafe diagnostizieren.

## 8. Was jetzt sinnvoll ist

1. Die kleinen lokalen Aliasfixes bei einem separat freigegebenen Release mitnehmen; anschließend alle 96 Regeln live prüfen. Keine neue URL-Struktur und keine weiteren pauschalen Redirects.
2. Die bestehende Cloudflare-Hostweiterleitung vor einer externen Änderung gezielt mit den Legacy-Pfaden zusammensetzen. Für die 35 www-Legacyketten ist der direkte-Hop-Vertrag noch offen. Keine Änderung externer Regeln in diesem Auftrag.
3. URL-Inspection für die sechs negativen Migrationsziele und eine kleine vergleichbare Auswahl unveränderter negativer Seiten: Google-selected Canonical, letzter Googlebotabruf, Abruf-/Indexierungsentscheidung speichern. Dazu die sieben 404- und drei noindex-Beispiel-URLs exportieren. Bisherige Exporte enthalten diese Informationen nicht.
4. Alte und neue URL-Identitäten, www/non-www sowie Coverage und Performance künftig getrennt archivieren; wöchentlich gleiche Kohorten messen. Historische Originaldateien vor URL-Normalisierung erhalten.
5. Nach einem Release den Zeitpunkt mit Livebelegen dokumentieren und 28 Tage dieselben Kohorten beobachten. Nur nachgewiesene Fehler sofort korrigieren; keine pauschalen Score-, Titel- oder Slugänderungen und keine künstliche Lastmod-Aktualisierung. Eine frühere 14-Tage-Frist aus September ist längst beendet und wird nicht als aktuelle Sperre ausgegeben.

## 9. Wie 35.4 weiterführen?

**Angepasst und priorisiert weiterführen; die bereits vorhandenen lokalen Änderungen bleiben erhalten.** Keine neue breite Umschreibung als vermeintliche Migrationsreparatur. Zuerst negative, bereits gecrawlte unveränderte Seiten mit konkreten Evidenz-/Intentlücken verbessern; die zwei negativen migrierten Vergleiche und Solo/Stromausfall separat beobachten. Bei „Gefunden“-Zielen zunächst Discovery-/Inspectiondaten beschaffen, nicht automatisch Textumfang erhöhen.

Die 41 in 35.4 lokal verbesserten Canonicals sind keine nachgewiesene Recovery. Bereits gut indexierte migrierte Vergleiche haben für weitere großflächige Änderungen geringere Priorität. Ratgeber mit medizinischen Aussagen weiter fachlich belegen, Produktbeobachtungen klar von Herstellerangaben trennen und tatsächlich überlappende Intents einzeln entscheiden. Keine zusätzliche Zusammenlegung ohne eigenständige Evidenz.

Methodischer Rahmen: Google empfiehlt konkrete URL-Zuordnungen, permanente direkte Weiterleitungen, konsistente Canonicals und getrenntes Monitoring von Alt/Neu; vorübergehende Verarbeitungsschwankungen sind möglich. Das beweist keine Ursache auf dieser Website. [Google: Site moves](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes). Die lokale Umsetzung nutzt die bestehende statische `_redirects`-Architektur. [Cloudflare Pages Redirects](https://developers.cloudflare.com/pages/configuration/redirects/).
