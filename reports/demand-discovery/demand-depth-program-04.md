# PfotenTechnik — Demand & Decision Depth Program 04

Stand: 31. August 2026  
Lokale Wahrheit: Branch `main`, HEAD `40540959294a5a91335634b53c1660228458f6d2`, einschließlich uncommittetem Batch 03.

## Executive Summary

33 externe Demand Nodes wurden gegen den tatsächlichen lokalen Repository-Bestand geprüft. Batch-02-Themen wurden nicht als neue Lücken gezählt; Batch-03-Felder `failureModes`, `litterCompatibility` und `multiPet` wurden wiederverwendet und erweitert.

| Coverage | Anzahl |
|---|---:|
| covered | 22 |
| partial | 11 |
| fragmented | 0 |
| missing | 0 |
| overcovered | 0 |
| uncertain | 0 |

- New Page Candidates: **0**
- Existing Owner Enrichments: **5**
- Structured-Data Decisions: **16**
- Data-Asset Decisions: **5**
- Deferred: **4**
- Neue Routes: **0**

Der Engpass liegt in Entscheidungstiefe und feldgenauer Primär-Evidence, nicht in URL-Breite. Umgesetzt wurden optionale Daten für Portioniersemantik, offizielle Ersatzteile, Datenportabilität, Sensorgrenzen, Gerätepersistenz und Identification Depth. `failureModes` erhielt Funktionsdetails und einen optionalen mechanischen Blockadefall.

## Coverage Matrix

| ID | Cluster | Demand Node | Coverage | Owner | Recommendation |
|---|---|---|---|---|---|
| A1 | Futterautomaten | Portion ist nicht automatisch Gramm | covered | `/smarte-futterautomaten/` | enrich-existing |
| A2 | Futterautomaten | Portioniergenauigkeit | covered | `/smarte-futterautomaten/` | structured-data |
| A3 | Futterautomaten | Mindestportion | covered | `/smarte-futterautomaten/` | structured-data |
| A4 | Futterautomaten | Doppelschale vs. Individualportion | covered | `/smarte-futterautomaten/` | structured-data |
| A5 | Futterautomaten | Futterstau / fehlgeschlagene Ausgabe | partial | `/smarte-futterautomaten/` | defer |
| B1 | Trinkbrunnen | Ersatzpumpe | covered | `/trinkbrunnen/` | structured-data |
| B2 | Trinkbrunnen | Repairability / Ersatzteile | partial | `/trinkbrunnen/` | data-asset |
| B3 | Trinkbrunnen | Filterfamilien | partial | `/filter-im-katzentrinkbrunnen-wechseln/` | defer |
| B4 | Trinkbrunnen | Bedeutung von kabellos | covered | `/trinkbrunnen/` | enrich-existing |
| B5 | Trinkbrunnen | Individuelles Trinktracking | covered | `/trinkbrunnen-fuer-mehrere-katzen/` | structured-data |
| C1 | GPS | Datenexport | covered | `/gps-tracker/` | structured-data |
| C2 | GPS | Verlauf / Retention | covered | `/gps-tracker/` | structured-data |
| C3 | GPS | Verhalten nach Abo-Ende | partial | `/warum-brauchen-gps-tracker-ein-abo/` | defer |
| C4 | GPS | Gesundheitsfunktionen je Modell | covered | `/gps-tracker/` | structured-data |
| C5 | GPS | Katze vs. Hund | covered | `/gps-tracker/` | enrich-existing |
| C6 | GPS | Hardwarewechsel / Upgrade | covered | `/gps-tracker/` | structured-data |
| D1 | Katzenklappen | Chip-Speicher bei Batteriewechsel | covered | `/vergleiche/beste-mikrochip-katzenklappen/` | structured-data |
| D2 | Katzenklappen | Repairability | partial | `/vergleiche/beste-mikrochip-katzenklappen/` | data-asset |
| D3 | Katzenklappen | Safety Learn | covered | `/vergleiche/beste-mikrochip-katzenklappen/` | no-change |
| D4 | Katzenklappen | IDs vs. individuelle Regeln | covered | `/vergleiche/beste-mikrochip-katzenklappen/` | structured-data |
| D5 | Katzenklappen | Batterie-Warnung / Fail State | partial | `/vergleiche/beste-mikrochip-katzenklappen/` | enrich-existing |
| E1 | Katzenklos | Mindestgewicht / Kitten | covered | `/vergleiche/beste-automatische-katzentoiletten/` | structured-data |
| E2 | Katzenklos | Große Katze: Gewicht vs. Platz | covered | `/vergleiche/beste-automatische-katzentoiletten/` | no-change |
| E3 | Katzenklos | Sensoruntergrund | partial | `/vergleiche/beste-automatische-katzentoiletten/` | data-asset |
| E4 | Katzenklos | Blockierter Zyklus | partial | `/vergleiche/beste-automatische-katzentoiletten/` | structured-data |
| E5 | Katzenklos | Manuelle Nutzbarkeit bei Ausfall | partial | `/automatische-katzentoiletten/` | defer |
| E6 | Katzenklos | Verschleißteile | partial | `/vergleiche/beste-automatische-katzentoiletten/` | data-asset |
| F1 | Kameras | Lokale Aufnahme bei Internetausfall | covered | `/vergleiche/beste-haustierkameras/` | structured-data |
| F2 | Kameras | LAN-Zugriff ohne Internet | covered | `/vergleiche/beste-haustierkameras/` | structured-data |
| F3 | Kameras | Lokaler Speicher vs. lokaler Betrieb | covered | `/vergleiche/beste-haustierkameras/` | enrich-existing |
| F4 | Kameras | Aufbewahrung / Überschreibung | covered | `/vergleiche/beste-haustierkameras/` | structured-data |
| F5 | Kameras | Benutzerfreigabe | partial | `/vergleiche/beste-haustierkameras/` | data-asset |
| F6 | Kameras | Tiererkennung vs. individuelles Tier | covered | `/vergleiche/beste-haustierkameras/` | no-change |

## Detailed Findings

### Cluster A — Futterautomaten

**A1 — Portionseinheit.** Demand Evidence: Seed fragt explizit nach 10/15/18 g. Repository Evidence: der Owner erklärt Kalibrierung bereits, Produktdaten nutzten aber uneinheitlich `portionGrams`/`portionMl`. Owner: `/smarte-futterautomaten/`, sekundär die Feeder-Vergleiche; strukturierte Quelle jetzt `dispensingPrecision`. Missing Information: herstellerseitige Toleranz bleibt überall `unknown`. Recommendation: `enrich-existing`, Confidence: high.

**A2 — Genauigkeit.** Demand Evidence: Wiederholbarkeit ist kaufentscheidend. Repository Evidence: keine eigenen Messreihen; PETLIBRO und PETKIT nennen Portionen ausdrücklich ungefähr beziehungsweise futterabhängig. Owner: `/smarte-futterautomaten/`. Missing: keine belastbare Serien-Toleranz. Recommendation: `structured-data`; nominal und garantiert bleiben getrennt. Confidence: high.

**A3 — Mindestportion.** Demand Evidence: kleine technische Ausgabe statt Ernährungsrat. Repository Evidence: Granary Camera 1/50, Air 1/16, YumShare Solo 2 1/5 Portionseinheiten. Owner: `/smarte-futterautomaten/`. Missing: kleinste Grammmenge mit konkretem Futter. Recommendation: `structured-data`. Confidence: high.

**A4 — Doppelnapf.** Demand Evidence: zwei Näpfe werden häufig als zwei individuelle Rationen missverstanden. Repository Evidence: Granary-Doppelschale ist keine Tieridentifikation; Batch-03-Multi-Pet trennt Individualfütterung bereits. Owner: `/smarte-futterautomaten/`. Missing: einstellbare Split-Ratio nicht belegt. Recommendation: `structured-data`. Confidence: high.

**A5 — Jam Detection.** Demand Evidence: leerer Tank, Blockade und fehlgeschlagene Ausgabe. Repository Evidence: Owner besitzt Fehlerdiagnose und einzelne Produkte Anti-Jam-/Warntexte, aber keine vergleichbare Sensorsemantik. Owner: `/smarte-futterautomaten/`. Missing: Sensor, Reverse, App-Warnung und bestätigter Ausgabefehler je Modell. Recommendation: `defer`, bis Primär-Evidence modellübergreifend reicht. Confidence: high.

### Cluster B — Trinkbrunnen

**B1 — Ersatzpumpe.** Demand Evidence: Pumpenausfall kann sonst Kompletttausch erzwingen. Repository Evidence: PetSafe führt PAC00-13150 offiziell für Streamside; bisher nur Filterdaten im Produkttext. Owner: `/trinkbrunnen/`, sekundär `/filter-im-katzentrinkbrunnen-wechseln/`; Quelle jetzt `repairability`. Missing: Verfügbarkeit anderer Modelle. Recommendation: `structured-data`. Confidence: high.

**B2 — weitere Teile.** Demand Evidence: Tank, Deckel, Dichtung, Basis und Sensorik. Repository Evidence: einzelne modellbezogene Teile, kein breiter Katalog. Owner: `/trinkbrunnen/`. Missing: offizielle Teilelisten für die aktuelle Produktpopulation. Recommendation: phasenweises `data-asset`, keine Reparierbarkeitsnote. Confidence: medium-high.

**B3 — Filterfamilien.** Demand Evidence: Lock-in zwischen Modellen einer Marke. Repository Evidence: Partnummern existieren verstreut in Specs, aber keine verifizierte Kompatibilitätsrelation. Owner: `/filter-im-katzentrinkbrunnen-wechseln/`. Missing: offizielle Modell-zu-Filter-Familien. Recommendation: `defer`. Confidence: high.

**B4 — kabellos.** Demand Evidence: Marketingbegriff ist mehrdeutig. Repository Evidence: Eversweet Solo 2 hat eine kabellose Pumpe im Tank, braucht aber Netzstrom; Dockstream 2 Cordless besitzt Akku und Sensorbetrieb. Owner: `/trinkbrunnen/`. Missing: keine. Recommendation: `enrich-existing`. Confidence: high.

**B5 — individuelles Tracking.** Demand Evidence: Gesamtverbrauch beantwortet nicht, welches Tier trinkt. Repository Evidence: Dockstream RFID dokumentiert Tag, bis fünf Katzen, Menge/Häufigkeit/Dauer; Mikrochip wird nicht gelesen. Owner: `/trinkbrunnen-fuer-mehrere-katzen/`, Produktdatei als Evidence; `multiPet` wird wiederverwendet. Missing: medizinische Genauigkeit und tagloser Fallback. Recommendation: `structured-data`. Confidence: high.

### Cluster C — GPS-Tracker

**C1 — Export.** Demand Evidence: Nutzer will Positionsdaten behalten. Repository Evidence: Tractive Premium exportiert Verlauf; EU-Data-Act-Anfrage umfasst weitere Tracker-Daten. Owner: `/gps-tracker/`; Quelle `dataPortability`. Missing: stabiles Exportformat in der geprüften Quelle. Recommendation: `structured-data`. Confidence: high.

**C2 — Retention.** Demand Evidence: „History“ ohne Zeitraum reicht nicht. Repository Evidence: Tractive Basic 24 h, Premium bis 365 Tage; Weenect bleibt `unknown`. Owner: `/gps-tracker/`. Missing: Weenect-Zeitraum und Zugriff nach Kündigung. Recommendation: `structured-data`. Confidence: high.

**C3 — Abo-Ende.** Demand Evidence: GPS-Fix, Mobilfunk, App und Historie müssen getrennt werden. Repository Evidence: Tractive-Fernortung erfordert aktives Abo; bezahlter Zeitraum läuft bis Vertragsende. Owner: `/warum-brauchen-gps-tracker-ein-abo/`. Missing: Restfunktionen und historischer Zugriff nach dem Enddatum je Modell. Recommendation: `defer`; `unknown` bleibt bestehen. Confidence: high.

**C4 — Gesundheit je Modell.** Demand Evidence: 2026-Modelle differenzieren Vital-/Verhaltensfunktionen. Repository Evidence: DOG 6 und CAT 6 Mini besitzen Activity, Sleep, Ruhe-Herz/-Atem; Hund ergänzt Bell-/Kratzdaten; Weenect nicht. Owner: `/gps-tracker/`; Quelle `gps.healthCapabilities`. Missing: medizinische Validierung wird nicht behauptet. Recommendation: `structured-data`. Confidence: high.

**C5 — Katze vs. Hund.** Demand Evidence: gleiche Plattform bedeutet nicht gleiche Funktionen. Repository Evidence: Tractive dokumentiert hundespezifisch Bell-/Kratz-/Trennungsangst und katzenspezifisch Territory. Owner: `/gps-tracker/`. Missing: Firmware-/Regiondetails können wechseln. Recommendation: `enrich-existing`. Confidence: high.

**C6 — Hardwarewechsel.** Demand Evidence: Profil, Zonen, Abo und Baseline. Repository Evidence: Tractive überträgt Abo, Profil, Energiesparzonen, Zäune, Heimadresse und Family Sharing; Modellfeatures können entfallen. Owner: `/gps-tracker/`. Missing: Historie und Gesundheitsbaseline werden in der Quelle nicht ausdrücklich garantiert. Recommendation: `structured-data`. Confidence: high.

### Cluster D — Mikrochip-Katzenklappen

**D1 — Batteriewechsel.** Demand Evidence: erneutes Anlernen wäre ein erheblicher Fail State. Repository Evidence: Sure Petcare und Closer Pets bestätigen persistent gespeicherte IDs. Owner: `/vergleiche/beste-mikrochip-katzenklappen/`; Quelle `lifecycleDependency`. Missing: Detailsettings bei langem stromlosen Zustand. Recommendation: `structured-data`. Confidence: high.

**D2 — Repairability.** Demand Evidence: Motor, Klappe, Rahmen, Schloss, Dichtung. Repository Evidence: Sure Petcare bietet offizielle Austauschvideos; Cat Mate Ersatzklappe Part 931. Owner: Vergleich. Missing: gleichartige Angaben für PetSafe, OnlyCat, petWALK und Petporte. Recommendation: phasenweises `data-asset`. Confidence: high.

**D3 — Safety Learn.** Demand Evidence: Wohnungskatze soll nach versehentlichem Entkommen zurückkehren können. Repository Evidence: DualScan-Produktdatei dokumentiert den Sicherheitsmodus; der Vergleich trennt ihn von Ausgangsrechten. Owner: Vergleich. Missing: keine verallgemeinerbare Funktion anderer Modelle. Recommendation: `no-change`. Confidence: high.

**D4 — ID-Kapazität.** Demand Evidence: 32 IDs sind nicht 32 Regeln. Repository Evidence: SureFlap Standard 32 IDs/partielle Regeln, DualScan 32/individuelle Richtungsrechte, Cat Mate 9/gemeinsamer Timer. Owner: Vergleich; `multiPet` wurde erweitert. Missing: keine pauschale Zeitplanfunktion ableiten. Recommendation: `structured-data`. Confidence: high.

**D5 — Low Battery.** Demand Evidence: Warnung und Endzustand sind getrennt. Repository Evidence: SureFlap und Cat Mate dokumentieren Warnanzeige und Weiterbetrieb während der Warnphase. Owner: Vergleich. Missing: finale Verriegelungsposition bei vollständig leeren Batterien und mechanischer Override je Modell. Recommendation: `enrich-existing` mit `unknown`. Confidence: high.

### Cluster E — automatische Katzentoiletten

**E1 — Mindestgewicht.** Demand Evidence: Automatik darf leichte Kitten nicht übersehen. Repository Evidence: Litter-Robot 4 nennt 1,36 kg und Semi-Automatik darunter; der bestehende Vergleich warnt bereits vor aktivem Betrieb zu leichter Tiere. Owner: Vergleich; Quelle `sensorLimits`. Missing: Normalisierung aller elf Modelle. Recommendation: `structured-data`. Confidence: high.

**E2 — große Katze.** Demand Evidence: Gewicht ist nicht Platz. Repository Evidence: Vergleich trennt Eingang, Innenraum, Einstieg, Bauform und Gewicht für aktuelle Modelle. Owner: Vergleich. Missing: keine substanzielle Owner-Lücke. Recommendation: `no-change`. Confidence: high.

**E3 — Untergrund.** Demand Evidence: Waage/Sensorik hängt vom Stand ab. Repository Evidence: Batch 02/03 enthält Luma plus Unknown-Matrix; Litter-Robot 4 dokumentiert festen Boden und Carpet Tray. Owner: Vergleich. Missing: modellbezogene Bedingungen der übrigen Population. Recommendation: `data-asset`. Confidence: high.

**E4 — blockierter Zyklus.** Demand Evidence: Stop, Meldung, Reset und Zugang. Repository Evidence: Litter-Robot 4 stoppt bei Sensoraktivierung, kann fortsetzen und dokumentiert Lichtcodes/Reset. Owner: Vergleich; `failureModes.mechanicalBlock`. Missing: gleiche Funktionskette anderer Modelle. Recommendation: `structured-data`, Coverage bleibt partial. Confidence: high.

**E5 — manuelle Nutzung.** Demand Evidence: Nutzung bei App-, WLAN- oder Motorproblem. Repository Evidence: einzelne Offline-/Manuell-Hinweise, aber keine sichere modellübergreifende Freigabe bei blockierter Mechanik. Owner: `/automatische-katzentoiletten/`. Missing: zugänglicher Innenraum und Herstellerfreigabe je Fail State. Recommendation: `defer`. Confidence: high.

**E6 — Verschleißteile.** Demand Evidence: Liner, Filter, Dichtungen, Sieb und Sensorik. Repository Evidence: Litter-Robot Filter/Dichtstreifen/Basis belegt; andere Produkttexte nennen Verbrauchsteile. Owner: Vergleich. Missing: normalisierte offizielle Teilepopulation. Recommendation: `data-asset`. Confidence: medium-high.

### Cluster F — Haustierkameras

**F1 — Offline-Aufnahme.** Demand Evidence: Internetverlust darf nicht aus microSD abgeleitet werden. Repository Evidence: Reolink 4K dokumentiert microSD-Aufnahme während Netzwerkausfällen; PetTec/Furbo bleiben `unknown`. Owner: Vergleich; `failureModes.internetOutage.functions`. Missing: PetTec/Furbo. Recommendation: `structured-data`. Confidence: high.

**F2 — LAN.** Demand Evidence: LAN-View ist nicht gleich Aufnahme. Repository Evidence: Reolink nennt RTSP/ONVIF/Browser, aber konkretes App-Playback während Ausfall bleibt offen. Owner: Vergleich. Missing: PetTec/Furbo und versionsgenauer Reolink-App-LAN-Pfad. Recommendation: `structured-data`. Confidence: high.

**F3 — lokaler Betrieb.** Demand Evidence: Aufnahme, Erkennung, Push, Playback und Remote-Zugriff müssen getrennt sein. Repository Evidence: Funktionsstatus im bestehenden Failure-Mode-Eintrag; Unknowns bleiben neutral. Owner: Vergleich. Missing: vollständige Funktionsmatrix der anderen Kameras. Recommendation: `enrich-existing`. Confidence: high.

**F4 — Retention.** Demand Evidence: Kapazität ist nicht Aufbewahrungsdauer. Repository Evidence: aktuelle Reolink 4K nennt bis acht Tage kontinuierlich mit 512 GB bei definierter Bitrate; Cloud-Retention bleibt tarif-/regionsabhängig. Owner: Vergleich; Quelle `dataPortability`. Missing: Überschreibung/Export anderer Modelle. Recommendation: `structured-data`. Confidence: high.

**F5 — Benutzerfreigabe.** Demand Evidence: Haushaltszugriff benötigt Rollen/Limits. Repository Evidence: Reolink nennt 20 Nutzer und 12 Streams; Multi-Camera-Owner bewahrt andere Werte als `unknown`. Owner: Vergleich. Missing: Furbo, PetTec, PETLIBRO und Enabot. Recommendation: `data-asset`. Confidence: high.

**F6 — Tier vs. Individuum.** Demand Evidence: generische Pet Detection ist keine Identität. Repository Evidence: Vergleich und Produktseiten trennen Reolink-Tiererkennung, Furbo-Tracking und PETLIBRO-Profile von sicherer individueller Zuordnung. Owner: Vergleich. Missing: keine allgemeine Lücke. Recommendation: `no-change`. Confidence: high.

## New Page Decision

Kein Node ist `missing` oder `fragmented`. Alle 33 Nodes besitzen einen natürlichen bestehenden Owner oder gehören als Produkt-/Datenattribut in einen solchen Owner. Damit scheitert das New-Page-Gate mindestens an Punkt 2, 3 oder 9. **Neue Seiten: 0.**

## Primary Evidence Used

- PETLIBRO Granary/Air: <https://petlibro.com/pages/how-the-granary-automatic-feeder-works>, <https://au.petlibro.com/products/air-wifi-feeder>
- PETKIT YumShare: <https://instructions.petkit.com/App%20Manual/D4H-2/D4H-2_UserManual_EN_V1.1_20260226.pdf>
- PetSafe Ersatzpumpe: <https://www.petsafe.com/ch/p/ersatzpumpe-drinkwell-trinkbrunnen-360/PAC00-13150/>
- Tractive Verlauf, Export, Health und Transfer: <https://help.tractive.com/hc/en-us/articles/360000321545-Checking-your-pet-s-location-history>, <https://help.tractive.com/hc/en-us/articles/29331965045138-Download-your-Tractive-tracker-data>, <https://help.tractive.com/hc/en-us/articles/360011024119-What-health-features-does-Tractive-track>, <https://help.tractive.com/hc/es/articles/115004050745-C%C3%B3mo-transferir-su-suscripci%C3%B3n-a-otro-localizador>
- Sure Petcare / Closer Pets: <https://www.surepetcare.com/en-eu/support/videos/replacing-the-batteries-on-your-sureflap-microchip-pet-door>, <https://www.surepetcare.com/en-us/support/videos>, <https://closerpets.co.uk/pages/faq-elite-microchip-cat-flap-with-timer-control-faqs-355>
- Litter-Robot 4: <https://www.litter-robot.com/eu/litter-robot-4.html>, <https://www.litter-robot.com/manual_pdf/Litter-Robot-4-Manual-EN-DE-FR-IT.pdf>
- Reolink E1 Zoom aktuelle 4K-Generation: <https://reolink.com/ca/product/e1-zoom/>, <https://reolink.com/de/product/e1-zoom/>

## Top Follow-ups

1. Offizielle Jam-/Empty-/Reverse-Semantik für aktuelle Feeder normalisieren.
2. Filterfamilien und offizielle Pumpen/Deckel/Dichtungen für weitere Brunnen erfassen.
3. Abo-Ende und Post-Subscription-History für Tractive/Weenect verbindlich klären.
4. Manual-/Blocked-Cycle-Verhalten der übrigen automatischen Katzentoiletten ergänzen.
5. Nutzerrollen, Streams und Offline-Funktionsmatrix für PetTec, Furbo und PETLIBRO Scout recherchieren.
