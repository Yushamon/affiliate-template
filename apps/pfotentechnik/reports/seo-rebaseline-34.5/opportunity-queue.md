# Unified Opportunity Queue

The machine-readable queue is [opportunity-queue.json](opportunity-queue.json). It reuses Traffic Leverage and enriches it with the rendered graph, Evidence, Demand Discovery and 28d/3m sufficiency checks.

## Highest-leverage 10 URLs

| Rank | URL | Zone | Supporting signal | Specific next change |
|---:|---|---|---|---|
| 1 | `/produkt/petlibro-polar-wet-food-feeder/` | B | 26 imp, 0 clicks, pos 12.4 | Compare product query with title/H1/intro and snippet promise; make one proven alignment change. |
| 2 | `/trinkbrunnen-fuer-mehrere-katzen/` | A | 15 imp, 0 clicks, pos 7.3 | Put the multi-cat quantity/placement answer clearly in the opening promise. |
| 3 | `/katzentrinkbrunnen-laut-pumpe/` | A | 11 imp, 0 clicks, pos 8.0 | Align title/opening answer to the observed “plätschert laut” symptom without broad rewrite. |
| 4 | `/produkt/petlibro-stainless-steel-fountain/` | A | 10 imp, 0 clicks, pos 12.5 | Verify “PETLIBRO Edelstahl Trinkbrunnen” appears naturally in the search promise and first answer. |
| 5 | `/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/` | A | 11 imp, 0 clicks, pos 9.6 | Make the material decision answer explicit before supporting depth. |
| 6 | `/katzenwasser-taeglich-wechseln/` | A | 17 imp, 0 clicks, pos 12.5 | State a qualified water-change cadence directly, then preserve nuance. |
| 7 | `/filter-im-katzentrinkbrunnen-wechseln/` | A | 10 imp, 0 clicks, pos 13.3 | Clarify replacement cadence and signs in title/opening answer. |
| 8 | `/vergleiche/beste-trinkbrunnen-fuer-hunde/` | C | 21 imp, 0 clicks, pos 18.1 | Compare decision depth with ranking intent; strengthen the existing page, not a new URL. |
| 9 | `/smarte-futterautomaten/` | D | 87 imp, 0 clicks, pos 41.6 | Observe another window; if persistent, inspect category-intent ownership and intro—not layout. |
| 10 | `/trinkbrunnen/` | D | 22 imp, 0 clicks, pos 42.5 | Observe; inspect hub query mix before any metadata or navigation change. |

## Next 10 opportunities

1. Complete the five P1 intent/snippet reviews above.
2. Review `/katzenwasser-taeglich-wechseln/` with the same mechanism.
3. Review `/filter-im-katzentrinkbrunnen-wechseln/` with the same mechanism.
4. Evaluate the existing dog-Trinkbrunnen comparison at page-2 intent depth.
5. Monitor `/smarte-futterautomaten/`; act only if the discovery signal persists.
6. Monitor `/trinkbrunnen/`; act only if its query mix becomes interpretable.
7. Monitor `/futterautomat-katze/` and resolve Nassfutter intent ownership before editing.
8. Monitor `/vergleiche/`; its generic index role limits direct query expectations.
9. Monitor the two-cats comparison and cats-Trinkbrunnen comparison; both are discovery signals, not immediate rewrites.
10. Research the partial evidence on `/produkt/oneisall-2-in-1-feeder-water/`; volume remains below the action floor.

## Next implementation batch

**Trinkbrunnen Intent / CTR Batch — 6 URLs**

- `/trinkbrunnen-fuer-mehrere-katzen/`
- `/katzentrinkbrunnen-laut-pumpe/`
- `/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/`
- `/katzenwasser-taeglich-wechseln/`
- `/filter-im-katzentrinkbrunnen-wechseln/`
- `/produkt/petlibro-stainless-steel-fountain/`

Common mechanism: inspect observed query → title/H1 → immediate answer → internal contextual authority, then make only the smallest evidence-backed mismatch correction. Measure the next complete 28-day window and require at least 20 impressions before interpreting CTR or rank movement. Polar remains a separate product-intent investigation rather than expanding this batch.
