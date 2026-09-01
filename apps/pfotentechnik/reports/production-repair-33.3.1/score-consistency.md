# Production Repair 33.3.1 — Score Consistency

`ProductScore.astro` is the canonical production presentation primitive. It
delegates normalization and qualitative wording to the existing shared
editorial score utility; score calculation remains in the owning product and
comparison domains.

| Previous renderer | Active consumer | Action |
| --- | --- | --- |
| direct `EditorialScore` ring | Product Hero | migrated to `ProductScore` ring |
| direct `EditorialScore` ring compact | Product Alternatives | migrated to `ProductScore` ring compact |
| `inline` numeric score | Comparison finalist / relevant alternative | migrated to `ProductScore` ring compact |
| `inline` numeric score | Explorer score row | migrated to `ProductScore` ring compact |

The circular score carries the numeric score, `/100`, and qualitative label.
Its outer accessible label communicates the complete score; the decorative
ring meter is hidden from the accessibility tree to avoid duplicate speech.
External ratings and Fit scores are intentionally outside this editorial
product-score primitive.
