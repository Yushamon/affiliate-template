# Score Token Audit

One score normalization function, one tone resolver, and one presentation primitive now serve Product, Comparison, Explorer, alternatives, and recommendations.

| Value | Canonical tone | Light token | Dark token |
|---:|---|---|---|
| 91 | excellent | `#237952` | `#66c98e` |
| 85 | excellent | `#237952` | `#66c98e` |
| 79 | good | `#5a800e` | `#a8d65e` |
| 70 | good | `#5a800e` | `#a8d65e` |
| 69 | solid | `#9a6900` | `#f0b45a` |
| 65 | solid | `#9a6900` | `#f0b45a` |
| 50 | limited | `#b65313` | `#ff9d61` |

Values below 50 use `poor` (`#b63737` light, `#ff8d8d` dark). Existing thresholds and score values were not changed.

Source audit results:

- `ProductScore.astro` remains the production Product/Comparison wrapper around `EditorialScore.astro`.
- `getEditorialScoreTone()` is the only threshold mapping.
- Product hero, Product alternatives, Scenario recommendations, Comparison production, and Explorer no longer define a local score accent.
- Browser QA found one computed color per rendered tone in every tested viewport and theme.
- Regression coverage explicitly checks 91, 85, 79, 70, 69, 65, and 50.
- Every tone color clears 4.5:1 against its score surface; the minimum is 4.64:1 for Light `good`.
