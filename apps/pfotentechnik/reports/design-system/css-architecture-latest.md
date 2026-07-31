# CSS Architecture Audit

Erzeugt: 2026-07-31T11:13:03.983Z

## Zusammenfassung

- CSS-Dateien: 25
- Astro-Dateien mit Style-Block: 53
- Quell-CSS: 745510 Bytes
- Regeln: 8045
- !important-Deklarationen: 1649
- mehrfach definierte Selektoren: 1538
- identische Deklarationsblöcke: 1034
- Importkanten: 37
- kaputte CSS-Imports: 0
- nicht statisch importierte CSS-Dateien: 0
- sichere Löschkandidaten: 0

## Ownership

| Owner | Dateien | Bytes | Regeln | !important |
|---|---:|---:|---:|---:|
| design-system | 19 | 303196 | 4094 | 971 |
| comparison-platform | 4 | 151695 | 1249 | 279 |
| editorial-content | 1 | 28892 | 172 | 258 |
| manufacturer-pages | 3 | 25513 | 379 | 84 |
| component-owner-unresolved | 23 | 100880 | 894 | 32 |
| product-experience | 21 | 96644 | 821 | 20 |
| admin-seo-copilot | 5 | 27363 | 353 | 5 |
| navigation | 2 | 11327 | 83 | 0 |

## Größte Problemdateien

| Datei | Kategorie | Owner | Bytes | Regeln | !important | importiert von |
|---|---|---|---:|---:|---:|---:|
| `apps/pfotentechnik/src/styles/pfotentechnik-design-system.css` | global | design-system | 134170 | 2306 | 753 | 1 |
| `packages/affiliate-core/src/components/comparison/comparison-system.css` | comparison | comparison-platform | 135639 | 1119 | 278 | 1 |
| `packages/affiliate-core/src/renderer/PremiumRenderer.astro` | component-inline | editorial-content | 28892 | 172 | 258 | 0 |
| `apps/pfotentechnik/src/styles/pfotentechnik-ui-system.css` | global | design-system | 25628 | 290 | 211 | 1 |
| `apps/pfotentechnik/src/pages/hersteller/[manufacturer].astro` | manufacturer | manufacturer-pages | 16698 | 266 | 57 | 0 |
| `apps/pfotentechnik/src/pages/hersteller/index.astro` | manufacturer | manufacturer-pages | 5348 | 83 | 27 | 0 |
| `packages/affiliate-core/src/components/home/home.css` | component | component-owner-unresolved | 24350 | 240 | 15 | 1 |
| `packages/affiliate-core/src/components/product/ProductReview.astro` | product | product-experience | 14307 | 132 | 8 | 0 |
| `apps/pfotentechnik/src/components/DecisionNextSteps.astro` | component-inline | component-owner-unresolved | 10878 | 77 | 8 | 0 |
| `apps/pfotentechnik/src/pages/[slug].astro` | component-inline | component-owner-unresolved | 5832 | 46 | 7 | 0 |
| `packages/affiliate-core/src/components/product/AlternativeRecommendationCard.astro` | product | product-experience | 5977 | 34 | 6 | 0 |
| `apps/pfotentechnik/src/components/product-experience-2/ProductDetails2.astro` | product | product-experience | 3827 | 47 | 6 | 0 |
| `apps/pfotentechnik/src/styles/pfotentechnik-product-mobile-premium.css` | global | design-system | 14792 | 136 | 5 | 1 |
| `apps/pfotentechnik/src/styles/pfotentechnik.css` | global | design-system | 17105 | 184 | 2 | 1 |
| `apps/pfotentechnik/src/components/advisor/PetAdvisor.astro` | component-inline | component-owner-unresolved | 8286 | 85 | 2 | 0 |
| `apps/pfotentechnik/src/pages/admin/seo/prices.astro` | admin | admin-seo-copilot | 7541 | 91 | 2 | 0 |
| `apps/pfotentechnik/src/components/admin/SearchIntegrations.astro` | admin | admin-seo-copilot | 3222 | 39 | 2 | 0 |
| `packages/affiliate-core/src/components/comparison/comparison-explorer-v2.css` | comparison | comparison-platform | 12463 | 101 | 1 | 1 |
| `apps/pfotentechnik/src/pages/admin/seo/media.astro` | admin | admin-seo-copilot | 7477 | 86 | 1 | 0 |
| `packages/affiliate-core/src/styles/product.css` | product | product-experience | 35078 | 283 | 0 | 2 |
| `packages/affiliate-core/src/styles/premium-page.css` | global | design-system | 34192 | 305 | 0 | 2 |
| `packages/affiliate-core/src/styles/article.css` | global | design-system | 14434 | 143 | 0 | 2 |
| `apps/pfotentechnik/src/components/product-experience-2/ProductDecisionAssistant.astro` | product | product-experience | 11823 | 99 | 0 | 0 |
| `apps/pfotentechnik/src/styles/pfotentechnik-visual-density.css` | global | design-system | 11775 | 149 | 0 | 1 |
| `apps/pfotentechnik/src/styles/seo-admin.css` | global | design-system | 10582 | 134 | 0 | 1 |
| `packages/affiliate-core/src/styles/misc.css` | global | design-system | 9749 | 108 | 0 | 2 |
| `packages/affiliate-core/src/components/Header.astro` | component-inline | navigation | 7141 | 48 | 0 | 0 |
| `packages/affiliate-core/src/styles/home.css` | global | design-system | 6844 | 69 | 0 | 2 |
| `apps/pfotentechnik/src/styles/pfotentechnik-primitives.css` | global | design-system | 5473 | 75 | 0 | 1 |
| `apps/pfotentechnik/src/pages/admin/seo/topical-authority.astro` | admin | admin-seo-copilot | 5012 | 86 | 0 | 0 |
| `packages/affiliate-core/src/components/ImageLightbox.astro` | component-inline | component-owner-unresolved | 4861 | 40 | 0 | 0 |
| `apps/pfotentechnik/src/pages/kaufberatung.astro` | component-inline | component-owner-unresolved | 4654 | 35 | 0 | 0 |
| `apps/pfotentechnik/src/components/advisor/FeederAdvisor.astro` | component-inline | component-owner-unresolved | 4613 | 61 | 0 | 0 |
| `apps/pfotentechnik/src/components/EditorialTransparency.astro` | component-inline | component-owner-unresolved | 4566 | 37 | 0 | 0 |
| `packages/affiliate-core/src/components/EditorialScore.astro` | component-inline | component-owner-unresolved | 4553 | 39 | 0 | 0 |
| `apps/pfotentechnik/src/components/AutoContentBlocks.astro` | component-inline | component-owner-unresolved | 4400 | 61 | 0 | 0 |
| `packages/affiliate-core/src/styles/header-footer.css` | global | navigation | 4186 | 35 | 0 | 2 |
| `packages/affiliate-core/src/styles/ui.css` | global | design-system | 4127 | 49 | 0 | 2 |
| `apps/pfotentechnik/src/components/admin/SeoWorkPackages.astro` | admin | admin-seo-copilot | 4111 | 51 | 0 | 0 |
| `apps/pfotentechnik/src/pages/vergleiche/index.astro` | component-inline | component-owner-unresolved | 4108 | 32 | 0 | 0 |

## Sichere Löschkandidaten

Keine automatisch sicher löschbaren Dateien gefunden.

## Sicherheitsgrenze

Nicht importiert bedeutet nicht automatisch ungenutzt. Dynamische Astro-Klassen, class:list, direkte Layout-Imports und bedingte Komponenten werden daher nur gemeldet.

