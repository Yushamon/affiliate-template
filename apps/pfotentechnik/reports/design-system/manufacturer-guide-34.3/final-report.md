# PfotenTechnik Manufacturer + Guide Experience 34.3 — Final Report

## 1. BEFORE

The preimplementation inventory found 32 manufacturer routes and 76 generic guide routes (82 root content pages minus six frozen Category/Hub routes). Manufacturers were a route-local catalog composition with duplicated product presentation and a client-side score normalizer. Guides stacked automatic, premium, decision, evidence and conversion modules without one hierarchy. The representative manufacturer was 21,729 px tall at 375 px with 23 images and 29 card-like surfaces; the representative guide was 63,969 px tall with 1,612 DOM nodes. Full findings and original metrics are in `audit.md` and `before-metrics.json`.

## 2. Architecture

Production now has one generic `ManufacturerExperience` backed by `buildManufacturerExperienceModel`, and one generic `GuideExperience` backed by `buildGuideExperienceModel`. Both use the shared Foundation and static Astro output. The frozen Category/Hub branch remains on 34.2. See `architecture.md` for data flow and ownership.

## 3. Manufacturer journey

The page opens with portfolio size, product-area breadth and a supported orientation, then provides three to five data-derived start paths. Products are grouped by actual category instead of a flat grid. Three to five current, evidence-aware, score-ranked and category-diverse products use the canonical ProductScore and generic media resolver. Structured differences render only when the data contains at least two real values. Relevant comparisons and alternative manufacturers provide an explicit editorial exit. Brand history, service, experience and sources remain server-rendered in progressive depth.

## 4. Guide journey

Existing metadata and generic signals derive problem, buying, how-to and explanation compositions through one renderer. A concise answer appears in the hero, followed by a high-information summary and table of contents. The complete original long form is server-rendered, open and directly readable without interaction at every viewport. Contextual products, when relevant, follow the article and explain user fit through “Interessant, wenn …”; no renderer, selection-policy or catalogue-defence copy is exposed. Only secondary depth, FAQ answers and evidence detail may use disclosure. FAQ now precedes contextual next steps. Explicit media is preserved; routes without a relevant image use a compact text hero.

## 5. Cross-page coverage

Browser QA covers PETKIT (many products/multiple categories), PETLIBRO (many products), Aqara (few products) and Pawsync (sparse data). Guide coverage includes buying, problem, how-to, explanation/technology, media-rich and sparse content across six routes. All ten routes pass every one of nine widths and both themes: 180/180 combinations. `browser-qa.json` records coverage, classification, fallback use, primary-article visibility, absence of a guide gate, secondary disclosure checks and media/score geometry.

## 6. Internal-link delta

Representative PETKIT internal links changed from 32 to 48 because the journey now exposes grouped Product, Category, Comparison and alternative-Manufacturer destinations. The representative guide changed from 94 to 91 after removal of generic feeder/conversion link dumping. The current strict target audit reports 367 pages, 0 errors and 0 warnings. The strict graph audit reports 243 content documents, 0 errors, 0 critical findings and the same nine natural opportunities documented by the 34.0 baseline. No unsupported link was inserted merely to silence a warning.

## 7. SEO/schema delta

URLs, canonicals, titles, meta descriptions, H1 intent, indexability, author/date metadata, breadcrumbs, Article schema and visible FAQ schema are preserved. Full guide Markdown remains server-rendered; manufacturer evidence is recomposed rather than discarded. Technical SEO passes source and built-output validation. Representative guide and manufacturer JSON-LD parse and contain Organization, Article, ImageObject, BreadcrumbList and FAQPage. Release-build-output strict and comparison-schema audits pass.

## 8. Performance delta

| Metric at 375 px | PETKIT before | PETKIT after | Cleaning guide before | Cleaning guide after |
|---|---:|---:|---:|---:|
| Response HTML | 65,237 B | 71,851 B | 130,012 B | 124,290 B |
| DOM nodes | 406 | 518 | 1,612 | 1,565 |
| Content images | 23 | 7 | 10 | 9 |
| Uncached image bytes | 194,406 B | 55,944 B | 144,434 B | 167,556 B |
| Document height | 21,729 px | 12,834 px | 63,969 px | 66,919 px |
| Card-like surfaces | 29 | 5 | 14 | 5 |
| Hydrated JS | 0 B | 0 B | 0 B | 0 B |

PETKIT trades modest HTML/DOM growth for an explicit structured journey while cutting images by 70%, uncached image transfer by 71%, height by 41% and card surfaces by 83%. The guide cuts HTML by 4.4%, DOM by 2.9% and card surfaces by 64%. Its 66,919 px document height now honestly represents the complete 5,629-word primary article instead of a collapsed initial state; the 4.6% increase from the legacy page is accepted because the primary editorial content must remain directly readable. Transfer remains static and hydrated JS remains zero. The explicit editorial hero uses a higher-quality image variant, explaining its image-byte increase. PETLIBRO, the largest audited manufacturer, finishes at 84,452 HTML bytes, 746 DOM nodes and 0 JS with no performance warning. The 30-check viewport performance contract passes.

The repository-wide diagnostic still reports three out-of-scope pre-existing errors on frozen `/vergleiche/beste-futterautomaten-fuer-katzen/` (HTML/DOM) and `/produkt/petlibro-granary-2-vision/` (CSS). No 34.3 Manufacturer or Guide route has a remaining finding; frozen page types were not changed to mask those debts.

## 9. Accessibility

All journey links and secondary summaries expose at least 44 px touch geometry in the browser matrix. Real keyboard traversal verifies a visible outline or Foundation focus ring. The primary guide article is a semantic section/article pair rather than a disclosure; headings, lists, descriptions, tables and optional secondary disclosures remain semantic. The Foundation contrast audit passes all 38 tested Light/Dark combinations at WCAG AA thresholds.

## 10. Responsive QA

Automated checks at 320, 375, 430, 768, 820, 1024, 1280, 1440 and 1600 validate `clientWidth === scrollWidth`, no hero overlap, no clipped non-ellipsis text, contained/scrollable tables, CTA geometry, touch targets, focus, valid scores and decoded visible media. Every Guide check additionally requires visible primary-article geometry, no closed disclosure ancestor and no legacy guide-gate copy. Secondary details also pass in their fully opened state: 180/180.

## 11. Light/Dark

Both renderers use semantic Foundation tokens only, without local theme branches, hard-coded UI colors or `!important`. Light uses typography, whitespace and dividers instead of repeated white cards. Dark keeps the page plane dominant and limits navy surfaces to functional disclosure/related-content boundaries. Light and Dark pass the full browser matrix and contrast audit.

## 12. Visual self-review

All eight final full-page screenshots were opened and inspected. PETKIT communicates brand, breadth and starting point immediately, avoids catalog presentation, differentiates selected products and exposes comparisons/alternatives. At 375 px in both themes, the guide moves from answer and four-point orientation through the table of contents directly into “Die kurze Antwort”; there is no gate before the real article. The full article remains the primary experience and contextual next steps stay subordinate. No overlap, malformed score, broken image, giant empty media stage, excessive CTA saturation or dominant FAQ was found.

## 13. Eight screenshot paths

- `final/manufacturer-petkit-375-light-full.png`
- `final/manufacturer-petkit-375-dark-full.png`
- `final/manufacturer-petkit-1600-light-full.png`
- `final/manufacturer-petkit-1600-dark-full.png`
- `final/guide-futterautomat-richtig-reinigen-375-light-full.png`
- `final/guide-futterautomat-richtig-reinigen-375-dark-full.png`
- `final/guide-futterautomat-richtig-reinigen-1600-light-full.png`
- `final/guide-futterautomat-richtig-reinigen-1600-dark-full.png`

Exactly eight PNG files exist in the final directory.

## 14. Build/test results

- Production build: PASS, 367 pages.
- New and migrated 34.3 contracts: PASS, including all seven explicit open-guide UX assertions.
- Foundation suites: PASS, 11/11.
- ProductScore/current consumer coverage: PASS, 25/25.
- Media audit: PASS.
- Strict internal-link targets: PASS, 367 pages, 0 findings.
- Strict internal-link graph: PASS, 0 errors/critical, nine non-critical opportunities.
- Technical SEO and schema: PASS.
- Release-build-output strict: PASS.
- Responsive and browser QA: PASS.
- Contrast: PASS, 38/38.
- Viewport performance contract: PASS, 30/30.
- `git diff --check`: PASS.

## 15. Legacy cleanup

Three proven-unused components were deleted: `ManufacturerOverviewHero.astro`, `AutoContentBlocks.astro` and `ConversionJourney.astro`. The manufacturer MutationObserver, DOM-scanning score normalization, route-local catalog renderer and historical CSS generations were removed. No generic article infrastructure used elsewhere was deleted.

## 16. Test contract migration

Historical assertions were classified A/B/C and either removed with legacy ownership, migrated to the new production contract or retained as genuine regression checks. The final affected test block passes 15/15. Details are recorded in `test-contract-migration.md`.

## 17. Files changed

Production ownership is concentrated in the two route files, two new ViewModels and two new renderer directories. Tests add the 34.3 contract and migrate manufacturer/dark-surface assertions. Audit scripts and the required report/screenshot artifacts live under `scripts/design-system` and `reports/design-system/manufacturer-guide-34.3`. No content entry, schema, global token, header/footer, Product or Comparison renderer was edited for 34.3.

## 18. Remaining genuine non-blocking issues

- The repository-wide performance audit retains the two frozen-route debts identified in section 8; neither is caused by 34.3.
- The optional repository-wide Content Quality audit reports eleven comparison-count mismatches, all on frozen Comparison routes; no Manufacturer/Guide issue is reported.
- Content-discovery sync has six existing generated-link drifts, including three frozen Category pages; strict built-link target safety is nevertheless 0/0.
- The shared image lightbox contains an empty zero-size target until opened (`alt="Vergrößerte Bildansicht"`). Content-media checks exclude that intentional target; all actual content images decode with positive intrinsic and visible dimensions.

## Final status

PFOTENTECHNIK MANUFACTURER + GUIDE EXPERIENCE 34.3

MANUFACTURER PORTFOLIO JOURNEY: PASS
GUIDE EDITORIAL JOURNEY: PASS
CONTEXTUAL NEXT STEPS: PASS
INTERNAL LINK SAFETY: PASS
SEO / SCHEMA SAFETY: PASS
LEGACY CLEANUP: PASS
TEST CONTRACT MIGRATION: PASS
PERFORMANCE: PASS
LIGHT MODE: PASS
DARK MODE: PASS
RESPONSIVE: PASS

MANUFACTURER + GUIDE EXPERIENCE: FINAL FROZEN
READY FOR SEO / QUALITY CLOSEOUT 34.4
