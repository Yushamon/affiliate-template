# PfotenTechnik 37.0 – Interactive Gift Guide Experience

Implementiert für `/ratgeber/technikgeschenke-haustiere/`. Stand: 16.11.2026. Kein Merge, kein Deployment.

## Ergebnis

Eigenständige Editorial-Landingpage mit responsivem Hund/Katze-Titelmotiv, vierstufigem Finder (Tier → Wunsch mit nötigen Kontextfragen → Budget → Ergebnis), persönlichen Begründungen, offen ausgewiesenen Datenlücken, veränderbaren Antworten, Preissortierung, teilbaren URLs und einem Direktvergleich für zwei bis drei Modelle. Produktdetails bleiben als native Aufklappbereiche lesbar. Geburtstage, Weihnachten und Black Friday werden ohne künstliche Angebots- oder Lieferbehauptungen eingeordnet. Ohne JavaScript bleiben Beratung, drei Modellbeispiele, FAQ und Links verfügbar.

375 und 1600 Pixel, Light und Dark geprüft. Keine horizontalen Seitenüberläufe oder defekten Bilder. Tastaturauswahl, Fokusführung, Live-Meldungen, reduzierte Bewegung und der Betrieb ohne JavaScript wurden im echten Browser geprüft. Einblendungen erfolgen einmalig; ohne IntersectionObserver bleibt der Text sichtbar. Beim Zurücknavigieren zu einer URL ohne Auswahl werden die unpersonalisierten Beispiele wiederhergestellt.

## Architektur und bestehende Daten

- Eintrag in der vorhandenen `pages`-Collection; eigene verschachtelte Astro-Route, keine zusätzliche flache Dublette. Der Wissen-Hub nimmt die neue Seite automatisch auf. Standardnavigation und Footer wurden nicht verändert.
- Produktregister → vorhandene Publikations-, Product-Operations-, Commerce-, Bewertungs- und Vergleichsfunktionen → berechnete, ausschließlich lesende Darstellung für den Finder. Keine zweite Produktdatenbank, keine neuen Dependencies, keine neuen Produktseiten.
- Gemeinsame Advisor-Prüfung aus der bestehenden Funktion extrahiert; bisherige GPS-/Brunnen-Einstiegspunkte behalten ihre Kategorien und Ergebnisse. Sortierung folgt dieser Logik einschließlich bestehender redaktioneller Bewertungen. Kein neuer Geschenk-Score.
- Eigenschaften kommen aus der Comparison Data Platform; Entscheidungshinweise aus der sicheren zentralen Logik von 35.9. Die 437 redaktionellen Originalhinweise bleiben gesperrt, die Freigabeliste bleibt leer.
- Preis- und Affiliate-Ziele kommen aus `resolveCommerceOffers`. Im SEO Cockpit gespeicherte Produktpreisänderungen wirken beim nächsten regulären Build automatisch auf diesen Katalog. Die bestehenden Preisaktualisierungswege werden wiederverwendet, kein zusätzlicher Scraper oder Preisjob. Eine bereits ausgelieferte statische Seite benötigt den normalen neuen Build/Release für geänderte Daten.
- SEO über das vorhandene ProjectLayout: selbstreferenzieller Canonical, index/follow, Artikel-/FAQ-Daten, eigene Metadaten, Sitemap und interner Zugang aus `/wissen/`. Die historische Indexierungs-/GSC-Auswertung von 36.1 bleibt als datierter Stand erhalten; keine Indexierung der neuen, noch unveröffentlichten URL behauptet.

## Auswahlgrenzen

56 Modelle aus vier Geräteklassen erfüllen die Kataloggrenzen: 17 trinkbrunnen, 21 futterautomaten, 8 haustierkameras, 10 gps-tracker.

Bei 12 dieser Modelle ist die Verfügbarkeit im Bestandsdatenstand bestätigt; 44 haben hierzu offene Angaben und werden ausschließlich als noch zu prüfen ausgegeben. Das sind Katalogzahlen, keine Zahl passender Treffer für jede Antwortkombination.

Bestätigte Treffer benötigen die dokumentierte Tierart, alle ausgewählten harten Anforderungen und einen passenden Verfügbarkeitsbeleg. Bei festem Budget ist zusätzlich ein frischer, positiver Euro-Gerätepreis erforderlich. Veraltete oder zukünftige Preisbelege zählen nicht. Ein Preis ist kein Lieferbeleg. Unbekannte Futterart oder fehlendes Tiergewicht führt zu offenen Punkten; bekannte Gegenanzeigen werden ausgeschlossen. Für „Beide“ müssen beide Tierarten dokumentiert sein. Tracker-Mindestgewicht und dokumentierte Höchstgewichte werden berücksichtigt; eine gleichzeitige Nutzung durch mehrere Tiere wird nicht behauptet.

Die offene Inspiration startet mit Trinkbrunnen und Kameras; Futter- und Tracker-Auswahl benötigt die zusätzlichen Kontextfragen. Klappen und Katzenklos werden im Ratgeber als gemeinsam zu planende Anschaffungen behandelt. Für den Geschenk-Katalog gilt die bereits bei Vergleichsfallbacks genutzte redaktionelle Grenze von 60 Punkten und eine vorhandene Bewertungsgrundlage. Das ändert keine Bewertung. Geschützte Experimentprodukte, Entwürfe, archivierte/nicht verfügbare Produkte und fehlende verifizierte Händlerziele werden ausgelassen. Die relevanten Ausschlussgründe stehen in [catalog-exclusions.json](gift-guide-37.0-qa/catalog-exclusions.json).

Ein festes Budget bezeichnet den Gerätepreis. Dokumentierte digitale Folgekosten werden separat aus dem bestehenden Abo-Kostenmodell angezeigt; enthaltene Paketzeiträume werden dort berücksichtigt. Verbrauchsteile und Versand sind keine geschätzten Pauschalen. Unbelegte Kosten bleiben offen.

## Bilder und Rechte

Fünf eigene, mit dem eingebauten `image_gen` erzeugte Motive; finale WebP-Dateien unter `src/assets/images/gift-guide/`. Hero und Kategorien sind sichtbar als KI-/Symbolbilder gekennzeichnet. Die Geräteklassenbilder sind ausdrücklich keine Fotos der benannten Modelle. Es werden keine aus den Referenzbildern erfundenen Bewertungen oder Produktmerkmale übernommen.

Bei vorhandenen Amazon-/Herstellerbildern belegt die geprüfte Provenienz teilweise nur Herkunft und Betreiberfreigabe, keine unabhängige Lizenz für eine erneute Veröffentlichung. Deshalb keine neue Verwendung dieser Fremdbilder auf der Landingpage. Bestehende Produktseiten und ihre Medien bleiben unverändert. Das ist eine bewusste Grenze der Modellbebilderung; echte Modellfotos können später mit belegter Nutzungsgrundlage eingebunden werden.

[Assetprovenienz einschließlich vollständiger Prompts, Originalpfade, Zielpfade und SHA-256](../research/gift-guide-37.0/image-plan.json).

## Abschlussprüfung

- Endgültiger Produktionsbuild erfolgreich: 391 generierte Seiten, 270 öffentliche selbstkanonische URLs, 269 Sitemap-URLs. Gegenüber der 37.0-Baseline genau eine neue öffentliche Route, keine entfallen.
- Alle 259 vorhandenen Content-Quelldateien aus der Baseline unverändert, darunter alle 110 Produktdateien. Preise, Scores, Affiliate-Ziele und sämtliche 437 Originalhinweise auf 73 Produkten unverändert.
- Experiment 35.5: 20 geschützte Seiten in der bestehenden Prüfung und sämtliche 205 eingehenden Linkzugänge unverändert. Keine experimentgeschützten Modelle werden neu aus dem Finder verlinkt.
- Einzige bestehende Seite mit verändertem Haupttext: `/wissen/`, durch den automatisch aufgenommenen Zugang zur neuen Collection-Seite. Keine defekten internen Ziele auf der neuen Route, keine JSON-LD-Parsefehler.
- **220 Tests bestanden:** 145 Produktintegration/Commerce/Schema/Rendering; 59 bestehende Advisor-/Freshness-/Entscheidungshinweis-/Product-Operations-Regressionen; 16 neue Geschenkfinder-Tests. Dazu 60 reale Antwortkombinationen im reproduzierbaren Buildreport.
- Neue Tests decken belegte Widersprüche, unbekannte Verfügbarkeit/Preise, beide Tierarten, Futter-Negationen, Gewichtsgrenzen, Abo-Anforderungen, validierte URL-Zustände, den gemeinsamen Advisor, vollständiges SSR, unveränderte Originalquellen und die Übernahme künftiger Cockpit-Preisänderungen ab.
- Browserprüfung in vier Ansichten: Pflichtantworten, Schrittwechsel, Kontext, Budget, Sortierung, Antworten ändern, Zurück, URL-Wiederherstellung, Vergleich mit zwei Modellen und Limit von drei, Fokus nach Schließen, Tastatur, leere GPS-Auswahl, reduzierte Bewegung, vollständige sichtbare Ratgeberabschnitte und Inhalte ohne JavaScript. Keine JavaScript-Ausnahmen.
- Diff einschließlich neuer Dateien geprüft; `git diff --check` bestanden. Vorhandene Arbeiten aus 35.9–36.1 bleiben erhalten. Keine Merge-, Push- oder Deployment-Aktion.

Reproduzierbare Nachweise: [Build-/Quellprüfung](gift-guide-37.0-qa/verification.json), [Browserprüfung](gift-guide-37.0-qa/browser.json).

## Vier geprüfte Ansichten

- [Mobil Light: Einstieg/Finder](gift-guide-37.0-qa/gift-guide-375-light.png)
- [Mobil Dark: persönliche Ergebnisse](gift-guide-37.0-qa/gift-guide-375-dark.png)
- [Desktop Light: Einstieg/Finder](gift-guide-37.0-qa/gift-guide-1600-light.png)
- [Desktop Dark: persönliche Ergebnisse](gift-guide-37.0-qa/gift-guide-1600-dark.png)

## Reproduktion

```sh
npm run build:pfotentechnik
npm --workspace apps/pfotentechnik run test:gift-guide
npm --workspace apps/pfotentechnik run test:product-integration
node --test apps/pfotentechnik/test/advisor-decision-b1.test.mjs apps/pfotentechnik/test/advisor-foundation.test.mjs apps/pfotentechnik/test/product-freshness-36.0.test.mjs apps/pfotentechnik/test/decision-consequences-35.9.test.mjs apps/pfotentechnik/test/product-operations.test.mjs
npm --workspace apps/pfotentechnik run check:gift-guide
npm --workspace apps/pfotentechnik run qa:gift-guide
```

Die Browserprüfung nutzt lokal installiertes Google Chrome und einen temporären lokalen Static-Server, der anschließend beendet wird. Sie veröffentlicht nichts. `verify` erst nach beendetem Build starten. Der 36.1-Report ist ein historischer Nachweis mit 269 URLs; seine damalige Inventarzahl ist keine Obergrenze für die ausdrücklich beauftragte neue 37.0-Seite.

## Praktische Grenzen

Die übergebene Auftragsdatei endet in Abschnitt 6.4 mitten in einer Aufzählung. Alle tatsächlich vorhandenen Anforderungen und die drei mitgelieferten Referenzbilder wurden berücksichtigt. Eine optionale Nachfrage nach einem fehlenden Rest blieb unbeantwortet.

Es liegt noch keine Messung im Produktivbetrieb vor. Die HTML-Datei ist rund 643 KiB groß, lokal mit gzip rund 98 KiB; davon stammen Teile aus den inaktiven Modellvorlagen für sofortige Interaktion. Kein externer Empfehlungsdienst, keine zusätzliche Framework-Hydration oder neue Bibliothek. Ladezeit/CWV unter echten Netzbedingungen ist damit nicht als bestanden behauptet. Preis-/Verfügbarkeitsdaten werden nicht als Live-Abfrage dargestellt. Für manche Antworten gibt es derzeit nur Modelle mit offenen Punkten – diese Einschränkung bleibt sichtbar.
