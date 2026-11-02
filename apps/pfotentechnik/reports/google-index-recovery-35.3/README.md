# Auftrag 35.3 – Google Index Recovery

Stand: **02.11.2026**, Anwendung `apps/pfotentechnik`. Lokal umgesetzt und geprüft. Kein Deployment, Push, Indexierungsantrag oder automatische Veröffentlichung.

## A. Indexierungsdiagnose

**Alle 183 exakten GSC-URLs wurden abgeglichen und live per GET geprüft. Ein gemeinsamer technischer Indexierungsblocker ist nicht nachgewiesen.** Der Grund für Googles Nichtindexierung bleibt offen. „Technisch korrekt“ beschreibt die gemessenen Signale und bedeutet weder „indexiert“ noch einen bewiesenen Qualitätsentscheid von Google.

| GSC-Kategorie | URLs | Technisch korrekt | Fehlerhaft | Technisch unklar |
| --- | ---: | ---: | ---: | ---: |
| Gecrawlt, zurzeit nicht indexiert | 105 | 105 | 0 | 0 |
| Gefunden, zurzeit nicht indexiert | 78 | 78 | 0 | 0 |

Die 105 enthalten **91 aktuelle Canonicals und 14 funktionierende Varianten**. Die 78 sind ausschließlich aktuelle Canonicals. Alle 183 Ketten enden mit HTTP 200, dem erwarteten Self-Canonical und ohne Meta-/Header-noindex. Die 14 Varianten sollen gerade nicht eigenständig indexiert werden.

| Entscheidung | Anzahl |
| --- | ---: |
| Soll indexiert werden | 169 |
| Soll weiterleiten | 14 |
| Soll bewusst nicht indexiert werden | 0 |
| Veraltet oder entfernt | 0 |
| Technisch fehlerhaft | 0 |
| Unklar, weitere Prüfung erforderlich | 0 |

Die letzte Zeile betrifft die technische URL-Zuordnung; Googles Ausschlussursache und gewählte Canonicals bleiben für sämtliche Fälle ungeklärt. Vollständige Einzelbefunde: [CSV](url-classification.csv), [JSON](url-classification.json), [Live-HTTP-Beobachtungen](http-observations.json).

### Quellen und Grenzen der historischen Beobachtung

- Die beiden November-Exporte wurden in Downloads gefunden. Der Status stammt aus ihrer jeweiligen `Metadaten.csv`, nicht aus Dateinamen oder HTTP-Signalen. [Originale CSV-Dateien](inputs/), [Dateinamen und SHA-256](input-manifest.json), [Import](coverage-input.json).
- Der Ordner ohne Suffix und weitere identische Downloads enthalten die 78er-Gruppe. Der ausdrücklich nachgereichte Ordner `pfotentechnik.de-Coverage-Drilldown-2026-11-02 (2) 2` enthält die 105er-Gruppe. Identische Kopien wurden nicht mehrfach importiert.
- Beide Diagramme reichen vom **05.08. bis 23.10.2026**: Crawled 8 → 105, Discovered 24 → 78. Einzelne überlieferte Crawl-Daten reichen bis **24.10.**. `1970-01-01` im Discovered-Export bleibt als Rohwert erhalten und wird nicht als tatsächliches Crawl-Datum ausgegeben.
- Gegenüber den vorhandenen Oktober-Exporten: **32 neu enthaltene, elf nicht mehr enthaltene exakte URLs**, netto +21. Die 78er-Gruppe ist unverändert. Fehlende Einträge sind unbekannt, kein Indexierungserfolg. [Statusvergleich](status-changes.json).
- Die im Auftrag genannten 95 indexierten Seiten, der Rückgang von etwa 190 und die 18 Impressionen sind Angaben des Auftrags. Die beiden Drilldown-Exporte enthalten keinen positiven Indexiert-Bestand und keinen vollständigen Performance-Export; diese Gesamtentwicklung wurde damit nicht unabhängig verifiziert.

### Technischer Abgleich

Finaler Production Build: **374 HTML-Dokumente, 259 öffentliche Canonicals und 115 Noindex-/Admin-Dokumente**. Die 169 exakten betroffenen Canonicals besitzen eine generierte Route, Sitemap-Eintrag und Self-Canonical. Auch alle Ziele der 14 Varianten sind vorhanden. Die übrigen 90 öffentlichen Canonicals haben im aktuellen Export keinen direkten Google-Statusbeleg.

- **HTTP und historische URLs:** vollständiger Live-Abgleich aller 183 URLs, zusätzlich aller 259 veröffentlichten Sitemap-URLs, 70 Legacy-Regeln sowie 16 Host-/Protokoll-/Query-/404-Fälle. Keine fehlgeschlagenen Prüfungen. Zufällige unbekannte URLs liefern echte 404, auch nach www-Weiterleitung; kein Startseiten-Fallback. [Produktionsprüfung](production-http.json).
- **Varianten:** neun www-URLs, drei URLs ohne Slash und zwei weitere Legacy-Routen. Die www-Variante von `petkit-yumshare-solo` benötigt weiterhin Host- und Legacy-Weiterleitung, also zwei permanente Schritte. Sie erreicht das richtige Ziel; keine Schleife, kein interner Verweis und kein Sitemap-Eintrag auf diese Variante. Die funktionierenden Regeln bleiben bestehen.
- **Robots:** Live-robots.txt erlaubt Crawling und verweist auf die korrekte Sitemap. Die öffentlichen Ziele besitzen kein Meta- oder X-Robots-Tag-noindex. Sechs priorisierte URLs liefern auch bei einem Googlebot-User-Agent HTTP 200 und passende Canonicals. Das ist **kein verifizierter Googlebot-Zugriff**. [User-Agent-Proben](googlebot-user-agent.json).
- **Sitemap/Lastmod:** 259 eindeutige URLs stimmen mit Build und veröffentlichter Sitemap überein; alle Build-Ziele existieren. 248 haben parsebare, nicht zukünftige Lastmod-Werte, elf keine. Vorhandene Content-Daten werden weiterverwendet; keine pauschale Datumsaktualisierung. [Einzelprüfung](sitemap-validation.json).
- **Rendering und Schema:** Ziele und kontextuelle Verweise sind im statischen HTML enthalten, also zum Auffinden nicht auf JavaScript angewiesen. JSON-LD-/Product-/Review-/Breadcrumb-Regressionen und alle 28 Vergleichs-ItemLists bestehen. Das belegt weder Googles gerenderte Version noch die Freigabe eines Rich Results.
- **Linkgraph:** alle 259 öffentlichen URLs erreichbar, keine echten Waisen, keine gebrochenen internen Dokumentlinks, keine internen Alias-Links. Gezählt werden eindeutige HTML-Quellseiten; Klicktiefe ist der kürzeste Weg ab Startseite. [Vollständige Inventur](url-inventory.csv), [Snapshot](snapshot.json).

### Priorisierte Discovered-Seiten nach Umsetzung

Alle sechs sind in Sitemap und Build, live HTTP 200 und ohne Indexierungssperre.

| URL | Klicktiefe | Kontextuelle Quellseiten | Direkt aus Themenhub |
| --- | ---: | ---: | --- |
| `/vergleiche/beste-gps-tracker-fuer-katzen/` | 1 | 11 | `/gps-tracker/` |
| `/vergleiche/gps-tracker-mit-langer-akkulaufzeit/` | 2 | 9 | `/gps-tracker/` |
| `/vergleiche/beste-automatische-katzentoiletten/` | 2 | 20 | `/automatische-katzentoiletten/` |
| `/vergleiche/beste-mikrochip-katzenklappen/` | 1 | 28 | `/katzenklappen/` |
| `/produkt/tractive-dog-6-xl/` | **2 statt 3** | **15 statt 14** | `/gps-tracker/`, neu |
| `/produkt/petlibro-granary-wifi-feeder/` | 2 | 24 | `/smarte-futterautomaten/` |

## B. Umgesetzte Verbesserungen

| Priorität | URL/Bereich | Nachgewiesenes Problem | Korrektur und Datei | Erwarteter Nutzen |
| --- | --- | --- | --- | --- |
| P1 | `/gps-tracker/` → `/produkt/tractive-dog-6-xl/` | Priorisiertes Modell hatte keinen direkten Hub-Link und Tiefe 3 | In `src/domain/category/categoryConfig.ts` die bestehende Produktauswahl um DOG 6 XL mit belegter Rolle **„Hunde ab 20 kg“** ergänzt; sechs Modelle innerhalb der bestehenden Obergrenze | Direkter Modellzugang für große Hunde; gerenderte Klicktiefe 2 und eine zusätzliche kontextuelle Quelle nachgewiesen |
| P1, Diagnose | Alle URLs im URL-Consistency-Audit | Doppelt escapete Wort-/Whitespace-Grenzen verhinderten die Meta-noindex-Erkennung; öffentliche Seiten wurden falsch gezählt | `scripts/seo/audit-url-consistency.mjs`: Wort-/Whitespace-Grenzen korrigiert; `test/url-consistency-audit.test.mjs`: isolierte Integration mit beiden Attributreihenfolgen, Großschreibung und weiter erforderlichen öffentlichen Canonicals | Belastbare technische Klassifikation im selben Build: vorher 261/113, jetzt 259/115; keine Änderung an ausgelieferten Robots oder Canonicals |

Der GPS-Hub rendert seine Produktauswahl aus der vorhandenen Kategorie-Konfiguration. Die Korrektur wurde im **finalen HTML und Linkgraphen** nachgewiesen. Keine neue Linkliste, kein Footer-Eingriff und keine Änderungen an Scores, Redirects, Canonicals, Preisen oder Produktaussagen.

## C. Redaktionelle Prüfung und nicht automatisch lösbare Punkte

Die **91 exakten aktuellen Crawled-Seiten** umfassen 38 Produkte, 41 Ratgeber, acht Hersteller, drei Vergleiche und einen weiteren Hub. Ihre Klicktiefe beträgt 2 oder 3. Die 14 Varianten wurden technisch separat geprüft und nicht als zusätzliche Inhalte gezählt.

Das vorhandene Content-Quality-Verfahren wurde auf dem finalen Build für alle 374 Dokumente ausgeführt: **keine Findings, keine nachgewiesenen Exact-/Near-Duplikate**. Die semantische Einordnung bleibt davon getrennt. [Audit](content-quality.json), [Überschneidungskandidaten mit Methode](overlap-candidates.json). Das ist kein vollständiger externer Faktencheck sämtlicher Produktaussagen und kein Beweis für ausreichenden eigenständigen Suchnutzen jeder Seite.

| Cluster/Frage | Befund und Konsequenz |
| --- | --- |
| GPS | Allgemeiner Katzenvergleich, Kleinformatvergleich und Akkulaufzeitvergleich haben Überschneidungen, aber unterschiedliche Aufgaben: Tier-Fit, kleine Gehäuse und Betriebsbedingungen. Nur Akku-/allgemeiner Katzenvergleich sind im aktuellen Discovered-Export; der Kleinformatvergleich ist gegenüber Oktober jetzt **unbekannt**. Google-Canonical und Queries prüfen, keine automatische Zusammenlegung. DOG 6 XL ist nun fachlich passend direkt erreichbar. |
| Futterautomaten | Aktuell Crawled sind Kamera- und Ohne-WLAN-Vergleich. Sichtkontrolle/Datenschutz und Offline-Ausgabe lösen unterschiedliche Aufgaben. Die älteren Crawled-Fälle App und Zwei-Katzen fehlen im neuen Export und sind deshalb unbekannt. Gleiche Empfehlungen allein belegen keine identischen Suchintentionen. |
| Trinkbrunnen | Gesamtgerätereinigung, Pumpenreinigung und Biofilm überschneiden sich, beschreiben aber unterschiedliche Arbeitsschritte. Erst Google-Canonical und Query-Daten dieser Seiten vergleichen. Hunde-, Kitten- und Seniorenrollen nicht wegen gleicher Geräte pauschal konsolidieren. |
| Mikrochip-Futterautomaten/Katzentüren | Zugangskontrolle beim Futter und Identität/Zugang an der Tür sind unterschiedliche Funktionen. Türhub, Mikrochip-Vergleich und App-/Beutevergleich sind direkt erreichbar. Weder eine gemeinsame technische Sperre noch ein zwingender Konsolidierungsfall belegt. |
| Katzentoiletten/Kameras | Kategorie erklärt Anforderungen, Vergleich ordnet Modelle. Zentrale Vergleichsseiten sind direkt aus den Hubs verlinkt. Keine neue Seite und keine pauschale Hub-Zusammenlegung erforderlich. |
| Ratgeber | `/hund-trinkt-viel/` ist jetzt Crawled. Überschneidung mit `/hund-trinkt-ploetzlich-viel/` als **Konsolidierungskandidat** prüfen: Beide behandeln Ursachen, Messung und Warnzeichen. Eine Zusammenlegung erst empfehlen/planen, wenn die aktuelle Akut-Abgrenzung keinen eigenen Suchnutzen trägt und Query-/Canonical-Daten dies stützen; nicht automatisch ausführen. |
| Produkt-Evidenz | Unter den 38 aktuellen Crawled-Produkten: 32 `editorial-review`, sechs `manufacturer-data`; explizites `editorial.testedHandsOn` fünfmal false, sonst nicht angegeben. Kein ausdrücklich bestätigter eigener Praxistest. Dokumentationsstatus allein beweist keinen Mangel; keine erfundenen Messwerte, pauschalen Review-Entfernungen oder Scoreänderungen. |
| Schwache Einzelfälle | `petkit-fresh-element-infinity` und `wopet-pioneer-f01-plus` haben jeweils nur eine kontextuelle Quelle. Für eine pauschale Aufnahme in prominente Empfehlungen fehlt die sachliche Begründung. Keine Linkmenge um ihrer selbst willen erzeugt. |

Fehlende Belege: URL-Inspection mit Google-Canonical und Abrufdatum, verifizierte Googlebot-Access-Logs, tatsächliche Google-Rendering-Version, positiver aktueller Indexiert-Export und passende Suchleistungs-/Query-Daten. User-Agent-Proben schließen eine IP-/Google-spezifische Sperre oder historische Hostingstörungen nicht aus. Aus der heutigen Erreichbarkeit wird keine Ursache des Rückgangs abgeleitet.

Die erfüllten technischen Voraussetzungen garantieren laut [Google Search Central](https://developers.google.com/search/docs/essentials/technical) keine Indexierung. Tatsächliche Google-Zugriffe müssen über [verifizierbare IP-/DNS-Merkmale](https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests) belegt werden. Lastmod bleibt ein optionales, sachlich zu pflegendes Signal; siehe [Google-Sitemap-Dokumentation](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## D. GSC-Nachkontrolle nach einer späteren Veröffentlichung

**Technisch behoben:** Noindex-Erkennung des lokalen Audits. Das ist keine ausgelieferte Website-Sperre und benötigt keinen Indexierungsantrag. Die direkte Hub-Verlinkung des DOG 6 XL ist lokal verbessert; für ihre Beobachtung muss die Änderung zunächst separat veröffentlicht werden.

**Zur erneuten Indexierung geeignet:** Nach Prüfung der tatsächlich veröffentlichten Version jeweils URL-Prüfung durchführen, Google-Canonical, letzten Crawl, mobile Darstellung und Indexierungsentscheidung speichern. Einmalige manuelle Anfrage nur für ausgewählte erfolgreiche Prüfungen; keine Anfragen wurden ausgeführt.

| Rang | URLs | Zweck |
| --- | --- | --- |
| 1 | `/produkt/tractive-dog-6-xl/`, `/gps-tracker/` | Neue Hub-Verlinkung nach Veröffentlichung prüfen; nur hier ist eine neue lokale Linkänderung zu beobachten |
| 2 | `/vergleiche/beste-gps-tracker-fuer-katzen/`, `/vergleiche/gps-tracker-mit-langer-akkulaufzeit/` | Discovered trotz direkter Hub-Wege: tatsächlichen Abruf und Google-Canonical erheben |
| 3 | `/vergleiche/beste-automatische-katzentoiletten/`, `/vergleiche/beste-mikrochip-katzenklappen/` | Weitere zentrale Discovered-Vergleiche kontrollieren |
| 4 | `/produkt/petlibro-granary-wifi-feeder/` | Discovered-Produkt mit bereits guter interner Erreichbarkeit als Vergleichsfall |
| 5 | `/vergleiche/beste-futterautomaten-mit-kamera/`, `/vergleiche/beste-futterautomaten-ohne-wlan/`, `/vergleiche/beste-trinkbrunnen-fuer-hunde/` | Aktuelle Crawled-Vergleiche: von Google verarbeitete Version und Canonical prüfen |
| 6 | `/produkt/petkit-fresh-element-infinity/`, `/hund-trinkt-viel/` | Schwächer verlinkten Produktfall und konkrete Intent-Überschneidung untersuchen |

**Weiterhin ungeklärt:** Ursache des Indexierungsverlusts, Status der 90 nicht direkt beobachteten öffentlichen Canonicals und der elf inzwischen fehlenden Export-URLs. Insbesondere `hersteller/petlibro`, App-Vergleich und Kleinformat-GPS-Vergleich nicht wegen ihres Verschwindens als indexiert behandeln. Aliase nicht eigenständig zur Indexierung einreichen.

T0 nach einer stabilen Veröffentlichung speichern, danach neue GSC-Belege an T+7/T+14/T+28 vergleichen. Ein fehlender Export-Eintrag bleibt unbekannt. Eigene HTTP-/Build-Beobachtungen und Google-Status getrennt halten; keine garantierte Ranking- oder Indexierungswirkung.

## Qualitätssicherung und Reproduktion

| Prüfung | Ergebnis |
| --- | --- |
| Finaler vollständiger Build | PASS, 374 Seiten |
| Vollständige Testsuite einschließlich neuer Regression | PASS, 991/991, keine übersprungenen Tests |
| URL-/Canonical-Audit und strikte interne Linkziele | PASS, null Fehler/Warnungen |
| Source-/Build-SEO und Vergleichs-Schema | PASS, 28 Vergleichsseiten/ItemLists |
| Vollständiger GSC-Abgleich | PASS, 183 eindeutige Original-URLs, 169 Canonicals/14 Weiterleitungen |
| Live-Produktionsprüfung | PASS, 259/259 Sitemap-URLs, 70 Legacy-Regeln, 16 Proben |
| Linkgraph | PASS, keine Waisen, unerreichbaren URLs, defekten Dokumentlinks oder internen Alias-Ziele |
| Content-Quality | PASS, keine Findings; keine behauptete Google-Qualitätsbewertung |
| Mobile/Tablet/Desktop | PASS, 30 statische HTML/CSS-Vertragsprüfungen; keine Browser-Layoutmessung |
| Dark Mode/Kategorieverträge | Bestehende Regressionen bestehen; unveränderte Komponenten/CSS, sechs GPS-Modelle innerhalb der bestehenden Grenzen |
| Git-Diff | Auf die belegten Änderungen und Auditbelege begrenzt; `git diff --check` PASS |

Keine allgemeine TypeScript- oder Content-Lint-Bereinigung durchgeführt. [Validierungsauszüge](validation.txt), [maschinenlesbare Diagnose](diagnosis.json). Die Live-Beobachtungen betreffen die zuvor veröffentlichte Version; das finale lokale HTML enthält die noch unveröffentlichte Hub-Verlinkung.

Ab Repository-Wurzel:

```sh
npm run build:pfotentechnik
npm --workspace apps/pfotentechnik test
node apps/pfotentechnik/scripts/seo/audit-url-consistency.mjs --strict
node apps/pfotentechnik/scripts/audit-internal-link-targets.mjs --strict
node apps/pfotentechnik/scripts/seo/audit-week4-technical-seo.mjs
node apps/pfotentechnik/scripts/seo/audit-comparison-product-schema.mjs
node apps/pfotentechnik/scripts/performance/viewport-contract.mjs
node apps/pfotentechnik/scripts/seo/audit-production-baseline.mjs --recovery --coverage apps/pfotentechnik/reports/google-index-recovery-35.3/coverage-input.json --observed-at 2026-11-02 --previous apps/pfotentechnik/reports/google-indexing-recovery/current/snapshot.json --out /tmp/pfotentechnik-recovery-repeat
node apps/pfotentechnik/scripts/seo/audit-production-baseline.mjs --coverage apps/pfotentechnik/reports/google-index-recovery-35.3/coverage-input.json --coverage-http-cache apps/pfotentechnik/reports/google-index-recovery-35.3/http-observations.json --out /tmp/pfotentechnik-coverage-repeat
```

Für eine neue HTTP-Messung zusätzlich `--coverage-live` mit einem **neuen** Cachepfad verwenden. Für die nächste Google-Beobachtung einen neuen belegten Export importieren und den hier gespeicherten `snapshot.json` als `--previous` angeben. Gleiche Daten nicht als neue Google-Messung ausgeben.
