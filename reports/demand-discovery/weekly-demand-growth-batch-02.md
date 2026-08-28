# Weekly Demand Growth Batch 02

## 1. Executive Summary

Untersucht wurden exakt **24 externe Demand Nodes** gegen den aktuellen Repository-Bestand von `apps/pfotentechnik`. Die Klassifikation beruht auf der Frage, ob ein Nutzer mit genau diesem Problem bei einem klaren bestehenden Intent Owner eine substanzielle Antwort erhält. Reine Keyword-Vorkommen wurden nicht als Coverage gewertet; unbekannte Produkteigenschaften wurden weder als `false` noch aus anderen Funktionen oder Modellen abgeleitet.

| Ergebnis | Anzahl |
|---|---:|
| covered | 10 |
| partial | 13 |
| fragmented | 0 |
| missing | 1 |
| overcovered | 0 |
| uncertain | 0 |

- **Direct Coverage Rate:** 10 / 24 = **41,67 %**
- **Effective Coverage Rate:** (10 + 0,5 × 13) / 24 = **68,75 %**
- **Breadth Classification:** `breadth-gap-medium`
- **New Page Candidates:** 0
- **Existing-page Enrichments:** 8
- **Consolidation Candidates:** 0
- **Data Asset Candidates:** 4 geprüft; Failure Mode und Multi-Pet `high`, TCO `medium`, Litter Compatibility `high`

Das Ergebnis zeigt keinen akuten URL-Breadth-Engpass: 23 von 24 Nodes besitzen bereits einen sinnvollen Owner. Es zeigt aber ein mittleres Coverage-Defizit, weil 13 Owner eine wesentliche modellvergleichende Information noch nicht liefern und ein Node substanziell fehlt. Der Engpass liegt überwiegend in normalisierten, primärquellenbasierten Produktdaten, nicht in neuen Seiten.

Aktuelle, query-spezifische GSC-Daten für diese 24 Nodes waren im Repository nicht ausreichend vorhanden. Deshalb wurde GSC nicht zur Klassifikation verwendet. Gemäß Cold-Start-Regel gilt: kein gespeichertes Impression-Signal ist kein Demand-Gegenbeweis.

## 2. Coverage Matrix

| ID | Cluster | Demand Node | Coverage | Owner | Recommendation |
|---|---|---|---|---|---|
| A1 | Futterautomaten | Manipulationssicherheit | partial | `/smarte-futterautomaten/` | enrich-existing |
| A2 | Futterautomaten | 5-GHz-WLAN | covered | `/vergleiche/futterautomat-mit-app/` | no-change |
| A3 | Futterautomaten | Schalenform / Schnurrhaarstress | partial | `/vergleiche/beste-futterautomaten-mit-edelstahl-napf/` | data-asset-candidate |
| A4 | Futterautomaten | Stromausfall + WLAN-Ausfall | covered | `/futterautomat-bei-stromausfall/` | no-change |
| B1 | Trinkbrunnen | Folgekosten | partial | `/filter-im-katzentrinkbrunnen-wechseln/` | data-asset-candidate |
| B2 | Trinkbrunnen | Ohne proprietäre Filter | covered | `/katzentrinkbrunnen-ohne-filter/` | no-change |
| B3 | Trinkbrunnen | Edelstahl vs. Keramik | covered | `/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/` | no-change |
| B4 | Trinkbrunnen | Spülmaschinen-Kompatibilität | partial | `/katzentrinkbrunnen-richtig-reinigen/` | enrich-existing |
| C1 | GPS-Tracker | Wald / schlechter Empfang | covered | `/reichweite-von-gps-trackern/` | no-change |
| C2 | GPS-Tracker | Funkloch | partial | `/reichweite-von-gps-trackern/` | data-asset-candidate |
| C3 | GPS-Tracker | Total Cost of Ownership | partial | `/warum-brauchen-gps-tracker-ein-abo/` | data-asset-candidate |
| C4 | GPS-Tracker | Gesundheits- und Vitaldaten | partial | `/gps-tracker/` | enrich-existing |
| D1 | Mikrochip-Katzenklappen | Dicke Wand / Tunnel | partial | `/katzenklappe-einbauen/` | enrich-existing |
| D2 | Mikrochip-Katzenklappen | Metalltür | partial | `/katzenklappe-einbauen/` | enrich-existing |
| D3 | Mikrochip-Katzenklappen | Große Katze | covered | `/vergleiche/beste-mikrochip-katzenklappen/` | no-change |
| D4 | Mikrochip-Katzenklappen | Chip inkompatibel / Fallback | partial | `/vergleiche/beste-mikrochip-katzenklappen/` | enrich-existing |
| E1 | Automatische Katzentoiletten | Streu-Kompatibilität | covered | `/vergleiche/beste-automatische-katzentoiletten/` | no-change |
| E2 | Automatische Katzentoiletten | Pflanzen-/Tofu-/Holzstreu | covered | `/vergleiche/beste-automatische-katzentoiletten/` | no-change |
| E3 | Automatische Katzentoiletten | Mehrere ähnlich schwere Katzen | partial | `/automatische-katzentoiletten/` | data-asset-candidate |
| E4 | Automatische Katzentoiletten | Teppich / unebener Boden | partial | `/vergleiche/beste-automatische-katzentoiletten/` | enrich-existing |
| F1 | Haustierkameras | Funktionen ohne Abo | covered | `/vergleiche/beste-haustierkameras/` | no-change |
| F2 | Haustierkameras | Lokale Speicherung vs. Cloud | covered | `/vergleiche/beste-haustierkameras/` | no-change |
| F3 | Haustierkameras | Internetausfall | partial | `/vergleiche/beste-haustierkameras/` | data-asset-candidate |
| F4 | Haustierkameras | Mehrere Kameras / Räume | missing | `/vergleiche/beste-haustierkameras/` | enrich-existing |

## 3. Detailed Findings

### A1 — Manipulationssicherheit — partial (high confidence)

- **Primary Intent Owner / Datei:** `/smarte-futterautomaten/` — `apps/pfotentechnik/src/content/pages/smarte-futterautomaten.md`
- **Repository Evidence:** Abschnitt `### 7. Sicherheit` und der 7-Tage-Plan verlangen Prüfungen auf Umkippen, Aufhebeln/Öffnen, Erreichen des Auslasses, Deckel, Mechanik und Standfestigkeit. Der Tag-6-Test simuliert ausdrücklich Öffnungsversuche. `/futterautomat-hund/`, Abschnitt `## Standfestigkeit und Manipulationsschutz`, vertieft Basis, Deckelverriegelung und Auslass, ist aber hundespezifisch.
- **Secondary URLs:** `/futterautomat-hund/`, `/produkt/catit-pixi-smart-futterautomat/`
- **Gap:** Kein katzenspezifischer, modellvergleichbarer Nachweis zu Deckelverriegelung, erreichbarem Auslass und sehr futtermotivierten Katzen.
- **Cannibalization / Entscheidung:** Hohe Gefahr bei einer neuen URL; dies ist ein Sicherheits-Unterintent des Hubs. Bestehenden Owner erst nach normalisierter Evidence anreichern. `newPage: no`.

### A2 — 5-GHz-WLAN — covered (high confidence)

- **Owner / Datei:** `/vergleiche/futterautomat-mit-app/` — `apps/pfotentechnik/src/content/comparisons/futterautomat-mit-app.md`
- **Evidence:** `WLAN: 2,4 GHz oder 5 GHz?` trennt 2,4-GHz-only, Dual-Band, kombinierte SSIDs, Einrichtung und 5-GHz-only als mögliches Ausschlusskriterium.
- **Secondary URL:** `/smarte-futterautomaten/`
- **Gap / Entscheidung:** Kein substanzieller Gap. Eine neue Seite würde den exakten Vergleichsabschnitt duplizieren. `no-change`, `newPage: no`.

### A3 — Schalenform / Schnurrhaarstress — partial (high confidence)

- **Owner / Datei:** `/vergleiche/beste-futterautomaten-mit-edelstahl-napf/` — `apps/pfotentechnik/src/content/comparisons/beste-futterautomaten-mit-edelstahl-napf.md`
- **Evidence:** Der Vergleich trennt Material korrekt von Schalenform, Reinigung, Rückständen und Hautbeobachtungen; er behauptet keinen pauschalen medizinischen Effekt.
- **Secondary URL:** `/smarte-futterautomaten/`
- **Gap:** Breite, Tiefe und Austauschbarkeit sind nicht konsistent vergleichbar. Für eine allgemeingültige medizinische „Schnurrhaarstress“-Behauptung fehlt eine belastbare Basis.
- **Entscheidung:** Produkt-Fit-Felder normalisieren und erst dann den bestehenden Vergleich ergänzen. Neue URL hätte hohe Kannibalisierungsgefahr. `data-asset-candidate`, `newPage: no`.

### A4 — Stromausfall + WLAN-Ausfall — covered (high confidence)

- **Owner / Datei:** `/futterautomat-bei-stromausfall/` — `apps/pfotentechnik/src/content/pages/futterautomat-bei-stromausfall.md`
- **Evidence:** Der Owner trennt Strom, Batterie, gespeicherten Zeitplan, Ausgabe, WLAN, Internet, Cloud, App, Benachrichtigungen, Wiederanlauf und aktive Kühlung. Keine Funktion wird aus einer anderen abgeleitet.
- **Secondary URLs:** `/vergleiche/beste-futterautomaten-fuer-nassfutter/`, `/smarte-futterautomaten/`
- **Entscheidung:** Exakter Intent ist vollständig belegt; keine neue oder konkurrierende URL. `no-change`.

### B1 — Folgekosten — partial (high confidence)

- **Owner / Datei:** `/filter-im-katzentrinkbrunnen-wechseln/` — `apps/pfotentechnik/src/content/pages/filter-im-katzentrinkbrunnen-wechseln.md`
- **Evidence:** `Folgekosten vor dem Kauf prüfen` nennt Preis, Packungsgröße, Wechselintervall und Verfügbarkeit. Der frühere Data-Readiness-Audit weist Filterkosten nur für 8 von 24 Brunnen-Produkten (33,3 %) und überwiegend im Text aus.
- **Secondary URL:** `/trinkbrunnen/`
- **Gap:** Normalisierte Filterpreise/-intervalle, Pumpenersatz und Kennzeichnung Pflicht/optional fehlen.
- **Entscheidung:** Komponentenasset statt scheinpräziser 1-/2-/3-Jahres-Summe; bestehender Owner bleibt zuständig. `data-asset-candidate`, `newPage: no`.

### B2 — Ohne proprietäre Filter — covered (high confidence)

- **Owner / Datei:** `/katzentrinkbrunnen-ohne-filter/` — `apps/pfotentechnik/src/content/pages/katzentrinkbrunnen-ohne-filter.md`
- **Evidence:** Der Owner trennt offiziell freigegebenen filterlosen Betrieb von erfundener Drittanbieter-Kompatibilität und berücksichtigt Pumpe, Reinigung und andere Ersatzteile.
- **Secondary URLs:** `/filter-im-katzentrinkbrunnen-wechseln/`, `/trinkbrunnen/`
- **Entscheidung:** Direkte, sichere Antwort vorhanden. `no-change`, `newPage: no`.

### B3 — Edelstahl vs. Keramik — covered (high confidence)

- **Owner / Datei:** `/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/` — gleichnamige Datei unter `src/content/pages`
- **Evidence:** Materialratgeber vergleicht Reinigung, Kalksichtbarkeit, Gewicht, Bruch, Kratzer, Pumpe/Innenmaterial und nur herstellerspezifisch belegte Spülmaschinenfreigaben; keine pauschalen Gesundheitsversprechen.
- **Secondary URLs:** `/katzentrinkbrunnen-richtig-reinigen/`, `/trinkbrunnen/`
- **Entscheidung:** Klarer, vollständiger Owner. `no-change`.

### B4 — Spülmaschinen-Kompatibilität — partial (high confidence)

- **Owner / Datei:** `/katzentrinkbrunnen-richtig-reinigen/` — `apps/pfotentechnik/src/content/pages/katzentrinkbrunnen-richtig-reinigen.md`
- **Evidence:** Spülmaschine nur nach ausdrücklicher Herstellerfreigabe; Pumpe und Elektronik werden ausgeschlossen. Einzelne Produktseiten enthalten konkrete Angaben, jedoch nicht normalisiert.
- **Secondary URLs:** `/trinkbrunnen/`, `/vergleiche/beste-trinkbrunnen-fuer-katzen/`
- **Gap:** Vollständige Teilematrix für Schale, Tank, Deckel und Zubehör je aktuellem Modell.
- **Entscheidung:** Sourced table in bestehenden Reinigungs-Owner; keine neue URL. `enrich-existing`.

### C1 — Wald / schlechter Empfang — covered (high confidence)

- **Owner / Datei:** `/reichweite-von-gps-trackern/` — `apps/pfotentechnik/src/content/pages/reichweite-von-gps-trackern.md`
- **Evidence:** Der Ratgeber trennt Satelliten-Fix, Baum-/Geländeeinfluss, Mobilfunkübertragung, verspätete Updates, letzten Punkt, LIVE-Akkuverbrauch und die anderen Rollen von VHF/Bluetooth.
- **Secondary URL:** `/gps-tracker/`
- **Entscheidung:** Substanzielle Antwort ohne universelle Reichweitenbehauptung. `no-change`.

### C2 — Funkloch — partial (high confidence)

- **Owner / Datei:** `/reichweite-von-gps-trackern/` — `apps/pfotentechnik/src/content/pages/reichweite-von-gps-trackern.md`
- **Evidence:** `GPS-Fix ist nicht Datenübertragung` erklärt korrekt, warum Remote-LIVE-Ortung und Benachrichtigungen ausfallen können, während letzter Standort oder spätere Historie modellabhängig möglich sind.
- **Secondary URLs:** `/gps-tracker/`, `/vergleiche/beste-gps-tracker-fuer-hunde/`
- **Gap:** Offizielle Matrix für lokale Aufzeichnung, spätere Synchronisierung, Bluetooth, Licht/Ton, Aktivität, Zonen und Benachrichtigungen je Modell.
- **Entscheidung:** Failure-Mode-Datenasset; Owner nicht durch neue URL aufspalten. `newPage: no`.

### C3 — Total Cost of Ownership — partial (high confidence)

- **Owner / Datei:** `/warum-brauchen-gps-tracker-ein-abo/` — `apps/pfotentechnik/src/content/pages/warum-brauchen-gps-tracker-ein-abo.md`
- **Evidence:** `Wie vergleiche ich Gesamtkosten?` liefert die richtige Kostenformel und trennt Pflichtabo, Inklusivzeit, Hardwarefunk und Tarifende. Data Readiness: Abo-Pflicht 12/12, Abopreis nur 3/12 (25 %).
- **Secondary URLs:** `/gps-tracker/`, `/vergleiche/gps-tracker-ohne-abo/`
- **Gap:** Zeitgestempelte Tarife, Laufzeiten, Inklusivperioden und Region.
- **Entscheidung:** Nur volatile Komponenten normalisieren; keine dauerhaft behauptete 2-/5-Jahres-Zahl. `data-asset-candidate`, `newPage: no`.

### C4 — Gesundheits- und Vitaldaten — partial (high confidence)

- **Owner / Datei:** `/gps-tracker/` — `apps/pfotentechnik/src/content/pages/gps-tracker.md`
- **Evidence:** `Gesundheitstrends richtig einordnen` trennt Aktivität, Schlaf und ausgewählte Trends klar von Diagnose und medizinischem Leistungsversprechen.
- **Secondary URLs:** `/produkt/tractive-dog-6/`, `/produkt/tractive-cat-6-mini/`, `/produkt/invoxia-smart-dog-collar/`
- **Gap:** Aktuelle Cross-Model-Matrix zu Aktivität, Schlaf, Ruhe, Herz-/Atemtrend, Temperatur, Verhalten und medizinischem Status.
- **Entscheidung:** Hub nach Daten-Normalisierung anreichern. `newPage: no`.

### D1 — Dicke Wand / Tunnel — partial (high confidence)

- **Owner / Datei:** `/katzenklappe-einbauen/` — `apps/pfotentechnik/src/content/pages/katzenklappe-einbauen.md`
- **Evidence:** `## Einbau in eine Wand` behandelt Tunnel, Verlängerung, Gefälle, Abdichtung, Feuchte/Statik und OnlyCat-spezifische Montage. Petporte dokumentiert 40-mm-Verlängerungen.
- **Secondary URLs:** `/katzenklappen/`, `/vergleiche/beste-mikrochip-katzenklappen/`
- **Gap:** Basistunneltiefe und belastbare Berechnung der Modulanzahl pro Modell.
- **Entscheidung:** Kompakte Tabelle/Formel im Einbauratgeber; keine neue URL. `enrich-existing`.

### D2 — Metalltür — partial (high confidence)

- **Owner / Datei:** `/katzenklappe-einbauen/` — `apps/pfotentechnik/src/content/pages/katzenklappe-einbauen.md`
- **Evidence:** `## Türmontage` und die Metalltür-FAQ warnen vor RFID-Störung und verlangen Herstellerprüfung. PetSafe Microchip fordert Adapter plus Test; Petporte den Test des montierten/programmierten Geräts vor dem Ausschnitt.
- **Secondary URLs:** `/vergleiche/beste-mikrochip-katzenklappen/`, `/produkt/onlycat-mikrochip-katzenklappe/`
- **Gap:** Modellmatrix zu Adapter, Ausschnitt und Testvorgabe.
- **Entscheidung:** Bestehenden Einbau-Owner ergänzen. Neue Seite würde denselben Installationsintent teilen. `newPage: no`.

### D3 — Große Katze — covered (high confidence)

- **Owner / Datei:** `/vergleiche/beste-mikrochip-katzenklappen/` — `apps/pfotentechnik/src/content/comparisons/beste-mikrochip-katzenklappen.md`
- **Evidence:** Feld `Durchgang` und FAQ vergleichen das engste reale Maß, grenzen Außen-/Ausschnittmaße ab und zeigen Petporte mit 160 × 160 mm als größere Option.
- **Secondary URLs:** `/katzenklappen/`, `/produkt/petsafe-petporte-smart-flap/`
- **Entscheidung:** Exakte Kaufentscheidung bereits abgedeckt. `no-change`.

### D4 — Chip inkompatibel / Fallback — partial (high confidence)

- **Owner / Datei:** `/vergleiche/beste-mikrochip-katzenklappen/` — `apps/pfotentechnik/src/content/comparisons/beste-mikrochip-katzenklappen.md`
- **Evidence:** `Zugang` zeigt FDX-B-/ISO-Beschränkungen. SureFlap dokumentiert einen kompatiblen RFID-Halsbandanhänger; PetSafe einen Formatcheck und Schlüssel/Tag-Fallback; Cat Mate einen ID-Anhänger.
- **Secondary URLs:** `/katzenklappen/`, `/produkt/cat-mate-elite-355w/`
- **Gap:** Einheitliche Spalten für Chipstandard, Prüfmethode und offiziellen Fallback pro Modell.
- **Entscheidung:** Vergleich ergänzen, kein neuer Owner. `enrich-existing`, `newPage: no`.

### E1 — Streu-Kompatibilität — covered (high confidence)

- **Owner / Datei:** `/vergleiche/beste-automatische-katzentoiletten/` — `apps/pfotentechnik/src/content/comparisons/beste-automatische-katzentoiletten.md`
- **Evidence:** Feld `streu` und Auswahlhinweise vergleichen klumpende Mineral-/Bentonit-, Tofu-/Misch-, Kristall- sowie ausgeschlossene Pellet-/nichtklumpende Varianten modellbezogen. „Klumpend“ wird ausdrücklich nicht als Universal-Freigabe behandelt.
- **Secondary URLs:** `/automatische-katzentoiletten/`, `/produkt/litter-robot-4/`, `/produkt/petkit-purobot-crystal-duo/`
- **Entscheidung:** Bereits nützlich und primärquellenorientiert; Unknowns bleiben erhalten. `no-change`.

### E2 — Pflanzen-/Tofu-/Holzstreu — covered (high confidence)

- **Owner / Datei:** wie E1.
- **Evidence:** Der Vergleich trennt explizite Tofu-/Mischstreu-Freigaben von Holzpellet-/nichtklumpenden Ausschlüssen; Luma, PETKIT und Neakasa werden modellbezogen behandelt.
- **Secondary URLs:** `/automatische-katzentoiletten/`, `/produkt/petlibro-luma-smart-litter-box/`, `/produkt/neakasa-m1-lite/`
- **Entscheidung:** Subintent von E1, kein eigenständiger URL-Bedarf. Separate Seite hätte sehr hohe Kannibalisierungsgefahr. `no-change`.

### E3 — Mehrere ähnlich schwere Katzen — partial (high confidence)

- **Owner / Datei:** `/automatische-katzentoiletten/` — `apps/pfotentechnik/src/content/pages/automatische-katzentoiletten.md`
- **Evidence:** `## Mehrkatzenhaushalt` warnt direkt, dass Profile/Gewichtserkennung nicht jedes Problem lösen und ähnlich schwere Tiere schwerer unterscheidbar sein können. Der Vergleich kennzeichnet Herstellererkennung nicht als unabhängigen Zuverlässigkeitsnachweis.
- **Secondary URLs:** `/vergleiche/beste-automatische-katzentoiletten/`, `/produkt/petlibro-luma-smart-litter-box/`
- **Gap:** Identifikationsmethode, Mindestgewichtsdifferenz, Kamera/RFID und Herstellergrenzen je Modell.
- **Entscheidung:** Multi-Pet-Asset; keine Zuverlässigkeit erfinden und keinen neuen Owner bauen. `newPage: no`.

### E4 — Teppich / unebener Boden — partial (high confidence)

- **Owner / Datei:** `/vergleiche/beste-automatische-katzentoiletten/` — gleichnamige Comparison-Datei
- **Evidence:** Sicherheitsabschnitt verlangt bei unebenem Stand das Abschalten bis zur Klärung. Luma verlangt konkret harten, ebenen Boden und warnt vor beeinträchtigter Gewichts-/Sicherheitsmessung auf Teppich.
- **Secondary URL:** `/automatische-katzentoiletten/`
- **Gap:** Offizielle Boden-, Matten- und Nivellierungsanforderungen der übrigen aktuellen Modelle.
- **Entscheidung:** Modellspalte im Vergleich ergänzen. `enrich-existing`, `newPage: no`.

### F1 — Funktionen ohne Abo — covered (high confidence)

- **Owner / Datei:** `/vergleiche/beste-haustierkameras/` — `apps/pfotentechnik/src/content/comparisons/beste-haustierkameras.md`
- **Evidence:** Felder `abo`, `pflichtabo`, `bezahlfunktionen`, `kostenlose_grundfunktionen` trennen Basis-Livebild, Aufzeichnung, Playback, AI/Cloud und lokale Speicherung pro Modell und bewahren Unknowns.
- **Secondary URLs:** `/haustierkameras/`, `/produkt/pettec-cam-360/`, `/produkt/reolink-e1-zoom/`
- **Entscheidung:** Vollständig genug für die Kaufentscheidung. `no-change`.

### F2 — Lokale Speicherung vs. Cloud — covered (high confidence)

- **Owner / Datei:** wie F1.
- **Evidence:** Felder `lokale_speicherung`, `cloud_erforderlich`, `microsd` und FAQ unterscheiden Reolink/PetTec lokal, Scout cloud-only und nicht belegte lokale Speicherung anderer Modelle.
- **Secondary URLs:** `/haustierkameras/`, `/produkt/reolink-e1-zoom/`, `/produkt/petlibro-scout-smart-camera/`
- **Entscheidung:** Klarer Vergleichsowner; keine neue Seite. `no-change`.

### F3 — Internetausfall — partial (high confidence)

- **Owner / Datei:** `/vergleiche/beste-haustierkameras/` — `apps/pfotentechnik/src/content/comparisons/beste-haustierkameras.md`
- **Evidence:** FAQ `Was passiert ohne Internet oder Herstellerdienst?` nennt möglichen Ausfall von Fernzugriff, Cloud und App und verlangt modell-/versions-/tarifspezifische Prüfung. Der Hub hat `## Internet- und Herstellerdienste als Systemgrenze`.
- **Secondary URLs:** `/haustierkameras/`, `/produkt/reolink-e1-zoom/`, `/produkt/pettec-cam-360/`
- **Gap:** Modellmatrix für lokale Aufnahme, LAN-Livebild, Erkennung, Audio, Push/Cloud und Wiederanlauf.
- **Entscheidung:** Failure-Mode-Asset; keine Funktion aus microSD allein ableiten. `newPage: no`.

### F4 — Mehrere Kameras / Räume — missing (high confidence)

- **Owner / Datei:** sinnvoller Ziel-Owner ist `/vergleiche/beste-haustierkameras/` — `apps/pfotentechnik/src/content/comparisons/beste-haustierkameras.md`
- **Evidence:** Raumabdeckung vergleicht feste Kamera und Roboter und nennt eine zweite feste Kamera als oft berechenbarer. Multi-Device-App-/Konto-Fähigkeit wird jedoch nicht beantwortet.
- **Secondary URL:** `/haustierkameras/`
- **Gap:** Gerätezahl, Multi-Camera View, gemischte Modelle und Abo pro Kamera versus Konto.
- **New-Page-Gate:** Trotz `missing` scheitern Bedingung 3 (sinnvoller bestehender Owner vorhanden) und 5 (Abschnitt/Tabelle reicht). Deshalb `enrich-existing`, `newPage: no`.

## 4. Data Asset Audit

| Asset | Potential | Coverage | Maintenance | Recommendation |
|---|---|---|---|---|
| Failure Mode Matrix | high | medium, stark ungleich | medium | phased implementation |
| Total Cost of Ownership | medium | low–medium für Beträge; hoch für GPS-Abo-Pflicht | high | components only |
| Multi-Pet Capability | high | medium | medium | phased implementation |
| Litter Compatibility Matrix | high | nützlich, aber nicht für alle 11 Produkte gleich stark | medium | normalize existing evidence |

### Failure Mode Matrix

Bereits vorhanden sind ausgewählte strukturierte `offline_betrieb`-/Stromfelder, Kamera-Felder für lokal/Cloud und umfangreiche freie Texte zu A4, C2, E4 und F3. Es fehlen einheitliche `powerOutageBehavior`, `scheduleWithoutPower`, `worksWithoutInternet`, `worksWithoutCloud`, `localStorageDuringInternetOutage`, `coolingDuringPowerOutage` und `reconnectBehavior`. Das Asset erfüllt den Gate: mehrere Owner profitieren, offizielle Manuals/Supportquellen liegen für Kernprodukte vor, die Kaufentscheidung verbessert sich, und `unknown` kann explizit bleiben. Empfehlung: phasenweise, zuerst Futterautomaten und Kameras.

### Total Cost of Ownership

Kaufpreise und Abo-Pflicht existieren gut, konkrete laufende Preise deutlich schlechter: GPS `requiredSubscription` 12/12, `subscriptionCost` 3/12; Brunnen-Filterkosten 8/24 und meist textuell. TCO wird deshalb nicht als feste 2-/5-Jahres-Zahl empfohlen. Sinnvoll sind zeitgestempelte Komponenten mit Region, Laufzeit und `mandatory/optional`; Berechnung nur zur Laufzeit mit sichtbaren Annahmen. Potenzial `medium`, Pflegeaufwand `high`.

### Multi-Pet Capability

Zugangsrechte bei Katzenklappen, RFID/Mikrochip-Fütterung sowie Profile/Gewichts-/Kamera-Erkennung bei Toiletten existieren, aber semantisch uneinheitlich. Empfohlen werden Felder für Methode, individuelle Profile/Fütterung/Nutzungsdaten, dokumentierte Mindestgewichtsdifferenz und Herstellergrenzen. Hersteller-Claims bleiben von unabhängiger Zuverlässigkeit getrennt. Potenzial `high`, Umsetzung phasenweise.

### Litter Compatibility Matrix

Im Repository existieren **11 aktuelle automatische-Katzenklo-Produktdateien**. Für die zentral verglichenen Modelle liegen klare offizielle Angaben zu Mineral/Bentonit, Tofu/Mischung, Kristall und Ausschlüssen vor; marketplace-lastige Produkte besitzen schwächere Evidence. Die bestehende Vergleichstabelle beweist Nutzen. Empfohlen ist die Normalisierung in `supported`, `notSupported`, `conditional`, `unknown` plus Partikelgrenzen und Provenance. Community-Erfahrung darf nur separat gekennzeichnet werden. Potenzial `high`.

## 5. New Page Candidates

**No new pages recommended from this batch.**

Kein Node erfüllt alle acht Bedingungen des New-Page-Gates. Selbst F4 (`missing`) hat mit dem Haustierkamera-Vergleich einen sinnvollen Owner und lässt sich als Vergleichsabschnitt/-feld ausreichend lösen.

## 6. Existing Page Enrichments

Nur folgende substanzielle Erweiterungen sind gerechtfertigt, jeweils erst nach Primärquellenprüfung:

1. **A1** `/smarte-futterautomaten/`: modellvergleichbare Manipulations-Safeguards.
2. **B4** `/katzentrinkbrunnen-richtig-reinigen/`: Teilematrix zur Spülmaschinenfreigabe.
3. **C4** `/gps-tracker/`: aktuelle Health-/Vital-Capability-Matrix mit medizinischer Abgrenzung.
4. **D1/D2** `/katzenklappe-einbauen/`: Tunneltiefen/Verlängerungslogik und Metalltür-Adapter/Testvorgaben.
5. **D4** `/vergleiche/beste-mikrochip-katzenklappen/`: Chipstandard und offizieller Fallback.
6. **E4** `/vergleiche/beste-automatische-katzentoiletten/`: Untergrund-/Nivellierungsanforderung je Modell.
7. **F4** `/vergleiche/beste-haustierkameras/`: Multi-Camera-/App-/Abo-pro-Gerät-Felder.

Die JSON-Liste zählt D1 und D2 als getrennte Demand-Enrichments; deshalb ergeben sich dort acht Candidates.

## 7. Consolidation / Cannibalization

Es wurde keine aktuelle, belegbare Konsolidierungsempfehlung gefunden. Mehrere Seiten berühren einzelne Nodes, besitzen aber unterschiedliche Rollen (Hub, Praxisratgeber, Vergleich, Produktbeleg). Insbesondere wären neue URLs für 5-GHz-WLAN, Ausfallverhalten, alternative Streu, große Katzen, Kamera-Abo oder Cloud/Lokal klare Kannibalisierungsrisiken.

## 8. Content Breadth Assessment

Für **diese Stichprobe** besteht ein `breadth-gap-medium`: Nur 10 Nodes sind vollständig covered, 13 sind partial und einer missing. Gleichzeitig besitzen 23/24 Nodes bereits einen plausiblen Intent Owner. Daher ist nicht breite neue Seitenproduktion die richtige Reaktion; selektive Owner-Vertiefung und strukturierte Evidence sind es.

Diese Aussage gilt ausdrücklich nicht für den gesamten Markt. Die 24 externen Nodes sind eine breite, aber begrenzte Stichprobe und beweisen weder Marktsättigung noch vollständige Themenabdeckung.

## 9. Recommended Next Action

1. **P0:** Failure-Mode-Matrix phasenweise für A4/F3 beginnen; nur offizielle, modellbezogene Restfunktionen und `unknown` speichern.
2. **P0:** Litter-Compatibility-Evidence der 11 aktuellen Toiletten in normalisierte Statuswerte überführen; bestehenden Vergleich als Consumer behalten.
3. **P1:** Multi-Pet-Capability für Klappen, Futterautomaten und Toiletten normalisieren; Claims und Zuverlässigkeitsnachweis getrennt halten.
4. **P1:** Die kombinierten D1/D2-Einbaudaten und F4-Multi-Camera-Daten recherchieren und nur bestehende Owner anreichern.
5. **P2:** TCO-Komponenten zeitgestempelt erfassen; keine dauerhaften 2-/5-Jahres-Gesamtsummen publizieren.

## 10. DO NOT TOUCH

Diese Owner decken den jeweiligen Intent ausreichend ab und sollten nicht unnötig umgeschrieben oder durch neue Seiten kannibalisiert werden:

- `/vergleiche/futterautomat-mit-app/` — 5-GHz-WLAN
- `/futterautomat-bei-stromausfall/` — kombinierte Ausfalllogik
- `/katzentrinkbrunnen-ohne-filter/` — Filter-Lock-in
- `/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/` — Materialwahl
- `/reichweite-von-gps-trackern/` — Wald/schlechter Empfang
- `/vergleiche/beste-mikrochip-katzenklappen/` — große Katze/Durchgang
- `/vergleiche/beste-automatische-katzentoiletten/` — allgemeine und alternative Streukompatibilität
- `/vergleiche/beste-haustierkameras/` — Funktionen ohne Abo sowie lokal versus Cloud

Produktionsdateien, URLs, Metadaten, Links und Schemas wurden in diesem Audit nicht verändert.
