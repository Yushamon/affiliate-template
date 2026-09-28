# Advisor orphan closure

The final production entry is one ordinary server-rendered paragraph link in `apps/pfotentechnik/src/components/category/CategoryExperience.astro`, inside **Anforderungen zuerst**, before the requirement list, scoped to `model.slug === "smarte-futterautomaten"`.

Source: `/smarte-futterautomaten/`. Target: `/futterautomat-berater/`. Anchor: **Futterautomat-Berater**. The surrounding sentence explains the six questions and the resulting models/limitations. It belongs to the requirements-first decision journey, uses existing paragraph/link styling, and is not a sitewide/footer link. No CSS or navigation system was changed.

The hub uses CategoryExperience instead of rendering its Markdown body. The final change is therefore in the actual renderer; the interim Markdown-only paragraph was removed. Source text alone is not accepted as evidence: final HTML parsing, browser DOM checks and graph assertions prove the actual anchor exists.

| Metric | 35.2 | Final build |
| --- | ---: | ---: |
| Advisor incoming unique sources | 0 | 1 |
| Advisor contextual source pages | 0 | 1 |
| Advisor homepage depth | unreachable | 2 |
| True orphans | 1 | 0 |
| Near-orphans (mechanical one-source definition) | 4 | 5 |
| Reachable pages >3 clicks | 0 | 0 |
| Canonical internal-link occurrences | 16900 | 16901 |

The extra near-orphan is the intentionally single-source advisor, not a new orphan or regression. Adding another link solely to change this counter is not justified. All four prior near-orphans remain unchanged:

- /produkt/petkit-fresh-element-infinity/ — **PAGE_ROLE_JUSTIFIES_LOW_LINKING**. Archived/discontinued; manufacturer-only archive discovery is sufficient, depth 3.
- /produkt/petlibro-one-rfid-smart-feeder/ — **NO_CHANGE**. Available product, manufacturer source, depth 3. No demonstrated user-journey gap justifies changing curated comparisons/selection in this batch.
- /produkt/wopet-pioneer-f01-plus/ — **PAGE_ROLE_JUSTIFIES_LOW_LINKING**. Archived/out-of-stock; manufacturer archive path at depth 3 is appropriate.
- /seniorenhunde-richtig-versorgen/ — **PAGE_ROLE_JUSTIFIES_LOW_LINKING**. Supporting guide, linked from /wissen/ and reachable at depth 2; no missing essential journey established.
- /futterautomat-berater/ — **PAGE_ROLE_JUSTIFIES_LOW_LINKING**. Newly reachable tool: one meaningful main-cluster-hub entry at depth 2 is the intentionally minimal fix.

Evidence: postfix/internal-authority-graph.csv, postfix/graph-evidence.json, closure-visual-qa.json. All 260 canonical URLs are now reachable. No redirect or query-string link is introduced.
