# Price UI Simplification 13.0.0

## Öffentliche Preisdarstellung

- Preisrange entfernt
- Fairness-Badge und Preisurteil entfernt
- erklärender Preisvergleichstext entfernt
- sichtbar bleiben nur aktueller Preis, letzter Prüfstand und Händler-CTA
- zugrunde liegende Price-Engine-Daten bleiben für Admin, Audits und spätere Preisverläufe erhalten

## Vergleich

- Top-Empfehlung auf eine zusammenhängende Oberfläche reduziert
- verschachtelte `pt-surface`-Flächen aus der Gewinnerkarte entfernt
- Produktmedium auf 4:3 begrenzt und innerhalb der Karte gehalten
- Preis direkt mit dem CTA-Bereich verbunden
- Dark-Mode-Texte, Score und Flächen auf Comparison-Tokens festgelegt
- Direktvergleich zeigt keine Range oder Fairness-Einordnung mehr

## Produktseiten

- PriceBox2 zeigt nur noch den aktuellen Preis
- Prüfdatum und Änderlichkeit bleiben transparent
- Verfügbarkeitszustände und deaktivierte Kauf-CTAs bleiben erhalten

## Geänderte Dateien

- packages/affiliate-core/src/components/comparison/ComparisonPriceSignal.astro
- apps/pfotentechnik/src/components/product-experience-2/PriceBox2.astro
- packages/affiliate-core/src/components/comparison/ComparisonTable.astro
- packages/affiliate-core/src/components/comparison/ComparisonShell.astro
- packages/affiliate-core/src/components/comparison/RecommendationGrid.astro
- packages/affiliate-core/src/components/comparison/comparison-premium-ux.css
- apps/pfotentechnik/test/comparison-score-price-3.3.4.test.mjs
