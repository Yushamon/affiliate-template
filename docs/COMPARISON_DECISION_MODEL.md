# Comparison decision model (33.2.2)

The comparison dataset remains the source of truth. Every product listed in a
comparison is retained in the technical Explorer/table; the deep decision
surface is a shortlist, not a market-wide claim.

## Selection policy

`src/domain/comparison/finalistSelection.mjs` deterministically selects up to
two finalists from eligible product entries. It combines the existing product
score with documentation completeness, evidence status and capability-token
diversity. Stable slug ordering resolves ties. A second finalist is preferred
when it documents a meaningfully different use case, so the result is not
simply the two highest scores.

Remaining candidates are split into relevant alternatives (compact image,
name, reason, score/price and existing product link) and a technical tail that
stays available through progressive disclosure. No product or URL is created by
the selector.

The result exposes `selectionReasons` (`whyFinalist`) and
`alternativeReasons` (`whyRelevantAlternative`) keyed by product slug. These
strings come from the candidate's existing recommendation/strength/feature
facts and are available to the renderer as data, not as product-specific UI
logic.

An explicit override is supported only as a migration escape hatch for a
comparison with insufficient structured data. Current Reference Comparison
does not provide an override; its pair is data-selected.

## Rollout states

The renderer supports these future data states without a second engine:

- two clear finalists: deep A/B flow plus relevant alternatives;
- three near-equal finalists: two deep finalists, third remains a prominent
  relevant alternative;
- one clear recommendation: one finalist and a graceful single-product flow;
- no clear winner: stable pair selected for contrasting documented use cases;
- very large field: shortlist plus Explorer/table;
- incomplete data: conservative fallback and visible technical field.

## Source-of-truth map

| Decision field | Existing source | Consumer |
| --- | --- | --- |
| Product membership and comparison values | comparison frontmatter `items[]` plus explicit product backlinks | `buildComparisonViewModel` and Explorer/table |
| Product name and URL | product frontmatter `title`, `slug`, `productUrl` | `ComparisonProduct` and product links |
| Product image | `src/domain/comparison/mediaResolver.mjs`: product `images.comparison` → `thumbnail` → `hero` | stage, alternatives and Explorer |
| Score and price | `calculateProductScore(product.data)` and the shared price index | score display and comparison metadata |
| Fit and purchase boundaries | `recommendation`, `decision.bestFor`, `decision.attention`, `failureModes` | finalist reasons and deep decision sections |
| Finalists, alternatives and technical tail | `selectComparisonFinalists` | `verdict`, `relevantAlternatives`, `technicalCandidates` |
| Technical differences and evidence | comparison `criteria[]`/rows and product editorial evidence | difference table, disclosure and supporting copy |

Legacy `winnerSlug`/`alternativeSlug` fields remain in source content for
backward compatibility and are consulted only when automatic selection cannot
produce a complete finalist pair; they are not required maintenance for the
Reference Comparison.

## Migration audit checklist

For each comparison, audit the item count, product records with usable images,
prices, scores, links, comparison values, decision text, evidence and failure
data. Confirm that every source item is either a finalist, relevant alternative
or technical-tail entry. The renderer must not contain product slugs or
product-specific image/copy constants.
