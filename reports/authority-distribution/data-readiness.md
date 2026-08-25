# Authority & Distribution – Data Readiness

Stand: 25.08.2026. Scope: alle 101 Markdown-Produktdatensätze unter `apps/pfotentechnik/src/content/products`. Maschinenlesbare Details stehen in `data-readiness.json`.

## Kurzurteil

Ja: Für mindestens ein belastbares originäres Data Asset reicht der Bestand bereits. Der beste erste Datensatz ist die Abo-Pflicht der zwölf im Repository geführten GPS-Tracker: `gps.subscriptionRequired` ist für 12/12 Produkte als Boolean befüllt. Im aktuellen Snapshot sind 10 `true` und 2 `false`. Die zulässige Aussage lautet daher: **„10 von 12 aktuell bei PfotenTechnik ausgewerteten GPS-Trackern benötigen ein Abo.“** Sie ist keine Aussage über Marktanteile oder alle in Deutschland verfügbaren Tracker.

Die nächste Reifestufe ist bei GPS ebenfalls gut: Gerätegewicht, maximale Hersteller-Akkulaufzeit, Übertragung, Live-Tracking und virtuelle Zäune liegen jeweils für 12/12 typisiert vor. Für Akkulaufzeit muss die Bedingung der Herstellerangabe mitgeführt werden; sie darf nicht als gemessene Laufzeit erscheinen.

Außerhalb GPS ist die inhaltliche Coverage häufig hoch, die Aggregationsreife aber deutlich niedriger. Der Grund ist nicht fehlender Inhalt, sondern freie Textsemantik in `specs` und `comparisonData.custom`, geringe Zahl typisierter Werte sowie überwiegend produkt- statt feldgenaue Quellenzuordnung.

## Messmethode

- Nenner ist immer die jeweilige Repository-Kategorie, nicht „der Markt“.
- Als bekannt zählt nur ein expliziter Wert. `unknown`, `unbekannt`, `nicht ausgewiesen`, `nicht dokumentiert`, `keine Angabe`, leere Werte und fehlende Felder wurden ausgeschlossen.
- Ein explizites `false` ist bekannt und bleibt `false`. Fehlend/unknown wird niemals zu `false`, `0` oder „nicht vorhanden“.
- Es wurde ausschließlich Frontmatter ausgewertet. Markdown-Fließtext wurde nicht in Fakten umgewandelt.
- Coverage beschreibt Vorhandensein, nicht automatisch Vergleichbarkeit oder Wahrheit.
- Preis ist ein datierter Angebots-Snapshot, kein Listenpreis und kein vollständiger Marktpreis.

## Bestand

| Kategorie | N | Preis bekannt | Charakter der Vergleichsdaten |
|---|---:|---:|---|
| Futterautomaten | 37 | 28 (75,7 %) | hohe Text-Coverage, wenig Typisierung |
| Trinkbrunnen | 24 | 18 (75,0 %) | hohe Text-Coverage, Einheiten/Semantik uneinheitlich |
| GPS-Tracker | 12 | 9 (75,0 %) | zentrale GPS-Felder vollständig typisiert |
| Automatische Katzentoiletten | 11 | 9 (81,8 %) | Sicherheits-/Kostenbeschreibungen, kaum quantitative Typisierung |
| Katzenklappen | 9 | 7 (77,8 %) | App vollständig typisiert; Rest überwiegend Text |
| Haustierkameras | 8 | 8 (100 %) | kleine, heterogene Produktklasse |
| Gesamt | 101 | 79 (78,2 %) | 100 mit `comparisonData`, aber nicht einheitlich typisiert |

Preisspannen im Snapshot (nur bekannte Preise, ohne Bereinigung): Futterautomaten 31,34–219,99 €, Trinkbrunnen 27,99–269,99 €, GPS 44,99–312,89 €, Katzentoiletten 169–799 €, Katzenklappen 66,99–2.016,67 €, Haustierkameras 59,46–199 €. Diese Rohspannen sind noch kein publizierbares Asset: Varianten, Bundles, Produktklassen, Versand, Coupons und Ausreißer müssen vorab geprüft werden.

## Feldmatrix

### GPS-Tracker (N = 12)

| Feld | Coverage | Typ | Quelle | Confidence | Aktualität | Vergleichbarkeit | Normalisierung | Ready |
|---|---:|---|---|---|---|---|---|---|
| Kaufpreis | 9/12 · 75 % | Zahl/EUR | `price` | hoch für Angebot | `checkedAt` | mittel | Variante/Angebot | bedingt |
| Abo erforderlich | 12/12 · 100 % | Boolean | `gps.subscriptionRequired` | hoch | kein Feld-Datum | hoch | keine | ja |
| Abopreis | 3/12 · 25 % | Tarif-Text | `specs` | mittel | kein Feld-Datum | niedrig | Plan, Laufzeit, Periode, Inklusivzeit | nein |
| Akkulaufzeit max. | 12/12 · 100 % | Zahl/Tage | `gps.batteryMaxDays` | hoch als Herstellermaximum | kein Feld-Datum | mittel | `batteryCondition` verpflichtend | bedingt |
| Gerätegewicht | 12/12 · 100 % | Zahl/g | `gps.deviceWeightGrams` | hoch | Produktdatum | hoch | `weightBasis` prüfen | ja |
| Übertragung | 12/12 · 100 % | Enum | `gps.transmission` | hoch | Produktdatum | hoch | LTE/VHF getrennt | ja |
| Live-Tracking | 12/12 · 100 % | Boolean | `gps.liveTracking` | hoch | Produktdatum | mittel–hoch | Definition/Intervall | ja |
| Geofence | 12/12 · 100 % | Boolean | `gps.virtualFence` | hoch | Produktdatum | hoch | GPS vs. lokale Zone | ja |
| App | 12/12 · 100 % | Text | `specs`/custom | mittel | Produktdatum | mittel | nullable Boolean | bedingt |

### Futterautomaten (N = 37)

| Feld | Coverage | Typisierung | Vergleichbarkeit | Hauptproblem | Ready |
|---|---:|---:|---|---|---|
| Preis | 28 · 75,7 % | vollständig numerisch | mittel | Angebote/Varianten | bedingt |
| Kapazität | 36 · 97,3 % | 8 typisiert | mittel | Liter, Fächer, nominal/nutzbar | bedingt |
| Kamera | 33 · 89,2 % | 3 Boolean | mittel | „je nach Variante“ und freie Texte | nein |
| App | 35 · 94,6 % | 3 Boolean | mittel | optional/erforderlich/Variante | nein |
| Stromversorgung | 34 · 91,9 % | Text | mittel | Netz/USB/Batterie/Akku/Hybrid | nein |
| Batteriebackup | 12 · 32,4 % | 3 Boolean | niedrig–mittel | Backup-Funktion und Dauer | nein |
| Futterart | 37 · 100 % | 30 Arrays | hoch nach Mapping | Trocken/Nass/Frisch/gefriergetrocknet | bedingt |
| Tierzahl/Eignung | 37 · 100 % | Text | niedrig | „geeignet für“ ist keine Tierzahl | nein |
| Portionssteuerung | 28 · 75,7 % | 6 numerisch | niedrig–mittel | g/ml/Herstellereinheit, min/max | nein |

### Trinkbrunnen (N = 24)

| Feld | Coverage | Typisierung | Vergleichbarkeit | Hauptproblem | Ready |
|---|---:|---:|---|---|---|
| Preis | 18 · 75 % | numerisch | mittel | Angebot/Variante | bedingt |
| Volumen | 22 · 91,7 % | 2 numerisch | mittel | nominal/nutzbar/Frisch-/Gesamtvolumen | nein |
| Filter | 23 · 95,8 % | Text | mittel | klassisch, Vorfilter, Ultrafiltration, filterlos | nein |
| Filterkosten | 8 · 33,3 % | Text | niedrig | Packung, Preisdatum, Intervall | nein |
| Material | 24 · 100 % | 2 Arrays | mittel | Trinkfläche vs. Tank vs. Gehäuse | bedingt |
| Stromversorgung | 21 · 87,5 % | Text | mittel | Netz/USB/Akku/Hybrid | nein |
| Akku/kabellos | 21 · 87,5 % | 2 Boolean | niedrig–mittel | Pumpenakku vs. Backup vs. kabelloser Tank | nein |
| App | 23 · 95,8 % | 4 Boolean | mittel | nullable Boolean/Konnektivität | nein |
| Sensorik | 6 · 25 % | 1 Boolean | niedrig | Bewegung, Wasserstand, Trinkmenge, Tier-ID vermischt | nein |

### Automatische Katzentoiletten (N = 11)

| Feld | Coverage | Typisierung | Vergleichbarkeit | Hauptproblem | Ready |
|---|---:|---:|---|---|---|
| Preis | 9 · 81,8 % | numerisch | mittel | Bundle/Variante | bedingt |
| Abmessungen | 7 · 63,6 % | Text | niedrig–mittel | H/B/T, Außenmaß/Innenraum/Stellfläche | nein |
| Gewicht | 5 · 45,5 % | Text | mittel | leer vs. befüllt | nein |
| App | 7 · 63,6 % | 3 Boolean | mittel | missing ≠ false | nein |
| Mehrkatzenfähigkeit | 6 · 54,5 % | Text | niedrig–mittel | Kapazität ≠ individuelle Erkennung | nein |
| Folgekosten | 10 · 90,9 % | Text | niedrig | Beutel/Streu/Filter/Abo/Zubehör | nein |
| Verbrauchsmaterial | 1 · 9,1 % | Text | niedrig | kein kontrolliertes Modell | nein |
| Sicherheitsfunktionen | 11 · 100 % | Text | niedrig | dokumentierte Funktion ≠ Wirksamkeitsnachweis | nein |

### Katzenklappen (N = 9)

| Feld | Coverage | Typisierung | Vergleichbarkeit | Hauptproblem | Ready |
|---|---:|---:|---|---|---|
| Preis | 7 · 77,8 % | numerisch | niedrig–mittel | Türklasse, Hub, Einbau, Ausreißer | bedingt |
| Mikrochip | 8 · 88,9 % | Enum | hoch | eine andere Smart-Türklasse separat halten | ja |
| App | 9 · 100 % | Boolean | hoch | App ≠ lokale Smart-Funktion | ja |
| Hub erforderlich | 3 · 33,3 % | Text | mittel | Bundle und Pflicht getrennt | nein |
| Stromversorgung | 9 · 100 % | Text | mittel | Batterie/Netz/USB/Hybrid | bedingt |
| Tierprofile | 8 · 88,9 % | Text-Proxy | niedrig | Rechte sind keine Profilanzahl | nein |
| selektiver Ein-/Ausgang | 8 · 88,9 % | Text | mittel | einseitig vs. je Tier bidirektional | nein |

### Haustierkameras (N = 8)

| Feld | Coverage | Typisierung | Vergleichbarkeit | Hauptproblem | Ready |
|---|---:|---:|---|---|---|
| Preis | 8 · 100 % | numerisch | mittel | feste Kamera vs. mobiler Roboter | bedingt |
| Kamera-/Videoklasse | 8 · 100 % | 4 Boolean + Text | niedrig–mittel | Klassen und Auflösung | nein |
| App | 4 · 50 % | Boolean | hoch, aber lückenhaft | missing ≠ false | nein |
| Speicher | 8 · 100 % | Text | mittel | microSD/Cloud/Aufbewahrung | bedingt |
| Abo | 8 · 100 % | Text | mittel | Pflichtabo vs. optionale Bezahlfunktionen | bedingt |

## Quellen- und Confidence-Befund

- `testStatus`: 54 `editorial-review`, 47 `manufacturer-data`, 0 `hands-on`, 0 `long-term-test`.
- `editorial` mit `testedHandsOn`, Evidenzart und `lastVerifiedAt`: 32/101 (31,7 %).
- `evidenceSources` mit Quellen/Feldreferenzen: 35/101 (34,7 %).
- `externalEvidence`: 100/101 (99 %), aber professionelle Reviews/Nutzersignale belegen nicht automatisch jedes technische Feld.
- Der vorhandene Product-Evidence-Report ist veraltet (99 Produkte) und meldet 71 vollständige/28 partielle Datensätze; er muss vor Verwendung gegen 101 Produkte neu erzeugt werden.
- Herstellerdateien: 32/32 haben `sources`, aber nur 2/32 ein `evidenceSources`-Modell. Hersteller-Fließtext und allgemeine Markenbewertung sind nicht feldgenau aggregierbar.

Confidence muss künftig am Wert hängen, nicht nur am Produkt. Empfohlen ist kein zweites Produktmodell, sondern eine additive, optionale Feld-Provenienz (`factMeta`/Evidence-Referenz) direkt am bestehenden Produktdatensatz oder als aus ihm erzeugter Read-Model-Snapshot.

## Was strukturiert vorliegt

- Identität, Kategorie, Hersteller, Status, Preisquelle/-zeit, redaktionelle Stati und Produktbeziehungen.
- GPS-Kernfelder als stark typisiertes Objekt.
- App/Kamera/Zugang/Backup und einzelne quantitative Werte teilweise in `comparisonFilters`.
- Breite Vergleichsdaten in `comparisonData`, jedoch überwiegend als freie `custom`-Strings.
- Produktquellen, externe Reviews und Consensus teilweise/weitgehend strukturiert.
- 32 Herstellerdatensätze mit `sources`, Produktzuordnungen, Serien und Aktualisierungsdatum.
- Content Graph, Search-Dashboards, Research Store, SEO-Copilot-Workspace sowie Audit-Reports.

## Was nur als Markdown-/Freitext vorliegt

- Viele Spezifikationen in `specs[].value` und `comparisonData.custom`.
- Abopreise, Verbrauchskosten, Filterpreise, Sicherheitswirksamkeit, Variantenbedingungen und reale Nutzung meist als Text.
- `strengths`, `weaknesses`, `decision`, `review`, `experience`, FAQ und Body-Text sind redaktionelle Aussagen, keine Aggregationsfelder.
- Herstellerprofile enthalten qualitative Einordnung; `sources` beziehen sich überwiegend auf das Dokument, nicht auf einzelne Werte.

## Nicht automatisiert als Fakt verwenden

- Fehlend/unknown als Nein, 0 oder „nicht vorhanden“.
- Hersteller-Maximalwerte als eigene Messwerte oder „tatsächliche“ Werte.
- `rating`, `score`, Stärken/Schwächen als objektive Messergebnisse.
- Sicherheitsfunktionen als Beweis tatsächlicher Sicherheit.
- Markenweite Nutzerbewertungen als produktspezifische Werte.
- Produkt-/Variantenangaben auf ähnliche Modelle übertragen.
- Merchant-Angebote als UVP, dauerhaften Preis oder vollständigen Marktpreis.
- `productStatus: unknown` als aktiv oder eingestellt.
- Jegliche Behauptung eigener Tests: Kein Datensatz ist aktuell als `hands-on` gekennzeichnet.

## Readiness-Gate für Findings

Ein Finding darf nur `validated` werden, wenn Population, Stichtag und Inklusionsregel feststehen; jedes verwendete Feld explizit bekannt ist; Einheiten und Semantik normalisiert sind; Hersteller-/Händler-/Independent-/Hands-on-Provenienz erhalten bleibt; Coverage und N im Satz oder Begleitmaterial stehen; unbekannte Werte im Nenner nicht heimlich als Nein zählen; Ausreißer/Varianten geprüft sind; und ein menschlicher Review die genaue Aussage freigibt.
