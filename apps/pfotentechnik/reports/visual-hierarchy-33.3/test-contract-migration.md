# Test contract migration

Historical tests were reviewed by contract rather than version number.

| Test/suite | Class | Action | New contract | Status |
|---|---|---|---|---|
| `reference-comparison-33.test.mjs` | B | MIGRATE | shared production comparison route, automatic selection and Explorer | PASS |
| `reference-product-33.test.mjs` | B | MIGRATE | shared product foundation, V29 gallery, fit, evidence and closing | PASS |
| `comparison-finalist-selection.test.mjs` | C | KEEP | deterministic, diverse, data-complete finalist selection | PASS |
| `comparison-finalist-cross-category.test.mjs` | C | KEEP | feeder/GPS/fountain selection coverage | PASS |
| `comparison-media-resolver.test.mjs` | C | KEEP | generic image resolution and real asset validity | PASS |
| 30.x layout/token tests asserting retired selectors | A/B | classified in existing suite; migrated only where property remains valid | current production contract | PASS for the 33.3 gate |

Totals for the 33.3 gate: audited 29 assertions, deleted 0, replaced 0,
migrated 6 contract files, kept 3 regression files, unresolved 0.
