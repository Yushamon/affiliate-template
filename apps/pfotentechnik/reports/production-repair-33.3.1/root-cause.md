# Production Repair 33.3.1 — Root Cause

## Media

The compact product-alternative path mixed two incompatible contracts: it
derived a raw `src` for Reference mode while deriving a transformed `srcset`
for the other mode. The Reference branch therefore bypassed Astro's asset
metadata and could render a stale or unsuitable emitted source. The comparison
resolver also stopped at `comparison`, `thumbnail`, and `hero`, so a product
with valid gallery-only media had no shared fallback.

`img.complete` and `naturalWidth` alone did not expose that defect because
they say nothing about whether the selected source was the intended asset or
about the empty stage reserved for a missing source.

## Score presentation

The calculated score value was already canonical, but consumers chose
different presentational variants (`inline`, `compact`, and ring) directly.
That left text-plus-number score renderers in the active Product/Comparison
flow despite an existing circular score implementation.

## Explorer

`ComparisonExplorer` was embedded by `ComparisonProduction`, while its CSS
was imported only by the former `ComparisonShell`. Its behaviour, native
inputs, and overflow checks therefore remained functional, but the embedded
picker lost its composition styles. A document-level overflow assertion could
not detect missing local layout ownership or duplicate visual indicators.

## Preventing recurrence

- `resolveProductMedia()` defines the shared compact-media priority.
- All repaired consumers retain `ImageMetadata` through `OptimizedImage`.
- Missing media receives a compact, labelled fallback rather than a blank
  stage or broken image.
- `ProductScore` is the Product/Comparison presentation entry point.
- Browser QA asserts image decode/rects, selector ownership, no duplicate
  control, count transitions, and pairwise control/media/identity/score/price
  non-overlap at 320–1600px in both themes.
