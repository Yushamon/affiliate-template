# Subscription & Total Cost – Scope Audit

Stand: 2026-09-02

## Auswahlregel

Vollständig aufgenommen wurden alle aktiven Produkte der Kategorien `gps-tracker` und `haustierkameras`. Außerhalb dieser Kategorien wurden nur aktive Produkte aufgenommen, deren vorhandene Produktdaten bereits einen konkreten verpflichtenden oder optionalen digitalen Dienst nennen. Verbrauchsmaterial, Strom, Ersatzteile und bloße App-Nutzung ohne kostenpflichtigen Dienst sind nicht Teil dieses Batches.

## Kernscope

| Gruppe | Aktiv | geprüft | im Kostenmodell |
| --- | ---: | ---: | ---: |
| GPS-Tracker | 12 | 12 | 12 |
| Haustierkameras | 8 | 8 | 8 |

GPS: Enabot ROLA PetTracker; Garmin Alpha T 20; Garmin Alpha TT 25; Invoxia Biotracker Edition 2026; PAJ PET Finder 4G Mini; Pawfit 3; Prothelis area Pets; Tractive CAT 6 Mini; Tractive DOG 6; Tractive DOG 6 XL; Weenect XS; Weenect XT.

Kameras: Enabot EBO Air 2; Enabot ROLA Mini; Furbo 360° Hundekamera; Furbo 360° Katzenkamera; Furbo Mini 360; PETLIBRO Scout Smart Camera; PetTec Cam 360; Reolink E1 Zoom (4K).

## Weitere Produkte mit konkretem Repository-Hinweis

| Produkt | Kategorie | Grund für Aufnahme |
| --- | --- | --- |
| OnlyCat Mikrochip-Katzenklappe | Katzenklappen | Kaufmodell mit Einmalzahlung oder 9,99-€-Monatsdienst |
| PETLIBRO Luma | automatische Katzentoiletten | optionaler Video-Cloud-AI-Dienst |
| PETKIT Eversweet Ultra | Trinkbrunnen | optionaler Care+-Dienst |
| PETKIT YumShare Dual-Hopper 2 | Futterautomaten | Video-Wiedergabe nach Testzeitraum über Care+ |
| PETKIT YumShare Solo 2 | Futterautomaten | Video-Wiedergabe über Care+ |
| PETLIBRO Dockstream 2 Smart | Trinkbrunnen | optionaler Care-Dienst |
| Litter-Robot 5 Pro | automatische Katzentoiletten | optionales Whisker+; derzeit US-begrenzt |

Damit umfasst der Implementierungsscope 27 aktive Produkte.

## Bewusst nicht aufgenommen

- Produkte mit `productStatus: unknown` (unter anderem PETLIBRO Granary 2 Vision und Granary Camera Feeder): keine aktive Produktionsauswahl.
- Catit PIXI Smart 6-Meal Feeder und andere Produkte mit ausdrücklich kostenloser App, aber ohne konkreten kostenpflichtigen Digitaldienst: kein relevanter Servicekostenfall.
- Filter, Beutel, Streu, Akkus, Strom und Ersatzteile: keine digitalen Servicekosten; sie bleiben außerhalb dieses Modells.
- Weitere PETKIT-Purobot-Modelle: Care+ ist teilweise dokumentiert, Deutschlandtarife und genaue modellbezogene Leistungsgrenzen sind nicht vollständig genug. Der separate Katzentoiletten-Readiness-Check bleibt rein berichtend.
- Spotter CatX: Research Candidate, keine bestehende Produktseite und daher keine Produktmigration.

## Infrastruktur-Befund

- Gerätepreise bleiben im vorhandenen `price`-Modell und im bestehenden Price-Index.
- `gps.subscriptionRequired` war nur ein Boolean und konnte Prepaid, optionale Dienste, Zahlungsweise oder Preis-Freshness nicht ausdrücken.
- `specs`, `comparisonData` und Freitext sind keine sichere Preisquelle.
- ProductExperience2 hatte bereits den richtigen oberen Preis-/CTA-Ort; `PriceBox2` wurde erweitert, kein paralleles Preis-Widget angelegt.
- Das GPS Subscription Data Asset hatte einen sicheren Publication Gate, las aber bisher nur den Legacy-Boolean und setzte jeden Preis auf unknown.

