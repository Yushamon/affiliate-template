# Multi-Merchant Commerce — Abschluss und Bedienung

## Architektur

Der bestehende Affiliate Core erzeugt Netzwerklinks. Produkt-Markdown bleibt die Datenquelle; die vorhandenen Commerce-Schemas, atomaren Frontmatter-Schreibvorgänge, Price-Intelligence-Aktionen, Product Operations und ProductExperience2 wurden erweitert. Es gibt keine zweite Produktdatenbank, Preisengine, Disclosure-Logik oder separate Händleroberfläche.

`affiliate-programs.mjs` trennt Merchant, Netzwerk und Programm. `offers` speichert Herstellerziel, verifizierte Variante/SKU, Preisquelle, Prüfdatum und Evidence. Bestehende Amazon-/Händlerdaten werden als implizites Angebot übernommen und nicht überschrieben. Ein verifiziertes Variantenangebot ersetzt einen allgemeinen Link zum selben Hersteller nur in der öffentlichen Ausgabe, damit etwa der Dockstream Cordless nicht mit dem Plug-in-Preis erscheint.

PETLIBRO/Awin: Merchant **77942**, Publisher **2987821**. Die vom Betreiber bestätigten **8 % Provision / 30 Tage Cookie** sind reine Programmevidence. Ranking und Preisvergleich lesen diese Werte nicht. Produkt, Placement und Seitentyp werden zentral in Awin `clickref` übersetzt.

## PETLIBRO

18 Produkte inventarisiert; 9 sichere DE-Zuordnungen mit verifizierter SKU und automatisch aktualisierbaren EUR-Preisen. Die Quelle ist die offizielle Shopify-Produkt-JSON plus Shop-Währung, nicht Awin. Abfrage am 21.09.2026; alle neun Varianten verfügbar. Die Daten bleiben zeitgebunden, keine dauerhafte Verfügbarkeitsgarantie.

Verifiziert: Dockstream 2 Smart Cordless, Dockstream 2 Smart, Luma, Polar, One RFID, Scout, Granary Camera, Granary WiFi und Granary Dual. URLs, Varianten, Preise und Quellen stehen in [petlibro-inventory.json](petlibro-inventory.json).

Unresolved: Air Automatic, Air WiFi, Capsule Dog, Dockstream Cordless (ältere Generation), Dockstream RFID, Glacier, Granary 2 Vision, Space und Stainless Steel 3 L. Ohne sichere DE-Modellzuordnung entstehen keine neuen Hersteller-Affiliate-Links.

## Bedienung im SEO-Cockpit

1. `/admin/seo/prices/` öffnen; bei Bedarf „Alle Produkte“ wählen und das Produkt suchen.
2. „Händlerangebote“ aufklappen: Merchant, Netzwerk, offizielle URL, Affiliate-Bereitschaft, Preisquelle, Verfügbarkeit, Freshness und Fehler sind dort pro Angebot sichtbar.
3. „Commerce aktualisieren“ prüft alle Quellen des Produkts. „Commerce-Daten aktualisieren“ nutzt dieselbe Aktion für den gesamten Bestand. Ein Providerfehler beendet andere Provider nicht. Die bestehende redaktionelle Sperre des Hauptpreises bleibt erhalten; zusätzliche Herstellerangebote können unabhängig aktualisiert werden.
4. Für eine offene Zuordnung die tatsächlich geprüfte DE-Produkt-URL, Varianten-ID und SKU eingeben. Die Bestätigung setzt die redaktionelle Modell-/Generationsprüfung voraus; der Server prüft zusätzlich die exakte SKU in der Händlerquelle. Ein unbestätigtes oder geändertes Ziel bleibt unresolved.

Die bestehenden Tabellenfelder, manuellen Preisfelder und Pflegekennzahlen beziehen sich weiterhin auf den bisherigen Hauptdatensatz. Die Händlersektion zeigt den zusätzlichen Multi-Offer-Zustand. Offene Eingaben werden bei einer Aktualisierung nicht überschrieben.

## Öffentliche Darstellung / SEO

Amazon-only funktioniert weiterhin. Hersteller-only benötigt keinen Amazon-Link. Bei mehreren unterschiedlichen Händlern erscheinen deren nutzbare Angebote. Unbekannte/veraltete Preise erzeugen keine Preisbehauptung. Bei Providerfehlern bleibt ein verifiziertes Herstellerziel nutzbar, der Preis wird ausgeblendet. Ohne nutzbares Angebot erscheint kein falscher Kaufen-CTA.

Ein Preisvergleich setzt aktuelle positive Preise, identische `comparisonKey`-Werte (Modell/Variante/Bundle), dieselbe Währung, verfügbare Angebote und bekannte Versandkosten voraus. Beim bisherigen Hauptangebot liegen optionale Vergleichsdaten in `price.comparisonKey`, `price.shipping` und `price.variantLabel`; bei zusätzlichen Angeboten direkt am Offer. Fehlende Versandkosten werden nicht als null Euro angenommen. Für die aktuellen PETLIBRO-Angebote wird daher keine Ersparnis behauptet.

Product-JSON-LD verwendet dieselben frischen, verfügbaren Angebote wie die öffentliche Commerce-Ausgabe. Netzwerklinks bleiben extern, `sponsored nofollow noopener`; bestehender Affiliate-Hinweis wird wiederverwendet. Evidence-Links bleiben neutral. Keine neuen Canonicals, Redirect-Routen oder Sitemap-Einträge. Filter-/Folgekostenberechnung bleibt im bestehenden System.

## ADCELL / Tractive und benötigte Eingaben

Das Tractive-Programm ist explizit deaktiviert. Zur Freischaltung fehlen eine bestätigte ADCELL-/Tractive-Linkvorlage mit Publisher-/Programmzuordnung und verifizierte Produktziele. Der zentrale Netzwerkadapter unterstützt erst nach Bestätigung eine Vorlage; ProductExperience2 braucht dafür keinen Netzwerk-Sonderfall. Es wurden keine IDs oder Konditionen erfunden.

Für die neun unresolved PETLIBRO-Modelle sind sichere, in Deutschland geeignete Modell-/Variantenquellen erforderlich. Die Website kann ohne diese Eingaben gebaut und genutzt werden.

## Prüfung

Abschluss am 23.09.2026: **858 PfotenTechnik-Tests**, **26 Affiliate-Core-Tests**, darin **26 neue Commerce-Tests**, erfolgreich. Production Build: **375 Seiten**. **17 Browserprüfungen** ohne Overflow, abgeschnittene CTAs, Preiszeilenfehler oder defekte Bilder; vier Fullpage-Screenshots visuell geprüft. Browsertest bestätigt getrenntes Speichern beider Händlerpreise und den Erhalt des jeweils anderen ungespeicherten Preisentwurfs. Serverseitige Integrationstests bestätigen getrennte Persistenz in den echten Markdown-Schreibfunktionen und Nutzung beider Preise im öffentlichen Resolver.

Der lokale Admin-Dienst wurde mit dem aktuellen Backend neu gestartet; Astro läuft gemäß AGENTS.md im Hintergrund auf Port 4321. Live-Cockpit geprüft: HTTP 200, separate Händlerpreisformulare vorhanden.

Die endgültigen Ergebnisse stehen in `validation.json` und `visual-qa.json`. Vier Fullpage-Screenshots: `product-375-light.png`, `product-375-dark.png`, `product-1600-light.png`, `product-1600-dark.png`. Weitere Breiten werden ohne zusätzliche Screenshots geometrisch geprüft.

Der eingebaute Browser war nicht verfügbar; die visuelle Prüfung nutzt den bereits im Repository installierten Electron/Chromium. Cockpit-Klicks auf Single/Global Refresh und Speichern laufen gegen eine isolierte In-Memory-API, damit die UI-Prüfung keine Produktdaten verändert. Reale Provider-/Persistenzlogik wird separat durch Integrationstests geprüft; die initiale Händlerabfrage erfolgte gegen PETLIBRO.

Reproduktion: `npm run build:pfotentechnik`, danach `npm --workspace apps/pfotentechnik test`, `npm run test:affiliate` und `npx electron apps/pfotentechnik/scripts/price-intelligence/visual-qa.cjs`. Build und Gesamttests nacheinander ausführen, da bestehende Tests auf den fertigen Build zugreifen.
