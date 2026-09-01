# PfotenTechnik 33.3 migration baseline

Generated 2026-08-31 from the production source tree before the shared-route switch.

| Collection | Source entries |
|---|---:|
| Products | 101 |
| Comparisons | 28 |
| Manufacturers | 32 |
| Guides/pages | 82 |
| Static build routes | 367 |

HEAD: `e17a591fddc5fc2348bc86a59b481e4fe3987a21`.

The 33.2.2 baseline already contained the automatic finalist selector,
Comparison ViewModel projections, generic media resolver and validated 33.x
foundation tokens. Product routes used `ProductExperience2`; comparison routes
used `ComparisonShell` except for the former camera-feeder reference route.
The migration promotes those validated paths to the normal production route.

The final build after migration completed successfully with 367 pages and no
Astro errors. Existing source data, URLs, schema and affiliate fields were not
rewritten.
