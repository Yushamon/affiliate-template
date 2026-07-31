# Exact Duplicate CSS Cleanup 23.0.0

- Modus: write
- geprüfte CSS-/Astro-Dateien: 172
- betroffene Dateien: 14
- entfernte exakt identische Deklarationen: 178
- eingesparte Bytes: 4825

## Sicherheitsgrenze

Entfernt werden ausschließlich Wiederholungen innerhalb desselben
Deklarationsblocks, wenn Property und normalisierter Wert exakt identisch sind.

Nicht verändert werden:

- Custom Properties
- Vendor-Prefix-Deklarationen
- gleiche Properties mit unterschiedlichen Werten
- Deklarationen in verschiedenen Selektoren
- Reihenfolge unterschiedlicher Deklarationen

## Dateien

- `apps/pfotentechnik/src/components/AutoContentBlocks.astro`: 1 Deklarationen, 27 Bytes
- `apps/pfotentechnik/src/components/advisor/FeederAdvisor.astro`: 1 Deklarationen, 25 Bytes
- `apps/pfotentechnik/src/pages/[slug].astro`: 1 Deklarationen, 30 Bytes
- `apps/pfotentechnik/src/pages/hersteller/[manufacturer].astro`: 5 Deklarationen, 274 Bytes
- `apps/pfotentechnik/src/styles/pfotentechnik-design-system.css`: 56 Deklarationen, 1586 Bytes
- `apps/pfotentechnik/src/styles/pfotentechnik-product-mobile-premium.css`: 46 Deklarationen, 830 Bytes
- `apps/pfotentechnik/src/styles/pfotentechnik-responsive-resilience.css`: 1 Deklarationen, 17 Bytes
- `packages/affiliate-core/src/components/Header.astro`: 11 Deklarationen, 386 Bytes
- `packages/affiliate-core/src/components/ImageLightbox.astro`: 1 Deklarationen, 20 Bytes
- `packages/affiliate-core/src/components/comparison/comparison-system.css`: 46 Deklarationen, 1369 Bytes
- `packages/affiliate-core/src/components/product/ProductReview.astro`: 2 Deklarationen, 65 Bytes
- `packages/affiliate-core/src/renderer/PremiumRenderer.astro`: 3 Deklarationen, 82 Bytes
- `packages/affiliate-core/src/styles/header-footer.css`: 3 Deklarationen, 84 Bytes
- `packages/affiliate-core/src/styles/product.css`: 1 Deklarationen, 30 Bytes
