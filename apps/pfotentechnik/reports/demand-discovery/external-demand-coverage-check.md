# External Demand → Repository Coverage Check

Stand: 26. August 2026  
Modus: read-only Audit; keine Content-, URL-, SEO-, Affiliate- oder Schema-Änderungen

## Ergebnis

Von fünf extern validierten Demand-Findings sind **2 covered** und **3 partial**. Es gibt keinen Fall, der eine neue Seite erfordert. Die sinnvollen nächsten Schritte liegen in bestehenden Intent-Ownern und Produktdaten.

| Finding | Intent Owner | Status | Manuelle Prüfung | Neue Seite |
|---|---|---:|---:|---:|
| Automatische Katzentoiletten: Streu und Verbrauchskosten | `/vergleiche/beste-automatische-katzentoiletten/` | partial | ja | nein |
| GPS-Fix ohne Mobilfunk | `/reichweite-von-gps-trackern/` | covered | nein | nein |
| Aktiv gekühlte Nassfutterautomaten bei Stromausfall | `/vergleiche/beste-futterautomaten-fuer-nassfutter/` | partial | ja | nein |
| Haustierkameras ohne Abo und Speicherort | `/vergleiche/beste-haustierkameras/` | covered | nein | nein |
| Katzenklappen: Ausgangsrechte und Tailgating | `/katzenklappen/` | partial | ja | nein |

`partial` bedeutet hier: Der richtige Owner und wesentliche Antworten existieren, aber eine belegbare Teilfrage fehlt oder widerspricht einer anderen Repository-Angabe. `fragmented` wurde nicht vergeben, weil jeder Fall einen klaren Owner besitzt; ergänzende Produktseiten sind normale Evidence-Vertiefung und kein konkurrierender Intent.

## Geprüfte Infrastruktur

Die Prüfung umfasste nicht nur Dateinamen, sondern Frontmatter, redaktionellen Body, FAQ, Decision-/Evidence-Felder, Vergleichsmatrizen und interne Links in:

- `src/content/pages`, `products`, `comparisons` und relevanten Herstellerdaten
- den Content-Schemas und `contentPlatform`
- der zentralen Vergleichsdaten-Auflösung in `src/domain/comparison`
- der internen Linklogik in `src/domain/content/internalLinks.ts`
- den Astro-Ausgaben für Produkt- und Vergleichsseiten einschließlich FAQ/JSON-LD

Die bestehende Architektur ist für diese Prüfung geeignet: Produktseiten halten modellbezogene Evidence und `comparisonData`; Vergleiche übernehmen den Evaluations-Intent; Cornerstones erklären Systemgrenzen. Es wurde kein paralleles Modell vorgeschlagen.

## 1. Automatische Katzentoiletten: Streu und laufende Verbrauchskosten

**Status: partial · Confidence: high · neue Seite: nein**

Der bestehende Vergleich ist der richtige Intent Owner. Seine Matrix weist für die Modelle Streukompatibilität, Ausschlüsse, Wartung, proprietäre Verbrauchssysteme und Folgekosten aus. Der Cornerstone erklärt zusätzlich, warum Bentonit, Tofu, Mischstreu, Pellets, Kristallstreu und Körnung nicht gleichgesetzt werden dürfen und rechnet Beutel, Filter, Deodorizer sowie optionale Dienste in die Gesamtkosten ein.

Belastbare Evidence:

- `src/content/comparisons/beste-automatische-katzentoiletten.md`: Modellmatrix mit `streu`, `wartung`, `verbrauchssystem` und `folgekosten`; dynamische Preise werden bewusst nicht dauerhaft festgeschrieben.
- `src/content/pages/automatische-katzentoiletten.md`: Streuarten, Körnung, Verbrauchsmaterial und Gesamtkostenformel.
- `src/content/products/petlibro-luma-smart-litter-box.md`: Freigaben/Ausschlüsse und Aktivkohlefilter ungefähr alle drei Monate.
- `src/content/products/neakasa-m1-plus.md`: siebfähige Klumpstreu, keine Holzpellets, gewöhnliche passende Müllbeutel.
- `src/content/products/petkit-purobot-crystal-duo.md`: proprietäre Kristallstreu und Einwegschalen.

Der Gap liegt nicht bei der Grundfrage, sondern bei der Vollständigkeit: Körnungsgrenzen und Wechselintervalle sind nicht für alle Modelle dokumentiert. Kostenarten sind vorhanden, belastbare modellbezogene Preise oder Drei-Jahres-Kosten jedoch nicht. Fehlende Angaben erscheinen nicht überall als einheitliches `unknown`.

**Empfohlene Aktion:** Den bestehenden Vergleich nach manueller Quellenprüfung um quellengebundene Felder für Körnungsgrenze, Beuteltyp, Filter/Deodorizer, dokumentiertes Wechselintervall und Kostenstatus erweitern. `unknown` muss erhalten bleiben; Preise nur mit Datum und Quelle, niemals geschätzt.

## 2. GPS-Fix ohne Mobilfunk

**Status: covered · Confidence: high · neue Seite: nein**

Der Demand ist inhaltlich vollständig und korrekt getrennt:

- `src/content/pages/reichweite-von-gps-trackern.md` beschreibt drei Ebenen: Satellit → Tracker, Tracker → Netz/Empfänger, Anzeige → Halter. Im Funkloch zeigt die App typischerweise den letzten übertragenen Punkt mit Zeitstempel; mögliche lokale Speicherung und spätere Übertragung bleiben ausdrücklich geräteabhängig.
- `src/content/pages/wie-funktionieren-gps-tracker.md` beantwortet „Was passiert ohne Mobilfunk?“ direkt: Ein Fix kann weiter möglich sein, die sofortige App-Übertragung nicht.
- `src/content/pages/gps-oder-bluetooth.md` trennt Bluetooth-Netzwerk-Tags von autonomen GPS-Systemen.
- `src/content/products/paj-pet-finder-4g-mini.md` trennt GPS, 4G, Bluetooth-Nähe und WLAN-Energiesparzone.
- `src/content/products/tractive-dog-6-xl.md` ordnet Bluetooth-Radar als begrenzte Nahbereichsfunktion ein.

**Empfohlene Aktion:** Keine Content-Aktion. Künftige Behauptungen zu gespeicherten Positionen oder Nachsynchronisierung nur produktspezifisch aus Primärquellen übernehmen.

## 3. Aktiv gekühlte Nassfutterautomaten bei Stromausfall

**Status: partial · Confidence: high · neue Seite: nein**

Die Repository-Abdeckung ist tief, aber intern nicht widerspruchsfrei:

- `src/content/pages/futterautomat-bei-stromausfall.md` trennt Steckdose, Router, Internet, Cloud, lokale Zeitpläne, Mechanik und Backup-Arten.
- `src/content/comparisons/beste-futterautomaten-fuer-nassfutter.md` trennt korrekt „öffnet das Fach?“ von „bleibt das Futter gekühlt?“ und hält aktive Kühlung für netzabhängig.
- `src/content/products/petlibro-polar-wet-food-feeder.md` dokumentiert drei AA-Batterien, die den gespeicherten Plan laut Hersteller bis zu zwölf Stunden schützen; fortgesetzte Kühlung ist nicht belegt.
- `src/content/products/petsafe-freshfeed-refrigerated-feeder.md` weist aktive Kühlung als netzabhängig aus und lässt eine nicht dokumentierte Notstromlösung offen.

Der konkrete Qualitätsfehler: Der Nassfuttervergleich sagt an einer Stelle, der Polar habe **kein dokumentiertes Batterie-Backup**. Die detailliertere Produktseite sagt das Gegenteil für den Zeitplan. Das ist nicht nur verteilte Information, sondern eine sachliche Inkonsistenz. Zusätzlich sind App, Benachrichtigung und Restfunktion je Modell nicht in einer einheitlichen Ausfallmatrix abgebildet.

**Empfohlene Aktion:** Zuerst die Polar-Angabe manuell gegen die aktuelle Herstellerquelle verifizieren und den bestehenden Vergleich konsistent machen. Anschließend dort getrennte Felder für Plan/Uhr, Öffnung/Motor, Aktivkühlung, App/Cloud, Benachrichtigung und Backup verwenden. Unbelegte Werte bleiben `unknown`.

## 4. Haustierkameras: Funktionen ohne Abo und Speicherort

**Status: covered · Confidence: high · neue Seite: nein**

Der Kamera-Vergleich beantwortet die Frage bereits modellbezogen und ohne erfundene Tarifpreise:

- `src/content/comparisons/beste-haustierkameras.md` enthält pro Modell Speicher, Abo, lokale Speicherung, Cloud-Pflicht/-Option, Pflichtabo, Bezahl- und Grundfunktionen, microSD, Tracking, Audio und Tiererkennung. Unbelegte Angaben bei Furbo Mini und Enabot werden sichtbar als nicht belastbar ausgewiesen.
- `src/content/pages/haustierkameras.md` erklärt lokale versus Cloud-Speicherung, Konto, Offline-Abhängigkeit und den wichtigen Unterschied zwischen „ohne Abo“ und „ohne Cloud“.
- `src/content/products/furbo-360-katzenkamera.md` trennt Livebild, Audio, Tracking, Treat Toss und Meowing Alert von Nanny-Verlauf, Diary und Zusatzalerts.
- `src/content/products/reolink-e1-zoom.md` dokumentiert microSD, NVR, Home Hub, FTP/NAS, optionale Cloud und lokale Tiererkennung ohne Pflichtabo.
- `src/content/products/pettec-cam-360.md` dokumentiert lokale microSD-Aufzeichnung und optionale Cloud.

**Empfohlene Aktion:** Keine neue Seite und keine unmittelbare Content-Aktion. Unbekannte Tarif-/Speicherfelder im normalen Produkt-Review nachziehen; Preise nur datiert und belegt.

## 5. Katzenklappen: individuelle Ausgangsrechte und Tailgating

**Status: partial · Confidence: high · neue Seite: nein**

Teil A, die Zugangslogik, ist vollständig abgedeckt:

- `src/content/pages/katzenklappen.md` trennt selektiven Eintritt, individuelle Ausgangsrechte, gemeinsame Sperren/Zeiten und App-/Hub-Funktionen.
- `src/content/comparisons/beste-mikrochip-katzenklappen.md` vergleicht acht Systeme nach Zugangslogik und Richtungsrechten. Standard-SureFlap, DualScan, Connect, Cat Mate Timer und OnlyCat werden nicht gleichgesetzt.
- `src/content/products/sureflap-dualscan-mikrochip-katzenklappe.md` belegt individuelle Ausgangsrechte je Tier und lokalen Betrieb.
- `src/content/products/sureflap-mikrochip-katzenklappe-connect.md` trennt lokale Klappenfunktion von Hub/App.
- `src/content/products/onlycat-mikrochip-katzenklappe.md` belegt beidseitigen Scan und individuelle zeitbasierte Richtungsregeln.

Teil B ist prinzipiell korrekt, aber nicht modellbezogen vollständig: Der Tailgating-Abschnitt im Katzenklappen-Hub sagt ausdrücklich, dass Mikrochip-Freigabe nur das erkannte Tier entriegelt und keine Luftschleuse darstellt. Er leitet aus „Mikrochip“ oder „DualScan“ keine Anti-Tailgating-Garantie ab. Für die Vergleichsmodelle fehlen jedoch einheitliche, quellengebundene Angaben zu Mechanismus, Erkennungsrichtung, Schließzeit und zwei dicht folgenden Tieren.

**Empfohlene Aktion:** Im bestehenden Mikrochip-Vergleich ein Feld `Tailgating/Schließmechanik` ergänzen, standardmäßig `unknown`. Nur ausdrücklich dokumentierte Herstellerangaben oder belastbare Testevidenz verwenden. Mikrochip, DualScan oder Beuteerkennung dürfen nie automatisch als Anti-Tailgating-Schutz gelten.

## Manuell zu prüfende Findings

1. **Polar-Backup-Widerspruch:** Produktseite versus Nassfuttervergleich gegen die aktuelle Primärquelle auflösen.
2. **Katzentoiletten-Verbrauch:** Nur dokumentierte Intervalle und datierte Preise modellbezogen ergänzen; fehlende Werte explizit unbekannt lassen.
3. **Katzenklappen-Tailgating:** Mechanische Eigenschaften nur dort ergänzen, wo Richtung, Verriegelung und Schließverhalten tatsächlich belegt sind.

## Abschluss

Die vorhandene Infrastruktur reicht für die interne Demand→Content-Zuordnung aus. Für keines der fünf Findings ist eine neue URL sinnvoll. Der kleinste wertvolle Folgeschritt ist eine **read-only Konsistenzprüfung für strukturierte Vergleichswerte gegen die verlinkten Produktdaten**, beginnend mit dem Polar-Backup. Sie würde einen realen Fehler sichtbar machen, ohne Inhalte automatisch zu ändern.

Nicht automatisieren: Contentänderungen, neue Seiten, SEO-Metadaten, Affiliate-Änderungen oder das Auffüllen unbekannter Werte. Insbesondere dürfen nicht dokumentierte Kosten nicht geschätzt und Mikrochip-Funktionen nicht zu Sicherheitsgarantien hochgerechnet werden.
