# Manufacturer + Guide 34.3 — Test Contract Migration

| Historical test / contract | Classification | Action | New/current contract |
|---|---|---|---|
| `manufacturer-overview-rebuild-30.1.0.test.mjs` — route uses `ManufacturerOverviewHero` | B — the valid property is single-component ownership; the named component is superseded | Migrated in place | Manufacturer route owns no catalog markup and renders the generic `ManufacturerExperience` from `buildManufacturerExperienceModel` |
| `manufacturer-overview-rebuild-30.1.0.test.mjs` — hero CSS collision checks | B — collision-free CSS ownership remains valid | Migrated in place | `ManufacturerExperience.astro` owns `pt-manufacturer__*`, contains no `!important`, local hex colors or slug branches |
| `global-dark-mode-surface-contract-25.8.2.test.mjs` — `AutoContentBlocks` semantic palette | B — semantic Light/Dark inheritance remains valid; the legacy component is no longer in production | Migrated in place | `GuideExperience.astro` consumes the shared Foundation palette without a separate dark-mode branch |
| `global-dark-mode-surface-contract-25.8.2.test.mjs` — removed `pfotentechnik-dark-mode-contract.css` import | B — explicit header/footer foreground roles remain valid, but the historical file no longer exists | Migrated to current ownership | The test reads shared `Header.astro`, `Footer.astro` and the active design-token import in `ProjectLayout.astro` |
| Implicit contract for route-local manufacturer score normalization | A — removed legacy system | Deleted with the route-local script and MutationObserver | Selected products render the canonical shared `ProductScore` server-side |
| `ManufacturerOverviewHero.astro` | A — removed legacy component after zero-reference search | Deleted | Hero is the first chapter of `ManufacturerExperience.astro` |
| `AutoContentBlocks.astro` | A — removed legacy component after zero production references and test migration | Deleted | Quick answer, summary, contextual products and supporting depth are owned by `GuideExperience` and its ViewModel |
| `ConversionJourney.astro` | A — removed legacy component after zero production/test references | Deleted | Guide next steps are resolved from current topic, category, comparison and related-guide data |
| Manufacturer/Guide 34.3 acceptance coverage | C — current regression protection required | Added `manufacturer-guide-experience-34.3.test.mjs` | One systemic renderer per page type, data-driven selection, four guide compositions, contextual links, optional media, semantic tokens, no client JS, frozen Category branch |
| Primary Guide body behind `details` | A — invalid information hierarchy | Removed the gate and migrated browser/source assertions | Primary article is visible without interaction, is not inside closed `details`, retains server-rendered content and has valid H1/H2/H3 structure |
| Internal selection-policy copy in Guide products | A — implementation language leaked into reader UI | Removed and replaced with reader-oriented fit rationale | Product section uses “Passende Modelle für diesen Entscheidungsfall” and preserves “Interessant, wenn …” at mobile and desktop widths |

No failing historical test was waived. Valid contracts were migrated; tests tied only to removed legacy components were replaced by current production contracts.
