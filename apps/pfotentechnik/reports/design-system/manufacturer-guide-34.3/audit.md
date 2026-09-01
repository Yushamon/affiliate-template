# PfotenTechnik Manufacturer + Guide Experience 34.3 — Production Audit

Audit completed before production implementation. The current production build and source architecture were inspected; the representative runtime measurements are preserved in `before-metrics.json`.

## Inventory

### Manufacturer

- 32 static production routes at `/hersteller/[manufacturer]/`, rendered by `src/pages/hersteller/[manufacturer].astro`.
- One content collection and schema: `src/content/manufacturers/*.md` and `src/content/schema/manufacturer.ts`.
- Portfolio depth ranges from 1 product (14 manufacturers) to 16 products (PETKIT and PETLIBRO). Product-category breadth ranges from 1 to 4; series data ranges from 0 to 9 entries.
- The route itself performs product discovery, featured-product selection, alternative-manufacturer resolution, related-content resolution, breadcrumbs and next-step construction. There is no manufacturer ViewModel.
- The only dedicated component is `ManufacturerOverviewHero.astro`; the rest of the page is a large route-local template and route-local CSS cascade.
- Shared systems in production: `ProjectLayout`, Breadcrumbs, FAQ, RelatedArticles, DecisionNextSteps, OptimizedImage, editorial scoring, content registry and recommendation-link resolver.
- Schema in production: Organization, Article, ImageObject, BreadcrumbList and FAQPage where visible FAQs exist.

### Guide / Ratgeber

- 82 static root content routes are loaded from `src/content/pages/*.md`; six are frozen Category/Hub routes, leaving 76 routes using the generic guide/article branch in `src/pages/[slug].astro`.
- Existing metadata supports a generic four-way classification without a required schema addition: problem/symptom, buying/selection, how-to/maintenance and technology/explanation. Initial derivation finds approximately 10 problem, 30 buying, 13 how-to and 23 explanation guides; the exact classification is resolved by metadata plus generic title/content signals.
- 47 of 76 guide routes have explicit hero media; 29 currently use a generic project fallback. Forty-four have Premium blocks, 69 have FAQ content, 46 have a recommendation journey and eight directly identify comparison products.
- The route composes `assembleContentPage`, decision rules, AutoContentBlocks, EditorialEvidence, PremiumRenderer, AutoLinkContent, rendered Markdown, DecisionJourney, DecisionNextSteps, HealthBridge, FAQ, RelatedArticles and ConversionJourney.
- Page content schema already carries `contentPlatform.intent`, structured summary/checklist/mistakes, `premiumBlocks`, recommendation journeys, comparison products, hero media, FAQ and SEO metadata. No new field is required for 34.3.
- Schema in production: Organization, Article, ImageObject, BreadcrumbList and FAQPage where visible FAQs exist.

## Representative BEFORE metrics at 375 px

| Metric | Manufacturer `/hersteller/petkit/` | Guide `/futterautomat-richtig-reinigen/` |
|---|---:|---:|
| Response HTML bytes | 65,237 | 130,012 |
| Browser HTML bytes | 66,610 | 132,884 |
| Main DOM nodes | 406 | 1,612 |
| Loaded image bytes | 194,406 | 144,434 |
| Content images | 23 | 10 |
| Document height | 21,729 px | 63,969 px |
| Internal links | 32 | 94 |
| Major sections | 12 | 6 |
| Card/surface-like elements | 29 | 14 |
| Hydrated JS bytes | 0 | 0 |
| Visible text words | 1,274 | 5,668 |

The one reported zero-size image on each route is the shared empty lightbox target (`alt="Vergrößerte Bildansicht"`), not content media. Loaded content images decode. The empty target is still a weak runtime media signal and must be excluded from content-media validity checks or initialized only when opened.

## A. Useful systems to preserve

- Static Astro routes, content collections and server-rendered Markdown.
- Existing URL, title, description, canonical, H1, author/date and breadcrumb contracts.
- Article, Breadcrumb and visible FAQ schema generation.
- Manufacturer product relations, category arrays, series, suitability, evidence/source and alternative-manufacturer data.
- Guide `contentPlatform`, Premium blocks, decision rules, recommendation journeys, FAQ, source/evidence and internal-link definitions.
- Generic optimized-image pipeline, generic product-media resolver, canonical ProductScore, Foundation typography/tokens, header/footer and native details.
- Existing body copy and long-tail chapters. The work is recomposition, not deletion.

## B. Duplicated or weak presentation

- Manufacturer pages show featured products and then repeat the full portfolio in a second flat product list. Product families, recommendations, profile facts, strengths, experience and alternatives are mostly rendered as equally weighted card grids.
- The manufacturer hero presents recommendation, summary, rating and external website but does not immediately expose category breadth, portfolio size, brand orientation or a meaningful place to start.
- Guide pages can stack AutoContentBlocks, EditorialEvidence, PremiumRenderer, decision recommendations, decision rules, full Markdown, DecisionJourney, FAQ, ConversionJourney and RelatedArticles without a single editorial hierarchy owning the page.
- Guide table of contents precedes the actual answer. Guides without Premium blocks receive a generic hero image and may defer the first useful orientation deep into the page.

## C. Legacy architecture still in production

- Manufacturer route contains a client-side DOM-scanning score normalizer with MutationObserver. It searches broad class fragments and manufactures a second score presentation instead of rendering the canonical ProductScore directly.
- Manufacturer route retains large unused `.manufacturer-hero` CSS and multiple historical cascade patches even though the production hero is `pt-manufacturer-overview`.
- Manufacturer selection relies first on manually listed `featuredProductSlugs`; only the empty-state fallback is data-driven.
- The guide renderer contains route-local style generations and legacy money-page modules in one large file.
- The generic non-recommendation `ConversionJourney` is hard-coded to Futterautomaten, comparisons and feeder cleaning, including on unrelated GPS, camera, fountain and health guides.

## D. Overly long sections

- The representative manufacturer is 21,729 px tall at 375 px. Profile, experience, strengths, series and repeated product sections remain fully expanded.
- The representative guide is 63,969 px tall with 1,612 nodes. Long-form depth is useful, but orientation, repeated automated modules and secondary evidence are not progressively staged.
- FAQ remains server-rendered and uses disclosure, but seven disclosures plus repeated prior answers can dominate the closing portion.

## E. Card overuse

- Manufacturer: 29 card/surface-like elements on the representative route. Stats, suitability, products, series, profile, experience and alternatives all acquire bordered/filled containers.
- Guide: cards originate from Premium blocks, recommendation blocks, decision rules and generic journeys. The page alternates many visually equal boxes instead of chapters with typography and dividers.
- Dark mode consequently becomes a stack of adjacent navy surfaces; Light mode becomes white cards on off-white.

## F. Missing decision hierarchy

- Manufacturer has no explicit “Wo solltest du anfangen?” requirement entry and does not group the portfolio by meaningful product family before listing products.
- Brand alternatives are other manufacturer cards; relevant comparison routes are not given the stronger editorial-independence role.
- Guides have no single Guide Experience owner. The direct answer depends on optional data and can appear after the table of contents, generic evidence or product modules.
- Guide type does not currently influence product discovery or the contextual next step.

## G. Missing or weak media

- Manufacturer hero media is schema-required and all 32 entries provide it, but the current route later repeats many product and alternative-brand images.
- Twenty-nine guides lack explicit media but still render a generic project hero, creating a visually large but weakly informative stage.
- Existing explicit guide images are useful and should remain optional. Routes without relevant media need a compact text hero, not a generic placeholder.

## H. Generic CTAs

- Manufacturer next steps exist but appear late, after catalog-like depth.
- Guide non-recommendation CTAs are Futterautomaten-specific regardless of resolved guide intent.
- Buying guide direct-entry logic can be useful, but its separate module adds another surface and does not generalize to problem, maintenance and explanation guides.

## I. Internal-link opportunities

- Manufacturer → Product exists strongly; Manufacturer → Comparison and Manufacturer → Category are weaker and late.
- Guide auto-linking provides many links, but contextual next steps do not consistently preserve the current cluster and intent.
- SEO Baseline 34.0 reports no broken graph edges and nine natural inbound-link opportunities. Relevant guide-context opportunities include `/hund-hat-durchfall/`, `/katze-an-trinkbrunnen-gewoehnen/`, `/katzentrinkbrunnen-dauerbetrieb-urlaub/`, `/katzentrinkbrunnen-ohne-filter/`, `/trinkbrunnen-fuer-kitten-sicher/`, `/seniorenhunde-richtig-versorgen/` and `/wie-kann-technik-gegen-langeweile-helfen/`. Links should only be added where existing related-content and category context support them.

## J. SEO depth to preserve and progressively stage

- All Markdown body chapters, useful native tables/lists, citations, health caveats, FAQ answers and sources remain indexable and server-rendered.
- Brand profile, service, app, replacement-part, warranty, experience and source information remains available but should become secondary disclosure/depth.
- The current canonical, metadata, H1, breadcrumb and schema inputs are independent of visual composition and should not change.

## K. Orphan-link opportunities from SEO Baseline 34.0

- The 34.0 graph has 57,835 edges, 0 broken targets and nine warnings. Product/manufacturer discovery reports currently show 0 orphan products and 0 orphan manufacturers.
- 34.3 should improve contextual ownership for relevant guide warnings, not increase raw link counts or insert link dumps.

## L. Performance problems

- Manufacturer repeats image-heavy featured and full-product modules; PETKIT loads 23 images and 194 KB at mobile width.
- Guide has no hydrated framework JS, which must be preserved, but the representative HTML is 130 KB and the main DOM is 1,612 nodes.
- The manufacturer MutationObserver and broad DOM normalization are unnecessary client work even though their inline bytes are not reported as a fetched script.
- Generic fallback hero media and repeated modules increase layout height without proportional decision value.

## Audit conclusion

The production data and SEO contracts are strong enough for one systemic Manufacturer Portfolio ViewModel and one systemic Guide Experience ViewModel. The repair should replace route-local catalog composition and generic article stacking, retain the existing content body and schema inputs, use no slug-specific branches, and add no client JavaScript.
