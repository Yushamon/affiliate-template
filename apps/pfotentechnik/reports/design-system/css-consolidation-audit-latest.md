# CSS Consolidation Audit

Erzeugt: 2026-07-31T07:37:06.684Z

## Zusammenfassung

- Dateien mit CSS: 78
- Quell-CSS: 745576 Bytes
- Selektor-Regeln: 8046
- !important: 1649
- mehrfach definierte Selektoren: 1538
- identische Deklarationsblöcke: 1035

## Größte !important-Quellen

| Datei | !important | Bytes | Regeln |
|---|---:|---:|---:|
| `apps/pfotentechnik/src/styles/pfotentechnik-design-system.css` | 753 | 134201 | 2307 |
| `packages/affiliate-core/src/components/comparison/comparison-system.css` | 278 | 135674 | 1119 |
| `packages/affiliate-core/src/renderer/PremiumRenderer.astro` | 258 | 28892 | 172 |
| `apps/pfotentechnik/src/styles/pfotentechnik-ui-system.css` | 211 | 25628 | 290 |
| `apps/pfotentechnik/src/pages/hersteller/[manufacturer].astro` | 57 | 16698 | 266 |
| `apps/pfotentechnik/src/pages/hersteller/index.astro` | 27 | 5348 | 83 |
| `packages/affiliate-core/src/components/home/home.css` | 15 | 24350 | 240 |
| `packages/affiliate-core/src/components/product/ProductReview.astro` | 8 | 14307 | 132 |
| `apps/pfotentechnik/src/components/DecisionNextSteps.astro` | 8 | 10878 | 77 |
| `apps/pfotentechnik/src/pages/[slug].astro` | 7 | 5832 | 46 |
| `packages/affiliate-core/src/components/product/AlternativeRecommendationCard.astro` | 6 | 5977 | 34 |
| `apps/pfotentechnik/src/components/product-experience-2/ProductDetails2.astro` | 6 | 3827 | 47 |
| `apps/pfotentechnik/src/styles/pfotentechnik-product-mobile-premium.css` | 5 | 14792 | 136 |
| `apps/pfotentechnik/src/styles/pfotentechnik.css` | 2 | 17105 | 184 |
| `apps/pfotentechnik/src/components/advisor/PetAdvisor.astro` | 2 | 8286 | 85 |
| `apps/pfotentechnik/src/pages/admin/seo/prices.astro` | 2 | 7541 | 91 |
| `apps/pfotentechnik/src/components/admin/SearchIntegrations.astro` | 2 | 3222 | 39 |
| `packages/affiliate-core/src/components/comparison/comparison-explorer-v2.css` | 1 | 12463 | 101 |
| `apps/pfotentechnik/src/pages/admin/seo/media.astro` | 1 | 7477 | 86 |

## Häufigste doppelte Selektoren

| Selektor | Vorkommen | Dateien | !important |
|---|---:|---:|---:|
| `h3` | 27 | 9 | 16 |
| `:root` | 26 | 10 | 26 |
| `.recommendation-card` | 22 | 3 | 17 |
| `h4` | 19 | 4 | 16 |
| `li` | 19 | 7 | 7 |
| `.feature-card` | 18 | 1 | 29 |
| `.recommendation-card__image-link` | 18 | 3 | 21 |
| `h2` | 18 | 9 | 10 |
| `.info-card` | 17 | 1 | 29 |
| `.warning-card` | 17 | 1 | 29 |
| `.health-bridge` | 17 | 1 | 29 |
| `:where( .premium-block` | 17 | 1 | 28 |
| `.main-nav-v2` | 17 | 4 | 6 |
| `.faq-section` | 16 | 3 | 24 |
| `.comparison-card` | 16 | 3 | 11 |
| `strong` | 15 | 3 | 27 |
| `.article-callout` | 15 | 1 | 27 |
| `.decision-template-card` | 15 | 2 | 27 |
| `.manufacturer-header` | 14 | 2 | 58 |
| `.brand-hero` | 14 | 2 | 58 |
| `[data-manufacturer-hero]` | 14 | 2 | 58 |
| `[class*="manufacturer-hero"]` | 14 | 2 | 58 |
| `.recommendation-card__content` | 13 | 3 | 7 |
| `.comparison-mobile-product` | 12 | 3 | 16 |
| `.product-summary` | 12 | 2 | 13 |
| `.comparison-mobile-product__actions` | 12 | 2 | 12 |
| `strong)` | 12 | 1 | 9 |
| `.comparison-sticky-bar` | 12 | 2 | 7 |
| `select` | 12 | 4 | 3 |
| `.comparison-detail` | 12 | 3 | 1 |

## Empfehlung

Beginne mit der Datei, die viele `!important`-Deklarationen und zugleich viele doppelte Selektorvorkommen enthält. Entferne nicht global, sondern konsolidiere jeweils eine klar abgegrenzte Komponentenfamilie und validiere danach Build, Design-System- und Performance-Audits.
