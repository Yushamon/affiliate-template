# Suchintention und Content Gap – Opportunity- und Umsetzungsprüfung

Paket: `seo-package-1hsfs69`  
Stand: 3. September 2026  
Prüffenster: GSC 7 Tage vom 27. August bis 2. September 2026; ergänzend Repository- und Primärquellenprüfung

## Ergebnis

Die drei Advisor-Aufgaben stammten aus einem älteren Repository-Befund. Haustierkameras und automatische Katzentoiletten fehlen nicht mehr: Beide besitzen bereits Hub, Hauptvergleich, Produktabdeckung und Decision Journeys. Eine weitere Expansion wird wegen fehlender clusterspezifischer Search-Signale nicht freigegeben. Das Glossar-Gap wurde als eine substanzielle Hubseite mit acht wiederverwendbaren Begriffen geschlossen; dünne Einzel-URLs wurden bewusst nicht angelegt.

| Task-ID | Status | Entscheidung |
|---|---|---|
| `topical-authority|pet-cameras-expansion` | abgeschlossen | Bestehenden Cluster halten; keine zusätzlichen Seiten ohne eigenständiges Search-Signal oder neue Entscheidungsrolle |
| `topical-authority|glossary-system` | abgeschlossen | Eine Hubseite mit acht Abschnitten und vier gezielten Kontextlinks; keine automatische Verlinkung aller Vorkommen |
| `topical-authority|automatic-litter-boxes-expansion` | abgeschlossen | Bestehenden Cluster halten; keine weitere Expansion vor erneuter Search-, Sicherheits- und Lifecycle-Prüfung |

Die drei erledigten beziehungsweise fachlich überholten Tasks wurden aus `src/lib/seo/advisor/topical-authority-plan.ts` entfernt. Damit bleiben die Aussagen „fehlt vollständig“ und „Glossar fehlt“ nicht als aktive Empfehlungen stehen.

## Aktuelle Search-Basis

`src/data/seo/gsc-dashboard-ranges.json` wurde am 3. September 2026 erzeugt. Das 7-Tage-Fenster enthält insgesamt 13 Impressionen und 0 Klicks, das 28-Tage-Fenster 48 Impressionen und 0 Klicks; beide sind als `lowData` markiert. In den aufgezeichneten Seiten und Queries erscheinen weder Haustierkamera- noch automatische-Katzentoiletten- noch Glossar-Signale. Im 3-Monats-Datensatz existieren nur angrenzende Kamera-Signale zu Futterautomaten: `/futterautomat-mit-kamera/` mit 11 und `/vergleiche/beste-futterautomaten-mit-kamera/` mit 6 Impressionen.

Folge: Aus den aktuellen Search-Daten lässt sich weder ein positiver Nachfrageeffekt noch ein belastbarer No-Demand-Befund ableiten. Die Expansionsentscheidungen sind konservative Repository- und Risikoentscheidungen, keine Wirkungsaussagen.

## Haustierkameras

### Repository- und Marktdeckung

- Hub: `/haustierkameras/`
- Hauptvergleich: `/vergleiche/beste-haustierkameras/`
- Acht Produktdateien mit `category.key: haustierkameras` und `affiliateAvailable: true`: PETLIBRO Scout, Reolink E1 Zoom, PetTec Cam 360, Enabot ROLA Mini, Enabot EBO Air 2, Furbo Mini 360, Furbo 360° Hundekamera und Furbo 360° Katzenkamera.
- Der Hauptvergleich bildet sechs ausreichend unterschiedliche Rollen ab: katzenspezifische Interaktion, Cloud-/KI-Kamera, kompakte Interaktion, mobiler Kameraroboter, lokale Pan/Tilt-Kamera und klassische Indoor-Kamera mit lokaler Speicherung.
- Hersteller-Primärquellen bestätigen fortbestehende Produktklassen bei Furbo, Enabot, PETLIBRO, Reolink und PetTec. Affiliate-Verfügbarkeit ist im Repository belegt, bleibt aber ein dynamischer Auslieferungs- und Händlerstatus.

### Differenzierungs- und Wettbewerbsentscheidung

Das Mindestgate von acht belastbaren Repository-Produkten ist erreicht. Es rechtfertigt dennoch keinen weiteren Content-Cluster: Hub und Hauptvergleich decken die Kategorie bereits ab, und zusätzliche Furbo-/Enabot-Varianten würden ohne neue Nutzeraufgabe Variantenbreite statt Information Gain erzeugen. Eine SERP-basierte Wettbewerbsstärke wurde nicht als dauerhafte Kennzahl gespeichert; sie muss bei einem späteren positiven Search-Signal neu erhoben werden.

**Entscheidung:** Kein neuer Hub, kein zweiter Hauptvergleich und keine drei pauschalen Support-Ratgeber. Bestehende Seiten behalten. Eine neue Route benötigt ein clusterspezifisches Query-Signal, einen eindeutigen Intent-Owner und eine Entscheidungsrolle, die Hub und Vergleich nicht bereits beantworten.

### Primärquellen-Check

- [Furbo Kameravergleich](https://furbo.com/eu-de/pages/comparison)
- [Enabot ROLA Mini](https://www.enabot.com/pet-robot/rola-mini)
- [PETLIBRO Scout Smart Camera](https://petlibro.com/products/scout-smart-camera)
- [Reolink E1 Zoom](https://reolink.com/product/e1-zoom/)
- [PetTec Pet Cam Free'n 360° – Bedienungsanleitung](https://support.pettec.de/hc/de/article_attachments/22845568025874)

## Begrenztes Glossar-System

Vor Umsetzung wurden Begriffsfamilien case-insensitiv in `src/content/**/*.md` gezählt. Frontmatter und Body zählen gemeinsam, weil beide für Taxonomie, interne Verlinkung und redaktionelle Wiederverwendung relevant sind.

| Begriffsfamilie | Vorkommen | Inhaltsdateien |
|---|---:|---:|
| Geofencing | 38 | 8 |
| RFID/Mikrochip | 917 | 75 |
| GPS/LTE | 1.114 | 43 |
| UV-C/UVC | 226 | 20 |
| Aktivkohlefilter | 65 | 19 |
| Biofilm | 69 | 27 |
| Portionierung | 753 | 87 |
| Futterkapazität/Vorratsvolumen | 27 | 21 |

Alle acht Begriffe überschreiten das Mehrfachnutzungs-Gate. `/glossar/` verwendet für jeden Eintrag dasselbe redaktionelle Muster: Definition, Praxisrelevanz und konkrete Vertiefungen. Es wurden keine Ein-Satz-Seiten angelegt. Vier Links aus GPS-, Katzenklappen-, Trinkbrunnen- und Futterautomaten-Inhalten geben einen bewusst begrenzten kontextuellen Einstieg; eine automatische Verlinkung jedes Vorkommens findet nicht statt.

Technische Grundquellen: [GPS.gov](https://www.gps.gov/systems/gps/), [ISO 11784:2024](https://www.iso.org/standard/83944.html) und [FDA zu UV-C](https://www.fda.gov/radiation-emitting-products/tanning/ultraviolet-uv-radiation). Produktwerte und individuelle Kompatibilitäten bleiben außerhalb des Glossars.

## Automatische Katzentoiletten

### Repository- und Marktdeckung

- Hub: `/automatische-katzentoiletten/`
- Hauptvergleich: `/vergleiche/beste-automatische-katzentoiletten/`
- Aktueller Topical-Authority-Bestand: elf Repository-Produkte; zehn eigenständige Rollen im Hauptvergleich.
- Die vorhandenen Inhalte trennen Bauform, Einstieg, Mindestgewicht, Sensorik, Streu, Reinigung, Verbrauchsmaterial, Cloud und Folgekosten. Damit ist der frühere Befund „Cluster fehlt vollständig“ widerlegt.

### Sicherheits- und Rückrufprüfung

Herstellerunterlagen zeigen, warum diese Kategorie ein erhöhtes Evidenzgate benötigt. Der Litter-Robot-4-Leitfaden verlangt für den Automatikmodus mindestens 1,36 kg und einen festen, ebenen Untergrund. PETLIBRO nennt für Luma unter anderem Gewicht, Infrarot, Kamera und Einklemmschutz; für Katzen unter 1 kg beziehungsweise unter sechs Monaten soll die automatische Reinigung deaktiviert werden. Neakasa beschreibt für M1 Plus sechs Infrarot-Sensorsätze und einen begrenzten Rotationsweg als Einklemmschutz. Das sind Herstellerangaben, keine unabhängigen Sicherheitsnachweise.

Die offiziellen CPSC- und EU-Safety-Gate-Portale wurden am 3. September 2026 auf Kategorieebene geprüft. Es wurde kein belastbarer, den vorhandenen Produktbestand eindeutig betreffender Rückrufnachweis in die Redaktion übernommen. Diese Negativsuche beweist nicht, dass weltweit oder unter abweichenden Handelsnamen nie ein Rückruf, Sicherheitsbericht oder Vorfall existierte. Vor jeder neuen Produktempfehlung sind Modellname, Hersteller, Importeur, Region und Datum erneut zu prüfen.

Primärquellen: [Litter-Robot 4 Handbuch](https://www.litter-robot.com/manual_pdf/Litter-Robot-4-Manual-English-International.pdf), [PETLIBRO Luma](https://petlibro.com/products/luma-smart-litter-box), [PETLIBRO Luma Sicherheitslogik](https://petlibro.com/pages/how-the-luma-smart-litter-box-puts-your-cats-safety-first), [Neakasa M1 Plus](https://neakasa.com/products/neakasa-m1-cat-litter-box), [CPSC Recalls](https://www.cpsc.gov/Recalls) und [EU Safety Gate](https://ec.europa.eu/safety-gate-alerts/screen/webReport).

### Test- und Quellenstandard

Eine neue oder aktualisierte Empfehlung benötigt mindestens:

1. eindeutige Modell-, Regions- und Lifecycle-Zuordnung;
2. Bedienungsanleitung oder offizielle Supportquelle für Mindestgewicht, Automatikgrenzen, Untergrund, Sensorik, Stopp-/Umkehrverhalten und Reinigung;
3. dokumentierte Streukompatibilität, vollständige Zerlegbarkeit und laufende Verbrauchsteile;
4. aktuelle Abfrage offizieller Rückruf-/Warnportale und Suche nach abweichenden Handelsnamen;
5. klare Trennung von Herstellerangabe, redaktioneller Datenprüfung und eigenem Praxistest;
6. bei Hands-on-Tests Szenarien für Eintritt während Zyklus, Sensorverschmutzung, Strom-/Netzausfall, ähnlich schwere Tiere, Reinigung und Wiederanlauf – ohne Sicherheit absichtlich zu überbrücken.

**Go/No-Go:** No-Go für weitere Cluster-Expansion. Go nur für Pflege und Evidenzaktualisierung der vorhandenen URLs. Eine neue Seite oder ein weiteres Produkt benötigt eine neue Entscheidungsrolle, belastbare regionale Verfügbarkeit, vollständige Sicherheitsdokumentation und ein messbares Search- oder Nutzer-Signal.

## Verbleibende Risiken und nächster Review

- Search-Basis ist weiterhin `lowData`; die Entscheidungen dürfen nicht als Traffic-Prognose gelesen werden.
- Preise, Affiliate-Ziele, regionale Verfügbarkeit, Cloudtarife und Produktgenerationen sind dynamisch.
- Offizielle Rückrufregister liefern keine Garantie für Vollständigkeit über alle Handelsnamen und Regionen.
- Herstellerangaben zu Sensorik, UV-C, Hygiene oder KI sind keine unabhängigen Wirksamkeits- oder Sicherheitstests.
- Erneute Review nach einem vollständigen Search-Fenster und frühestens ab dem im Paket genannten Termin; wegen des bereits verstrichenen Datums ist das nächste verfügbare 28-Tage-Fenster mit clusterspezifischen Daten maßgeblich.
