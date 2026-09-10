# PfotenTechnik 35.0B.2 – Fountain Accessory Commerce Audit

Stand: 2026-09-10 · Scope: intern, keine Veröffentlichung

## Ergebnis

Die bestehende Commerce-Struktur ist für Zubehördaten grundsätzlich wiederverwendbar. `consumables[].offers[]` und `repairability.parts[].offers[]` verwenden bereits dieselben Preis-, Availability- und optionalen Affiliate-Primitiven wie Hauptprodukte. Es fehlt kein öffentliches Schemafeld, um 35.0B.2 intern zu entscheiden. Es fehlt jedoch eine persistierte Zubehör-ASIN bzw. `merchantLinks`-Struktur; deshalb werden die geprüften Zuordnungen nur im internen Resolution-Report gehalten und nicht in Produkt-Frontmatter oder UI übernommen.

## Bestehende Systeme

| Bereich | Bestand | Bewertung für Zubehör |
|---|---|---|
| Offer-Speicher | `accessoryOfferSchema` unter `consumables[]` und `repairability.parts[]` | Direkt wiederverwendbar |
| Merchant-Identität | `price.source.id`, `label`, `type`, `url` | Ausreichend für den vorhandenen Händler; kein zweites Registry-Modell nötig |
| Affiliate-Modell | optionales `affiliate`-Objekt am Accessory Offer | Formell vorhanden, aber ohne verifizierten ASIN-/Merchant-Link-Nachweis |
| Merchant-Abstraktion | `MerchantKey = "amazon"`; Engine liefert Amazon oder internen Link | Nur Amazon ist als Affiliate-Merchant integriert |
| Amazon-ASIN | Extraktion aus ASIN bzw. direkten `/dp/…`-, `/gp/product/…`-URLs | Ableitbar; Suchseiten sind technisch möglich, für Zubehör aber nicht freigabefähig |
| Tracking | `buildAmazonAffiliateUrl` / `addAmazonTrackingId` mit Projekt-Tracking-ID | Wiederverwendet; keine manuell angehängten Parameter |
| Hauptprodukt-Rendering | Produktseite verarbeitet ausschließlich `contentProduct.affiliate` | Zubehör bleibt unsichtbar |
| Preis-Fetch | Service arbeitet auf Hauptprodukt-URL/Frontmatter-Patch | Kein Accessory-Refresh-Pfad; 35.0B.2 erweitert ihn nicht |
| Offer-Validierung | HTTPS, Preisquelle/-zeitpunkt, Availability, eindeutige Offer-ID | Direkt wiederverwendbar |
| Händlerpriorisierung | Amazon vor Legacy-Link im Affiliate Engine; keine automatische Accessory-Auswahl | Für Zubehör bewusst explizite Entscheidung je Offer |

## Antworten auf die Architekturfragen

1. Zubehör kann die vorhandenen Offer-, Preis-, Availability-, Affiliate- und Amazon-Link-Primitiven direkt verwenden. Pumpen bleiben Eigentum von `repairability.parts[]`; Filter bleiben unter `consumables[]`.
2. Für eine spätere persistierte Automatisierung fehlt Zubehörangeboten nur eine ASIN-/`merchantLinks.amazon`-Repräsentation und ein verifizierter Commerce-Status. Für diesen internen Freeze-Schritt ist keine Schemaerweiterung erforderlich.
3. Affiliate-Verifizierung kommt aktuell nicht aus den Daten. Sie entsteht nur, wenn ein Amazon-Eingang plus konfigurierte Tracking-ID an die Affiliate Engine übergeben wird. Ein vorhandener Merchant-Link oder `affiliate.provider` ist allein kein Verifizierungsbeleg.
4. Amazon-Affiliate-Fähigkeit ist aus einer validen ASIN oder einer direkten Amazon-Produkt-URL ableitbar. Sie ist nicht aus einer Amazon-Suche, einem Markennamen oder einem ähnlichen Produkt ableitbar. Kaufbarkeit, exakte Packung und Kompatibilität bleiben zusätzliche Gates.
5. Offer-Typen jenseits des Hauptprodukts werden bereits gespeichert und validiert; es gibt aber keinen Renderer, keine automatische Affiliate-Auflösung und keinen Price-Fetch-Writeback für Zubehör.

## Statusvertrag

- `AFFILIATE_READY`: exaktes Produkt, exakte Kompatibilität und Packung, verfügbarer Direktartikel bei unterstütztem Merchant und anwendbare vorhandene Tracking-Mechanik.
- `PURCHASABLE_NON_AFFILIATE`: verfügbarer Artikel bei einem unterstützten Merchant, aber ohne verwendbaren Affiliate-Mechanismus oder ohne zulässiges Direktziel.
- `COMPATIBILITY_UNRESOLVED`: Produkt-, Modell-, Generation-, Komponenten- oder Packungszuordnung ist nicht belastbar.
- `MERCHANT_UNSUPPORTED`: Angebot ist kaufbar und kompatibel, sein Merchant hat aber keine vorhandene Affiliate-Integration.
- `OFFER_UNAVAILABLE`: das bewertete Angebot ist nicht kaufbar.
- `UNKNOWN`: für die Klassifikation fehlen Daten; nicht gleichbedeutend mit einem bekannten, aber nicht unterstützten Merchant.

## Validierung

- Architektur-/Statusvertrag: 16/16 neue Szenarien bestanden.
- Produkt- und Commerce-Audit: 102 Produkte, 0 Fehler; Fountain-Research-Gate 24/24 bestanden.
- Affiliate-Paket: 26/26 Affiliate- und Linking-Tests bestanden.
- Öffentliche Wirkung: keine Renderer-, Content-, CTA- oder Schema.org-Änderung; keine der drei freigegebenen ASINs erscheint im Build-Output.

## Technische Entscheidung

Eine kleine interne, rendererfreie Statusfunktion wurde in `src/domain/accessoryCommerce.mjs` ergänzt. Sie importiert die bestehende Amazon-ASIN- und Link-Generierung, baut keine parallele Commerce-Schicht, verändert keine Produktdaten und erzeugt keine öffentliche Ausgabe. Schema-, Price-, Affiliate- und Redirect-Systeme wurden nicht erweitert.
