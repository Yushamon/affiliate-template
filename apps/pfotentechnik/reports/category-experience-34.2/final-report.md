# Category / Hub Experience 34.2 — final report

Date: 2026-09-01  
Status: PASS  
Representative visual freeze: `/smarte-futterautomaten/`

## Architecture and journey

All six commercial hubs now use the existing `[slug].astro` route, one `buildCategoryViewModel()` builder, one `CategoryExperience.astro` renderer and one six-entry editorial configuration. No category has a hand-built route or a product-specific template condition. Product facts remain in product content, comparison facts remain in comparison content, guide metadata remains in page content, product images use the generic comparison media resolver, and scores use the canonical `EditorialScore` component.

The production chapter order is:

1. restrained category orientation
2. six consequence-led requirements
3. three to six decision paths
4. one to four strategic comparisons
5. three to five curated product rows
6. one to five decision-relevant guides
7. compact server-rendered evidence, trust links and native disclosure
8. one clear next step

## Cross-category result

| Category | Requirements | Decision paths | Comparisons | Products | Guides | Evidence | Media fallbacks | Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Smarte Futterautomaten | 6 | 5 | 4 | 4 | 4 | 4 | 0 | PASS |
| Trinkbrunnen | 6 | 6 | 2 | 5 | 5 | 5 | 0 | PASS |
| GPS-Tracker | 6 | 5 | 4 | 5 | 5 | 5 | 0 | PASS |
| Katzenklappen | 6 | 4 | 2 | 5 | 4 | 5 | 0 | PASS |
| Haustierkameras | 6 | 4 | 1 | 5 | 2 | 5 | 0 | PASS |
| Automatische Katzentoiletten | 6 | 4 | 1 | 5 | 1 | 5 | 0 | PASS |

The lower guide counts for cameras and litter boxes are intentional: no unrelated editorial routes were invented merely to fill a template quota.

## Internal-link delta

The old route produced an accidental mixture of body links, auto-links, premium modules, journey modules and related-content links. The new route exposes a smaller intentional graph of requirements, paths, comparisons, products, guides, trust and one closing action.

| Route | Unique main links before | Unique main links after |
| --- | ---: | ---: |
| `/smarte-futterautomaten/` | 80 | 18 |
| `/trinkbrunnen/` | 21 | 18 |
| `/gps-tracker/` | 33 | 19 |
| `/katzenklappen/` | 22 | 15 |
| `/haustierkameras/` | 16 | 12 |
| `/automatische-katzentoiletten/` | 18 | 11 |

The production Trinkbrunnen hub now links five natural candidates from the nine-page SEO 34.0 orphan baseline:

- `/katze-an-trinkbrunnen-gewoehnen/`
- `/katzentrinkbrunnen-dauerbetrieb-urlaub/`
- `/katzentrinkbrunnen-ohne-filter/`
- `/trinkbrunnen-fuer-kitten-sicher/`
- `/produkt/feelneedy-fn-w18-8l-katzenbrunnen/`

This reduces the rendered production orphan set from nine to four. The legacy source-only report still lists nine warnings because it does not parse links in TypeScript editorial configuration; the build-target audit verifies 367 pages with zero broken link targets and the runtime link-health gate has zero errors.

## SEO and schema delta

Across all six routes, URL, title, meta description, H1, canonical, indexability, published/updated metadata, Article schema, Breadcrumb schema and existing FAQ schema are unchanged. No ranking ItemList, Review or AggregateRating schema was introduced. Useful source material remains server-rendered as four or five selected evidence sections; generic filler, duplicated directories and duplicate discovery modules are no longer rendered in the category journey.

The final production build generated 367 pages plus `sitemap-index.xml`. Technical SEO and release-output strict audits pass with zero errors or warnings.

## Performance and density delta

The representative feeder hub no longer owns any category-specific HTML, DOM or image-budget failure.

| Metric | Before | After | Change |
| --- | ---: | ---: | ---: |
| HTML | 133,311 B | 65,967 B | -50.5% |
| DOM | 1,445 | 517 | -64.2% |
| Images | 3,499,826 B | 60,836 B | -98.3% |
| 375px scrollHeight | 59,802 px | 11,770 px | -80.3% |
| Hydrated JS | 0 B | 0 B | unchanged |

The repository performance diagnostic still reports three errors on the frozen Comparison/Product routes and two non-blocking category warnings inherited from the global stylesheet (368,287 B against a 360,000 B warning threshold and 1,109 `!important` uses against 1,100). Category HTML, DOM and image payloads pass; no carousel, client filter, hydration or page-specific palette was added.

## Accessibility, themes and responsive QA

The category output has one H1, semantic sections, ordered lists, navigation landmarks, native `details`/`summary`, accessible canonical score labels, alt text, keyboard-visible focus and 44px minimum interactive height. Foundation contrast passes all 38 semantic combinations. The browser gate asserts geometry rather than relying only on overflow.

Automated browser QA passed all 108 cases: six routes × nine widths (`320`, `375`, `430`, `768`, `820`, `1024`, `1280`, `1440`, `1600`) × Light/Dark. It verifies exact route/theme, `scrollWidth === clientWidth`, section order, heading bounds, media readiness, product/media/score/price geometry, no overlaps, touch targets, focus, details semantics, score accessibility and no white semantic surface in Dark.

Browser evidence: `browser-qa.json`.

## Visual review

All four full-page captures were opened and reviewed. The category is identifiable immediately; requirements precede paths; comparisons remain more prominent than the compact product set; product reasons are specific; media anchors rather than dominates; mobile no longer feels like a directory; desktop alternates reading and decision widths; Light and Dark have the same hierarchy; the closing action is unambiguous; and the page remains recognizably PfotenTechnik.

Final screenshots:

- `reports/design-system/category-34.2/final/category-futterautomaten-375-light-full.png`
- `reports/design-system/category-34.2/final/category-futterautomaten-375-dark-full.png`
- `reports/design-system/category-34.2/final/category-futterautomaten-1600-light-full.png`
- `reports/design-system/category-34.2/final/category-futterautomaten-1600-dark-full.png`

Exactly four PNG files exist in the final freeze directory.

## Build and tests

- Production build: PASS — 367 pages, sitemap created.
- Category 34.2 tests: PASS — 5/5.
- Focused Category/Foundation/ProductScore/Product/Comparison regression suite: PASS — 50/50.
- Browser responsive/accessibility/theme suite: PASS — 108/108.
- Internal link targets: PASS — 367 pages, 0 errors, 0 warnings.
- Internal link health: PASS — 0 runtime errors; nine non-strict source-graph warnings described above.
- Technical SEO: PASS.
- Release build output strict: PASS — 0 errors, 0 warnings.
- Image-alt strict: PASS — 0 blockers.
- Foundation token, responsive and contrast audits: PASS.
- Performance viewport contract: PASS — 30/30.
- Repository strict audit: PASS — 0 errors.

A broad historical test batch passed 78/84. Its six failures are frozen pre-existing expectations outside 34.2: an obsolete direct Product-page journey import, two Katzenklappen tests that expect currently available/rated products to remain unavailable/unrated, two outdated product-coverage snapshots, and one test whose path assumes execution from the monorepo root. No production code was changed to satisfy those stale contracts.

## Cleanup

The usage audit found no standalone legacy Category component or stylesheet that could be removed safely: the generic article modules remain used by non-category routes. The category branch stops rendering their duplicated category composition while preserving the shared implementations for their valid consumers. No Product, Comparison, Homepage or Foundation redesign was made.

## Remaining non-blocking issues

- Global CSS size/specificity warnings remain inherited by category and unrelated editorial routes.
- Three performance errors remain on frozen Product/Comparison routes.
- The legacy source-only internal-link analyzer cannot discover links emitted from TypeScript configuration, although the built HTML and target audit verify them.
- Six stale historical tests described above remain outside this category migration’s production contract.

