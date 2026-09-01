# PfotenTechnik 34.4 — Deletion manifest

Status: **COMPLETE**  
Principle: delete only artifacts or source with no current production, build, test, or operational-audit consumer.

## Safety boundary

- No public route, canonical, indexability rule, legal wording, title/meta field, schema contract, or internal-link destination was intentionally removed.
- No production/editorial media under `src/assets`, `public`, or content media locations was deleted.
- Frozen Product, Comparison, Homepage, Category, Manufacturer, and Guide compositions were not redesigned.
- Tracked deletions remain recoverable from Git history.

## Removed inventory

| Class | Files | Bytes | Evidence and disposition |
|---|---:|---:|---|
| Historical QA screenshots | 338 | 279,084,481 | Completed 33.x/34.x before/after, breakpoint, detail, and full-page captures; no active baseline or test consumer. Removed. |
| Obsolete report JSON/log output | 66 | 3,233,989 | Versioned browser QA, patch, migration, research, performance, and stale CSS consolidation output superseded by current reports. Removed. |
| Stale generated audit companion | 1 | 3,451 | Markdown companion to the obsolete CSS consolidation JSON; no script or consumer remained. Removed. |
| Obsolete migration tests | 90 | 206,561 | Assertions described retired intermediate releases and contradicted the consolidated production contract. Removed after current-contract coverage was identified or repaired. |
| Iteration-specific capture/audit scripts | 18 | 156,340 | Completed 33.x/34.x migration utilities or audits of retired architecture. Removed; current Foundation behavior retained in one generic audit. |
| Tracked backup/temp files | 9 | 61,708 | Historical `.bak` copies with no consumer. Removed. Across tracked and ignored files, 38 backup/temp/`.DS_Store` artifacts were found and the final count is zero. |
| Dead components | 15 | 63,202 | Zero production imports and no legitimate current consumer. Removed. |
| Retired Comparison CSS tombstones | 3 | 220 | Empty/retired token-system files retained only for obsolete assertions. Removed. |

## Comparison assertion disposition

| Legacy assertion | Classification | Resolution |
|---|---|---|
| Comparison owners must import `comparison-tokens.css` | **B — retired subsystem** | Replaced with an assertion for the current `comparison-experience.css` owner imports and absence of retired stylesheets. |
| Comparison CSS must preserve specific old literal palette values | **B — retired subsystem** | Replaced with assertions for shared semantic `--pt-*` tokens and absence of the old local palette/dark branch. |
| The retired token file must declare exactly eight comparison variables | **B — retired subsystem** | Replaced with an assertion that comparison-specific token declarations and uses are absent. |

A separate current-contract test found a real reader-facing Comparison count drift. That issue was classified **C — real regression**, fixed in three comparison documents, and its test was retained.

Final result: **0 intentionally stale assertions; 0 knowingly obsolete failing tests.**

## Deleted capture and audit scripts

- `scripts/audit-comparison-css-system.mjs`
- `scripts/audit-product-experience-2.mjs`
- `scripts/design-system/audit-foundation-consolidation-34.4.mjs`
- `scripts/design-system/audit-manufacturer-guide-34.3-before.mjs`
- `scripts/design-system/audit-visual-legacy-34.3a.cjs`
- `scripts/design-system/audit-visual-legacy-34.3a.mjs`
- `scripts/design-system/capture-category-34.2.mjs`
- `scripts/design-system/capture-comparison-micro-polish-33.3.2a.mjs`
- `scripts/design-system/capture-comparison-repair-33.3.2.mjs`
- `scripts/design-system/capture-homepage-34.1.1.mjs`
- `scripts/design-system/capture-homepage-34.1.mjs`
- `scripts/design-system/capture-manufacturer-guide-34.3.mjs`
- `scripts/design-system/capture-product-production-repair-33.3.1a.mjs`
- `scripts/design-system/capture-production-repair-33.3.1.mjs`
- `scripts/design-system/capture-reference-comparison-release.mjs`
- `scripts/design-system/capture-reference-release.mjs`
- `scripts/design-system/capture-visual-hierarchy-33.3.mjs`
- `scripts/seo/export-baseline-34.0.mjs`

The still-useful Foundation browser audit was consolidated as `scripts/design-system/audit-production-foundation.mjs`. It writes to a stable `reports/production-foundation/browser-audit-latest.json` target by default and remains available through `npm run audit:production-foundation`.

## Deleted dead source

- `src/components/ContentGraphSections.astro`
- `src/components/ProductTrustPanel.astro`
- `src/components/advisor/AdvisorCompare.astro`
- `src/components/comparison/ScenarioRecommendations.astro`
- `src/components/product-experience-2/ProductDecisionAssistant.astro`
- `src/components/product-experience-2/ProductTrust2.astro`
- `src/components/product-standard-2/AlternativesGrid.astro`
- `src/components/product-standard-2/ContextSpecs.astro`
- `src/components/product-standard-2/DecisionCard.astro`
- `src/components/product-standard-2/ProductEngineInsights.astro`
- `src/components/product-standard-2/ProductStandard2.astro`
- `src/components/product-standard-2/ProsCons.astro`
- `src/components/product-standard-2/QuickFacts.astro`
- `src/components/product-standard-2/SuitabilityMatrix.astro`
- `src/components/product-standard-2/TrustBar.astro`
- `packages/affiliate-core/src/components/comparison/comparison-explorer-v2.css`
- `packages/affiliate-core/src/components/comparison/comparison-system.css`
- `packages/affiliate-core/src/components/comparison/comparison-tokens.css`

The strict repository audit reports no unused component errors after deletion.

## Obsolete test grouping

The 90 removed files break down as follows:

| Historical contract group | Files |
|---|---:|
| Comparison migrations | 12 |
| Product migrations | 23 |
| Evidence batches and precedence snapshots | 20 |
| Theme, layout, header, and navigation migrations | 13 |
| SEO, topical-authority, and research snapshots | 10 |
| Cat-flap and SureFeed release snapshots | 9 |
| Other completed migrations | 3 |
| **Total** | **90** |

The maintained suite now contains 140 test files and 704 passing tests.

## Prevention

The repository ignore contract now excludes `*.log` and report screenshot formats (`png`, `jpg`, `jpeg`, `webp`) so transient QA output does not silently return. Useful Markdown architectural reports and current machine-readable operational reports remain tracked.
