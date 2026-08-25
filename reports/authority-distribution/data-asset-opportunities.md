# Originäre Data-Asset-Kandidaten

Bewertet wurden nur Assets, deren benötigte Werte im aktuellen Repository tatsächlich vorhanden sind. Ein Score priorisiert Datenqualität/Coverage (35), Nutzerwert (20), journalistischen/Zitationswert (20), Aktualisierbarkeit (15) und kommerziellen Bezug (10), abzüglich Irreführungsrisiko. „Markt“ bedeutet bei keinem Kandidaten den Gesamtmarkt, sondern immer die explizit benannte PfotenTechnik-Auswahl.

## Priorisierung

| Rang | Kandidat | N / Coverage | Score | Priorität |
|---:|---|---:|---:|---|
| 1 | Pflichtabo bei ausgewerteten GPS-Trackern | 12/12 · 100 % | 93 | P1 |
| 2 | Gewicht und Tier-Fit von GPS-Trackern | 12/12 · 100 % | 86 | P1 |
| 3 | GPS-Systemwahl: Mobilfunk vs. VHF und Funktionsfolgen | 12/12 · 100 % | 84 | P1 |
| 4 | Hersteller-Maximalwerte zur GPS-Akkulaufzeit | 12/12 · 100 % | 78 | P2 |
| 5 | Futterart-Spektrum bei Futterautomaten | 37/37 · 100 % | 74 | P2 |
| 6 | App-Verbreitung bei Katzenklappen | 9/9 · 100 % | 72 | P2 |
| 7 | Aktuelle Angebotspreisspannen nach Produktkategorie | 79/101 · 78,2 % | 67 | P2 |
| 8 | Speicher- und Abo-Modelle von Haustierkameras | 8/8 · 100 % Text-Coverage | 63 | P3 |

Maximal drei P1 werden empfohlen. Alle P1 kommen aus GPS, weil dort erstmals Coverage, Typisierung und Vergleichbarkeit gleichzeitig hoch sind.

## 1. Pflichtabo bei ausgewerteten GPS-Trackern — 93/100 · P1

- **Fragestellung:** Wie viele der aktuell bei PfotenTechnik ausgewerteten GPS-Tracker benötigen für die reguläre Ortung ein Abo?
- **Produkte/Coverage:** N = 12; 12/12 (100 %) mit typisiertem `gps.subscriptionRequired`.
- **Benötigte Felder:** Slug, Hersteller, Produktstatus, `gps.subscriptionRequired`, Übertragung, Produkt-/Faktquelle, Stand.
- **Datenqualität:** hoch strukturell; vor Veröffentlichung einmalige feldgenaue Quellenkontrolle nötig. Aktueller Snapshot: 10 ja, 2 nein.
- **Mögliche Aussage:** „10 von 12 aktuell von PfotenTechnik ausgewerteten GPS-Trackern benötigen ein Abo; die zwei abo-freien Systeme in der Auswahl arbeiten als VHF-Systeme und sind funktional nicht 1:1 mit LTE-Trackern gleichzusetzen.“ Der zweite Halbsatz muss aus der typisierten Übertragung validiert werden.
- **Aktualisierbarkeit:** sehr hoch nach Produktänderungen; kleine Population.
- **Nutzerwert:** sehr hoch, weil Folgekosten und Systemwahl kaufentscheidend sind.
- **Journalistischer/Zitationswert:** hoch bei transparenter Produktliste und Methodik.
- **Kommerzieller Bezug:** hoch zu GPS-Vergleichen und „ohne Abo“-Intent.
- **Risiko:** Stichprobe als Marktanteil missverstehen; enthaltene Gratiszeiträume oder Tarife nicht differenziert. Gegenmittel: Population/N/Stichtag im Titel und Chart.

## 2. Gewicht und Tier-Fit von GPS-Trackern — 86/100 · P1

- **Fragestellung:** Wie verteilt sich das Gerätegewicht der ausgewerteten Tracker, und welche Modelle unterschreiten definierte Gewichtsschwellen?
- **Produkte/Coverage:** N = 12; Gewicht 12/12 (100 %), Tierart 12/12; Mindestgewicht nur 5/12 typisiert.
- **Benötigte Felder:** `deviceWeightGrams`, `weightBasis`, `animal`, optional `minimumPetWeightKg`, Befestigung.
- **Datenqualität:** hoch für Gerätegewicht; mittel für Tier-Fit, weil Mindestgewicht nur 41,7 % typisiert ist.
- **Mögliche Aussage:** Verteilung/Median und Zahl der Geräte unter transparenten Schwellen (z. B. unter 35 g). Kein pauschaler Eignungsclaim allein aus Gerätegewicht.
- **Aktualisierbarkeit:** sehr hoch.
- **Nutzerwert:** hoch, besonders für Katzen und kleine Hunde.
- **Journalistischer/Zitationswert:** hoch als nachvollziehbarer Datensatz/Chart.
- **Kommerzieller Bezug:** hoch zu kleinen Katzen-Trackern und Hundegrößen-Vergleichen.
- **Risiko:** Gewicht ohne Halterung/Halsband und ergonomische Eignung gleichsetzen. `weightBasis` und Hersteller-Mindestgewicht müssen sichtbar bleiben.

## 3. GPS-Systemwahl: Mobilfunk vs. VHF und Funktionsfolgen — 84/100 · P1

- **Fragestellung:** Welche Übertragungssysteme nutzt die PfotenTechnik-Auswahl, und wie unterscheiden sich Abo, Live-Tracking und Geofence innerhalb dieser Auswahl?
- **Produkte/Coverage:** N = 12; Übertragung, Abo, Live-Tracking und Geofence jeweils 12/12 (100 %).
- **Benötigte Felder:** `transmission`, `subscriptionRequired`, `liveTracking`, `virtualFence`, `batteryMaxDays`, Einsatzgebiet.
- **Datenqualität:** hoch strukturell; Funktionsdefinition und Systemklassen redaktionell prüfen.
- **Mögliche Aussage:** Kreuztabelle statt Siegerclaim: Systemtyp × Abo × Cloud-/Live-Funktionen.
- **Aktualisierbarkeit:** sehr hoch.
- **Nutzerwert:** sehr hoch, da Systeme unterschiedliche Einsatzfälle lösen.
- **Journalistischer/Zitationswert:** mittel–hoch; erklärender Kontext wichtiger als ein einzelner Prozentwert.
- **Kommerzieller Bezug:** hoch zu GPS-vs.-Bluetooth/VHF- und Abo-Ratgebern.
- **Risiko:** VHF und LTE anhand eines Features als „besser/schlechter“ werten. Nur Unterschiede beschreiben.

## 4. Hersteller-Maximalwerte zur GPS-Akkulaufzeit — 78/100 · P2

- **Fragestellung:** Welche Spanne und Verteilung haben dokumentierte maximale Herstellerlaufzeiten in der aktuellen Auswahl?
- **Produkte/Coverage:** N = 12; 12/12 (100 %).
- **Benötigte Felder:** `batteryMaxDays`, `batteryCondition`, Übertragung, Live-Tracking.
- **Datenqualität:** Zahl hoch; Vergleichbarkeit nur mittel, weil Bedingungen/Nutzungsmodi variieren.
- **Mögliche Aussage:** „Dokumentierte Hersteller-Maximalwerte“ als Spannweite/Verteilung, niemals „tatsächliche Akkulaufzeit“.
- **Aktualisierbarkeit:** hoch.
- **Nutzerwert:** hoch.
- **Journalistischer/Zitationswert:** mittel–hoch mit starkem Methodikhinweis.
- **Kommerzieller Bezug:** hoch zu „lange Akkulaufzeit“.
- **Risiko:** größtes Claim-Risiko aller GPS-Kandidaten. Ohne sichtbare Bedingungen nicht veröffentlichen.

## 5. Futterart-Spektrum bei Futterautomaten — 74/100 · P2

- **Fragestellung:** Wie viele Geräte der Auswahl sind für Trocken-, Nass- oder mehrere Futterarten dokumentiert?
- **Produkte/Coverage:** N = 37; 37/37 (100 %), davon 30 typisierte `foodType`-Arrays und 7 normalisierbare Texte.
- **Benötigte Felder:** `comparisonFilters.foodType`, `comparisonData.custom.futterart`, Variante, Kühlprinzip.
- **Datenqualität:** mittel–hoch nach manueller Normalisierung der sieben Textwerte.
- **Mögliche Aussage:** Verteilung nach Futterart innerhalb der Produktbasis und Zahl spezialisierter Nassfutterlösungen.
- **Aktualisierbarkeit:** hoch nach einmaliger Taxonomie.
- **Nutzerwert:** hoch.
- **Journalistischer/Zitationswert:** mittel.
- **Kommerzieller Bezug:** sehr hoch zu Trocken-/Nassfutter-Vergleichen.
- **Risiko:** Mehrfachzählung bei Multi-Food-Geräten; „geeignet“ kann technische Grenzen verdecken. Multi-Select transparent darstellen.

## 6. App-Verbreitung bei Katzenklappen — 72/100 · P2

- **Fragestellung:** Wie viele der neun ausgewerteten Katzenklappen/-türen bieten App-Funktionen?
- **Produkte/Coverage:** N = 9; 9/9 (100 %) als Boolean.
- **Benötigte Felder:** `comparisonFilters.app`, Produktklasse, Mikrochipzugang, Hub-Pflicht.
- **Datenqualität:** hoch für App ja/nein; Hub nur 3/9 bekannt, Produktklassen heterogen.
- **Mögliche Aussage:** App-Anteil innerhalb der Auswahl, getrennt nach klassischer Klappe und größerer Smart-Tiertür.
- **Aktualisierbarkeit:** hoch.
- **Nutzerwert:** mittel–hoch.
- **Journalistischer/Zitationswert:** mittel wegen kleinem N.
- **Kommerzieller Bezug:** hoch zum App-/Beuteerkennungs-Vergleich.
- **Risiko:** App-Funktion, Mikrochipzugang, Beuteerkennung und Hub-Abhängigkeit gleichsetzen. Nur App-Boolean aggregieren.

## 7. Aktuelle Angebotspreisspannen nach Kategorie — 67/100 · P2

- **Fragestellung:** Welche datierten Angebotspreisspannen und Mediane enthält der aktuelle Repository-Snapshot je Kategorie?
- **Produkte/Coverage:** 79/101 (78,2 %); Kategorie-Coverage 75–100 %.
- **Benötigte Felder:** Preis, Währung, `checkedAt`, Quelle, Verfügbarkeit, Variante/Produktklasse.
- **Datenqualität:** hoch für einzelne beobachtete Angebote; mittel/niedrig für kategoriale Vergleichbarkeit.
- **Mögliche Aussage:** Snapshot mit N/Unknown je Kategorie, Median und robusten Quantilen nach Ausreißer-/Variantenreview.
- **Aktualisierbarkeit:** hoch durch Price Intelligence; es fehlt noch Historie.
- **Nutzerwert:** hoch.
- **Journalistischer/Zitationswert:** mittel, schnell alternd.
- **Kommerzieller Bezug:** sehr hoch.
- **Risiko:** UVP/Marktpreis suggerieren, Coupons/Versand/Bundle ignorieren; Katzenklappen enthalten einen 2.016,67-€-Ausreißer aus einer anderen Türklasse. Kein Asset ohne Klassifikation und Stichtag.

## 8. Speicher- und Abo-Modelle von Haustierkameras — 63/100 · P3

- **Fragestellung:** Welche der acht Lösungen bieten lokale Speicherung, optionale Cloud-Funktionen oder Pflichtabos?
- **Produkte/Coverage:** N = 8; Speicher und Abo jeweils 8/8 als freie Texte.
- **Benötigte Felder:** `custom.speicher`, `custom.abo`, Pflichtabo, lokale Speicherung, kostenlose Grundfunktionen, Produktklasse.
- **Datenqualität:** mittel nach manueller Klassifikation; noch keine einheitlichen Booleans/Tarife.
- **Mögliche Aussage:** deskriptive Matrix, noch kein automatischer Prozentclaim.
- **Aktualisierbarkeit:** mittel; Cloudtarife ändern sich.
- **Nutzerwert:** hoch für Datenschutz/Folgekosten.
- **Journalistischer/Zitationswert:** mittel.
- **Kommerzieller Bezug:** mittel–hoch.
- **Risiko:** optionale Bezahlfunktionen als Pflichtabo werten; mobiler Roboter und feste Kamera vermischen.

## Nicht vorgeschlagen

Filterkosten von Trinkbrunnen (8/24), Abopreise von GPS-Trackern (3/12), Verbrauchsmaterialien von Katzentoiletten (1/11), Sensorik von Trinkbrunnen (6/24) und Preisaufschlag für Kamera-Futterautomaten werden noch nicht empfohlen. Trotz teilweise hoher Text-Coverage fehlen Vergleichbarkeit, typisierte Variantenregeln oder ausreichend bekannte Kostenwerte. Unknown darf den jeweiligen Nenner nicht künstlich vergrößern.
