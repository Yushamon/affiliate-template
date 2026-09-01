# Legacy cleanup

The former comparison reference route and its conditional page branch were
removed from PfotenTechnik production. The component was promoted in place to
`ComparisonProduction.astro`; no second comparison engine was introduced.

`ComparisonShell` remains in the shared affiliate-core package because it is a
cross-site package export; it has no PfotenTechnik production import after the
migration. Legacy finalist fields remain only as documented sparse-data
compatibility inputs. No content, links, schema or product data were deleted.
