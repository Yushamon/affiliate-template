# Validation — Trinkbrunnen 34.6

Status: **PASS**

No production content, metadata, link, schema, route or visual file was changed. Validation still covers the complete current PfotenTechnik contract so that the NO-CHANGE decision is based on a healthy baseline rather than an unverified build.

| Check | Command / evidence | Result |
|---|---|---|
| Baseline JSON validity | `jq empty reports/seo-trinkbrunnen-intent-ctr-34.6/baseline.json` | PASS |
| Manifest JSON validity | `jq empty reports/seo-trinkbrunnen-intent-ctr-34.6/change-manifest.json` | PASS |
| Complete tests | `npm test` | PASS — 704/704 |
| Current production contract | `npm run seo:release:check` | PASS — 23/23 phases, 0 failed, 0 skipped |
| Production build | Astro production build inside release check | PASS — 367 pages |
| Content quality/cannibalization | `audit:content-quality:strict` inside release check | PASS — 255 indexable pages, 0 errors, 0 warnings, 0 unresolved intent conflicts |
| Technical SEO | source and built-output audits inside release check | PASS |
| Target canonical/indexability/sitemap | Direct inspection of six rendered HTML files and generated sitemap | PASS — 6/6 |
| Target heading contract | Direct rendered inspection | PASS — exactly one H1 on 6/6 |
| Target schema | Parse all target JSON-LD; require Article for five guides and Product for product URL | PASS — 6/6 |
| URL consistency | `audit:url-consistency:strict` inside release check | PASS — 0 errors, 0 warnings |
| Source links | `audit:internal-links:strict` inside release check | PASS — 243 documents, 0 errors, 0 strict-critical findings |
| Rendered links | `audit:internal-link-targets:strict` inside release check | PASS — 367 pages, 0 errors, 0 warnings |
| Generated SEO output | `audit:release-build-output:strict` inside release check | PASS — 0 errors, 0 warnings |
| Media | `npm run media:audit` | PASS |
| Semantic contrast | `npm run design-system:contrast:audit` | PASS — 38/38 Light/Dark combinations meet WCAG AA |
| Responsive | viewport contract inside release check | PASS — 30/30 static checks |
| Performance | strict performance contract inside release check | PASS — 10/10 routes; six known non-blocking warnings outside the target set |
| Diff hygiene | `git diff --check` | PASS |

Screenshots were not created because 34.6 makes no visual change.

## Target rendered-schema matrix

| URL | Canonical | Indexable | Sitemap | H1 | Required schema |
|---|---|---|---|---:|---|
| `/trinkbrunnen-fuer-mehrere-katzen/` | PASS | PASS | PASS | 1 | Article PASS |
| `/katzentrinkbrunnen-laut-pumpe/` | PASS | PASS | PASS | 1 | Article PASS |
| `/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/` | PASS | PASS | PASS | 1 | Article PASS |
| `/katzenwasser-taeglich-wechseln/` | PASS | PASS | PASS | 1 | Article PASS |
| `/filter-im-katzentrinkbrunnen-wechseln/` | PASS | PASS | PASS | 1 | Article PASS |
| `/produkt/petlibro-stainless-steel-fountain/` | PASS | PASS | PASS | 1 | Product PASS |

## Warning disposition

The release checks report existing non-blocking repository/maintainability and performance warnings. No warning was introduced by 34.6, none identifies a defect on the six target URLs, and none supports broadening this fixed SEO/content batch. They remain WATCH under the 34.5 contract.
