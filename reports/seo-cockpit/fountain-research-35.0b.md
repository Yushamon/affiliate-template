# PFOTENTECHNIK 35.0B — FOUNTAIN COST RESEARCH

## SCOPE

- fountains: 24/24
- P1 researched: 8/8
- P2 researched: 6/6
- P3 researched: 10/10
- identity conflicts: 8 Produkte (Details im Dataset)
- unresolved identities: oneisall-3-2l-cordless-fountain, oneisall-2-2l-cordless-fountain, oneisall-3-5l-cordless-fountain
- Identitätskapazität zusätzlich UNKNOWN: petlibro-glacier-ultrafiltration, petlibro-capsule-dog-fountain

## FILTER DATA

Filtervorhandensein bekannt 24/24 (23 ja, 1 nein). Pflichtstatus bekannt 7/24.

| Feld | Known | Unknown | N/A | Known / 24 |
|---|---:|---:|---:|---:|
| filterRequired | 7 | 17 | 0 | 29.2 % |
| filterlessOperationPossible | 7 | 17 | 0 | 29.2 % |
| filterType | 15 | 8 | 1 | 62.5 % |
| replacementInterval | 17 | 6 | 1 | 70.8 % |
| packSize | 16 | 7 | 1 | 66.7 % |
| currentFilterOffer | 12 | 11 | 1 | 50.0 % |
| annualFilterCost | 11 | 12 | 1 | 45.8 % |
| proprietaryDependency | 1 | 23 | 0 | 4.2 % |
| replacementPumpAvailability | 8 | 16 | 0 | 33.3 % |

## REPLACEMENT PARTS

- pump available: 8
- pump unavailable confirmed: 0
- pump unknown: 16
- pump offers: 9 Produktzuordnungen (inklusive 1 ausverkauft); PETKIT-Angebote sind Bundles, keine Pumpen-Einzelpreise

## EVIDENCE

- manufacturer: 33 eindeutige URL/Typ-Quellen
- officialStore: 18 eindeutige URL/Typ-Quellen
- retailer: 1 eindeutige URL/Typ-Quellen
- manual: 1 eindeutige URL/Typ-Quellen
- unresolved: feldweise mit Gründen im Dataset/Quality-Report
- evidence conflicts: 13 dokumentierte Konfliktfälle

Quellen direkt geöffnet und gelesen, keine Suchsnippets. Originalintervall-Wortlaut und Normalisierung im Dataset. Dieselbe URL pro Produkt/Quellentyp zusammengeführt; über Produkte getrennte exakte Feldpfade gemäß bestehendem evidenceSources-Modell. Abrufmanifest enthält Hashes und Fehler; Volltexte bleiben temporär.

## COST DATA

- products with calculable annual cost: 11/24, nur Hauptfilter
- lowest: 19.85 € (catit-pixi-smart-trinkbrunnen)
- highest: 158.11 € (petlibro-glacier-ultrafiltration)
- median: 52.12 € (nur Teilbestand, kein Bestandsmedian)
- interval-based: 0
- fixed-interval: 11
- insufficient data: 12; N/A: 1

## DATA QUALITY

- overall coverage: 43.5 % known über neun Kernfelder, Nenner 24 je Feld
- outliers reviewed: 9 Kategorien, davon 7 mit Beobachtungen und 2 ohne bestätigten Fall
- corrections after final outlier review: 3 (abschließender Quellencheck); während Recherche/Review 9 Präzisierungen
- guessed values: 0

## IMPLEMENTATION

- product data changed: 24 interne Datensätze; Produkt-Markdown 0
- evidence changed: 63 feldbezogene Quellen-Einträge
- commerce data changed: 16 Verbrauchsteil-Angebotszuordnungen und 9 Pumpen-Angebotszuordnungen
- frontend components changed: 0
- visible affiliate links added: 0
- SEO copy changed: 0
- new URLs: 0

Import in [fountain-cost-35.0b.json](../../apps/pfotentechnik/research/fountain-cost-35.0b.json). Payloads benutzen das bestehende 35.0A-Modell, evidenceSources und Commerce; vollständiger Produktschema-Merge ist getestet. Der vorhandene Product Audit prüft diesen internen Import mit. Keine Einbindung in Renderer/Schema.org. Einzige Schemaergänzung: waterTreatment für das tatsächlich erforderliche Cube C; bestehende Engine berechnet auch diesen Typ unverändert. Keine zusätzliche Kostenformel. Pro Verbrauchsteil nur ein repräsentatives Packformat, keine unterschiedlich großen Packs unter derselben packSize.

## OBSERVATION

- 15/15 URLs publicly unchanged: YES
- 34.6: 6/6 NO CHANGE
- Live-Fix-Messbeginn unverändert: 2026-09-07T13:27:50.265Z; Ende 2026-09-21T13:27:50.265Z. Kein Deployment in 35.0B.

## VALIDATION

- tests: 788/788
- Production Build: PASS
- Release phases: 24/24
- pages: 372
- sitemap: UNCHANGED
- evidence / commerce / dataset gate: PASS
- new blockers: 0

Öffentlicher HTML-Vergleich ersetzt ausschließlich Asset-URL-Namen durch Hashes der referenzierten Bytes. Inhalt, Metadaten, Canonical, Schema und Links werden nicht ausgeblendet. Admin-Zeitstempel separat dokumentiert.

## 35.0C RECOMMENDATION

1. **Ist die Datenabdeckung hoch genug für eine öffentliche Darstellung?** Teilweise, nur einzeln belegte Fakten/Produkte. Kein bestandsweiter Kostenvergleich, Ranking oder vollständige TCO-Darstellung. Veröffentlichung bleibt in 35.0B gesperrt.

2. **Für welche Felder?** Filtervorhandensein 24/24 einschließlich eines filterlosen Modells; exaktes Hauptfilterintervall 17/24; Packungsgröße 16/24. Nur feldweise bekannte Werte mit Quelle/Datum, UNKNOWN nicht als Nein darstellen.

3. **Welche Felder sind noch zu lückenhaft?** Filterpflicht und filterloser Betrieb jeweils 7/24 bekannt; proprietäre/generische Abhängigkeit 1/24; aktuelle Pumpenbeschaffbarkeit 8/24. Vollständige regelmäßige Gesamtkosten für kein Produkt freigegeben.

4. **Sind die Jahreskosten belastbar genug?** Für 11 ausgewählte Hauptfilter-Angebote zum Abrufdatum nachvollziehbar berechnet. Kein Preisversprechen und keine zwingenden Gesamtjahreskosten: Pflichtstatus/Schwämme/Vorfilter teilweise offen. Vor Veröffentlichung Preise erneut prüfen.

5. **Können wir seriös Min/Median/Max über den Bestand nennen?** Nein. 11/24 sind ein unvollständiger und durch gemeinsame Filterfamilien korrelierter Teilbestand. Die Kennzahlen unten sind ausschließlich interne Teilbestandswerte.

6. **Können Ersatzfilter bereits monetarisiert werden?** Teilweise vorbereitet: 12 exakt zugeordnete verfügbare Hauptfilter-Angebote. Merchant-URLs und Varianten sind hinterlegt; keine neuen Affiliate-Tags erfunden. Monetarisierung benötigt freigegebene Händler-/Affiliate-Zuordnung, aktuelle Verfügbarkeit und 35.0C-Freigabe.

7. **Können Ersatzpumpen bereits monetarisiert werden?** Teilweise vorbereitet: 8 Produkte mit aktuell verfügbarem EU-Pumpenangebot. Fünf PETKIT-Zuordnungen betreffen dasselbe Pumpen-/Filterbundle zu 45,90 EUR; ausdrücklich kein Pumpen-Einzelpreis. Affiliate-Zuordnung und Veröffentlichung noch offen.

8. **Welche Produkte dürfen wegen Datenlücken keine Kostenangabe erhalten?** cat-mate-shell-fountain, oneisall-7l-dog-water-fountain, petkit-eversweet-ultra, petlibro-stainless-steel-fountain, xiaomi-smart-pet-fountain-2, feelneedy-fn-w18-8l-katzenbrunnen, oneisall-3-2l-cordless-fountain, oneisall-2-2l-cordless-fountain, oneisall-3-5l-cordless-fountain, petkit-eversweet-5-mini, petkit-eversweet-max-2-uvc, petlibro-capsule-dog-fountain, petsafe-streamside-trinkbrunnen. Ultra: konventioneller Filter nicht anwendbar, Cube-C-Kosten dennoch unzureichend. Auch die anderen elf dürfen keinen vollständigen Pflicht-Gesamtkostenwert erhalten.

9. **Welche 3–5 interessantesten Erkenntnisse liefert der Datensatz?** (1) Filterlos ist nicht verbrauchsmittelfrei (Ultra/Cube C). (2) Selten gewechselt ist nicht automatisch günstig (Glacier). (3) Pflichtfilter ist viel schlechter dokumentiert als Wechselintervalle. (4) Modell-/Regions- und Packvarianten sind wesentliche Fehlerquellen. (5) Eine gelistete Pumpe oder ein sichtbarer Template-Text beweist keine aktuelle Lieferbarkeit.

10. **Ist 35.0C READY: YES / PARTIAL / NO?** PARTIAL. Faktenweise Vorbereitung möglich; keine bestandsweiten Kosten-/Abhängigkeitsbehauptungen. Offene EU-Identitäten und konkrete Zubehör-/Affiliate-Lücken zuerst schließen.

## Produktprüfung 24/24

| Produkt | Hauptfilter €/Jahr | Status / Grund |
|---|---:|---|
| cat-mate-shell-fountain | — | insufficientData; currentAvailablePrice |
| oneisall-7l-dog-water-fountain | — | insufficientData; replacementInterval |
| petkit-eversweet-max-cordless | 52.12 € | calculated;  |
| petkit-eversweet-ultra | — | notApplicable; noConventionalFilter; otherConsumablesNotZero |
| petlibro-dockstream-rfid-smart | 104.22 € | calculated;  |
| petlibro-glacier-ultrafiltration | 158.11 € | calculated;  |
| petlibro-stainless-steel-fountain | — | insufficientData; packSize, selectedOffer |
| xiaomi-smart-pet-fountain-2 | — | insufficientData; selectedOffer |
| cat-mate-335-pet-fountain | 36.48 € | calculated;  |
| feelneedy-fn-w18-8l-katzenbrunnen | — | insufficientData; packSize, replacementInterval, selectedOffer |
| oneisall-3-2l-cordless-fountain | — | insufficientData; packSize, replacementInterval, selectedOffer |
| petkit-eversweet-3-pro-uvc | 52.12 € | calculated;  |
| petlibro-dockstream-2-smart | 130.29 € | calculated;  |
| petlibro-dockstream-2-smart-cordless | 130.29 € | calculated;  |
| catit-pixi-smart-trinkbrunnen | 19.85 € | calculated;  |
| oneisall-2-2l-cordless-fountain | — | insufficientData; packSize, replacementInterval, selectedOffer |
| oneisall-3-5l-cordless-fountain | — | insufficientData; packSize, replacementInterval, selectedOffer |
| petkit-eversweet-5-mini | — | insufficientData; packSize, replacementInterval, selectedOffer |
| petkit-eversweet-max-2-uvc | — | insufficientData; packSize, selectedOffer |
| petkit-eversweet-solo-2-fountain | 52.12 € | calculated;  |
| petkit-eversweet-solo-se | 52.12 € | calculated;  |
| petlibro-capsule-dog-fountain | — | insufficientData; currentAvailablePrice |
| petlibro-dockstream-cordless | 130.29 € | calculated;  |
| petsafe-streamside-trinkbrunnen | — | insufficientData; selectedOffer |

### cat-mate-shell-fountain (P1)

Cat Mate; Cat Mate Shell Pet Fountain; Modell 410/410E; Region EU 410E; Netzteilregion separat; Kapazität 3 l.

Keine ungelösten Quellenwidersprüche im importierten Teilbestand.

- [manufacturer: /pages/faq-cat-mate-two-level-three-litre-shell-pet-fountain-white-410-410e](https://closerpets.com/pages/faq-cat-mate-two-level-three-litre-shell-pet-fountain-white-410-410e) — Identität des konkreten Modells geprüft: 410/410E. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30.
- [officialStore: /products/3-stage-filter-cartridges-pet-fountain-4-pack](https://closerpets.de/products/3-stage-filter-cartridges-pet-fountain-4-pack) — Gewählte Einzelkauf-Variante: 4 Stück; 16.00 EUR; Variante eindeutige Packung.
- [manufacturer: /products/3-stage-filter-cartridges-pet-fountain-4-pack](https://closerpets.com/products/3-stage-filter-cartridges-pet-fountain-4-pack) — Hersteller nennt Shell 410/410E für dasselbe Zubehörteil 386.
- [officialStore: /products/replacement-pump-pet-fountain-354](https://closerpets.de/products/replacement-pump-pet-fountain-354) — Offizielle kompatible EU-Ersatzpumpe gelistet. Offizielle kompatible EU-Ersatzpumpe gelistet.

### oneisall-7l-dog-water-fountain (P1)

oneisall; oneisall 7L Dog Water Fountain; Modell PW02SIE7L; Region EU; Kapazität 7 l.

- Dieselbe Modellseite nennt 2–3 Wochen und 2–4 Wochen. replacementInterval bleibt UNKNOWN; keine künstliche Intervallspanne.

- [manufacturer: /products/oneisall-7l-dog-water-fountain-with-visual-water-level-for-large-dogs](https://eu.oneisall.com/products/oneisall-7l-dog-water-fountain-with-visual-water-level-for-large-dogs) — Identität des konkreten Modells geprüft: PW02SIE7L. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Lieferumfang nennt separat Filter und Schwamm; keine eigene Schwamm-Packgröße oder Wechselrate daraus abgeleitet.
- [officialStore: /products/8pcs-carbon-filters-for-dog-water-fountain](https://eu.oneisall.com/products/8pcs-carbon-filters-for-dog-water-fountain) — Gewählte Einzelkauf-Variante: 8 Stück; 16.99 EUR; Variante 46677157544171. EU-Ersatzfilter benennt Kohlefilter für genau 7 l. EU-Zubehörseite spezifiziert 7 l; keine Übertragung auf 2,2/3,2/3,5 l.
- [officialStore: /products/oneisall-7l-dog-water-fountain-pump-replacement](https://eu.oneisall.com/products/oneisall-7l-dog-water-fountain-pump-replacement) — Offizielle kompatible EU-Ersatzpumpe gelistet. Offizielle kompatible EU-Ersatzpumpe gelistet.

### petkit-eversweet-max-cordless (P1)

PETKIT; PETKIT Eversweet Max Cordless; Modell P4115; Region EU; ursprünglicher MAX ohne UVC; Kapazität 3 l.

- Zubehörshop empfiehlt 2–4 Wochen; exakte Modell-FAQ empfiehlt 4 Wochen. Modell-FAQ hat Vorrang; keine Mischung der Intervalle.

- [manufacturer: /products/petkit-eversweet-max-cordless](https://www.petkit.com/products/petkit-eversweet-max-cordless) — Identität des konkreten Modells geprüft: P4115. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30. Hersteller bestätigt Erforderlichkeit des eingesetzten Verbrauchsteils. Modell-FAQ beantwortet die Notwendigkeit des Filters auch bei reinem Wasser ausdrücklich mit Ja. Modell-FAQ: automatische Abschaltung bei zu wenig Wasser. Modell-FAQ unterscheidet Akkubetrieb von dauerhaft notwendiger Stromversorgung.
- [officialStore: /de/products/petkit-filter-unit-rect](https://www.petkit-eu.com/de/products/petkit-filter-unit-rect) — Gewählte Einzelkauf-Variante: 5 Stück; 19.99 EUR; Variante 46302723244267. RECT 5.0: Anwendungsbereich ausdrücklich EVERSWEET MAX CORDLESS.
- [officialStore: /de/products/wireless-water-pump-fft1-2](https://www.petkit-eu.com/de/products/wireless-water-pump-fft1-2) — EU-Shop listet das exakte Modell als pumpenkompatibel. Preis ist Gesamtbundle Pumpe + 5 RECT-Filter, kein Pumpen-Einzelpreis. Beigepackte Filter nicht automatisch für jedes pumpenkompatible Modell geeignet. EU-Shop listet das exakte Modell als pumpenkompatibel. Preis ist Gesamtbundle Pumpe + 5 RECT-Filter, kein Pumpen-Einzelpreis. Beigepackte Filter nicht automatisch für jedes pumpenkompatible Modell geeignet.

### petkit-eversweet-ultra (P1)

PETKIT; PETKIT Eversweet Ultra; Modell P4117; Region EU; 5 l Frischwasser + 1,8 l Abwasser; Kapazität 5 l.

- Aktuelle Hersteller-FAQ: Cube C ist strukturell erforderlich und muss eingesetzt bleiben. Bestehende öffentliche Optional-Darstellung nicht geändert (Freeze), redaktionelle Korrektur in 35.0C erforderlich. Filterlos bedeutet nicht verbrauchsmittelfrei.

- [manufacturer: /products/eversweet-ultra-with-camera-pet-water-fountain](https://www.petkit.com/products/eversweet-ultra-with-camera-pet-water-fountain) — Identität des konkreten Modells geprüft: P4117. OneWay-System führt Wasser nicht zurück: kein konventioneller Filter. Hersteller bestätigt ausdrücklich filterloses OneWay-System.
- [manufacturer: /products/fountain-cubec](https://www.petkit.com/products/fountain-cubec) — Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30. Hersteller bestätigt Erforderlichkeit des eingesetzten Verbrauchsteils. Betrieb ist an das konkret benannte System-Verbrauchsteil gebunden; keine generische Freigabe abgeleitet.
- [officialStore: /de/products/fountain-cube-c](https://www.petkit-eu.com/de/products/fountain-cube-c) — Gewählte Einzelkauf-Variante: 3 Stück; 15.90 EUR; Variante 48531627311339.

### petlibro-dockstream-rfid-smart (P1)

PETLIBRO; PETLIBRO Dockstream RFID Smart; Modell PLWF305; Region DE/EU; RFID, nicht Dockstream 2; Kapazität 3 l.

- RFID-Ersatzfilter nutzt im DE-Shop ebenfalls PL-FF005-SKUs. Zuordnung nur über exakte RFID-Zubehörseite; keine pauschale Kreuzkompatibilität aus SKU abgeleitet.

- [manufacturer: /products/dockstream-rfid-smart-fountain](https://petlibro.com/products/dockstream-rfid-smart-fountain) — Identität des konkreten Modells geprüft: PLWF305. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells.
- [manufacturer: /pages/how-often-do-i-need-to-replace-the-filter-wf305-plwf305](https://de.petlibro.com/pages/how-often-do-i-need-to-replace-the-filter-wf305-plwf305) — Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30.
- [officialStore: /products/dockstream-rfid-fountain-replacement-filter](https://de.petlibro.com/products/dockstream-rfid-fountain-replacement-filter) — Gewählte Einzelkauf-Variante: 4 Stück; 15.99 EUR; Variante 51661786612078.

### petlibro-glacier-ultrafiltration (P1)

PETLIBRO; PETLIBRO Glacier Ultrafiltration Fountain; Modell PLWF007; Region DE/EU; Kapazität UNKNOWN l.

- Glacier-Vorfilter: dieselbe FAQ nennt zwei Wochen und 15 Tage. UNKNOWN; Hauptfilter 60 Tage ist davon getrennt. Vorfilterpreis fehlt, Hauptfilterkosten sind kein Gesamtverbrauch.

- [manufacturer: /pages/pre-sale-inquries-for-the-glacier-ultrafiltration-water-fountain-wf007-plwf007](https://de.petlibro.com/pages/pre-sale-inquries-for-the-glacier-ultrafiltration-water-fountain-wf007-plwf007) — Identität des konkreten Modells geprüft: PLWF007. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30. Hersteller bestätigt Erforderlichkeit des eingesetzten Verbrauchsteils. Betrieb ist an das konkret benannte System-Verbrauchsteil gebunden; keine generische Freigabe abgeleitet. FAQ: funktioniert nur mit installiertem Ultrafiltrationsfilter. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils.
- [officialStore: /products/glacier-replacement-filter](https://de.petlibro.com/products/glacier-replacement-filter) — Gewählte Einzelkauf-Variante: 1 Stück; 25.99 EUR; Variante 45005300695282.

### petlibro-stainless-steel-fountain (P1)

PETLIBRO; PETLIBRO Stainless Steel Fountain 3L; Modell PLWF006; Region DE/EU Modell-FAQ bestätigt WF006; Kapazität 3 l.

- Vorhandene primäre Amazon-Zuordnung B0F8NFVVZD verweist auf Dockstream statt PLWF006. Kein Zubehör oder Gerätepreis aus diesem Link übernommen; geschützte Produktdatei bleibt unverändert.

- [manufacturer: /products/petlibro-automatic-pet-water-fountain-3l-stainless-steel](https://petlibro.com/products/petlibro-automatic-pet-water-fountain-3l-stainless-steel) — Identität des konkreten Modells geprüft: PLWF006. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30.

### xiaomi-smart-pet-fountain-2 (P1)

Xiaomi; Xiaomi Smart Pet Fountain 2; Modell MJCWYSJ03; Region DE/EU Generation 2; Kapazität 3 l.

Keine ungelösten Quellenwidersprüche im importierten Teilbestand.

- [manufacturer: /de/product/xiaomi-smart-pet-fountain2/specs/](https://www.mi.com/de/product/xiaomi-smart-pet-fountain2/specs/) — Identität des konkreten Modells geprüft: MJCWYSJ03. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells.
- [manufacturer: /de/product/xiaomi-smart-pet-fountain2-filter/](https://www.mi.com/de/product/xiaomi-smart-pet-fountain2-filter/) — Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30.
- [manufacturer: /de/product/xiaomi-smart-pet-fountain2-filter/specs/](https://www.mi.com/de/product/xiaomi-smart-pet-fountain2-filter/specs/) — Filterzubehör-Spezifikation: drei Filter. Explizite Filter-Modellnummer.

### cat-mate-335-pet-fountain (P2)

Cat Mate; Cat Mate Pet Fountain 335; Modell 335E; Region DE/EU; Kapazität 2 l.

Keine ungelösten Quellenwidersprüche im importierten Teilbestand.

- [manufacturer: /products/cat-mate-trinkbrunnen-mit-drei-ebenen-weiss-335](https://closerpets.de/products/cat-mate-trinkbrunnen-mit-drei-ebenen-weiss-335) — Identität des konkreten Modells geprüft: 335E. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30.
- [officialStore: /products/replacement-filter-cartridges-pet-fountain-6-pack](https://closerpets.de/products/replacement-filter-cartridges-pet-fountain-6-pack) — Gewählte Einzelkauf-Variante: 6 Stück; 17.99 EUR; Variante eindeutige Packung.
- [officialStore: /products/replacement-pump-pet-fountain-354](https://closerpets.de/products/replacement-pump-pet-fountain-354) — Offizielle kompatible EU-Ersatzpumpe gelistet. Offizielle kompatible EU-Ersatzpumpe gelistet.

### feelneedy-fn-w18-8l-katzenbrunnen (P2)

FEELNEEDY; FEELNEEDY FN-W18 8L Katzenbrunnen; Modell FN-W18; Region DE; 7 l Tank + 1 l Trinkwanne; Kapazität 8 l.

Keine ungelösten Quellenwidersprüche im importierten Teilbestand.

- [manufacturer: /products/feelneedy-de-fn-w18-8l-katzenbrunnen-kabellos-5000mah-trinkbrunnen-fur-hunde-mit-3-filters-katzenbrunnen-edelstahl-spulmaschinenfest-verbesserter-radarsensor](https://feelneedy.com/products/feelneedy-de-fn-w18-8l-katzenbrunnen-kabellos-5000mah-trinkbrunnen-fur-hunde-mit-3-filters-katzenbrunnen-edelstahl-spulmaschinenfest-verbesserter-radarsensor) — Identität des konkreten Modells geprüft: FN-W18. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. DE-Seite beschreibt Akku-Sensormodus und kontinuierlichen Betrieb am Netz.

### oneisall-3-2l-cordless-fountain (P2)

oneisall; oneisall 3,2L Cordless Cat Fountain; Modell PW14SAU3.2L; Region UNKNOWN; Kapazität 3.2 l.

- Globale Oneisall-Variante bestätigt, exakte EU-Version und EU-Zubehör nicht abgesichert; keine Übertragung von anderer Größe/Farbe/SKU.

- [manufacturer: /products/oneisall-3-2l-cordless-cat-water-fountain](https://oneisall.com/products/oneisall-3-2l-cordless-cat-water-fountain) — Identität des konkreten Modells geprüft: PW14SAU3.2L. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils.

### petkit-eversweet-3-pro-uvc (P2)

PETKIT; PETKIT Eversweet 3 Pro UVC; Modell P4108; Region EU; 1,6 l Nutzvolumen, 1,8 l Maximum; Kapazität 1.6 l.

- Kapazitätsabweichung aufgelöst: Hersteller-FAQ trennt 1,8 l Maximum von 1,6 l tatsächlich nutzbar.

- [manufacturer: /products/eversweet-3-pro-wireless-pump-uvc](https://www.petkit.com/products/eversweet-3-pro-wireless-pump-uvc) — Identität des konkreten Modells geprüft: P4108. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30. Hersteller bestätigt Erforderlichkeit des eingesetzten Verbrauchsteils. Modell-FAQ beantwortet die Notwendigkeit des Filters auch bei reinem Wasser ausdrücklich mit Ja. Modell-FAQ: automatische Abschaltung bei zu wenig Wasser. Modell-FAQ unterscheidet Akkubetrieb von dauerhaft notwendiger Stromversorgung.
- [officialStore: /de/products/petkit-filter-unit-3-0-5-pcs](https://www.petkit-eu.com/de/products/petkit-filter-unit-3-0-5-pcs) — Gewählte Einzelkauf-Variante: 5 Stück; 19.99 EUR; Variante 46302719017195. Filter 3.0 listet dieses Modell ausdrücklich im Anwendungsbereich.
- [officialStore: /de/products/wireless-water-pump-fft1-2](https://www.petkit-eu.com/de/products/wireless-water-pump-fft1-2) — EU-Shop listet das exakte Modell als pumpenkompatibel. Preis ist Gesamtbundle Pumpe + 5 RECT-Filter, kein Pumpen-Einzelpreis. Beigepackte Filter nicht automatisch für jedes pumpenkompatible Modell geeignet. EU-Shop listet das exakte Modell als pumpenkompatibel. Preis ist Gesamtbundle Pumpe + 5 RECT-Filter, kein Pumpen-Einzelpreis. Beigepackte Filter nicht automatisch für jedes pumpenkompatible Modell geeignet.

### petlibro-dockstream-2-smart (P2)

PETLIBRO; PLWF106; Modell PLWF106; Region DE/EU Plug-in-Variante; Kapazität 3 l.

- Ältere offizielle Modellmatrix: Filter noch nicht verfügbar. Aktuelle exakte Zubehörseite/Modellbundle vorhanden, daher aktuelle Quelle bevorzugt. Zubehör-FAQ beschreibt 8er-Pack inklusive 8 Schwämmen; ausgewählte 4er-Variante nicht automatisch als identisches Schwammbundle bepreist.

- [manufacturer: /products/dockstream-2-smart-fountain](https://de.petlibro.com/products/dockstream-2-smart-fountain) — Identität des konkreten Modells geprüft: PLWF106. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30.
- [officialStore: /products/dockstream-2-smart-fountain-replacement-filter](https://de.petlibro.com/products/dockstream-2-smart-fountain-replacement-filter) — Gewählte Einzelkauf-Variante: 4 Stück; 19.99 EUR; Variante 52389590892910. Aktueller Dockstream-2-Zubehörartikel und gerätespezifisches Filterbundle bestätigen Zuordnung.
- [manufacturer: /products/dockstream-2-smart-fountain-replacement-filter](https://de.petlibro.com/products/dockstream-2-smart-fountain-replacement-filter) — Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils.

### petlibro-dockstream-2-smart-cordless (P2)

PETLIBRO; PETLIBRO Dockstream 2 Smart Cordless; Modell PLWF116; Region DE/EU Cordless-Variante; Kapazität 3 l.

- Ältere offizielle Modellmatrix: Filter noch nicht verfügbar. Aktuelle exakte Zubehörseite/Modellbundle vorhanden, daher aktuelle Quelle bevorzugt. Zubehör-FAQ beschreibt 8er-Pack inklusive 8 Schwämmen; ausgewählte 4er-Variante nicht automatisch als identisches Schwammbundle bepreist.

- [manufacturer: /products/dockstream-2-smart-fountain](https://de.petlibro.com/products/dockstream-2-smart-fountain) — Identität des konkreten Modells geprüft: PLWF116. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30.
- [officialStore: /products/dockstream-2-smart-fountain-replacement-filter](https://de.petlibro.com/products/dockstream-2-smart-fountain-replacement-filter) — Gewählte Einzelkauf-Variante: 4 Stück; 19.99 EUR; Variante 52389590892910. Aktueller Dockstream-2-Zubehörartikel und gerätespezifisches Filterbundle bestätigen Zuordnung.
- [manufacturer: /products/dockstream-2-smart-fountain-replacement-filter](https://de.petlibro.com/products/dockstream-2-smart-fountain-replacement-filter) — Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils.

### catit-pixi-smart-trinkbrunnen (P3)

Catit; Catit PIXI Smart-Trinkbrunnen; Modell 43751; Region DE/EU Smart; nicht normaler PIXI; Kapazität 2 l.

Keine ungelösten Quellenwidersprüche im importierten Teilbestand.

- [manufacturer: /de/produkte/trinkbrunnen/pixi-smart-trinkbrunnen/](https://www.catit.com/de/produkte/trinkbrunnen/pixi-smart-trinkbrunnen/) — Identität des konkreten Modells geprüft: 43751. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells. Automatische Abschaltung bei leerem Reservoir. Hersteller nennt vollständig abnehmbare Pumpe.
- [manufacturer: /de/produkte/trinkbrunnen/pixi-trinkbrunnenfilter/](https://www.catit.com/de/produkte/trinkbrunnen/pixi-trinkbrunnenfilter/) — Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30. Explizite Hersteller-Teilebezeichnung.
- [retailer: /shop/katzen/fressnapf/katzentraenke/brunnen/2235929](https://www.zooplus.de/shop/katzen/fressnapf/katzentraenke/brunnen/2235929?activeVariant=2235929.1) — Gewählte Einzelkauf-Variante: 6 Stück; 9.79 EUR; Variante eindeutige Packung.

### oneisall-2-2l-cordless-fountain (P3)

oneisall; oneisall 2,2L Cordless Cat Fountain; Modell PW13BBU2.2L; Region UNKNOWN; Kapazität 2.2 l.

- Globale Oneisall-Variante bestätigt, exakte EU-Version und EU-Zubehör nicht abgesichert; keine Übertragung von anderer Größe/Farbe/SKU.

- [manufacturer: /products/oneisall-2-2l-cordless-cat-water-fountain](https://oneisall.com/products/oneisall-2-2l-cordless-cat-water-fountain) — Identität des konkreten Modells geprüft: PW13BBU2.2L. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils.

### oneisall-3-5l-cordless-fountain (P3)

oneisall; oneisall 3,5L Cordless Fountain; Modell PW04BAU3.5L; Region UNKNOWN; Kapazität 3.5 l.

- Globale Oneisall-Variante bestätigt, exakte EU-Version und EU-Zubehör nicht abgesichert; keine Übertragung von anderer Größe/Farbe/SKU.

- [manufacturer: /products/oneisall-3-5l-cordless-black-stainless-steel-pet-water-fountain-with-3pcs-filters](https://oneisall.com/products/oneisall-3-5l-cordless-black-stainless-steel-pet-water-fountain-with-3pcs-filters) — Identität des konkreten Modells geprüft: PW04BAU3.5L. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils.

### petkit-eversweet-5-mini (P3)

PETKIT; PETKIT Eversweet 5 Mini; Modell P4106; Region Mehrsprachiges Hersteller-Manual, inklusive DE; Kapazität 1 l.

Keine ungelösten Quellenwidersprüche im importierten Teilbestand.

- [manual: /W5-CC_V1.0_20220729%20%2Bmanual.pdf](https://instructions.petkit.com/W5-CC_V1.0_20220729%20%2Bmanual.pdf) — Identität des konkreten Modells geprüft: P4106. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells.
- [manufacturer: /W5-CC_V1.0_20220729%20%2Bmanual.pdf](https://instructions.petkit.com/W5-CC_V1.0_20220729%20%2Bmanual.pdf) — Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben.

### petkit-eversweet-max-2-uvc (P3)

PETKIT; PETKIT Eversweet Max 2 UVC; Modell P4116; Region EU MAX 2 UVC; nicht MAX 1; Kapazität 3 l.

Keine ungelösten Quellenwidersprüche im importierten Teilbestand.

- [manufacturer: /products/eversweet-max-2-uvc-pet-water-fountain](https://www.petkit.com/products/eversweet-max-2-uvc-pet-water-fountain) — Identität des konkreten Modells geprüft: P4116. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30. Hersteller bestätigt Erforderlichkeit des eingesetzten Verbrauchsteils. Modell-FAQ beantwortet die Notwendigkeit des Filters auch bei reinem Wasser ausdrücklich mit Ja. Modell-FAQ: automatische Abschaltung bei zu wenig Wasser. Modell-FAQ unterscheidet Akkubetrieb von dauerhaft notwendiger Stromversorgung.
- [officialStore: /de/products/wireless-water-pump-fft1-2](https://www.petkit-eu.com/de/products/wireless-water-pump-fft1-2) — EU-Shop listet das exakte Modell als pumpenkompatibel. Preis ist Gesamtbundle Pumpe + 5 RECT-Filter, kein Pumpen-Einzelpreis. Beigepackte Filter nicht automatisch für jedes pumpenkompatible Modell geeignet. EU-Shop listet das exakte Modell als pumpenkompatibel. Preis ist Gesamtbundle Pumpe + 5 RECT-Filter, kein Pumpen-Einzelpreis. Beigepackte Filter nicht automatisch für jedes pumpenkompatible Modell geeignet.

### petkit-eversweet-solo-2-fountain (P3)

PETKIT; PETKIT Eversweet Solo 2; Modell P4114; Region EU; Kapazität 2 l.

Keine ungelösten Quellenwidersprüche im importierten Teilbestand.

- [manufacturer: /products/eversweet-solo-2](https://www.petkit.com/products/eversweet-solo-2) — Identität des konkreten Modells geprüft: P4114. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30. Hersteller bestätigt Erforderlichkeit des eingesetzten Verbrauchsteils. Modell-FAQ beantwortet die Notwendigkeit des Filters auch bei reinem Wasser ausdrücklich mit Ja. Modell-FAQ: automatische Abschaltung bei zu wenig Wasser. Modell-FAQ unterscheidet Akkubetrieb von dauerhaft notwendiger Stromversorgung.
- [officialStore: /de/products/petkit-filter-unit-3-0-5-pcs](https://www.petkit-eu.com/de/products/petkit-filter-unit-3-0-5-pcs) — Gewählte Einzelkauf-Variante: 5 Stück; 19.99 EUR; Variante 46302719017195. Filter 3.0 listet dieses Modell ausdrücklich im Anwendungsbereich.
- [officialStore: /de/products/wireless-water-pump-fft1-2](https://www.petkit-eu.com/de/products/wireless-water-pump-fft1-2) — EU-Shop listet das exakte Modell als pumpenkompatibel. Preis ist Gesamtbundle Pumpe + 5 RECT-Filter, kein Pumpen-Einzelpreis. Beigepackte Filter nicht automatisch für jedes pumpenkompatible Modell geeignet. EU-Shop listet das exakte Modell als pumpenkompatibel. Preis ist Gesamtbundle Pumpe + 5 RECT-Filter, kein Pumpen-Einzelpreis. Beigepackte Filter nicht automatisch für jedes pumpenkompatible Modell geeignet.

### petkit-eversweet-solo-se (P3)

PETKIT; PETKIT Eversweet Solo SE; Modell P4103S; Region EU; Kapazität 1.8 l.

Keine ungelösten Quellenwidersprüche im importierten Teilbestand.

- [manufacturer: /products/eversweet-solo-se](https://www.petkit.com/products/eversweet-solo-se) — Identität des konkreten Modells geprüft: P4103S. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30. Hersteller bestätigt Erforderlichkeit des eingesetzten Verbrauchsteils. Modell-FAQ beantwortet die Notwendigkeit des Filters auch bei reinem Wasser ausdrücklich mit Ja. Modell-FAQ: automatische Abschaltung bei zu wenig Wasser. Modell-FAQ unterscheidet Akkubetrieb von dauerhaft notwendiger Stromversorgung.
- [officialStore: /de/products/petkit-filter-unit-3-0-5-pcs](https://www.petkit-eu.com/de/products/petkit-filter-unit-3-0-5-pcs) — Gewählte Einzelkauf-Variante: 5 Stück; 19.99 EUR; Variante 46302719017195. Filter 3.0 listet dieses Modell ausdrücklich im Anwendungsbereich.
- [officialStore: /de/products/wireless-water-pump-fft1-2](https://www.petkit-eu.com/de/products/wireless-water-pump-fft1-2) — EU-Shop listet das exakte Modell als pumpenkompatibel. Preis ist Gesamtbundle Pumpe + 5 RECT-Filter, kein Pumpen-Einzelpreis. Beigepackte Filter nicht automatisch für jedes pumpenkompatible Modell geeignet. EU-Shop listet das exakte Modell als pumpenkompatibel. Preis ist Gesamtbundle Pumpe + 5 RECT-Filter, kein Pumpen-Einzelpreis. Beigepackte Filter nicht automatisch für jedes pumpenkompatible Modell geeignet.

### petlibro-capsule-dog-fountain (P3)

PETLIBRO; PETLIBRO Capsule Dog Fountain; Modell PLWF008; Region DE/EU Dog; nicht Capsule PLWF002; Kapazität UNKNOWN l.

Keine ungelösten Quellenwidersprüche im importierten Teilbestand.

- [manufacturer: /pages/pre-sale-inquries-for-the-capsule-dog-water-fountain-wf008-plwf008](https://de.petlibro.com/pages/pre-sale-inquries-for-the-capsule-dog-water-fountain-wf008-plwf008) — Identität des konkreten Modells geprüft: PLWF008. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells.
- [manufacturer: /pages/how-is-the-capsule-dog-fountain-maintained-wf008-plwf008](https://de.petlibro.com/pages/how-is-the-capsule-dog-fountain-maintained-wf008-plwf008) — Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30.
- [officialStore: /products/capsule-dog-fountain-replacement-filter](https://de.petlibro.com/products/capsule-dog-fountain-replacement-filter) — Gewählte Einzelkauf-Variante: 4 Stück; 15.99 EUR; Variante 46496383140082.

### petlibro-dockstream-cordless (P3)

PETLIBRO; PETLIBRO Dockstream Cordless; Modell PLWF115; Region DE/EU; erste Generation; Kapazität 2.5 l.

Keine ungelösten Quellenwidersprüche im importierten Teilbestand.

- [manufacturer: /pages/pre-sale-inquiries-about-dockstream-cordless-fountain-wf115-plwf115](https://petlibro.com/pages/pre-sale-inquiries-about-dockstream-cordless-fountain-wf115-plwf115) — Identität des konkreten Modells geprüft: PLWF115. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30. Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils.
- [officialStore: /products/dockstream-replacement-filter](https://de.petlibro.com/products/dockstream-replacement-filter) — Gewählte Einzelkauf-Variante: 4 Stück; 19.99 EUR; Variante 44409650970866. DE-Zubehör nennt PLWF115 ausdrücklich.
- [officialStore: /products/dockstream-replacement-pump](https://de.petlibro.com/products/dockstream-replacement-pump) — Exakt PLWF115-kompatible offizielle Ersatzpumpe gelistet; gewählte Variante aktuell ausverkauft, nicht dauerhaft nicht erhältlich. Exakt PLWF115-kompatible offizielle Ersatzpumpe gelistet; gewählte Variante aktuell ausverkauft, nicht dauerhaft nicht erhältlich.

### petsafe-streamside-trinkbrunnen (P3)

PetSafe; PetSafe Keramik-Trinkbrunnen Streamside; Modell PWW19-17098; Region DE/EU; Kapazität 1.8 l.

- DE-Geräteseite nennt PAC00-US-Teilenummern; EU-Zubehörseiten PAC19-14088/14089 bestätigen Streamside direkt. Keine US-Angebotspreise übertragen.

- [manufacturer: /de/p/keramik-trinkbrunnen-streamside/PWW19-17098/](https://www.petsafe.com/de/p/keramik-trinkbrunnen-streamside/PWW19-17098/) — Identität des konkreten Modells geprüft: PWW19-17098. Textlicher Lieferumfang/Filterwartung bzw. explizite Filterfunktion des exakten Modells.
- [manufacturer: /es/p/filtros-de-carbon-de-repuesto-fuentes-para-mascotas-de-ceramica-drinkwell-4-unidades/PAC19-14088/](https://www.petsafe.com/es/p/filtros-de-carbon-de-repuesto-fuentes-para-mascotas-de-ceramica-drinkwell-4-unidades/PAC19-14088/) — Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30. Explizite Hersteller-Teilebezeichnung.
- [officialStore: /es/p/filtros-de-carbon-de-repuesto-fuentes-para-mascotas-de-ceramica-drinkwell-4-unidades/PAC19-14088/](https://www.petsafe.com/es/p/filtros-de-carbon-de-repuesto-fuentes-para-mascotas-de-ceramica-drinkwell-4-unidades/PAC19-14088/) — EU-Zubehörseite: vier Filter, explizit Streamside-kompatibel.
- [manufacturer: /de/p/ersatzschaumfilter-fur-drinkwell-keramik-edelstahl-brunnen-360-2-pack/PAC19-14089/](https://www.petsafe.com/de/p/ersatzschaumfilter-fur-drinkwell-keramik-edelstahl-brunnen-360-2-pack/PAC19-14089/) — Identität/Verbrauchsteil ist für dieses Modell ausdrücklich beschrieben. Hersteller benennt Aufbau/Funktion des Verbrauchsteils. Offizielles modellspezifisches Austauschintervall; Wochen × 7, Monate × 30. Explizite Hersteller-Teilebezeichnung.
- [officialStore: /de/p/ersatzschaumfilter-fur-drinkwell-keramik-edelstahl-brunnen-360-2-pack/PAC19-14089/](https://www.petsafe.com/de/p/ersatzschaumfilter-fur-drinkwell-keramik-edelstahl-brunnen-360-2-pack/PAC19-14089/) — Gewählte Einzelkauf-Variante: 2 Stück; 6.99 EUR; Variante eindeutige Packung.
- [officialStore: /ch/p/ersatzpumpe-drinkwell-trinkbrunnen-360/PAC00-13150/](https://www.petsafe.com/ch/p/ersatzpumpe-drinkwell-trinkbrunnen-360/PAC00-13150/) — Offizielle Schweizer Seite nennt Streamside-Kompatibilität; aktuelle DE/EU-Verfügbarkeit und EUR-Preis nicht bestätigt. Offizielle Schweizer Seite nennt Streamside-Kompatibilität; aktuelle DE/EU-Verfügbarkeit und EUR-Preis nicht bestätigt.
