# CSS Architecture Audit

Erzeugt: 2026-07-31T18:58:17.970Z

## Zusammenfassung

- CSS-Dateien: 42
- Astro-Dateien mit Style-Block: 53
- Quell-CSS: 743121 Bytes
- Regeln: 8036
- !important-Deklarationen: 1624
- mehrfach definierte Selektoren: 1536
- identische Deklarationsblöcke: 1027
- Importkanten: 71
- kaputte CSS-Imports: 0
- nicht statisch importierte CSS-Dateien: 0
- sichere Löschkandidaten: 0

## Ownership

| Owner | Dateien | Bytes | Regeln | !important |
|---|---:|---:|---:|---:|
| design-system | 34 | 302994 | 4088 | 950 |
| comparison-platform | 5 | 150378 | 1247 | 278 |
| editorial-content | 1 | 28810 | 172 | 255 |
| manufacturer-pages | 3 | 25239 | 379 | 84 |
| component-owner-unresolved | 23 | 100778 | 894 | 32 |
| product-experience | 22 | 96702 | 820 | 20 |
| admin-seo-copilot | 5 | 27363 | 353 | 5 |
| navigation | 2 | 10857 | 83 | 0 |

## Größte Problemdateien

| Datei | Kategorie | Owner | Bytes | Regeln | !important | importiert von |
|---|---|---|---:|---:|---:|---:|
| `apps/pfotentechnik/src/styles/pfotentechnik-design-system.css` | global | design-system | 125457 | 2221 | 732 | 1 |
| `packages/affiliate-core/src/components/comparison/comparison-system.css` | comparison | comparison-platform | 133855 | 1116 | 277 | 1 |
| `packages/affiliate-core/src/renderer/PremiumRenderer.astro` | component-inline | editorial-content | 28810 | 172 | 255 | 0 |
| `apps/pfotentechnik/src/styles/pfotentechnik-ui-system.css` | global | design-system | 25628 | 290 | 211 | 1 |
| `apps/pfotentechnik/src/pages/hersteller/[manufacturer].astro` | manufacturer | manufacturer-pages | 16424 | 266 | 57 | 0 |
| `apps/pfotentechnik/src/pages/hersteller/index.astro` | manufacturer | manufacturer-pages | 5348 | 83 | 27 | 0 |
| `packages/affiliate-core/src/components/home/home.css` | component | component-owner-unresolved | 24350 | 240 | 15 | 1 |
| `packages/affiliate-core/src/components/product/ProductReview.astro` | product | product-experience | 14242 | 132 | 8 | 0 |
| `apps/pfotentechnik/src/components/DecisionNextSteps.astro` | component-inline | component-owner-unresolved | 10878 | 77 | 8 | 0 |
| `apps/pfotentechnik/src/pages/[slug].astro` | component-inline | component-owner-unresolved | 5802 | 46 | 7 | 0 |
| `packages/affiliate-core/src/components/product/AlternativeRecommendationCard.astro` | product | product-experience | 5977 | 34 | 6 | 0 |
| `apps/pfotentechnik/src/components/product-experience-2/ProductDetails2.astro` | product | product-experience | 3827 | 47 | 6 | 0 |
| `apps/pfotentechnik/src/styles/pfotentechnik-product-mobile-premium.css` | global | design-system | 13962 | 136 | 5 | 1 |
| `apps/pfotentechnik/src/styles/pfotentechnik.css` | global | design-system | 17105 | 184 | 2 | 1 |
| `apps/pfotentechnik/src/components/advisor/PetAdvisor.astro` | component-inline | component-owner-unresolved | 8286 | 85 | 2 | 0 |
| `apps/pfotentechnik/src/pages/admin/seo/prices.astro` | admin | admin-seo-copilot | 7541 | 91 | 2 | 0 |
| `apps/pfotentechnik/src/components/admin/SearchIntegrations.astro` | admin | admin-seo-copilot | 3222 | 39 | 2 | 0 |
| `packages/affiliate-core/src/components/comparison/comparison-explorer-v2.css` | comparison | comparison-platform | 12463 | 101 | 1 | 1 |
| `apps/pfotentechnik/src/pages/admin/seo/media.astro` | admin | admin-seo-copilot | 7477 | 86 | 1 | 0 |
| `packages/affiliate-core/src/styles/premium-page.css` | global | design-system | 34192 | 305 | 0 | 2 |
| `packages/affiliate-core/src/styles/product.css` | product | product-experience | 32983 | 265 | 0 | 2 |
| `packages/affiliate-core/src/styles/article.css` | global | design-system | 14434 | 143 | 0 | 2 |
| `apps/pfotentechnik/src/components/product-experience-2/ProductDecisionAssistant.astro` | product | product-experience | 11823 | 99 | 0 | 0 |
| `apps/pfotentechnik/src/styles/pfotentechnik-visual-density.css` | global | design-system | 11775 | 149 | 0 | 1 |
| `packages/affiliate-core/src/styles/misc.css` | global | design-system | 9749 | 108 | 0 | 2 |
| `packages/affiliate-core/src/styles/home.css` | global | design-system | 6844 | 69 | 0 | 2 |
| `packages/affiliate-core/src/components/Header.astro` | component-inline | navigation | 6755 | 48 | 0 | 0 |
| `apps/pfotentechnik/src/styles/pfotentechnik-primitives.css` | global | design-system | 5473 | 75 | 0 | 1 |
| `apps/pfotentechnik/src/pages/admin/seo/topical-authority.astro` | admin | admin-seo-copilot | 5012 | 86 | 0 | 0 |
| `packages/affiliate-core/src/components/ImageLightbox.astro` | component-inline | component-owner-unresolved | 4841 | 40 | 0 | 0 |
| `apps/pfotentechnik/src/pages/kaufberatung.astro` | component-inline | component-owner-unresolved | 4654 | 35 | 0 | 0 |
| `apps/pfotentechnik/src/components/advisor/FeederAdvisor.astro` | component-inline | component-owner-unresolved | 4588 | 61 | 0 | 0 |
| `apps/pfotentechnik/src/components/EditorialTransparency.astro` | component-inline | component-owner-unresolved | 4566 | 37 | 0 | 0 |
| `packages/affiliate-core/src/components/EditorialScore.astro` | component-inline | component-owner-unresolved | 4553 | 39 | 0 | 0 |
| `apps/pfotentechnik/src/components/AutoContentBlocks.astro` | component-inline | component-owner-unresolved | 4373 | 61 | 0 | 0 |
| `apps/pfotentechnik/src/styles/seo-admin-foundation.css` | global | design-system | 4195 | 47 | 0 | 2 |
| `packages/affiliate-core/src/styles/ui.css` | global | design-system | 4127 | 49 | 0 | 2 |
| `apps/pfotentechnik/src/components/admin/SeoWorkPackages.astro` | admin | admin-seo-copilot | 4111 | 51 | 0 | 0 |
| `apps/pfotentechnik/src/pages/vergleiche/index.astro` | component-inline | component-owner-unresolved | 4108 | 32 | 0 | 0 |
| `packages/affiliate-core/src/styles/header-footer.css` | global | navigation | 4102 | 35 | 0 | 2 |

## Sichere Löschkandidaten

Keine automatisch sicher löschbaren Dateien gefunden.

## Sicherheitsgrenze

Nicht importiert bedeutet nicht automatisch ungenutzt. Dynamische Astro-Klassen, class:list, direkte Layout-Imports und bedingte Komponenten werden daher nur gemeldet.

