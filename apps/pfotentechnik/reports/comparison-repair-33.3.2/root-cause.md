# Comparison Visual Repair 33.3.2 — Root Cause

## Decision axis

The production comparison already owns one centered 75rem decision axis. The Fit chapter added `padding-inline: clamp(1.25rem, 4vw, 3rem)` on that axis, then the Explorer added another 1rem inset and every selector card added its own padding. The visible Fit heading and action therefore began farther inward than the adjacent Differences and Scenarios chapters.

The repair removes the chapter-level inline inset. The Fit section, its eyebrow, heading, and copy now start on the same axis as both adjacent decision sections. The Explorer remains the single optional inner tool surface. No negative margins, transforms, translations, or compensating `calc()` geometry were introduced.

## Disclosure cascade

`ComparisonProduction.astro` previously styled `.rc33 details` and `.rc33 summary` broadly. That ownership was too wide for nested Explorer criterion groups and left the three production disclosures with different interaction and surface treatments.

The repair scopes rules to the Fit, technical-data, and methodology disclosures. Each uses native `details/summary`, a semantic Foundation surface, one chevron icon, a visible focus treatment, and a rotated open state. Explorer criterion rows keep their own shared semantic styling.

## Score cascade

The shared score component selected a tone locally, but product hero, product alternatives, and scenario recommendation consumers could replace `--score-accent` with their page accent. Identical values could therefore render with different colors.

Tone selection now lives in `getEditorialScoreTone()`. The primitive paints from `--pt-score-tone-accent`, which is assigned only by the canonical tone class and Foundation score tokens. Consumers can still provide surface/text context but cannot replace score meaning.

## Selector geometry

The selector suppressed the qualitative verdict and attempted to force a 2.25rem ring. Cascade order could also return it to the generic compact-ring size. Price wrapping remained allowed.

The selector now uses a specificity-safe 2.875rem ring, displays the verdict, keeps the price as a no-wrap unit, and stacks score and price below 430px. Browser assertions verify containment and collision pairs.
