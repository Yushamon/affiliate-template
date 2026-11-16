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

Produktionsbuild: 390 Seiten erfolgreich. Relevante Tests: 140 bestanden, keine Fehler. Diff einschließlich Index und Arbeitskopie geprüft; keine Whitespace-Fehler.

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
- Bewertung: 60/100. Konservative redaktionelle Eignungsbewertung aus Herstellerangaben und getrennt dokumentierten Fremdtests; kein eigener Praxistest. Ortung 3,5/5 für dokumentierte Mobilfunk-/GPS-Funktionen ohne eigene Latenzmessung; App 3,0/5 wegen Plattformabhängigkeit; Akku 3,0/5 wegen bedingter Maximalwerte; Tragekomfort 3,0/5 wegen zu prüfender Masse und Befestigung; Kosten 2,5/5 wegen Pflicht-Abo. Fünf Kriterien gleich gewichtet. Gerätepreis und Händlerprovision beeinflussen die Kriterien nicht.
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
- Bewertung: 60/100. Konservative redaktionelle Eignungsbewertung aus Herstellerangaben und getrennt dokumentierten Fremdtests; kein eigener Praxistest. Ortung 3,5/5 für dokumentierte Mobilfunk-/GPS-Funktionen ohne eigene Latenzmessung; App 3,0/5 wegen Plattformabhängigkeit; Akku 3,0/5 wegen bedingter Maximalwerte; Tragekomfort 3,0/5 wegen zu prüfender Masse und Befestigung; Kosten 2,5/5 wegen Pflicht-Abo. Fünf Kriterien gleich gewichtet. Gerätepreis und Händlerprovision beeinflussen die Kriterien nicht.
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
- Bewertung: 83/100. Herstellerangaben werden getrennt von professionellen Tests und Nutzerbewertungen ausgewertet. Externe Sterne werden nicht direkt in den PfotenTechnik-Score übernommen.
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

- **Akkutechnik und Austausch Integrierter, wiederaufladbarer Akku; Zellchemie und Austausch durch Nutzer in den geprüften modellspezifischen Herstellerangaben nicht eindeutig dokumentiert**: Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo Erforderlich; ein Abo pro Tracker**: Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.
- **App Tractive GPS App; Android 10 oder neuer, iOS 17 oder neuer**: Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Akkukapazität 450 mAh**: Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Akkulaufzeit Bis zu 7 Tage mit Energiesparzone; bis zu 4 Tage ohne Energiesparzone**: Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Stromversorgung Integrierter Akku**: Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.

### tractive-dog-6

- **Akkutechnik und Austausch Integrierter, wiederaufladbarer Akku; Zellchemie und Austausch durch Nutzer in den geprüften modellspezifischen Herstellerangaben nicht eindeutig dokumentiert**: Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo Erforderlich; ein eigenes Abo pro Tracker**: Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.
- **App Tractive GPS App; Android 10 oder neuer, iOS/iPadOS 17 oder neuer**: Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Akkulaufzeit Laut Tractive bis zu 14 Tage mit Energiesparzonen; bis zu 6 Tage ohne**: Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Stromversorgung Integrierter Akku; Laden über das mitgelieferte USB-C-Ladekabel**: Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Akku Integrierter Akku, laut Support 930 mAh**: Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.

### tractive-dog-6-xl

- **Akkukapazität 2150 mAh laut Tractive**: Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Akkutechnik und Austausch Integrierter, wiederaufladbarer Akku; Zellchemie und Austausch durch Nutzer in den geprüften modellspezifischen Herstellerangaben nicht eindeutig dokumentiert**: Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo Erforderlich; ein eigenes Abo pro Tracker**: Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.
- **App Tractive GPS App; Android 10 oder neuer, iOS/iPadOS 17 oder neuer**: Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Akkulaufzeit Bis zu 42 Tage mit Energiesparzonen; bis zu 20 Tage ohne**: Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Stromversorgung Integrierter Akku; Laden über das mitgelieferte USB-C-Ladekabel**: Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.

## Granary 2 X

Expliziter Betreiberauftrag: bis zur gesicherten Marktverfügbarkeit nur Recherchekandidat. Deutsche Produktseite bezeichnet das Modell als bald verfügbar; keine bestätigte verkaufbare X-SKU in den drei aktuellen DE-Varianten. Keine Produktseite angelegt.
