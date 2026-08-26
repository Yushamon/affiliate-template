# External Demand Evidence Repair

Stand: 26. August 2026  
Scope: ausschließlich die drei im Coverage-Audit als `partial` eingestuften Findings; keine neue Seite

## Ergebnis

| Bereich | Ergebnis |
|---|---|
| PETLIBRO Polar | Konflikt aufgelöst; Zeitplan-Backup und aktive Kühlung sauber getrennt |
| Automatische Katzentoiletten | 11 Repository-Produkte geprüft; 1 Produkt mit neuen belastbaren Daten verbessert |
| Mikrochip-Katzenklappen | 8 relevante Klappen geprüft; 3 Produkte mit modellbezogener Locking-/Tailgating-Evidence verbessert |
| Neue Seiten | 0 |

## P0: PETLIBRO Polar PLAF109

### Primärquellen

- [PETLIBRO Produktseite PLAF109](https://petlibro.com/products/polar-wet-food-pet-feeder), geprüft am 26.08.2026
- [PETLIBRO Polar Support](https://petlibro.com/pages/faq-product/polar-smart-wet-food-feeder), geprüft am 26.08.2026
- [PETLIBRO Support zur Offline-Meldung](https://petlibro.com/pages/what-should-i-do-if-i-dont-want-to-receive-any-offline-notifications-after-i-unplug-the-polar-wet-food-feeder), geprüft am 26.08.2026
- [PETLIBRO Support zur manuellen Öffnung](https://petlibro.com/pages/how-could-i-manually-feed-my-pet-is-there-any-feeding-button-on-the-polar-wet-food-feeder), geprüft am 26.08.2026

### Vorheriger Konflikt

- `src/content/products/petlibro-polar-wet-food-feeder.md` dokumentierte drei AA-Batterien und bis zu zwölf Stunden Schutz des Fütterungsplans.
- `src/content/comparisons/beste-futterautomaten-fuer-nassfutter.md` behauptete, für den Polar sei kein Batterie-Backup dokumentiert.

### Verifizierter Sachstand

| Teilfrage | Belegbarer Stand |
|---|---|
| Backup-Stromversorgung | drei AA-Batterien, nicht enthalten |
| Dauer | bis zu 12 Stunden bei Stromausfall |
| gespeicherter Plan | PETLIBRO sagt ausdrücklich, dass der Fütterungsplan weiterläuft |
| Motor/Fachöffnung | nicht als eigenständige Backup-Funktion spezifiziert; aus „Plan läuft weiter“ wurde keine umfassendere Motorgarantie abgeleitet |
| aktive Kühlung | benötigt den 12-V-/5-A-Netzanschluss; nicht als batteriebetrieben dokumentiert |
| WLAN | nicht als Backup-Funktion dokumentiert |
| App-Steuerung | nicht als Backup-Funktion dokumentiert; spontane Öffnung hat keine physische Taste und erfolgt regulär über die App |
| Benachrichtigungen | PETLIBRO dokumentiert eine Offline-Meldung nach dem Trennen vom Strom; eine fortlaufende Übertragung weiterer Meldungen während des Ausfalls ist nicht zugesagt |

Geändert wurden die widersprüchlichen Vergleichsaussagen sowie die Produkt-FAQ und strukturierten Custom-Daten. Der Wortlaut bleibt absichtlich enger als „alle Fütterungsfunktionen laufen weiter“.

Geänderte Dateien:

- `src/content/products/petlibro-polar-wet-food-feeder.md`
- `src/content/comparisons/beste-futterautomaten-fuer-nassfutter.md`

## P1: Automatische Katzentoiletten

### Untersuchte Produkte

Geprüft wurden alle elf im Repository vorhandenen Modelle:

- Devoko 90L
- Litter-Robot 4
- Litter-Robot 5 Pro
- Neakasa M1 Lite
- Neakasa M1 Plus
- PETKIT PuraMax 2
- PETKIT PUROBOT Crystal Duo
- PETKIT PUROBOT MAX 3
- PETKIT PUROBOT MAX PRO 2
- PETLIBRO Luma
- PetSnowy SNOW+

Es wurde keine pauschale Webrecherche für jedes Produkt erzwungen. Priorisiert wurden Modelle mit bereits guten Herstellerunterlagen. Luma und Neakasa besitzen bereits brauchbare Angaben zu Streu, Ausschlüssen, Beuteln oder Filterintervallen. Für PETKIT sind proprietäre Systeme und modellbezogene Streugrenzen teilweise bereits erfasst. Ohne neue belastbare Primärquellen blieben diese Dateien unverändert.

### Neu belegte Daten: Litter-Robot 4

Offizielle Whisker-Unterlagen belegen nun im Produktdatensatz:

- empfohlen: standardgewichtige, klumpende Tonstreu;
- teilweise möglich: Silikakristalle, wenn sie durch das Sieb passen;
- ungeeignet: nichtklumpende/lose klumpende, papierbasierte, absorbierende Holzpellet- und viele pflanzliche Streus;
- keine feste minimale oder maximale Körnung veröffentlicht;
- proprietäre Whisker-Einlagen sind nicht nötig: transparente oder weiße Müllbeutel mit 30–49 Litern funktionieren;
- dunkle Beutel können die Füllstandsmessung beeinträchtigen;
- Aktivkohlefilter oder OdorTrap sind für den Betrieb optional;
- Aktivkohlefilter hält unter normalen Bedingungen ungefähr einen Monat beziehungsweise wird nach Bedarf gewechselt.

### Kosten

Es wurde keine laufende Kostenrechnung erzeugt. Zwar ist das Filterintervall belastbar, für den relevanten deutschen/EU-Kontext lag in der geprüften Primärquelle keine ausreichend stabile, datierte Preisgrundlage für denselben Verbrauchsdatensatz vor. Daher bleibt:

`laufende Kosten = unknown`

Auch bei allen anderen Modellen gilt: Ohne zugleich belegten Preis und belegtes Intervall keine Rechnung. Händlerpreise und implizite Nutzungsannahmen wurden nicht eingesetzt.

### Weiterhin unbekannt

- vollständige modellübergreifende Körnungsgrenzen;
- Filter-/Deodorizer-Intervalle vieler PETKIT-, Neakasa-, Devoko- und PetSnowy-Modelle;
- belastbare laufende Kosten, sobald Preis oder Intervall fehlt;
- reale Streuverbrauchsmengen, weil diese von Katze, Streu und Nutzung abhängen.

### Sinnvolles, nicht implementiertes Datenfeld

Ein normalisiertes Objekt für `consumables` mit Quellenstatus, `known/unknown/not-applicable`, Preisdatum und Intervallbasis wäre langfristig sinnvoll. Es wurde bewusst weder Schema noch neue Architektur eingeführt; die belegten Werte passen derzeit in bestehende `specs`, `comparisonData.custom` und `evidenceSources`.

Geänderte Datei:

- `src/content/products/litter-robot-4.md`

## P1: Mikrochip-Katzenklappen und Tailgating

### Untersuchte Modelle

Geprüft wurden die acht Klappenmodelle des bestehenden Mikrochip-Vergleichs:

- SureFlap Mikrochip Katzenklappe
- SureFlap DualScan
- SureFlap Connect
- PetSafe Mikrochip Katzenklappe
- PetSafe Petporte smart flap
- OnlyCat
- petWALK Medium
- Cat Mate Elite 355W

ZeroMouse wurde als Zusatzgerät, nicht als eigenständige Mikrochip-Klappe, nicht in die Locking-Matrix aufgenommen.

### Neu belegte modellbezogene Evidence

| Modell | Chip-/Verriegelungslogik | Wiederverriegelung | Tailgating-Schutz |
|---|---|---|---|
| SureFlap DualScan | Chipprüfung auf beiden Seiten; individuelle Richtungsrechte | exakter Zeitpunkt in der geprüften Produkt-/Supportdokumentation nicht angegeben | nicht dokumentiert |
| SureFlap Connect | im Standardbetrieb beidseitig verriegelt; autorisierter Chip wird auf der jeweiligen Seite gelesen | laut Handbuch wieder beidseitig verriegelt, sobald die Katze vollständig passiert hat | nicht dokumentiert; keine mechanische Vereinzelung zugesagt |
| PetSafe Mikrochip | selektive Prüfung beim Annähern von außen; verstärkte doppelte Auto-Verriegelung | exakter Zeitpunkt nicht dokumentiert | nicht dokumentiert |

Für Cat Mate 355W ist offiziell selektiver Eintritt und eine gemeinsame Zeit-/Vier-Wege-Regel belegt, aber kein Anti-Tailgating-Mechanismus. Für Standard-SureFlap, Petporte, OnlyCat und petWALK wurden ohne eine ebenso klare aktuelle technische Passage keine neuen Locking-Details ergänzt.

### Nicht belegbare Aussagen

Nicht belegt und deshalb nicht behauptet werden:

- eine Mikrochip-Klappe bilde eine Luftschleuse;
- „DualScan“ verhindere das direkte Folgen eines zweiten Tieres;
- ein doppelter Riegel sei automatisch Anti-Tailgating-Technik;
- Beuteerkennung bei OnlyCat sei gleichbedeutend mit mechanischer Vereinzelung;
- eine nicht genannte Schließzeit könne aus Videos oder Marketingformulierungen geschätzt werden.

Geänderte Dateien:

- `src/content/products/sureflap-dualscan-mikrochip-katzenklappe.md`
- `src/content/products/sureflap-mikrochip-katzenklappe-connect.md`
- `src/content/products/petsafe-mikrochip-katzenklappe.md`

## Bewusst nicht geändert

Die zwei bereits als `covered` bewerteten Findings blieben unangetastet:

- GPS-Fix ohne Mobilfunk
- Haustierkameras ohne Abo und Speicherort

Ebenfalls unverändert blieben alle Produktdateien, für die die geprüften Primärquellen keine belastbare zusätzliche Aussage erlaubten. Es wurden keine neuen Seiten, URLs, SEO-Metadaten, Affiliate-Ziele, Redirects, Canonicals oder Schemas erzeugt.

## Tatsächlich geänderte Dateien

1. `src/content/products/petlibro-polar-wet-food-feeder.md`
2. `src/content/comparisons/beste-futterautomaten-fuer-nassfutter.md`
3. `src/content/products/litter-robot-4.md`
4. `src/content/products/sureflap-dualscan-mikrochip-katzenklappe.md`
5. `src/content/products/sureflap-mikrochip-katzenklappe-connect.md`
6. `src/content/products/petsafe-mikrochip-katzenklappe.md`
7. `reports/demand-discovery/external-demand-evidence-repair.md`
8. `reports/product-data-audit.md` (durch gezielte Validierung aktualisiert)
9. `reports/product-data-audit.json` (durch gezielte Validierung aktualisiert)
10. `reports/comparison-platform/comparison-data-platform.md` (durch gezielte Validierung aktualisiert)
11. `reports/comparison-platform/comparison-data-platform.json` (durch gezielte Validierung aktualisiert)

## Validierung

- `npm run audit:products`: bestanden; 101 Produkte, 0 Fehler, 0 doppelte Slugs. Die 96 repositoryweiten Warnungen bestanden bereits als dokumentierter Handlungsbestand und blockieren diesen Repair nicht.
- `npm run lint:content`: bestanden; 82 Dateien, 0 Fehler. Die ausgegebenen 234 repositoryweiten redaktionellen Warnungen liegen außerhalb dieses engen Evidence-Scopes.
- `npm run comparison:data:audit`: bestanden; 28 Vergleiche, 92,7 % Quellabdeckung und 100 % gerenderte Abdeckung.
- `git diff --check`: bestanden.

Ein Build wurde nicht ausgeführt: Es wurden weder Schema, Komponenten, Routen noch Renderinglogik geändert; die Content- und Vergleichsaudits prüfen die betroffenen Strukturen gezielter.
