# Gezielter Google-Indexierungs-Fix – 16.10.2026

## Ergebnis und Priorität

- **P0/P1: keine technischen Coverage-Blocker nachgewiesen.** Alle 162 Export-URLs wurden live per GET geprüft; alle Ketten enden mit HTTP 200, passendem Canonical und ohne Meta-/Header-noindex. Das belegt keine Google-Indexierung und erklärt nicht automatisch den Google-Ausschluss.
- **P2: 11 URL-Varianten beibehalten.** Zwei historische Pfade, drei Varianten ohne abschließenden Slash und sechs weitere www-Varianten führen korrekt zu aktuellen kanonischen Zielen. Keine Redirect-, Content- oder Linkänderung erforderlich.
- **P3: 151 aktuelle kanonische URLs.** Im Build vorhanden, in der Sitemap, intern erreichbar und ohne nachgewiesene Indexierungssperre. Google-Status beobachten, bei Bedarf einzelne URL-Inspection; keine pauschalen Optimierungen.
- **Bewertungsdarstellung korrigiert.** Ein positiver Score reicht nicht mehr für Review-Markup. Nachvollziehbare redaktionelle Bewertungen bleiben auch bei `manufacturer-data` zulässig. Eigene Praxistests werden nicht aus Herstellerdaten oder externen Testberichten abgeleitet.

## Vorher / Nachher

| Prüfung | Vorher | Nachher |
|---|---|---|
| Produktseiten mit Review | 103 | 92 |
| `manufacturer-data` mit Review | 49 | 45 |
| `editorial-review` mit Review | 54 | 47 |
| Produktseiten mit Product und BreadcrumbList | 103 | 103 |
| Eigene Praxistests im aktuellen Datenbestand | 0 | 0 |
| Bedingung für Review | positiver Score | positiver Score, Kriterien, dokumentierte Methodik/Quellenbewertung, Urteil und Belege |
| Titel-Fallback | „im Test und Vergleich“ | statusabhängig „Datencheck“, „Redaktionelle Einordnung“ bzw. „Testbericht“ |
| Explizite SEO-Titel, Descriptions, Canonicals | Bestand | unverändert |
| Coverage | 151 aktuelle URLs + 11 Varianten | unverändert; keine technischen Eingriffe nötig |

Die Layout-Prop `title` enthielt vorher bedingungslos „Testbericht“. Sie war nicht mit einem auf allen Seiten sichtbaren Testbericht-Titel gleichzusetzen: Ein expliziter `seoTitle` hatte Vorrang, und der H1 verwendete den Produktnamen. Der sichtbare Score war bereits als redaktionelle Eignungsbewertung bezeichnet. Direkt am Score steht jetzt zusätzlich, dass kein eigener Praxistest vorliegt. Der ProductRenderer verwendet dafür das bestehende ProductExperience-Modell.

Zwei tatsächlich gerenderte Fallback-Titel ändern sich gezielt:

- PetSafe Petporte smart flap: „im Test und Vergleich“ → „– Datencheck“.
- SureFlap DualScan Mikrochip Katzenklappe: „im Test und Vergleich“ → „– Datencheck“.

Review entfällt bei diesen elf Produkten; ihre Produktdaten, Scores, Preise und Texte wurden nicht editiert:

`devoko-90l-automatisches-katzenklo`, `furbo-360-katzenkamera`, `honeyguardian-a305d`, `honeyguardian-a68`, `neakasa-m1-lite`, `neakasa-riko`, `pawbby-smart-pet-feeder`, `petkit-fresh-element-infinity`, `wopet-cube-air-ca10`, `wopet-heritage-view-camera-feeder`, `wopet-pioneer-f01-plus`.

Die Freigabe berücksichtigt die vorhandenen Strukturen `experience.methodology` sowie die gerenderte Quellenbewertung `externalEvidence.consensus.editorialAssessment`. Quellen können belegte Herstellerangaben, externe Fachreviews oder qualitative modellbezogene Nutzerberichte sein. Eine fremde Sternebewertung allein genügt nicht. Für die Bezeichnung als eigener Praxistest müssen praktischer Teststatus und `editorial.testedHandsOn` übereinstimmen. Die Tests für echte Praxistests verwenden synthetische Fixtures; es wurden keine Testberichte erfunden.

## Coverage-Belege

- [Aktueller priorisierter Kurzbericht](after/google-coverage.md)
- [Alle 162 Einzelbefunde als JSON](after/google-coverage.json)
- [Unveränderte Live-HTTP-Beobachtungen mit Zeitstempeln und Redirect-Ketten](http-observations.json)
- [Import mit Originaldateinamen, SHA-256 und Google-Status](coverage-input.json)
- [Coverage vor der Änderung](before/google-coverage.json)
- [Produkt-Signale vor der Änderung](before/product-signals.json)
- [Produktprüfung nach der Änderung](after/product-signals.json)

Die Exporte enthalten 84 „Gecrawlt – zurzeit nicht indexiert“ und 78 „Gefunden – zurzeit nicht indexiert“, insgesamt 162 unterschiedliche URLs. Der originale Statusstring bleibt im JSON erhalten, einschließlich der im Export enthaltenen fehlerhaften Trennzeichen. `lastCrawledRaw` bleibt ein unveränderter Excel-Rohwert, keine behauptete aktuelle Crawl-Zeit.

Der bestehende `audit-production-baseline.mjs` wurde um `--coverage` erweitert. Er verwendet weiterhin sein Build-Inventar, Sitemap-Parsing, Redirect-Mapping und HTML-Linkdaten. Der Coverage-Modus erzeugt gezielte Berichte statt einer vollständigen SEO-Rebaseline. Er zählt eindeutige HTML-Quellseiten und die kürzeste Klicktiefe ab Startseite; exakte Export-URL, normalisierter Pfad und historisches Weiterleitungsziel werden getrennt ausgewiesen. Live-Beobachtungen wurden nach dem Build wiederverwendet: Es gab kein Deployment.

## Validierung

- 30 relevante Regressionstests: PASS, einschließlich Herstellerdaten, belegter redaktioneller Reviews, eigener Praxis-/Langzeittests, widersprüchlicher Testflags, Route-/Renderer-Anbindung, Netzwerkfehlern, Redirect-Schleifen und HTML-Linkgraph.
- Abschließender Production Build: PASS, **374 Seiten**. Nach Ergänzung der bereits vorhandenen Konsensstruktur wurde der Build erneut ausgeführt.
- Bestehender technischer Source-/Build-SEO-Audit: PASS.
- Alle 103 gerenderten Produktseiten: Review-Freigabe, sichtbare Transparenz, Product, BreadcrumbList, Bildziele und Offers gegen aktuelle Daten geprüft.
- Alle 103 Descriptions und Canonicals unverändert; 101 explizite SEO-Titel unverändert, zwei nachgewiesen irreführende Fallback-Titel korrigiert.
- Keine neuen Seiten, keine Änderungen an Contentdateien, Preisen, Affiliate-Logik, Redirects oder internen Links.
- `git diff --check`: PASS.

Der vorhandene Vorher-Build war gegenüber den aktuellen Repository-Preisdaten nicht vollständig aktuell: 33 Offer-Ausgaben unterscheiden sich nach dem Neuaufbau. Alle nachher gerenderten Offers wurden gegen den **unveränderten** Commerce-Resolver und den aktuellen Content geprüft; diese Abweichungen wurden nicht durch eine Änderung der Preislogik verursacht. Acht generierte Bild-Asset-URLs änderten sich beim Neuaufbau; alle Bildziele existieren. Diese Build-Effekte sind in den Produkt-Signalen getrennt dokumentiert.

## Wiederholung

```powershell
python apps/pfotentechnik/scripts/seo/import-gsc-coverage.py --out apps/pfotentechnik/reports/google-indexing-fix/coverage-input.json "C:\Users\bbuck\Downloads\pfotentechnik.de-Coverage-Drilldown-2026-10-16.xlsx" "C:\Users\bbuck\Downloads\pfotentechnik.de-Coverage-Drilldown-2026-10-16 (1).xlsx"
node apps/pfotentechnik/scripts/seo/audit-production-baseline.mjs --coverage apps/pfotentechnik/reports/google-indexing-fix/coverage-input.json --out reports/google-indexing-fix/after --coverage-http-cache apps/pfotentechnik/reports/google-indexing-fix/http-observations.json
```

Für neue Live-Messungen zusätzlich `--coverage-live` verwenden. Die HTTP-Cache-Datei dokumentiert Messzeitpunkte; ohne diesen Schalter werden keine aktuellen HTTP-Statuswerte vorgetäuscht.

Referenz zur Prüfung der strukturierten Bewertungen: [Google Search Central – Review-Snippets](https://developers.google.com/search/docs/appearance/structured-data/review-snippet). Die zusätzliche Freigabe anhand der vorhandenen Bewertungsbelege ist eine redaktionelle Projektregel, keine Behauptung, dass Google einen eigenen Praxistest für jedes redaktionelle Review verlangt.
