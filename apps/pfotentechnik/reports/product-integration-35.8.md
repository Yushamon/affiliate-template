# PfotenTechnik 35.8 – Integrationsbericht

Stand: 2026-11-16. Kein Merge, kein Deployment.

Zwei neue GPS-Produkte sind freigegeben, zwei PETLIBRO-Modelle bleiben unveröffentlichte Kandidaten. Drei Bestandsprodukte wurden aktualisiert. Sieben Preisprüfungen erfolgreich. 24 Fullpage-Screenshots: ausschließlich 375/1600 Pixel in Light/Dark.

## Schutzregeln und Befunde

- Experiment 35.5: 20 gerenderte Seiten einschließlich ausgehender Links und 205 eingehende Linkkanten exakt unverändert.
- Entscheidungshinweise: 73 Produkte/437 Originaltexte bleiben erhalten; Freigabeliste leer, automatischer Fallback unverändert.
- Granary 2 AF105: probeweise Vergleichsaufnahme entfernte einen bestehenden Link zur Pawsync-Kontrollseite. Änderung zurückgenommen; Kandidat bleibt gesperrt.
- Vision Duo: Kamera-/Mehrtiervergleiche haben weniger als zehn geeignete Produkte. Keine unpassenden Füllprodukte ergänzt.
- MOVA und SATELLAI erscheinen über die bestehende explizite Vergleichszuordnung automatisch in der sichtbaren Produktauswahl des Hundevergleichs (12 Produkte). Bestehende Gewinnerregeln bleiben erhalten.
- Bilder: direkte öffentliche Downloads nach ausdrücklicher Betreiberfreigabe. Quellen, genaue Modellidentität, Abrufdatum und SHA-256 je Datei dokumentiert; keine Drittlizenz oder API-Berechtigung behauptet.
- Invoxia: alte angefragte ASIN lieferte eine andere primäre Kaufvariante. Nur die direkt bestätigte Edition 2026 mit Max-GPS-Jahrespaket (B0H4QZMTSY, 219 EUR) übernommen. Kein Bestandsstatus aus einem Preis allein abgeleitet.
- DOG 6: Amazon-Seite überschritt das bisherige Abruflimit; begrenzte 5-MB-Ausnahme nur für bekannte Amazon-Hosts, sonst weiterhin 2,5 MB.

## Tests und Reproduktion

Historischer Prüfstand aus 35.8.1: 390 Build-Seiten und 145 bestandene Tests. Aktuelle Freshness-Änderungen und deren Validierung stehen in product-freshness-36.0.md. Der vorliegende Datenexport wird gegen den aktuellen Build geprüft.

Die maschinenlesbaren Details, Quellen und Feldzuordnungen stehen in [product-integration-35.8.json](product-integration-35.8.json). Der Browser prüft Galerie öffnen/weiter/schließen, Bilder, Überlauf, Preise, Kaufziele, Canonical und Robots in 24 Fällen. Cockpit-Tests prüfen echte API-Routen, atomare Speicherung, Versionskonflikte, Kriterienberechnung und eine manuelle Preisänderung bis in die echte Kaufkomponente. Der öffentliche Datenbestand übernimmt Änderungen beim nächsten statischen Build.

```sh
npm run integrate:products:media
npm run integrate:products
node scripts/product-integration/run.mjs --refresh
PFOTENTECHNIK_DRAFT_PREVIEW=1 npm run build -- --outDir /tmp/pt358/preview-dist
npm run build
node scripts/product-integration/browser.mjs --draft-dist=/tmp/pt358/preview-dist
npm run audit:decision-facts
npm run report:product-integration
npm run test:product-integration
```

Die vier neuen Modelle verwenden ausdrücklich geprüfte Alternativen statt ungeprüfter Volltext-Zuordnungen. Bei der Sichtprüfung wurde ein falscher Nassfutter-Hinweis der alten automatischen Alternativen erkannt; die automatische Auswahl bestehender Produkte bleibt unverändert. Die PNG-Screenshots sind lokale QA-Artefakte; JSON-Metadaten enthalten ihre Prüfsummen.

Die Integration legt nur fehlende Kandidatendateien an; bestehende redaktionelle Kandidaten werden nicht automatisch überschrieben. Preisprüfungen verwenden die bestehenden Dienste. Der explizite QA-Build erzeugt noindex-Entwurfsvorschauen; der reguläre Build enthält diese Routen nicht.

## PETLIBRO Granary 2 Vision Duo

- Status: **unpublished-candidate**. Reservierte Zielroute, öffentlich nicht gebaut: https://pfotentechnik.de/produkt/petlibro-granary-2-vision-duo/
- Modell: AF205-D; Handbuch PLAF205 / 6216205; MPN/SKU: PL-AF205-32B.
- Amazon: Amazon.de gezielt geprüft; Suchantworten nicht auswertbar/Blockseite. Keine bestätigte exakte ASIN gefunden. Dies beweist nicht, dass keine Amazon-Listung existiert.
- Preis: 289.99 EUR bei petlibro; Prüfung 2026-11-16T10:39:59.126Z; Verfügbarkeit available.
- Bilder: manufacturer-product-image; Herkunft und Prüfsummen: [Nachweis](../src/assets/images/products/petlibro-granary-2-vision-duo/media-provenance-35.8.json).
- Cockpit: [Produktpflege](https://pfotentechnik.de/admin/seo/products/petlibro-granary-2-vision-duo/); bestehende Preis-/Angebotsverwaltung und neuer allgemeiner Editor für Kriterien, Quellen, Status und Datum.
- Bewertung: 65/100. Redaktionelle Eignungsbewertung, kein Praxistest. Bedienung 3,5/5 für App-Fütterung mit Einrichtungsaufwand; Portionierung 3,5/5 für dokumentierte Wiegefunktion ohne eigene Präzisionsmessung; Reinigung 3,0/5 wegen Napf, Auslass und Behälter; Folgekosten 3,0/5 wegen optionaler Cloud-/Care-Funktionen. Vier Kriterien gleich gewichtet; keine Preisvariable und keine fremden Testnoten als eigene Messung.
- Verlinkung: Verknüpfungen im Entwurf vorbereitet; keine öffentliche Listung.
- Vergleiche: keine zusätzliche öffentliche Vergleichsaufnahme.
- Visuelle/Funktionsprüfung: 4 Fälle bestanden.
  - [375 light dark](product-integration-35.8/petlibro-granary-2-vision-duo-375-light.png)
  - [375 light dark](product-integration-35.8/petlibro-granary-2-vision-duo-375-dark.png)
  - [1600 light dark](product-integration-35.8/petlibro-granary-2-vision-duo-1600-light.png)
  - [1600 light dark](product-integration-35.8/petlibro-granary-2-vision-duo-1600-dark.png)
- Offene Probleme: Die zugehörigen Kamera-/Mehrtiervergleiche enthalten derzeit weniger als zehn fachlich zugeordnete sichtbare Produkte; keine künstlichen Füllprodukte ergänzt.

## PETLIBRO Granary 2

- Status: **unpublished-candidate**. Reservierte Zielroute, öffentlich nicht gebaut: https://pfotentechnik.de/produkt/petlibro-granary-2/
- Modell: AF105; Handbuch PLAF105 / 6216105; MPN/SKU: PL-AF105-31B.
- Amazon: Amazon.de gezielt geprüft; Suchantworten nicht auswertbar/Blockseite. Keine bestätigte exakte ASIN gefunden. Dies beweist nicht, dass keine Amazon-Listung existiert.
- Preis: 169.99 EUR bei petlibro; Prüfung 2026-11-16T10:39:59.323Z; Verfügbarkeit available.
- Bilder: manufacturer-product-image; Herkunft und Prüfsummen: [Nachweis](../src/assets/images/products/petlibro-granary-2/media-provenance-35.8.json).
- Cockpit: [Produktpflege](https://pfotentechnik.de/admin/seo/products/petlibro-granary-2/); bestehende Preis-/Angebotsverwaltung und neuer allgemeiner Editor für Kriterien, Quellen, Status und Datum.
- Bewertung: 65/100. Redaktionelle Eignungsbewertung, kein Praxistest. Bedienung 3,5/5 für App-Fütterung mit Einrichtungsaufwand; Portionierung 3,5/5 für dokumentierte Wiegefunktion ohne eigene Präzisionsmessung; Reinigung 3,0/5 wegen Napf, Auslass und Behälter; Folgekosten 3,0/5 wegen optionaler Cloud-/Care-Funktionen. Vier Kriterien gleich gewichtet; keine Preisvariable und keine fremden Testnoten als eigene Messung.
- Verlinkung: Verknüpfungen im Entwurf vorbereitet; keine öffentliche Listung.
- Vergleiche: keine zusätzliche öffentliche Vergleichsaufnahme.
- Visuelle/Funktionsprüfung: 4 Fälle bestanden.
  - [375 light dark](product-integration-35.8/petlibro-granary-2-375-light.png)
  - [375 light dark](product-integration-35.8/petlibro-granary-2-375-dark.png)
  - [1600 light dark](product-integration-35.8/petlibro-granary-2-1600-light.png)
  - [1600 light dark](product-integration-35.8/petlibro-granary-2-1600-dark.png)
- Offene Probleme: Die Aufnahme in den bestehenden Katzenvergleich verändert einen eingehenden Link zur Kontrollseite Pawsync im geschützten Experiment 35.5; bis zum Ende des Experiments keine globale Freischaltung.

## MOVA SureTrack Pro

- Status: **published**. Produktseite: https://pfotentechnik.de/produkt/mova-suretrack-pro/
- Modell: SureTrack Pro; MPN/SKU: 011508AA000002.
- Amazon: Amazon.de gezielt geprüft; Suchantworten nicht auswertbar/Blockseite. Keine bestätigte exakte ASIN gefunden. Dies beweist nicht, dass keine Amazon-Listung existiert.
- Preis: 79 EUR bei de.mova.tech; Prüfung 2026-11-16T10:40:00.069Z; Verfügbarkeit available.
- Bilder: manufacturer-product-image; Herkunft und Prüfsummen: [Nachweis](../src/assets/images/products/mova-suretrack-pro/media-provenance-35.8.json).
- Cockpit: [Produktpflege](https://pfotentechnik.de/admin/seo/products/mova-suretrack-pro/); bestehende Preis-/Angebotsverwaltung und neuer allgemeiner Editor für Kriterien, Quellen, Status und Datum.
- Bewertung: 58/100. Redaktionelle Datenbewertung, kein eigener Praxistest. Ortung 3,0/5: connect beurteilt die Positionierung positiv, F.A.Z. Kaufkompass meldet ausgebliebene Geofence-Alarme. App 3,0/5: verständlich, aber eingeschränkter Funktionsumfang. Akku 2,5/5: Fremdtests berichten etwa drei bis vier Tage. Tragekomfort 3,5/5: Gewichtsvorteil mit 36,4 g; keine eigene Tragemessung. Kosten 2,5/5: Pflicht-Abo. Kriterien gleich gewichtet; Gerätepreis und Provision ohne Einfluss. Widersprüchliche Testerfahrungen erlauben keine Zuverlässigkeitsgarantie.
- Verlinkung: Herstellerprofil, Kategorie, Alternativen und Hundevergleich öffentlich verknüpft.
- Vergleiche: beste-gps-tracker-fuer-hunde.
- Visuelle/Funktionsprüfung: 4 Fälle bestanden.
  - [375 light dark](product-integration-35.8/mova-suretrack-pro-375-light.png)
  - [375 light dark](product-integration-35.8/mova-suretrack-pro-375-dark.png)
  - [1600 light dark](product-integration-35.8/mova-suretrack-pro-1600-light.png)
  - [1600 light dark](product-integration-35.8/mova-suretrack-pro-1600-dark.png)
- Offene Probleme: Keine Veröffentlichungssperre; Grenzen der Datenbewertung bleiben ausgewiesen.

## SATELLAI Collar Go

- Status: **published**. Produktseite: https://pfotentechnik.de/produkt/satellai-collar-go/
- Modell: Collar Go, EU Carbon Black / M; MPN/SKU: TG1-EU-BK-M.
- Amazon: Amazon.de gezielt geprüft; Suchantworten nicht auswertbar/Blockseite. Keine bestätigte exakte ASIN gefunden. Dies beweist nicht, dass keine Amazon-Listung existiert.
- Preis: 67 EUR bei global.satellai.com; Prüfung 2026-11-16T10:40:01.240Z; Verfügbarkeit unknown.
- Bilder: manufacturer-product-image; Herkunft und Prüfsummen: [Nachweis](../src/assets/images/products/satellai-collar-go/media-provenance-35.8.json).
- Cockpit: [Produktpflege](https://pfotentechnik.de/admin/seo/products/satellai-collar-go/); bestehende Preis-/Angebotsverwaltung und neuer allgemeiner Editor für Kriterien, Quellen, Status und Datum.
- Bewertung: 62/100. Redaktionelle Datenbewertung, kein eigener Praxistest. Ortung 3,5/5 und App 3,5/5: positive Fremdtests bei connect und CHIP. Akku 3,0/5: CHIP misst 108 Stunden; die höhere Hersteller-Maximallaufzeit wird nicht als Alltagsergebnis gewertet. Tragekomfort 3,0/5: 49 g laut EU-Daten, Befestigung vor jedem Einsatz prüfen. Kosten 2,5/5: Pflicht-Abo, regionaler Tarif ungeklärt. Kriterien gleich gewichtet; Gerätepreis, Lieferstatus und Provision ohne Einfluss. Unterschiedliche Testbedingungen begrenzen direkte Laufzeitvergleiche.
- Verlinkung: Herstellerprofil, Kategorie, Alternativen und Hundevergleich öffentlich verknüpft.
- Vergleiche: beste-gps-tracker-fuer-hunde.
- Visuelle/Funktionsprüfung: 4 Fälle bestanden.
  - [375 light dark](product-integration-35.8/satellai-collar-go-375-light.png)
  - [375 light dark](product-integration-35.8/satellai-collar-go-375-dark.png)
  - [1600 light dark](product-integration-35.8/satellai-collar-go-1600-light.png)
  - [1600 light dark](product-integration-35.8/satellai-collar-go-1600-dark.png)
- Offene Probleme: Keine Veröffentlichungssperre; Grenzen der Datenbewertung bleiben ausgewiesen.

## Tractive DOG 6

- Status: **published**. Produktseite: https://pfotentechnik.de/produkt/tractive-dog-6/
- Modell: Tractive DOG 6; MPN/SKU: im Bestandsdatensatz nicht separat geführt.
- Amazon: Amazon.de gezielt geprüft; Suchantworten nicht auswertbar/Blockseite. Keine bestätigte exakte ASIN gefunden. Dies beweist nicht, dass keine Amazon-Listung existiert.
- Preis: 67.99 EUR bei amazon; Prüfung 2026-11-16T10:40:03.833Z; Verfügbarkeit unknown.
- Bilder: amazon-product-image; Herkunft und Prüfsummen: [Nachweis](../src/assets/images/products/tractive-dog-6/media-provenance-35.8.json).
- Cockpit: [Produktpflege](https://pfotentechnik.de/admin/seo/products/tractive-dog-6/); bestehende Preis-/Angebotsverwaltung und neuer allgemeiner Editor für Kriterien, Quellen, Status und Datum.
- Bewertung: 92/100. Bewertet wurden dokumentierte Ortungstechnik, Live-Intervall, Tier-Fit, Befestigung, Akkubedingungen, App-Funktionen, Folgekosten und Systemabhängigkeiten.
- Verlinkung: Vorhandene Verlinkung erhalten.
- Vergleiche: beste-gps-tracker-fuer-hunde.
- Visuelle/Funktionsprüfung: 4 Fälle bestanden.
  - [375 light dark](product-integration-35.8/tractive-dog-6-375-light.png)
  - [375 light dark](product-integration-35.8/tractive-dog-6-375-dark.png)
  - [1600 light dark](product-integration-35.8/tractive-dog-6-1600-light.png)
  - [1600 light dark](product-integration-35.8/tractive-dog-6-1600-dark.png)
- Offene Probleme: Keine Veröffentlichungssperre; Grenzen der Datenbewertung bleiben ausgewiesen.

## Invoxia Biotracker Edition 2026

- Status: **published**. Produktseite: https://pfotentechnik.de/produkt/invoxia-biotracker-2026/
- Modell: Invoxia Biotracker Edition 2026; MPN/SKU: im Bestandsdatensatz nicht separat geführt.
- Amazon: [B0H4QZMTSY](https://www.amazon.de/dp/B0H4QZMTSY?tag=yusha0f-21)
- Preis: 219 EUR bei amazon; Prüfung 2026-11-16T10:40:05.613Z; Verfügbarkeit unknown.
- Bilder: amazon-product-image; Herkunft und Prüfsummen: [Nachweis](../src/assets/images/products/invoxia-biotracker-2026/media-provenance-35.8.json).
- Cockpit: [Produktpflege](https://pfotentechnik.de/admin/seo/products/invoxia-biotracker-2026/); bestehende Preis-/Angebotsverwaltung und neuer allgemeiner Editor für Kriterien, Quellen, Status und Datum.
- Bewertung: 78/100. Redaktionelle Fremdquellenauswertung, kein eigener Praxistest. Tom’s Guide France beschreibt Fehlklassifikationen und wenig verständliche Gesundheitsdarstellung; CHIP/Golem liefern daneben positive Funktions- und Verlaufsbefunde. Gesundheit deshalb 3,5 statt 4,8/5. Ortung 4,4, App 4,2, Akku 4,4 und Kosten 3,0 bleiben unverändert. Gleichgewichtet 78/100 (3,9/5). Gerätepreis und Provision ohne Einfluss; keine fremde Note übernommen.
- Verlinkung: Vorhandene Verlinkung erhalten.
- Vergleiche: beste-gps-tracker-fuer-hunde.
- Visuelle/Funktionsprüfung: 4 Fälle bestanden.
  - [375 light dark](product-integration-35.8/invoxia-biotracker-2026-375-light.png)
  - [375 light dark](product-integration-35.8/invoxia-biotracker-2026-375-dark.png)
  - [1600 light dark](product-integration-35.8/invoxia-biotracker-2026-1600-light.png)
  - [1600 light dark](product-integration-35.8/invoxia-biotracker-2026-1600-dark.png)
- Offene Probleme: Keine Veröffentlichungssperre; Grenzen der Datenbewertung bleiben ausgewiesen.

## PETLIBRO Granary 2 Vision

- Status: **published**. Produktseite: https://pfotentechnik.de/produkt/petlibro-granary-2-vision/
- Modell: PETLIBRO Granary 2 Vision; MPN/SKU: im Bestandsdatensatz nicht separat geführt.
- Amazon: Amazon.de gezielt geprüft; Suchantworten nicht auswertbar/Blockseite. Keine bestätigte exakte ASIN gefunden. Dies beweist nicht, dass keine Amazon-Listung existiert.
- Preis: 269.99 EUR bei petlibro; Prüfung 2026-11-16T10:40:01.435Z; Verfügbarkeit available.
- Bilder: bestehende Bilder unverändert; Bestandsbilder unverändert.
- Cockpit: [Produktpflege](https://pfotentechnik.de/admin/seo/products/petlibro-granary-2-vision/); bestehende Preis-/Angebotsverwaltung und neuer allgemeiner Editor für Kriterien, Quellen, Status und Datum.
- Bewertung: 86/100. Abgleich der offiziellen Produkt- und Serienseite mit den technischen Angaben zur Variante PLAF205. Kein eigener Ausgabe-, Waagen-, Kamera- oder Langzeittest.
- Verlinkung: Vorhandene Verlinkung erhalten.
- Vergleiche: keine zusätzliche öffentliche Vergleichsaufnahme.
- Visuelle/Funktionsprüfung: bestehende Seite ohne neue Gestaltung.

- Offene Probleme: Keine Veröffentlichungssperre; Grenzen der Datenbewertung bleiben ausgewiesen.

## Tatsächlich gerenderte Entscheidungsaussagen

### tractive-cat-6-mini

- **Akkutechnik und Austausch / Akkukapazität / Akkulaufzeit Integrierter, wiederaufladbarer Akku; Zellchemie und Austausch durch Nutzer in den geprüften modellspezifischen Herstellerangaben nicht eindeutig dokumentiert · 450 mAh · Bis zu 7 Tage mit Energiesparzone; bis zu 4 Tage ohne Energiesparzone**: Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo Erforderlich; ein Abo pro Tracker**: Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.
- **Geeignet für Katzen von 3 bis 8 kg**: Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.
- **Übertragung LTE/4G (Cat 1 bis)**: Prüfe vor dem Kauf die unterstützten Netze und Länder für deinen Einsatzort. Satellitenortung allein garantiert noch keine Übertragung des Standorts an dich.
- **Ortung GPS, GLONASS und Galileo**: Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.
- **Gewicht 32 g inklusive Halsband**: Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

### tractive-dog-6

- **Akkutechnik und Austausch / Akkulaufzeit / Akku Integrierter, wiederaufladbarer Akku; Zellchemie und Austausch durch Nutzer in den geprüften modellspezifischen Herstellerangaben nicht eindeutig dokumentiert · Laut Tractive bis zu 14 Tage mit Energiesparzonen; bis zu 6 Tage ohne · Integrierter Akku, laut Support 930 mAh**: Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo Erforderlich; ein eigenes Abo pro Tracker**: Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.
- **Geeignet für Hunde ab 4 kg**: Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.
- **Übertragung LTE/4G (Cat 1 bis)**: Prüfe vor dem Kauf die unterstützten Netze und Länder für deinen Einsatzort. Satellitenortung allein garantiert noch keine Übertragung des Standorts an dich.
- **Ortung GPS, GLONASS und Galileo**: Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.
- **Gewicht Rund 39 g**: Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

### tractive-dog-6-xl

- **Akkukapazität / Akkutechnik und Austausch / Akkulaufzeit 2150 mAh laut Tractive · Integrierter, wiederaufladbarer Akku; Zellchemie und Austausch durch Nutzer in den geprüften modellspezifischen Herstellerangaben nicht eindeutig dokumentiert · Bis zu 42 Tage mit Energiesparzonen; bis zu 20 Tage ohne**: Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo Erforderlich; ein eigenes Abo pro Tracker**: Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.
- **Geeignet für Hunde ab 20 kg**: Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.
- **Übertragung LTE/4G (Cat 1 bis)**: Prüfe vor dem Kauf die unterstützten Netze und Länder für deinen Einsatzort. Satellitenortung allein garantiert noch keine Übertragung des Standorts an dich.
- **Ortung GPS, GLONASS und Galileo**: Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.
- **Gewicht Rund 70 g**: Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

## Granary 2 X

Expliziter Betreiberauftrag: bis zur gesicherten Marktverfügbarkeit nur Recherchekandidat. Deutsche Produktseite bezeichnet das Modell als bald verfügbar; keine bestätigte verkaufbare X-SKU in den drei aktuellen DE-Varianten. Keine Produktseite angelegt.
