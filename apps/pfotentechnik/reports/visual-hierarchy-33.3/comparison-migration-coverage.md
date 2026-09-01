# Comparison migration coverage

All 28 comparison routes now render through the shared `ComparisonProduction`
composition. Candidate breadth remains in `model.products` and the Explorer;
the visible flow uses the automatic finalist/alternative/technical split.

| Class | Count |
|---|---:|
| A strong automatic selection | 18 |
| B usable with limited confidence | 8 |
| C sparse documented fallback | 2 |
| D data blocker | 0 |

Normal-path manual overrides: **0**. Legacy `winnerSlug`/`alternativeSlug`
fields remain compatibility data only and are used only for sparse fallback or
an explicit exceptional override.
