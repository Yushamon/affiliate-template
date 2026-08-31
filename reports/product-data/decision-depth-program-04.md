# PfotenTechnik — Decision Depth Program 04

Stand: 31. August 2026  
Lokale Basis: Branch `main`, HEAD `40540959294a5a91335634b53c1660228458f6d2`, einschließlich des uncommitteten Batch-03-Stands.

## Ergebnis

Program 04 ergänzt das bestehende Produktschema um sechs klar abgegrenzte Decision-Depth-Assets. Alle neuen Felder sind optional und rückwärtskompatibel. `failureModes`, `litterCompatibility` und `multiPet` aus Batch 03 bleiben die maßgeblichen bestehenden Systeme; Kamera-Funktionsausfälle und Identification Depth wurden dort erweitert, statt parallele Modelle anzulegen.

Die Umsetzung ist bewusst exemplarisch: 13 Produktdateien besitzen mindestens eines der neuen Top-Level-Assets. Positive technische Claims benötigen Hersteller-, Handbuch- oder Support-Evidence; `unknown` und `notApplicable` dürfen ohne künstliche Ableitung bestehen bleiben. Es wurde keine allgemeine Reparierbarkeitsnote, keine eigene Messgenauigkeit und keine neue Route eingeführt.

## Asset 1 — Dispensing Precision

| Punkt | Ergebnis |
|---|---|
| Existing fields | `comparisonFilters.portionGrams`, `portionMl`, `maxPortionsPerMeal`, `maxMealGrams`, `maxMealMl`, `kibbleMaxMm`; freie Specs und Produkttexte |
| Implemented fields | `status`, `portionUnit`, `nominalPortionGrams`, `nominalPortionMilliliters`, `minimumPortionsPerDispense`, `maximumPortionsPerDispense`, `portionIsApproximate`, `kibbleDependency`, `fillLevelDependency`, `integratedScale`, `calibrationSupported`, `dualBowlDistribution` |
| Products applicable | 37 Futterautomaten; vorrangig Trockenfutterautomaten mit portionierter Ausgabe |
| Products populated | 3: PETLIBRO Granary Camera, PETLIBRO Air WiFi Feeder, PETKIT YumShare Solo 2 |
| Supported claims | Nennportionen und Min-/Max-Portionseinheiten; Futterform/-dichte als Bedingung; Granary-Doppelschale als mechanische Teilung ohne individuelle Dosierung |
| Unknowns | Hersteller-Toleranz, Füllstandseinfluss, Gram-Kalibrierung und integrierte Waage, soweit für die konkrete Generation nicht eindeutig dokumentiert |
| Evidence coverage | 3/3 Datensätze mit Primärquelle und Prüfdatum; zwei Herstellerseiten, ein aktuelles Herstellerhandbuch |
| Maintenance risk | mittel: Produktgenerationen, regionale Varianten und Portionsdefinitionen können wechseln |
| Recommendation | Asset beibehalten und nur generationstreu auf weitere Feeder ausrollen; Nennwert nie als garantierte Ausgabe darstellen |

Die bestehende `portionGrams`-/`portionMl`-Filterlogik bleibt für Vergleiche bestehen. Das neue Asset trägt die Semantik, ob eine Angabe nominal, ungefähr oder futterabhängig ist, und vermeidet damit eine zweite Wahrheit für Filterwerte.

## Asset 2 — Repairability / Parts

| Punkt | Ergebnis |
|---|---|
| Existing fields | Filter-/Verbrauchsmaterial in Specs, `replacementFilter`, freie Wartungs- und Supporttexte |
| Implemented fields | normalisierte `parts[]` mit `type`, Status, `officialPart`, optionaler Teilenummer, werkzeuglosem Wechsel, Detail und Evidence; optionale `warrantyNote` |
| Products applicable | zunächst 44 Produkte in Trinkbrunnen, Katzenklappen und automatischen Katzentoiletten; keine pauschale Abdeckung behauptet |
| Products populated | 4: PetSafe Streamside, SureFlap Mikrochip-Katzenklappe, Cat Mate Elite 355W, Litter-Robot 4 |
| Supported claims | offizielle PetSafe-Pumpe PAC00-13150 und Filter; Sure-Petcare-Motor, Klappe, Rahmen, Verriegelung und Catch Pad; Cat-Mate-Ersatzklappe Part 931; Litter-Robot-Filter, Dichtstreifen und Basis |
| Unknowns | Werkzeuge, Garantieauswirkung und Teile für weitere Modelle; keine Drittanbieter-Kompatibilität abgeleitet |
| Evidence coverage | 4/4 Produkte besitzen offizielle Produkt-, Support- oder Handbuchquellen je positivem Eintrag |
| Maintenance risk | hoch: Teileverfügbarkeit, Teilenummern und Supportseiten sind lifecycle-abhängig |
| Recommendation | phasenweise ausbauen; Parts-URLs regelmäßig prüfen, aber keine Score- oder Lebensdauerwertung einführen |

## Asset 3 — Data Portability & Retention

| Punkt | Ergebnis |
|---|---|
| Existing fields | GPS-Abo-/Connectivity-Daten, Kamera-`localStorage`, Cloud-/microSD-Specs und freie History-Texte |
| Implemented fields | `history`, `historyRetentionDays`, `export`, `exportFormats`, `localDownload`, `cloudRetention`, `postSubscriptionAccess`, `deviceMigration`, `sharedAccess`, `maximumUsers`, `simultaneousStreams` |
| Products applicable | 12 GPS-Tracker und 8 Haustierkameras; konkrete Felder nur bei passender Funktion |
| Products populated | 4: Tractive DOG 6, Tractive CAT 6 Mini, Weenect XS, aktuelle Reolink E1 Zoom 4K |
| Supported claims | Tractive-Verlauf nach Tarif, Premium-Export und Geräteübertragung; Reolink-microSD-Aufbewahrung unter dokumentierter Bitratenbedingung sowie 20 Nutzer/12 Streams |
| Unknowns | Exportformat, dauerhaft lokales Archiv, Zugriff nach Abo-Ende, Weenect-Retention/-Export sowie Cloud-Retention der Reolink-Variante |
| Evidence coverage | Tractive und Reolink mit aktueller Hersteller-/Support-Evidence; Weenect bleibt absichtlich vollständig `unknown` |
| Maintenance risk | hoch: Tarif-, Regions-, Firmware- und Cloud-Änderungen können Retention und Freigabe verändern |
| Recommendation | Asset beibehalten; Tarif und Modellgeneration stets als Bedingung am Claim führen |

## Asset 4 — Sensor Limits

| Punkt | Ergebnis |
|---|---|
| Existing fields | GPS-Mindestgewicht, Litter-`weightTracking`, `litterCompatibility`, `multiPet.similarPetLimitation` und freie Aufstellhinweise |
| Implemented fields | `minimumOperationalWeightKg`, `automaticModeMinimumWeightKg`, `baselineDaysRequired`, `calibrationRequirement`, `environmentDependency`, `identificationLimitation`, `belowMinimumBehavior` plus Evidence-Triple für numerische Grenzen |
| Products applicable | produktabhängig in Futterautomaten, GPS, automatischen Katzentoiletten und identifizierenden Brunnen; bewusst kein universelles Pflichtschema |
| Products populated | 2: Litter-Robot 4 und PETLIBRO Dockstream RFID Smart |
| Supported claims | 1,36-kg-Grenze und manueller Betrieb darunter; harter/ebener Untergrund und Carpet Tray; RFID-Tag-/Kalibrierungsbedingung beim Trinktracking |
| Unknowns | Mindestgewicht und Untergrund vieler weiterer Katzenklos; Messgenauigkeit und Fallback ohne RFID-Tag |
| Evidence coverage | 2/2 mit Hersteller-/Handbuch-Evidence; numerische Angaben werden ohne vollständiges Evidence-Triple vom Audit abgelehnt |
| Maintenance risk | mittel: Kalibrierungs- und Firmwarehinweise können sich ändern; Grenzen dürfen nicht auf verwandte Modelle übertragen werden |
| Recommendation | nur produktspezifische Limits ergänzen und `litterCompatibility` beziehungsweise `multiPet` für benachbarte Aussagen weiterverwenden |

## Asset 5 — Lifecycle Dependency

| Punkt | Ergebnis |
|---|---|
| Existing fields | `subscription`, Connectivity, Failure Modes und freie Batterie-/Gerätewechseltexte |
| Implemented fields | `profilePersistence`, `settingsPersistence`, `subscriptionTransfer`, `serviceEndFallback` als einzeln belegte Claims |
| Products applicable | Geräte mit Batteriewechsel, Pflichtdienst, Profil- oder Einstellungszustand; im ersten Schritt drei Mikrochip-Katzenklappen |
| Products populated | 3: SureFlap Mikrochip-Katzenklappe, SureFlap DualScan, Cat Mate Elite 355W |
| Supported claims | gespeicherte Chip-IDs bleiben beim Batteriewechsel erhalten; Basismodelle benötigen keinen Cloud-Dienst für lokale Chipfreigabe |
| Unknowns | vollständige Settings-Persistenz und finaler Fail State bei komplett leerer Batterie |
| Evidence coverage | 3/3 mit Hersteller-Support oder offizieller FAQ für ID-Persistenz |
| Maintenance risk | mittel: Connect-Varianten und Basismodelle dürfen nicht vermischt werden |
| Recommendation | Asset getrennt von `failureModes` halten: Lifecycle beschreibt erhaltenen Zustand, Failure Mode das Verhalten während eines konkreten Ausfalls |

## Asset 6 — Identification Depth

| Punkt | Ergebnis |
|---|---|
| Existing fields | Batch-03-`multiPet`: `sharedUse`, Identifikationsmethoden, Profile, Zugang, Fütterung, Nutzungsdaten und Similar-Pet-Limit |
| Implemented fields | additive Erweiterung um `identitiesStored`, `identifiesPresence`, `identifiesIndividual`, `controlsAccess`, `attributesUsage`, `attributesHealthData`, `individualRules`, `individualSchedules` |
| Products applicable | 19 bestehende Multi-Pet-Datensätze; Vertiefung zuerst dort, wo gespeicherte IDs oder individuelle Zuordnung kaufentscheidend sind |
| Products populated | 4: drei Mikrochip-Katzenklappen und PETLIBRO Dockstream RFID Smart |
| Supported claims | IDs, individuelle Erkennung, Zugangssteuerung und Regel-Tiefe der Klappen; tierbezogene Trinknutzung per proprietärem RFID-Tag |
| Unknowns | nicht dokumentierte Zeitpläne, individuelle Health Attribution und Systemgrenzen außerhalb der Primärquelle |
| Evidence coverage | alle vier Vertiefungen referenzieren offizielle Evidence über `multiPet.evidenceSourceUrls`; positive Individualfunktionen erfordern weiterhin eine Identifikationsmethode |
| Maintenance risk | mittel: Marketingbegriffe wie „Multi-Pet“ und „AI Pet Detection“ dürfen nicht als Individualerkennung interpretiert werden |
| Recommendation | bestehendes Batch-03-Asset weiterführen; keine separate Identification-Struktur anlegen |

## Changes Implemented

### Work Package A — Portion & Dispensing Data

Abgeschlossen für drei repräsentative Trockenfutterautomaten. Nominalwert, Portionseinheit, Approximation, Futterabhängigkeit, Mindest-/Maximalportion und Doppelschalenlogik sind getrennt. Der Owner `/smarte-futterautomaten/` erklärt nun ausdrücklich, warum Herstellerportion und reale Grammmenge nicht gleichgesetzt werden dürfen.

### Work Package B — Repairability & Replacement Parts

Phasenweise umgesetzt für vier Produkte mit belastbarer Primär-Evidence. Ersatzteile werden nach Typ und offiziellem Status erfasst; Drittanbieterangebote und pauschale Lebensdauerurteile bleiben ausgeschlossen. Der Owner `/trinkbrunnen/` trennt kabellose Bauart von tatsächlicher Reparierbarkeit.

### Work Package C — GPS Data Ownership & Health Capabilities

Abgeschlossen für die drei priorisierten Tracker. `gps.healthCapabilities` trennt Aktivität, Schlaf, Ruhe-Herz/-Atemrate, Kratzen, Bellen, weitere Verhaltensfunktionen, Alerts, Baseline und Nicht-Medizinprodukt-Status. `dataPortability` trennt History, Export, Abo-Bedingung und Gerätewechsel. Der Owner `/gps-tracker/` zeigt die Unterschiede zwischen Hund, Katze und ungeklärten Weenect-Feldern.

### Work Package D — Device Persistence

Abgeschlossen für drei Mikrochip-Katzenklappen. Chip-ID-Persistenz beim Batteriewechsel ist belegt; Settings-Persistenz und vollständig leerer Batterie-Fail-State bleiben `unknown`. Identification Depth trennt gespeicherte IDs von individuellen Regeln. Der bestehende Katzenklappen-Vergleich ist der Owner.

### Work Package E — Automatic Litter Safety & Recovery

Phasenweise für Litter-Robot 4 umgesetzt. Mindestgewicht, Verhalten unterhalb der Grenze, Untergrundbedingung, Blockadefall und ausgewählte Verschleißteile sind strukturiert. Batch-03-`litterCompatibility` und `multiPet` bleiben unverändert die benachbarten Wahrheiten; der bereits starke Katzenklo-Vergleich erhielt keine sechste Owner-Erweiterung.

### Work Package F — Camera Local Operation

Phasenweise für die aktuelle Reolink E1 Zoom 4K umgesetzt. Das bestehende `failureModes.internetOutage` wurde um getrennte Funktionsstatus für Aufnahme, Erkennung, Wiedergabe, Remote-Zugriff, Benachrichtigungen und LAN ergänzt. Retention und Benutzerfreigabe stehen im Portability-Asset. Der Kamera-Vergleich unterscheidet nun lokalen Speicher von lokalem Betrieb.

### Work Package G — Existing Owner Enrichment

Genau fünf bestehende Owner wurden gezielt ergänzt:

| Owner | Vorher | Nachher | Verbesserung |
|---|---|---|---|
| `/smarte-futterautomaten/` | partial | covered | Nominalportion, reale Ausgabe, Minimum und Doppelschale als Decision Table |
| `/trinkbrunnen/` | partial | covered | „kabellos“ und austauschbare Komponenten getrennt |
| `/gps-tracker/` | partial | covered | Verlauf, Export, Abo-Bedingung, Tierart und Gerätewechsel |
| `/vergleiche/beste-mikrochip-katzenklappen/` | partial | covered für D1/D4; partial für D2/D5 | ID-Persistenz, Kapazität vs. Regeln, Parts und ehrliche Fail-State-Unknowns |
| `/vergleiche/beste-haustierkameras/` | partial | covered für F1–F4; partial für F5 | Offline-Funktionen und Retention getrennt; weitere Hersteller-Nutzerlimits offen |

## Changes Deferred

| Finding | Grund |
|---|---|
| A5 Feeder Jam-/Empty-Erkennung | Keine ausreichend konsistente, modellübergreifende Primär-Evidence für Sensor, Reverse und bestätigte Fehlausgabe |
| B3 Filterfamilien | Offizielle Modell-zu-Filter-Kompatibilitätsrelationen fehlen für eine belastbare Lock-in-Matrix |
| C3 vollständiger Zustand nach Abo-Ende | Remote-Ortung ist geklärt, Restfunktionen und Zugriff auf alte Historie jedoch nicht |
| E5 manuelle Nutzung bei Elektronik-/Motorfehler | Darf nicht aus offener Bauform oder normalem Offline-Betrieb abgeleitet werden |
| B2/D2/E3/E6/F5 breite Population | Asset vorhanden, aber Rollout auf weitere Produkte bleibt evidence- und wartungsabhängig |

## Schema- und Test-Guardrails

- Alle neuen Top-Level-Felder sind optional; bestehende 101 Produktdateien bleiben kompatibel.
- Positive Decision-Depth-Claims benötigen `sourceUrl`, `sourceType` und `verifiedAt`.
- Positive offizielle Ersatzteile benötigen `officialPart: true`.
- Numerische Sensorgrenzen benötigen ein Evidence-Triple.
- Nominale Grammportionen müssen `portionIsApproximate` explizit ausweisen.
- `unknown`, `notApplicable`, `unavailable` und bedingte Unterstützung bleiben semantisch getrennt.
- Neue Tests prüfen optionale Schemas, ungültige Werte, Evidence-Pflichten, Retention, Sensorlimits, Identification Depth und genau fünf Owner-Marker.

## New Routes

**0.** Kein Demand Node ist `missing` oder `fragmented`; alle Fragen besitzen einen natürlichen bestehenden Intent Owner oder gehören in ein wiederverwendbares Produktdaten-Asset. Das New-Page-Gate wurde daher nicht passiert.

## Validation

| Prüfung | Ergebnis | Klassifikation |
|---|---|---|
| Product Data Audit | bestanden: 101 Produkte, 0 Fehler, 96 Warnungen | bestehende Hinweise, kein Program-04-Fehler |
| Product Data Strict | bestanden: 101 Produkte, 0 Fehler | grün |
| Content Audit | nicht-strikt beendet: 11 harte Count-Mismatches | alle 11 aus der dokumentierten Batch-03-Baseline, `pre-existing` |
| Content Audit Strict | Exit 1 wegen exakt derselben 11 Count-Mismatches | `pre-existing`, keine neue Route und kein neuer Count-Befund |
| Internal Linking | bestanden: 243 Dokumente, 0 Fehler, 9 Warnungen | grün |
| Internal Linking Strict | bestanden: 0 strict-kritische Befunde | grün |
| Comparison Audit Strict | bestanden: 99/100, 0 Fehler, 4 Coverage-Warnungen | grün |
| Comparison Data Audit Strict | bestanden: 28 Vergleiche, 100 % gerenderte Abdeckung | grün |
| Decision Data Audit | bestanden: 101 Produkte, 11 Litter-Produkte | grün |
| Decision Depth Audit | bestanden: 101 Produkte; Assets 3/4/4/2/3 | grün |
| Failure Mode Tests | 4/4 | grün |
| Litter Compatibility Test | 1/1 innerhalb Batch-03-Suite | grün |
| Multi-Pet Tests | 2/2 innerhalb Batch-03-Suite | grün |
| Program-04-Tests | 6/6 | grün |
| Legacy Cluster Tests | 13/13 | grün |
| Astro Build | bestanden: 366 Seiten | grün |
| `git diff --check` | keine Ausgabe, Exit 0 | grün |

## Maintenance Recommendation

Program 04 sollte als evidence-getriebene Vertiefung weitergeführt werden, nicht als Coverage-Quote. Die nächsten Ergänzungen sind nur sinnvoll, wenn die konkrete Modellgeneration und eine offizielle Quelle feststehen. Höchstes Pflegepotenzial besitzen Parts-URLs, Tarif-/Retention-Angaben und Kamera-Firmwarefunktionen; sie sollten bei Produktaktualisierungen gezielt erneut geprüft werden.
