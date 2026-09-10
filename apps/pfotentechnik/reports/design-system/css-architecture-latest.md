# CSS Architecture Audit

Erzeugt: 2026-09-10T06:56:21.199Z

## Zusammenfassung

- CSS-Dateien: 42
- Astro-Dateien mit Style-Block: 47
- Quell-CSS: 706694 Bytes
- Regeln: 7294
- !important-Deklarationen: 1168
- mehrfach definierte Selektoren: 1422
- identische Deklarationsblöcke: 915
- Importkanten: 71
- kaputte CSS-Imports: 0
- nicht statisch importierte CSS-Dateien: 0
- sichere Löschkandidaten: 0

## Ownership

| Owner | Dateien | Bytes | Regeln | !important |
|---|---:|---:|---:|---:|
| design-system | 36 | 317350 | 3952 | 848 |
| editorial-content | 1 | 29738 | 172 | 255 |
| manufacturer-pages | 3 | 17772 | 197 | 27 |
| product-experience | 17 | 117884 | 957 | 14 |
| component-owner-unresolved | 22 | 119810 | 989 | 10 |
| comparison-platform | 3 | 59018 | 527 | 9 |
| admin-seo-copilot | 6 | 34603 | 439 | 5 |
| navigation | 1 | 10519 | 61 | 0 |

## Größte Problemdateien

| Datei | Kategorie | Owner | Bytes | Regeln | !important | importiert von |
|---|---|---|---:|---:|---:|---:|
| `apps/pfotentechnik/src/styles/pfotentechnik-design-system.css` | global | design-system | 116968 | 2042 | 639 | 1 |
| `packages/affiliate-core/src/renderer/PremiumRenderer.astro` | component-inline | editorial-content | 29738 | 172 | 255 | 0 |
| `apps/pfotentechnik/src/styles/pfotentechnik-ui-system.css` | global | design-system | 19156 | 194 | 174 | 1 |
| `apps/pfotentechnik/src/styles/pfotentechnik-foundation-contracts.css` | global | design-system | 11456 | 119 | 28 | 1 |
| `apps/pfotentechnik/src/pages/hersteller/index.astro` | manufacturer | manufacturer-pages | 6446 | 83 | 27 | 0 |
| `packages/affiliate-core/src/components/comparison/comparison-experience.css` | comparison | comparison-platform | 45051 | 352 | 9 | 2 |
| `packages/affiliate-core/src/components/product/ProductReview.astro` | product | product-experience | 14949 | 132 | 8 | 0 |
| `apps/pfotentechnik/src/components/DecisionNextSteps.astro` | component-inline | component-owner-unresolved | 11181 | 77 | 8 | 0 |
| `packages/affiliate-core/src/components/product/AlternativeRecommendationCard.astro` | product | product-experience | 6239 | 34 | 6 | 0 |
| `apps/pfotentechnik/src/styles/pfotentechnik-product-mobile-premium.css` | global | design-system | 14028 | 136 | 5 | 1 |
| `apps/pfotentechnik/src/styles/pfotentechnik.css` | global | design-system | 15268 | 162 | 2 | 1 |
| `apps/pfotentechnik/src/components/advisor/PetAdvisor.astro` | component-inline | component-owner-unresolved | 9480 | 84 | 2 | 0 |
| `apps/pfotentechnik/src/pages/admin/seo/prices.astro` | admin | admin-seo-copilot | 7755 | 91 | 2 | 0 |
| `apps/pfotentechnik/src/components/admin/SearchIntegrations.astro` | admin | admin-seo-copilot | 3234 | 39 | 2 | 0 |
| `apps/pfotentechnik/src/pages/admin/seo/media.astro` | admin | admin-seo-copilot | 7477 | 86 | 1 | 0 |
| `packages/affiliate-core/src/styles/premium-page.css` | global | design-system | 35676 | 305 | 0 | 2 |
| `packages/affiliate-core/src/styles/product.css` | product | product-experience | 34794 | 265 | 0 | 2 |
| `apps/pfotentechnik/src/components/category/CategoryExperience.astro` | component-inline | component-owner-unresolved | 19851 | 154 | 0 | 0 |
| `packages/affiliate-core/src/components/home/home.css` | component | component-owner-unresolved | 19586 | 207 | 0 | 1 |
| `packages/affiliate-core/src/styles/article.css` | global | design-system | 15507 | 143 | 0 | 2 |
| `apps/pfotentechnik/src/styles/pfotentechnik-design-tokens.css` | global | design-system | 14740 | 14 | 0 | 1 |
| `apps/pfotentechnik/src/components/comparison/ComparisonProduction.astro` | comparison | comparison-platform | 12416 | 167 | 0 | 0 |
| `packages/affiliate-core/src/styles/misc.css` | global | design-system | 10655 | 112 | 0 | 2 |
| `packages/affiliate-core/src/components/Header.astro` | component-inline | navigation | 10519 | 61 | 0 | 0 |
| `apps/pfotentechnik/src/styles/pfotentechnik-visual-density.css` | global | design-system | 10394 | 130 | 0 | 1 |
| `apps/pfotentechnik/src/components/product-experience-2/ProductExperience2.astro` | product | product-experience | 10390 | 88 | 0 | 0 |
| `apps/pfotentechnik/src/components/product-experience-2/product-gallery-29.css` | product | product-experience | 10369 | 73 | 0 | 1 |
| `apps/pfotentechnik/src/components/manufacturer/ManufacturerExperience.astro` | manufacturer | manufacturer-pages | 7675 | 84 | 0 | 0 |
| `apps/pfotentechnik/src/components/product-experience-2/ProductHero2.astro` | product | product-experience | 7526 | 67 | 0 | 0 |
| `packages/affiliate-core/src/styles/home.css` | global | design-system | 7216 | 69 | 0 | 2 |
| `apps/pfotentechnik/src/pages/vergleiche/index.astro` | component-inline | component-owner-unresolved | 7072 | 52 | 0 | 0 |
| `apps/pfotentechnik/src/components/product-experience-2/PriceBox2.astro` | product | product-experience | 6331 | 52 | 0 | 0 |
| `apps/pfotentechnik/src/pages/admin/seo/topical-authority.astro` | admin | admin-seo-copilot | 6172 | 96 | 0 | 0 |
| `apps/pfotentechnik/src/components/admin/ResearchWorkbench.astro` | admin | admin-seo-copilot | 5854 | 76 | 0 | 0 |
| `apps/pfotentechnik/src/components/guide/GuideExperience.astro` | component-inline | component-owner-unresolved | 5626 | 61 | 0 | 0 |
| `apps/pfotentechnik/src/styles/foundation/foundation-33.css` | global | design-system | 5589 | 59 | 0 | 2 |
| `packages/affiliate-core/src/components/EditorialScore.astro` | component-inline | component-owner-unresolved | 5302 | 40 | 0 | 0 |
| `apps/pfotentechnik/src/components/product-experience-2/ProductVerdict2.astro` | product | product-experience | 5152 | 41 | 0 | 0 |
| `packages/affiliate-core/src/components/ImageLightbox.astro` | component-inline | component-owner-unresolved | 5086 | 40 | 0 | 0 |
| `apps/pfotentechnik/src/pages/kaufberatung.astro` | component-inline | component-owner-unresolved | 4877 | 35 | 0 | 0 |

## Sichere Löschkandidaten

Keine automatisch sicher löschbaren Dateien gefunden.

## Sicherheitsgrenze

Nicht importiert bedeutet nicht automatisch ungenutzt. Dynamische Astro-Klassen, class:list, direkte Layout-Imports und bedingte Komponenten werden daher nur gemeldet.

