# PfotenTechnik Content-Driven Roadmap

## Abgeschlossen

- [x] Modulare Content-Schemas
- [x] Collections für Pages, Produkte, Hersteller und Vergleiche
- [x] Content Registry
- [x] Zehn Hersteller als Markdown
- [x] Dynamische Herstellerroute mit Collection-Vorrang
- [x] 35 Produkte als Markdown
- [x] ProductReview auf übergebene Markdown-Daten umgestellt
- [x] Produktalternativen auf Product-Collection umgestellt
- [x] Fünf belegbare Vergleiche in `comparisons` migriert
- [x] Dynamische Vergleichsroute
- [x] Vergleiche-Hub aus Registry
- [x] Wissen-Hub aus Registry
- [x] Hauptnavigation aus Frontmatter
- [x] Related Content für Produkte, Hersteller, Vergleiche und Wissen
- [x] Automatische Breadcrumbs und Breadcrumb-JSON-LD
- [x] Sitemap mit Frontmatter-basiertem `lastmod`
- [x] Content-Bilder nach `src/assets` und Rendering auf `astro:assets` migriert
- [x] Produktgalerien auf eigenständige Anwendungs- und Detailmotive geprüft

## Offen

### Vergleichsmigration

- [ ] Nassfuttervergleich um mindestens zwei belegbare Produktbeziehungen ergänzen
- [ ] Danach in die `comparisons`-Collection migrieren
- [ ] Legacy-Rootvergleiche erst nach Redirect- und Canonical-Entscheidung entfernen

### Herstellerroute

- [ ] Produktkarten vollständig aus Product-Collection statt `products.ts` laden
- [ ] Legacy-Herstelleradapter entfernen

### Wissensseiten

- [ ] Decision-Daten und Produktvergleiche auf Collections umstellen
- [ ] Direkte Imports aus `products.ts`, `decisionProducts.ts`, `internalLinks.ts`, `projectImages.ts` und `seoOverrides.ts` reduzieren

### Konfiguration

- [ ] Nicht mehr verwendete `projectConfig.headerLinks` entfernen
- [ ] Footer-Navigation optional ebenfalls aus Frontmatter erzeugen

### Cleanup

- [ ] Alle Legacy-Imports repositoryweit erfassen
- [ ] `products.ts` entfernen, sobald keine Abhängigkeiten verbleiben
- [ ] `manufacturers.ts` entfernen, sobald keine Abhängigkeiten verbleiben
- [ ] `productReviews.ts`, `productScoring.ts`, `projectImages.ts`, `seoOverrides.ts`, `internalLinks.ts`, `decisionProducts.ts` und `decisionRules.ts` einzeln prüfen
- [ ] Einmalige Migrationsskripte nach bestätigtem Commit entfernen
- [ ] Parallele Produktkopien unter `public/images` nach Entfernung aller Legacy-URL-Strings löschen
- [ ] Abschließenden Build und Sitemap-Audit durchführen

## Später

- Produkt-Lifecycle
- Preisdaten mit Zeitstempel und Quelle
- Link-Analytics
- Search-Console-Auswertung
- Weitere Produktkategorien mit eigenen Domain-Regeln
