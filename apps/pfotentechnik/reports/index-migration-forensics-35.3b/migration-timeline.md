# 35.3B – Migrationschronologie

Stand: 02.11.2026. Git-Basis `5633a476369208b5d4170b0b5e9184ef79209cf0`; 875 erreichbare Commits, kein Shallow-Checkout. Autor- und Committerzeit stehen in der beigefügten Git-Evidenz. Die folgenden Uhrzeiten sind Git-Autorzeiten in Europe/Berlin, **keine nachgewiesenen Deploymentzeiten**.

## Quellen und Abgrenzung

Zuerst ausgewertet: `reports/seo-cockpit/visibility-34.7-evidence/`, der korrigierte Bericht `reports/seo-cockpit/production-http-integrity-34.8.md`, dessen Original-GSC-ZIP und Live-Vorher-/Nachher-Belege sowie `apps/pfotentechnik/reports/google-index-recovery-35.3/`. Der vollständige Sitemap-/183-URL-Liveaudit aus 35.3 wird nicht als neue Untersuchung ausgegeben. Neu sind die vollständige Pfadhistorie, die fehlerhaften Canonical-Ziele, die Kohorten und deren gezielte HTTP-Prüfung.

3.841 Änderungsereignisse und 3.836 unterschiedliche Markdown-Blobs der vier öffentlichen Collections wurden auf Slugs, Löschungen, Canonicals, Publikationsmetadaten und explizites noindex untersucht. Datei-Backups außerhalb der Collections erzeugen keine öffentlichen Routen. Dateiname und tatsächlicher Frontmatter-Slug wurden getrennt: Die Datei `was-tun-wenn-der-futterautomat-klemmt.md` enthielt zuletzt einen völlig anderen Wasserstandort-Artikel.

Die Repository-Historie beginnt am 22.06.2026 mit dem Astro-/Balkonspeicher-Projekt. PfotenTechnik ist ab `2203ebef` vom 08.07. im App-Pfad belegt. Ein früheres Erstellen der Inhalte außerhalb dieses Repositories ist möglich, aber damit nicht datierbar. Aktuelle `publishedAt`-Werte sind kein Nachweis eines damaligen Livegangs.

## Ereignisse

| Zeitpunkt | Git-/Live-Beleg | Bedeutung |
| --- | --- | --- |
| 08.–10.07. | `2203ebef`, `c0f1631b`, `55919077` | Root-Seiten entstehen im App-Pfad. Ein vorübergehender Nassfutter-Datei-Slug benennt Mehrtierhaushalte; dessen Root-URL besteht daneben unabhängig weiter. Keine zusätzliche dauerhafte Migration zählen. `robots.txt` erlaubt Crawling und nennt den non-www-Sitemapindex. |
| 12.07., 14:40 | `8755d262` | Fünf Futterautomaten-Vergleiche werden zusätzlich unter `/vergleiche/` erzeugt. Die zugehörigen Root-Seiten bleiben zunächst bestehen; Vergleichsroute und Root-Route verwenden jeweils ihre eigenen Canonicals. Die Migration ist kein einzelner Umstellungstermin. |
| 14.07., 17:12 | `2e42bfae` | Der Klemmt-Ratgeber wird durch einen themenfremden Wasserstandort-Artikel mit anderem Slug überschrieben. Kein gleichwertiger Nachfolger nachgewiesen; eine Weiterleitung dorthin wäre irreführend. Spätere Löschung der Datei am 16.07. ist nicht das Datum, an dem der Klemmt-Pfad verschwindet. |
| 16.07. / 20.07. | Collection-Erstanlagen, siehe Git-Evidenz | Zwei Trinkbrunnen- und fünf GPS-Vergleiche entstehen direkt unter `/vergleiche/`. Ihre späteren Root-Redirects belegen keine vorherigen Root-Seiten. Diese sieben Seiten gehören zur unveränderten Kontrollgruppe. |
| 23.07., 15:22 | `0d4806c5` | Produktalias `/produkt/petkit-yumshare-solo/` wird gelöscht, zunächst ohne Redirect. Derselbe Produktname „YumShare Solo 2“ belegt den passenden Nachfolger. |
| 24.07., 23:29 | `fdd7f8b2` | Nassfutter-Root wird entfernt, Vergleich und beide 301-Varianten sind im selben Commit vorhanden. |
| 25.07., 20:52 / 21:32 | `bb470587`, `0225caf9` | Weitere fünf Root-Vergleiche werden mit Redirects im selben Commit entfernt. Die neuen Vergleichsseiten existieren bereits seit 12.07. |
| 27.07., 08:01 | `073a6173` | 15 weitere Root-Pfade entfernt, elf zusätzliche Vergleichsziele angelegt; vier Root-Intentvarianten werden mit bereits vorhandenen Vergleichszielen zusammengeführt. Redirects für diese 15 Pfade fehlen in diesem Git-Zustand. |
| 27.07., 08:46 | `3dc09874` | Redirects für alle 15 ergänzt: **45 Minuten 39 Sekunden Git-Lücke**. Gleichzeitig beschädigt die Linkumschreibung 14 Canonical-Ziele: `/vergleiche/beste-futterautomaten-…/` wird zu `/vergleiche/-…/`. In untersuchten Content-/Komponenten-/Seiten-/Konfigurationsquellen stehen 101 betroffene Quellzeilen, darunter 14 Canonicals; dies sind keine 101 verschiedenen URLs. |
| 27.07., 09:01 | `b07f68d7` | Alle 14 Canonicals repariert: **14 Minuten 53 Sekunden Git-Intervall**. 87 Quellzeilen mit fehlerhaften Linkpfaden bleiben. `3f8db2d1` ergänzt nur Kommentare in `_redirects`; die Bezeichnung „fix“ belegt hier keine zusätzliche Redirectreparatur. |
| 27.07., 09:12 | `2f016fac` | Migrationsaudit/Datenergänzungen; kein Ersatz für den noch später erfolgenden vollständigen Linkfix. |
| 27.07., 23:08 | `d50e45c3` | In den untersuchten Inhalts-/Komponenten-/Seiten-/Konfigurationsquellen keine `/vergleiche/-…`-Treffer mehr. Linkfehler damit im Git für bis zu **14 Stunden 21 Minuten 27 Sekunden** vorhanden. Siehe `malformed-path-history.json`. |
| 28.07. | `11eb32c2` | Batterie-/Netzteil-Ratgeber in Stromausfall-Ratgeber konsolidiert; Redirects im selben Commit. |
| 29.07. | `c1b83759` | GPS/Bluetooth-Ratgeber und YumShare-Dual-Produktalias konsolidiert; Redirects im selben Commit. |
| 04.08. | `2b57f4f1` | Smarte-Katzenklappen-Root in Katzenklappen-Hub konsolidiert; Redirects im selben Commit. Zwei neue Katzenklappen-Vergleiche entstehen direkt unter `/vergleiche/`. |
| 06.08. | Collection-Historie | Toiletten- und Kamera-Vergleiche entstehen direkt unter `/vergleiche/`; keine Migration. |
| 08.08. | `f1e7dfb9` | URL-Konsistenzhelfer und Tests eingeführt; zwei Redirectvarianten für `/vergleiche/-fuer-katzen/` gehen auf die allgemeine Vergleichsübersicht. Die anderen 13 beschädigten Canonical-Pfade erhalten keine Recovery-Regeln. |
| 07.09., Git 13:37 | `b3724bec` | Solo-Redirect ergänzt; Abstand zur Löschung rund 45 Tage 22 Stunden. Das ist eine Quellcode-Lücke, keine belegte durchgehende Live-Ausfalldauer. |
| 07.09., Live 13:03–13:27 UTC | 34.8 Vorher-/Nachher-HTTP-JSON | Zuvor www-200 und Homepage-200 für unbekannte Pfade/Solo-Alias; danach echte 404, www-301 und Solo-301. Nachher-Gate: 258 Sitemapziele und 68 Legacy-Regeln bestanden. 13:27:50 UTC ist der dokumentierte Verifikations-/Messanker, kein unabhängig aus Cloudflare ausgelesener Deploymentzeitpunkt. |
| 21.–22.09. | `8b68bd76`, `8b7649d2`, `4a72b6c9`, `a8c5b0f4` | Redaktionelle Titel-/Wasserbedarf-/Reinigungsänderungen und Commerce-Arbeiten. Kein neuer Vergleichs-URL-Umzug belegt. Zeitliche Korrelation mit Indexsprung ist kein Wirkungsnachweis. |
| 05.10. | `9d59fda8`, `38ae5913`, `3e780a9d`, `fd5b598a` | Advisor-/Vergleichsdaten-/Linkoberflächenänderungen. `/futterautomat-berater/` wird mit 301 nach `/berater/futterautomat/` entfernt. Ein umgezogener Advisor erklärt den gleichzeitigen Rückgang um 29 indexierte URLs nicht direkt. |
| 16.10. / 22.10. / 02.11. | Git und bestehende Berichte | Weitere Produkt-/CTA-/Preis-/Datenänderungen; 35.3 prüft 183 negative Export-URLs. Kein weiterer umfassender Vergleichsroutenwechsel belegt. |
| 02.11., 35.3B lokal | Arbeitsstand | 13 fehlende Recovery-Ziele ergänzt und Katzen-Fehlziel präzisiert; 96 statt 70 Regelvarianten. Kein Push/Deployment. |

## Sitemap, Canonicals und interne Links

Die Astro-Routen verwenden Collection-Slugs. Die Sitemap-Metadaten werden ebenfalls aus Slugs gebildet. Die 14 falschen `seo.canonical`-Werte änderten deshalb die tatsächlich erzeugten Vergleichs-Routen nicht; es entstand ein widersprüchliches Signal zwischen existierender Route/Sitemap und Canonical-Ziel. Historische Deployment-Sitemaps für jedes Zwischenstadium liegen nicht vor. Die Sitemapbereinigung `a022fb5c` vom 25.07. schließt Admin/API-/Fehlerpfade aus und normalisiert Datumswerte; sie entfernt nicht pauschal die öffentlichen Vergleichsrouten.

Links wurden nicht fehlerfrei in einem Schritt umgestellt: Der 27.07.-Rewrite beschädigte auch Navigation, Advisor- und Contentlinks. Der Abendcommit korrigierte diese Vorkommen. Heutiger Build und die übernommenen 35.3-Prüfungen zeigen direkte aktuelle Linkziele; ein historisches Render-/Crawlprotokoll fehlt.

## Suchsichtbarkeit und Indexkurve sind unterschiedliche Messreihen

Original-GSC-Performance: 74 Impressionen am 24.07., zwei am 25.07., fünf am 26.07. Der erste Einbruch liegt somit **vor** den fehlerhaften Canonicals vom 27.07.; die erste Root-Entfernung vom 24.07. bleibt zeitlich kompatibel, ihr Redirect war jedoch im selben Commit enthalten. Wochenwerte: 339 Impressionen 13.–19.07., 280 am 20.–26.07., 20 am 27.07.–02.08. Keine URL-genaue tägliche Attribution möglich.

Coverage-Übersicht vom 02.11., Daten bis 23.10. (`coverage-index-timeline.csv`): 196 indexierte URLs am 05.08., Höchststand 198 am 15.–17.08., 187 am 07.09., 158 am 22.09., 129 am 05.10., 100 am 13.10., 95 am 23.10. Die größten Tagessprünge sind −22 am 22.09., −29 am 05.10. und −20 am 13.10. Damit weder einen unmittelbaren Juli-Indexkollaps noch eine Recovery nach dem Septemberfix behaupten. Ohne historische URL-Inventare sind 101/103 weniger gemeldete URLs nicht automatisch ebenso viele verlorene eigenständige Inhalte.
