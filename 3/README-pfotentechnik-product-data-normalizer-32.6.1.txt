PfotenTechnik Product Data Normalizer 32.6.1

Sichere Auto-Fixes
- vorhandene thumbnail.webp und comparison.webp anbinden
- vorhandene gallery-N.webp anbinden
- tote Bildpfade nur auf eindeutig vorhandene Dateien bzw. gleichnamige WebP reparieren
- vorhandenes top-level capacity als Spec Kapazität ergänzen
- Produkt -> Vergleich aus den tatsächlichen Comparison-items ergänzen
- productUrl auf /produkt/<slug>/ normalisieren

Bewusst nicht automatisch gesetzt
- Lautstärke, Gewicht, UV/UVC, WLAN, Garantie
- Affiliate-Links
- Stärken/Schwächen
- decision.bestFor / decision.attention
- alte Vergleichsrelationen; diese werden nur gemeldet

Kommandos
  npm --workspace apps/pfotentechnik run product:data:normalize
  npm --workspace apps/pfotentechnik run product:data:normalize:check
  npm --workspace apps/pfotentechnik run test:product-data-normalizer

Report
  apps/pfotentechnik/reports/product-data-normalizer/normalizer-latest.json
  apps/pfotentechnik/reports/product-data-normalizer/normalizer-latest.md

Ausführen
  node 3/apply-pfotentechnik-product-data-normalizer-32.6.1.mjs

Ohne Build
  node 3/apply-pfotentechnik-product-data-normalizer-32.6.1.mjs --skip-build

Danach
  npm run seo:release:check
