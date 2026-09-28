# PFOTENTECHNIK 35.2 — GOOGLE SIGNAL INTEGRITY

Audit date: 2026-09-28. Repository: Yushamon/affiliate-template; app: apps/pfotentechnik. **Audit-only: no production content, UI, product data, redirects, or public URLs changed.**

## Decision

**A — NO evidence of a material sitewide technical failure explaining Google's extremely low visibility.** This is an evidence statement, not proof of Google's indexing decisions. **B — P0: 0. C — P1: 1. D — Production patch justified: YES, narrowly for the one orphan, in a separately authorized work package. E — No unconditional technical SEO freeze while that P1 remains.** Broad canonical/sitemap/rendering/performance redesign is not justified. Nothing in this batch authorizes a patch or new content systems.

All 260 intended canonicals are live HTTP 200, self-canonical, robots-permitted, and exactly sitemap-listed. The live sitemap equals the local build sitemap byte-for-byte. All 260 deployed pages have the same primary text and internal-link targets as the fresh build. Localized findings do not establish a cause for sitewide low visibility.

## 1. Existing systems inspected and reused

| System | Reuse / evidence | Remaining gap |
| --- | --- | --- |
| SEO baseline `scripts/seo/audit-production-baseline.mjs` | Fresh independent 375/260 inventory and graph, saved in baseline/ | Full live headers, variant combinations, unique source/anchor breakdown |
| `scripts/content-quality/core.mjs` | Direct `collectContentQuality` reuse for source role, cluster, age, content distinctness; zero findings | Live URL identity and semantic schema visibility |
| URL consistency, week4 technical SEO, release-build-output | Executed existing strict checks | Old URL regex overcounts by two; exact canonical cardinality/HTTP require independent DOM parser |
| Internal-link source/target/health, content graph | Existing strict audits executed; link targets reused and independently cross-checked | One-source pages and contextual-vs-navigation authority |
| Product data, Product Standard 3, product evidence, price intelligence | Existing audits; entire existing 856-test suite | Semantic field-to-visible-content alignment |
| Schema comparison audit; layout/product JSON-LD | Existing audit plus every page's parsed schema | Valid JSON alone cannot prove truthful markup |
| Performance, contrast, responsive and viewport contract | Existing strict audits and 30 Chrome checks using existing Electron checker functions | No field CWV/CrUX data |
| GSC/Bing/search platform, recovery, SEO cockpit, demand discovery | Existing dated snapshots and source workflows inspected; read-only reuse | No URL-level exclusion dataset; no search sync or submission performed |
| SEO release preflight, URL normalization, robots, frontmatter dates | Inspected release gates; independently ran relevant safe checks | Full release orchestrator writes generated files, so not used in this zero-production-change batch |

The new audit is an extension under **existing scripts/seo/**, imports existing content-quality analysis, and uses installed parse5. No parallel provider, SEO scoring system, content graph, or public endpoint was created. The browser adapter imports the existing check definitions by extracting their unchanged function declarations. Existing report outputs were preserved under validation/existing-audit-artifacts and their prior tracked versions restored to keep the final diff focused.

## 2–3. Authoritative URL set and signal consistency

Generated HTML: **375**. A INDEXABLE_CANONICAL: **260**; C NOINDEX: **114** (113 admin routes plus foundation); E intentional 404 document: **1**. B/D/F/G generated HTML: **0**. Additional known B redirects: **68 exact source paths / 34 logical aliases**. Five deliberately probed F filter states are not generated landing pages; all appear in parameter-surface.csv. Redirect/variant and filter inventories supplement the generated-page matrix; finite tests cannot enumerate arbitrary external garbage URLs.

The 404 template is `dist/404.html`; its direct URL returns 200 with noindex. This is not a failed unknown-path test: all three deliberately nonexistent paths return real 404. The matrix includes the actually measured URL to distinguish this file from its canonical `/404/` label.

| Signal | Result |
| --- | ---: |
| Canonical HTTP 200 without redirect | 260/260 |
| Exactly one absolute HTTPS, non-www, trailing-slash self-canonical | 260/260 local and live |
| Canonical equals sitemap | 260/260 |
| Robots / X-Robots-Tag consistency | 260/260 |
| Internal canonical document links | 16900/16900 occurrences; 0 variant/redirect targets |
| Internal schema reference consistency | 260/260 pages |
| Local/deployed primary text and internal targets match | 260/260 |
| Canonical target to redirect/noindex/404 | 0 |
| Invalid JSON-LD | 0 |

Organization/WebSite IDs, image URLs, linked products in ItemLists, and external merchant offers are evaluated according to their role; they are not incorrectly required to equal the current page URL. The checks do not claim Google chose the declared canonical. No conflicting HTTP Link canonical headers observed.

## 4. Redirect integrity

Complete HTTP/HTTPS × www/non-www × slash/no-slash matrix for all 260 canonical URLs, plus 68 historical exact sources. Canonical slash removal uses **308**, a permanent redirect; historical aliases use **301**. Every historical alias reaches its expected self-canonical 200 destination in one hop, including both YumShare aliases and renamed comparison/guide paths.

**1037 multi-hop variant URLs; 0 loops.** Hop distribution across variants and historical aliases: {1: 847, 2: 778, 3: 259}. `http://www.pfotentechnik.de/` takes HTTP→HTTPS followed by www→non-www. Combining slash normalization adds another hop on non-root URLs. None are internal link targets or sitemap URLs. This is P2 hygiene, not a broken canonical chain or P0 indexing blocker. Full per-hop status/location evidence is in redirect-integrity.csv and live-evidence.json. No redirects are recommended for arbitrary nonexistent paths.

## 5. Sitemap and lastmod

All 260 entries are live 200, indexable, self-canonical, query-free, unique and non-www; zero missing intended canonicals. **Reachability: 259/260**; the advisor orphan is the single exception, explicitly retained in the denominator. Integrity is therefore **PASS for URL/HTTP identity, WARNING for internal reachability**.

**LASTMOD_PARTIALLY_TRUSTWORTHY.** `astro.config.mjs` reads collection frontmatter (`updatedAt ?? publishedAt`), validates it, and serializes it. There is no deployment-time fallback. 248 entries have lastmod; 12 omit it; no future dates. The live and fresh-build XML are identical, additionally disproving a current-clock rebuild stamp. A confirmed stale example is Furbo Mini 360: August 15 lastmod despite a September 9 visible price change (commit 8db22020). This does not prove all 248 dates are wrong. Do not invent dates; omit uncertain values instead of setting build/check time. [Google's lastmod guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) supports accurate significant-change dates.

## 6. Internal authority graph

Computed over all canonical pages from actual anchor DOM nodes, excluding self-links. Stored: every edge, anchor distribution, incoming occurrences, unique source pages, outgoing links, shortest homepage depth, logical hub links, source page types and contextual/navigation region. Deployed link targets match the build on all 260 pages.

Rules: ORPHAN = zero distinct sources; NEAR_ORPHAN = one; WEAK = at most one main-content source or unreachable/depth >3; STRONG = homepage or at least two main-content sources plus a logical-hub link and depth ≤2; otherwise NORMAL. These are structural triage categories, not ranking scores. “Contextual” means within main outside header/nav/footer; it does not guarantee an editorial prose link. Cluster ownership comes from existing content-quality mapping; generic multi-topic pages may have no unique logical hub.

Counts: {'NORMAL': 182, 'WEAK': 8, 'STRONG': 65, 'ORPHAN': 1, 'NEAR_ORPHAN': 4}. **True orphans 1; near-orphans 4; reachable pages deeper than 3 clicks 0; unreachable 1.** Direct logical-hub links are absent for 135 pages; this is not an instruction to add 135 links. Legal pages and navigation destinations can be healthy with mostly sitewide navigation links. Repeated desktop/mobile navigation is not automatically link spam; no evidence supports changing it.

- https://pfotentechnik.de/futterautomat-berater/ — ORPHAN, sources=0, contextual sources=0, depth=None
- https://pfotentechnik.de/katzenklappe-fuer-mehrere-katzen/ — WEAK, sources=2, contextual sources=1, depth=2
- https://pfotentechnik.de/produkt/petkit-fresh-element-infinity/ — NEAR_ORPHAN, sources=1, contextual sources=1, depth=3
- https://pfotentechnik.de/produkt/petlibro-one-rfid-smart-feeder/ — NEAR_ORPHAN, sources=1, contextual sources=1, depth=3
- https://pfotentechnik.de/produkt/wopet-pioneer-f01-plus/ — NEAR_ORPHAN, sources=1, contextual sources=1, depth=3
- https://pfotentechnik.de/seniorenhunde-richtig-versorgen/ — NEAR_ORPHAN, sources=1, contextual sources=1, depth=2
- https://pfotentechnik.de/smarte-gadgets-fuer-hunde-und-katzen/ — WEAK, sources=2, contextual sources=1, depth=2
- https://pfotentechnik.de/vergleiche/beste-futterautomaten-mit-edelstahl-napf/ — WEAK, sources=3, contextual sources=1, depth=2
- https://pfotentechnik.de/vergleiche/kleine-gps-tracker-fuer-katzen/ — WEAK, sources=2, contextual sources=1, depth=2

The three near-orphan products have manufacturer-only support and no topical comparison/guide entry point. Two weak comparisons are edelstahl-napf and kleine-gps-tracker-fuer-katzen. Lists of all exceptions, not just examples, are in the graph CSV and graph-evidence.json. [Google link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable) supports useful crawlable paths, not arbitrary link quotas.

## 7. Initial HTML and rendering

**SSR/STATIC CONTENT PASS for all 260 editorial/canonical page shells**, including title, description, canonical, robots, H1, primary text, links and JSON-LD. Product facts and evidence/experience sections are present without client JavaScript. Homepage, hubs, guides, comparisons, products and manufacturer pages are covered, with detailed per-route records in render-evidence.json. This checks all pages, beyond the requested representatives.

**RENDER DEPENDENCY FOUND in the advisor's interactive results**, an intentional questionnaire, not the editorial corpus: six inputs and introduction are static, while `data-result-list` is empty until client-side answers generate recommendations. Product-fit assistants and gallery/lightbox interactions likewise need JS for their interactive state; core product content does not. No “crawled-not-indexed” subset can be prioritized without the missing URL-level export.

## 8. Parameter surface

**0 crawlable internal parameter hrefs**, across all 375 generated HTML documents; zero filter states in sitemap. Five `?filter-tier=katze` probes return 200 with a clean base canonical and the same initial primary text as their base pages. They are canonical alternatives, not deliberately indexable landing pages. No internally exposed faceted crawl trap observed. robots.txt allows resource crawling; no resources were blocked as an attempted duplicate fix. Fragment-based UX controls are not treated as separate indexable URLs.

## 9. Soft 404 / thin response

Three unknown-path probes (root, product, manufacturer) return genuine 404; neither deleted YumShare alias returns homepage 200. Existing content-quality analysis reports zero exact/near duplicate and thin-without-value findings; no empty manufacturer pages or core-content-empty products found. **0 soft-404 candidates under the explicit response/content checks.** Short utility/advisor pages are assessed by purpose, not word count. Filter results can be empty as a user-selected state; their base HTML remains useful and self-canonical to the clean URL. Google could still independently classify a page as a soft 404; no URL Inspection evidence is available.

## 10. Product/review schema semantics

All **103 product pages** examined, local and deployed. **JSON syntax pass 103/103**; **SEMANTIC_PASS 0, WARNING 102, INVALID/MISLEADING 1** under the conservative audit rules. This is not a claim that 103 reviews are fake or that Google rejects all 103.

Every product has a visible editorial 0–100 rating, clearly identified as source-based editorial assessment. No AggregateRating, fabricated user review counts, manufacturer MPN or GTIN observed. Brand names correspond to product identity. Manufacturer is omitted rather than guessed. SKU is the publisher slug (P3 provenance issue). There are 67 offers on 60 products, with third-party seller names, visible prices and the existing freshness/availability guard; PfotenTechnik is not falsely named as seller. Two missing-affiliate products have no Offer.

The warning policy records non-identical reviewBody text because schema uses `review.verdict` while the visible experience predominantly shows `review.summary` and selected limitations. That mismatch needs semantic review; a faithful summary does not need identical wording. All 103 remain WARNING rather than falsely being marked fully verified. 22 negative-note strings on 19 pages are not literal matches; some are demonstrably paraphrased (e.g. filter-change cadence, dry-food-only FAQ). The sole INVALID/MISLEADING classification is the internal **Lifecycle-Owner** implementation statement as a hidden negativeNote on Neakasa M1 Lite. This is an invalid semantic use of that property, not invalid JSON or evidence of fraudulent testing.

Affiliate wrapping/tracking explains many exact Offer URL-vs-anchor differences; these are warnings, not missing crawl links. Numeric price punctuation also needs locale-aware comparison. All per-product values, warnings and actual visible text are preserved in structured-data-audit.csv and product-visible-evidence.json. Google requires representative, reader-visible markup; a structured-data problem alone does not establish a generic search-ranking penalty. [Structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

## 11–12. Media and performance

2,441 actual image instances: **0 missing alt attributes, 0 missing dimensions, 0 missing local files**. Excluded 260 empty lightbox placeholders identified by `data-lightbox-image`; these become images only on interaction. Existing image-alt audit passes. **339 deployed hero/schema image URLs checked, 339 HTTP 200.** Three local rebuild hashes returned production 404 during the initial sampling, but they are not the deployed image references; they remain in raw evidence as local-hash probes and are not falsely reported as broken production media. No image sitemap extension is used; images are discoverable through initial HTML/schema.

Existing strict performance audit and 30 static viewport contracts pass. Electron could not start because its binary is missing; installed Chrome ran **the same existing 30 viewport metric/threshold combinations: 30/30 pass**, with no screenshots. No measured horizontal overflow, broken sampled browser images, missing image dimensions, first-visible-image lazy-loading problem or H1/viewport failure. The existing budgets detect no systemic blocking/hydration/hero-architecture regression. **Performance sanity: PASS / FREEZE.** This is not a field Core Web Vitals pass: CrUX/real-user LCP, CLS and INP were unavailable.

## 13–14. GSC exclusions and Bing control

Latest supplied snapshots generated September 22, data through September 21; compare the same 28-day period August 25–September 21. Google: **36 impressions, 0 clicks**; Bing: **248 impressions, 18 clicks**. Performance page rows are not index-coverage statuses. No local URL-level exclusion/inspection export was found for crawled-not-indexed, discovered-not-indexed, duplicates, redirects, 404 or noindex. **Crawled-not-indexed URLs analyzed: 0. Common technical pattern: NOT ASSESSABLE.** Expected technical classes cannot be substituted for reported GSC reasons.

The 260-row correlation table records this missingness explicitly, plus available provider metrics and technical fields. There are 57 Bing-visible URLs, 17 Google-visible URLs and 243 with no impressions in the available Google page rows. Absent rows mean no observed data in this snapshot, not proved non-indexation. Bing-visible pages span products, guides, comparisons and manufacturers; their canonicals also pass. Age, cluster, depth, authority, schema type and main-content length comparisons are in bing-control.json. Homepage/navigation effects make raw average incoming links a confounder; no causal ranking conclusion is drawn. Bing is consistent with absence of a gross sitewide rendering/canonical failure, but does not prove Google should rank the same pages.

## 15. Google-specific files/directives

Live robots.txt: `User-agent: *`, `Allow: /`, correct HTTPS non-www sitemap declaration. No observed googlebot-specific restriction, nosnippet, max-snippet limit, unavailable_after, blocked asset rule, or conflicting X-Robots-Tag on canonicals. Intended canonical pages permit `max-image-preview:large`. Intentional noindex pages remain excluded from sitemap. The live robots/sitemap bodies and HTTP header evidence are preserved. No additional Google-specific directives are recommended. [Robots documentation](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).

## 16. Findings, severity and validation

Finding counts (categories, not affected-page totals): **P0 0; P1 1; P2 5; P3 2**. Major canonical/HTTP/sitemap identity, robots, direct internal links, parameter exposure, image delivery and editorial static rendering are **NO_CHANGE**. Every finding below identifies evidence, scope, examples, responsible implementation, documentation, action and risk.

### GS35-01 · P1 · One canonical sitemap URL has no incoming rendered link

- Affected: 1 URLs.
- Evidence: 0 incoming links from all 260 indexable canonical pages; null homepage depth; local and deployed link targets match. HTTP 200, self-canonical and sitemap-listed.
- Examples: https://pfotentechnik.de/futterautomat-berater/.
- Implementation: apps/pfotentechnik/src/pages/futterautomat-berater.astro; apps/pfotentechnik/src/components/advisor/PetAdvisor.astro.
- Why it matters: This one intended public tool has no crawlable discovery path within the canonical graph. It does not explain sitewide Google weakness.
- Google support: https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- Recommended action: In a separately authorized patch, add one appropriate contextual entry point to the existing advisor if it is intentionally public. Do not add links to all pages.
- Change risk: Low: one editorial link; validate usefulness and tool purpose first.

### GS35-02 · P2 · Combined host/protocol/slash variants take multiple redirects

- Affected: 1037 URLs.
- Evidence: Complete canonical HTTP/HTTPS × www/non-www × slash/no-slash matrix recorded in redirect-integrity.csv. No internal links or sitemap entries use these variants. All end at 200 self-canonicals; no loops.
- Examples: http://www.pfotentechnik.de/, http://pfotentechnik.de/produkt/furbo-mini-360, https://www.pfotentechnik.de/produkt/furbo-mini-360.
- Implementation: Production Cloudflare host/protocol normalization (not fully represented in repository); apps/pfotentechnik/public/_redirects.
- Why it matters: Avoidable crawl hops, limited to alternate external entry points. The 68 configured historical aliases already take one 301.
- Google support: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Recommended action: Optional future edge-rule consolidation after exporting the actual deployed rules; do not add per-URL redirect lists or arbitrary garbage redirects.
- Change risk: Medium: edge routing affects every URL; not a reason for an urgent sitewide patch.

### GS35-03 · P2 · Product schema and visible product experience use different text selections

- Affected: 103 URLs.
- Evidence: 103 reviewBody strings absent as exact visible text; 22 negativeNotes strings on 19 products need semantic comparison. Some are visibly paraphrased. One confirmed inappropriate note on neakasa-m1-lite exposes internal Lifecycle-Owner route metadata as a product disadvantage. All JSON parses; 103 visible editorial ratings, no AggregateRating; 67 offers on 60 products identify external sellers.
- Examples: https://pfotentechnik.de/produkt/furbo-mini-360/, https://pfotentechnik.de/produkt/neakasa-m1-lite/, https://pfotentechnik.de/produkt/honeyguardian-a305d/.
- Implementation: apps/pfotentechnik/src/pages/produkt/[product].astro:301; apps/pfotentechnik/src/components/product-experience-2/ProductVerdict2.astro:15; apps/pfotentechnik/src/components/product-experience-2/ProductDetails2.astro:13; apps/pfotentechnik/src/content/products/neakasa-m1-lite.md.
- Why it matters: A rich-result fidelity concern. Exact wording differences are warnings, not proof of fabricated reviews or a ranking penalty. One internal implementation note is definitely not a reader-visible product disadvantage.
- Google support: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Recommended action: In a later scoped patch, align schema selections with visible review content and omit the internal lifecycle note. Preserve actual editorial scores and unknown identifiers. Resolve warnings semantically before changing them.
- Change risk: Low-medium: incorrect deduplication could remove valid pros/cons; preserve visible content and source evidence.

### GS35-04 · P2 · Four near-orphans and four lightly supported editorial destinations

- Affected: 8 URLs.
- Evidence: Four pages each have one unique incoming source. Three are products linked only by their manufacturer; seniorenhunde-richtig-versorgen is linked only from /wissen/. Four other editorial pages have <=1 contextual incoming source. All reachable in <=3 clicks.
- Examples: https://pfotentechnik.de/katzenklappe-fuer-mehrere-katzen/, https://pfotentechnik.de/produkt/petkit-fresh-element-infinity/, https://pfotentechnik.de/produkt/petlibro-one-rfid-smart-feeder/, https://pfotentechnik.de/produkt/wopet-pioneer-f01-plus/, https://pfotentechnik.de/seniorenhunde-richtig-versorgen/, https://pfotentechnik.de/smarte-gadgets-fuer-hunde-und-katzen/, https://pfotentechnik.de/vergleiche/beste-futterautomaten-mit-edelstahl-napf/, https://pfotentechnik.de/vergleiche/kleine-gps-tracker-fuer-katzen/.
- Implementation: apps/pfotentechnik/src/pages/hersteller/[manufacturer].astro; apps/pfotentechnik/src/content/pages/; apps/pfotentechnik/src/content/comparisons/.
- Why it matters: Localized topical support gaps. Direct hub links are absent for 135 pages under the inherited cluster mapping; absence alone is not a defect. Legal/navigation destinations are not content-link problems.
- Google support: https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- Recommended action: Review relevance only when these pages are editorially updated; use a natural same-topic guide/comparison connection if it helps readers. No mass linking.
- Change risk: Low if selective; medium if applied mechanically.

### GS35-05 · P2 · Lastmod is editorial-source-based but does not cover all meaningful derived changes

- Affected: 248 URLs.
- Evidence: 248 dates originate from updatedAt ?? publishedAt; 12 static routes omit lastmod. No build-clock default. Furbo has lastmod 2026-08-15, while commit 8db22020 on 2026-09-09 changed displayed price 81 → 98. Automatic check timestamps alone are not meaningful edits.
- Examples: https://pfotentechnik.de/produkt/furbo-mini-360/.
- Implementation: apps/pfotentechnik/astro.config.mjs:79; apps/pfotentechnik/astro.config.mjs:132; apps/pfotentechnik/src/content/products/furbo-mini-360.md:17.
- Why it matters: LASTMOD_PARTIALLY_TRUSTWORTHY: no invented freshness, but source dates do not fully track derived visible/structured changes. 248 is the date-bearing population, not 248 proven inaccurate dates.
- Google support: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Recommended action: Retain real source dates; document meaningful-update ownership. If an accurate date cannot be established for a route, omit it. Do not substitute deploy time or routine price-check time.
- Change risk: Low; false freshness would be riskier than omission.

### GS35-06 · P2 · Existing strict price audit fails for two missing affiliate destinations

- Affected: 2 URLs.
- Evidence: price:audit:strict exit 1 because missingAffiliate=2; missingPrice=1, stale30=41. Neither affected product emits an Offer. Unknown availability is retained; no fabricated merchant offer observed.
- Examples: https://pfotentechnik.de/produkt/litter-robot-5-pro/, https://pfotentechnik.de/produkt/neakasa-riko/.
- Implementation: apps/pfotentechnik/scripts/price-intelligence/audit.mjs:11; apps/pfotentechnik/src/content/products/litter-robot-5-pro.md; apps/pfotentechnik/src/content/products/neakasa-riko.md.
- Why it matters: A maintenance/gate exception, not an indexing blocker. Missing commercial destinations may be deliberate for uncertain products.
- Google support: No Google requirement to invent an affiliate link or an unknown price.
- Recommended action: Use the existing product-maintenance workflow to determine whether the omissions are intentional; do not invent values to turn the gate green.
- Change risk: Low if reviewed; high factual risk if guessed.

### GS35-07 · P3 · Publisher slugs are emitted as SKU identifiers

- Affected: 103 URLs.
- Evidence: Product.sku = contentProduct.slug. No MPN/GTIN is fabricated; manufacturer and brand roles are not confused with seller.
- Examples: https://pfotentechnik.de/produkt/furbo-mini-360/.
- Implementation: apps/pfotentechnik/src/pages/produkt/[product].astro:323.
- Why it matters: No demonstrated ranking/indexing effect. A publisher-local identifier must not be presented as a verified manufacturer SKU.
- Google support: https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- Recommended action: Document as publisher-local or omit during a future schema cleanup; do not replace with guessed identifiers.
- Change risk: Low; optional field.

### GS35-08 · P3 · Older URL audit miscounts noindex pages

- Affected: 2 URLs.
- Evidence: audit-url-consistency reports 262 indexable pages because its regex uses a double-escaped word boundary; independent parse5 extraction and existing baseline both report 260. Existing audit exits 0.
- Examples: https://pfotentechnik.de/404/, https://pfotentechnik.de/foundation/.
- Implementation: apps/pfotentechnik/scripts/seo/audit-url-consistency.mjs:81.
- Why it matters: Audit-confidence issue only. Production noindex signals are correct. This package uses actual HTML parsing rather than accepting that counter.
- Google support: No production directive problem.
- Recommended action: Consolidate the legacy parser in a future tooling cleanup; use the attached URL matrix as the current measured denominator.
- Change risk: Low: audit-only.

### Validation record

- Full app suite: **856/856 tests pass**, zero skipped/failed.
- Full production build: **PASS, 375 pages**, sitemap generated; no fast build.
- **15/16 explicitly executed existing audit commands pass**. The strict price audit fails for its documented two missing affiliate destinations, not for this audit's changes.
- Existing content-quality collector: **0 findings**, reused without its source/generated-writing CLI.
- Existing SEO baseline: completed, agrees on 260 canonicals and one orphan.
- Chrome browser geometry: **30/30**, existing Electron command unavailable; no screenshots produced.
- Public HTTP evidence: **2627 distinct requested URLs**, no fetch errors. Actual requests also include redirect-follow GETs. No merchant account changes, submissions, or deployment.
- Node syntax checks on both audit scripts pass. No production-visible tracked changes. Existing audit-generated report changes are archived inside this report and restored outside it.

Raw outputs: validation/; all exceptions: audit.json, the seven CSV matrices, graph-evidence.json, product-visible-evidence.json, live-evidence.json. Re-run `node apps/pfotentechnik/scripts/seo/audit-google-signal-integrity.mjs` for local analysis with cached live evidence; add `--live` to fetch missing/error URLs. To refresh every live observation, remove or rename only this report's live-evidence.json first. Reviewed findings are separately preserved in reviewed-findings.json and require editorial re-review after a changed build.

## Exactly one next action

Prepare a **separately authorized, minimal work package for the orphan advisor's intended public entry point**. Do not redesign technical SEO, mass-add links, fabricate dates, or rewrite product content in this audit.
