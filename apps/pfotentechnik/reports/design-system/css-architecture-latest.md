# CSS Architecture Audit

Erzeugt: 2026-09-01T08:28:47.510Z

## Zusammenfassung

- CSS-Dateien: 45
- Astro-Dateien mit Style-Block: 64
- Quell-CSS: 717985 Bytes
- Regeln: 7624
- !important-Deklarationen: 1202
- mehrfach definierte Selektoren: 1491
- identische Deklarationsblöcke: 956
- Importkanten: 72
- kaputte CSS-Imports: 0
- nicht statisch importierte CSS-Dateien: 3
- sichere Löschkandidaten: 3

## Ownership

| Owner | Dateien | Bytes | Regeln | !important |
|---|---:|---:|---:|---:|
| design-system | 36 | 307434 | 3960 | 857 |
| editorial-content | 1 | 28810 | 172 | 255 |
| manufacturer-pages | 4 | 24605 | 290 | 45 |
| component-owner-unresolved | 26 | 120309 | 1026 | 17 |
| product-experience | 28 | 133489 | 1133 | 14 |
| comparison-platform | 7 | 58907 | 543 | 9 |
| admin-seo-copilot | 6 | 34290 | 439 | 5 |
| navigation | 1 | 10141 | 61 | 0 |

## Größte Problemdateien

| Datei | Kategorie | Owner | Bytes | Regeln | !important | importiert von |
|---|---|---|---:|---:|---:|---:|
| `apps/pfotentechnik/src/styles/pfotentechnik-design-system.css` | global | design-system | 115914 | 2042 | 639 | 1 |
| `packages/affiliate-core/src/renderer/PremiumRenderer.astro` | component-inline | editorial-content | 28810 | 172 | 255 | 0 |
| `apps/pfotentechnik/src/styles/pfotentechnik-ui-system.css` | global | design-system | 25628 | 290 | 211 | 1 |
| `apps/pfotentechnik/src/pages/hersteller/index.astro` | manufacturer | manufacturer-pages | 6155 | 83 | 27 | 0 |
| `apps/pfotentechnik/src/pages/hersteller/[manufacturer].astro` | manufacturer | manufacturer-pages | 11577 | 156 | 18 | 0 |
| `packages/affiliate-core/src/components/comparison/comparison-experience.css` | comparison | comparison-platform | 43052 | 352 | 9 | 2 |
| `packages/affiliate-core/src/components/product/ProductReview.astro` | product | product-experience | 14242 | 132 | 8 | 0 |
| `apps/pfotentechnik/src/components/DecisionNextSteps.astro` | component-inline | component-owner-unresolved | 10878 | 77 | 8 | 0 |
| `apps/pfotentechnik/src/pages/[slug].astro` | component-inline | component-owner-unresolved | 5802 | 46 | 7 | 0 |
| `packages/affiliate-core/src/components/product/AlternativeRecommendationCard.astro` | product | product-experience | 5977 | 34 | 6 | 0 |
| `apps/pfotentechnik/src/styles/pfotentechnik-product-mobile-premium.css` | global | design-system | 13890 | 136 | 5 | 1 |
| `apps/pfotentechnik/src/styles/pfotentechnik.css` | global | design-system | 15785 | 167 | 2 | 1 |
| `apps/pfotentechnik/src/components/advisor/PetAdvisor.astro` | component-inline | component-owner-unresolved | 8286 | 85 | 2 | 0 |
| `apps/pfotentechnik/src/pages/admin/seo/prices.astro` | admin | admin-seo-copilot | 7541 | 91 | 2 | 0 |
| `apps/pfotentechnik/src/components/admin/SearchIntegrations.astro` | admin | admin-seo-copilot | 3222 | 39 | 2 | 0 |
| `apps/pfotentechnik/src/pages/admin/seo/media.astro` | admin | admin-seo-copilot | 7477 | 86 | 1 | 0 |
| `packages/affiliate-core/src/styles/premium-page.css` | global | design-system | 34192 | 305 | 0 | 2 |
| `packages/affiliate-core/src/styles/product.css` | product | product-experience | 32993 | 265 | 0 | 2 |
| `packages/affiliate-core/src/components/home/home.css` | component | component-owner-unresolved | 19287 | 207 | 0 | 1 |
| `apps/pfotentechnik/src/components/category/CategoryExperience.astro` | component-inline | component-owner-unresolved | 18003 | 143 | 0 | 0 |
| `packages/affiliate-core/src/styles/article.css` | global | design-system | 14434 | 143 | 0 | 2 |
| `apps/pfotentechnik/src/styles/pfotentechnik-design-tokens.css` | global | design-system | 13655 | 13 | 0 | 1 |
| `apps/pfotentechnik/src/components/product-experience-2/ProductDecisionAssistant.astro` | product | product-experience | 11825 | 99 | 0 | 0 |
| `apps/pfotentechnik/src/components/comparison/ComparisonProduction.astro` | comparison | comparison-platform | 11768 | 161 | 0 | 0 |
| `apps/pfotentechnik/src/styles/pfotentechnik-visual-density.css` | global | design-system | 10289 | 130 | 0 | 1 |
| `packages/affiliate-core/src/components/Header.astro` | component-inline | navigation | 10141 | 61 | 0 | 0 |
| `packages/affiliate-core/src/styles/misc.css` | global | design-system | 10054 | 112 | 0 | 2 |
| `apps/pfotentechnik/src/components/product-experience-2/ProductExperience2.astro` | product | product-experience | 10041 | 86 | 0 | 0 |
| `apps/pfotentechnik/src/components/product-experience-2/product-gallery-29.css` | product | product-experience | 9830 | 73 | 0 | 1 |
| `apps/pfotentechnik/src/components/product-experience-2/ProductHero2.astro` | product | product-experience | 7236 | 67 | 0 | 0 |
| `packages/affiliate-core/src/styles/home.css` | global | design-system | 6844 | 69 | 0 | 2 |
| `apps/pfotentechnik/src/pages/admin/seo/topical-authority.astro` | admin | admin-seo-copilot | 6085 | 96 | 0 | 0 |
| `apps/pfotentechnik/src/components/admin/ResearchWorkbench.astro` | admin | admin-seo-copilot | 5854 | 76 | 0 | 0 |
| `apps/pfotentechnik/src/styles/foundation/foundation-33.css` | global | design-system | 5536 | 59 | 0 | 2 |
| `apps/pfotentechnik/src/styles/pfotentechnik-primitives.css` | global | design-system | 5473 | 75 | 0 | 1 |
| `packages/affiliate-core/src/components/EditorialScore.astro` | component-inline | component-owner-unresolved | 5096 | 40 | 0 | 0 |
| `apps/pfotentechnik/src/pages/vergleiche/index.astro` | component-inline | component-owner-unresolved | 4976 | 32 | 0 | 0 |
| `apps/pfotentechnik/src/components/product-experience-2/ProductVerdict2.astro` | product | product-experience | 4949 | 42 | 0 | 0 |
| `packages/affiliate-core/src/components/ImageLightbox.astro` | component-inline | component-owner-unresolved | 4841 | 40 | 0 | 0 |
| `apps/pfotentechnik/src/pages/kaufberatung.astro` | component-inline | component-owner-unresolved | 4654 | 35 | 0 | 0 |

## Sichere Löschkandidaten

- `packages/affiliate-core/src/components/comparison/comparison-explorer-v2.css`: empty-or-comments-only
- `packages/affiliate-core/src/components/comparison/comparison-system.css`: empty-or-comments-only
- `packages/affiliate-core/src/components/comparison/comparison-tokens.css`: empty-or-comments-only

## Sicherheitsgrenze

Nicht importiert bedeutet nicht automatisch ungenutzt. Dynamische Astro-Klassen, class:list, direkte Layout-Imports und bedingte Komponenten werden daher nur gemeldet.

