# PfotenTechnik Manufacturer + Guide Experience 34.3 — Architecture

## One Foundation, two journeys

34.3 adds no page-type design system. Both experiences inherit `ProjectLayout`, the shared 33.x semantic tokens, header/footer, breadcrumbs, typography, `OptimizedImage`, `ProductScore`, FAQ and related-content systems. Page-type composition is isolated to one ViewModel and one Astro renderer per family.

## Manufacturer Portfolio Journey

- Route: `src/pages/hersteller/[manufacturer].astro`
- ViewModel: `src/domain/manufacturerExperience/model.ts`
- Renderer: `src/components/manufacturer/ManufacturerExperience.astro`
- Inputs: manufacturer entry plus the current product, comparison and manufacturer registries.
- Derivation: product membership, category families, current-product state, score, evidence/completeness, suitability, structured specifications, relevant comparisons and alternative manufacturers.
- Output order: restrained orientation hero → 3–5 start paths → grouped families → 3–5 selected products → supported differences → fit → comparison/brand exits → progressive evidence.
- Fallbacks: sparse portfolios remain compact; differences disappear when fewer than two structured values exist; a brand exit is used when no defensible comparison contains the manufacturer.
- Runtime: static Astro output, CSS and native `details`; no client script or DOM normalization.

The selected-product algorithm is manufacturer-agnostic. It excludes discontinued/archived candidates, weights explicit evidence and data completeness, orders by score and recency signals, and diversifies across categories before filling remaining places. It uses the shared media resolver and canonical `ProductScore`.

## Guide Editorial Decision Journey

- Route: the non-Category branch of `src/pages/[slug].astro`
- ViewModel: `src/domain/guideExperience/model.ts`
- Renderer: `src/components/guide/GuideExperience.astro`
- Inputs: the page entry, assembled content metadata, current products, comparisons and related pages.
- Classification: one generic four-way type (`problem`, `buying`, `how-to`, `explanation`) derived from existing `contentPlatform.intent`, health/troubleshooting metadata and generic German intent signals. No content-schema field was added.
- Output order: early answer and optional explicit hero media → compact quick summary → table of contents and complete open long form → contextual products only for buying intent → secondary structured depth/evidence/FAQ → contextual next steps.
- Product rule: only buying guides may render selected products; other guide types prefer relevant category, comparison or guide destinations.
- Media rule: explicit existing media renders through `OptimizedImage`; absent media produces a compact text hero, never a generic decorative fallback.
- Runtime: the full Markdown body remains server-rendered and indexable inside native `details`; there is no hydration JavaScript.

## Frozen route protection

The Category/Hub branch in `src/pages/[slug].astro` remains owned by `CategoryExperience` 34.2. Homepage, Product, Comparison, automatic finalist selection, Product Fit, Comparison Fit, global tokens and the global shell were not modified by the 34.3 production implementation. Contract tests protect the Category branch and shared score ownership.

## SEO and linking contracts

The routes continue to supply their prior URL, canonical, title, meta description, H1 intent, author/dates, breadcrumbs, Article schema and visible FAQ data to `ProjectLayout`. The guide body and manufacturer structured evidence remain present in production HTML. Next steps only target registry-backed pages; strict target and graph audits validate the output.

## Removed legacy ownership

- `ManufacturerOverviewHero.astro`: superseded by the single Manufacturer Experience.
- `AutoContentBlocks.astro`: superseded by the Guide ViewModel’s answer/summary/depth composition.
- `ConversionJourney.astro`: removed after proving no remaining production/test references; generic feeder CTAs are replaced by current-topic next steps.
- Manufacturer route-local score normalizer and `MutationObserver`: replaced by server-rendered canonical `ProductScore`.

The classification and migration decision for every affected historical test is recorded in `test-contract-migration.md`.
