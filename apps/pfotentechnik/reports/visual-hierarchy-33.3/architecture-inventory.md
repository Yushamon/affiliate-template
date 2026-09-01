# 33.3 architecture inventory

| File/system | Used by | Replacement/role | Action |
|---|---|---|---|
| `src/components/comparison/ComparisonProduction.astro` | all comparison routes | shared data-driven comparison renderer | PROMOTE |
| `src/domain/comparison/buildComparisonViewModel.ts` | all comparison routes | production ViewModel and selector projection | KEEP |
| `src/domain/comparison/finalistSelection.mjs` | ViewModel/tests | deterministic finalists/alternatives/technical tail | KEEP |
| `src/domain/comparison/mediaResolver.mjs` | ViewModel/renderer | generic Astro/plain media resolution | PROMOTE |
| `src/components/product-experience-2/ProductExperience2.astro` | all product routes | shared decision-first product renderer | MIGRATE |
| `src/styles/foundation/foundation-33.css` | global foundation | shared primitives/tokens | KEEP |
| `@affiliate-core/components/comparison/ComparisonShell.astro` | no PfotenTechnik production route after migration | superseded comparison composition | INVESTIGATE (retained in affiliate-core for other sites) |
| `ReferenceComparison33` / `pt33-reference` route branch | none | `ComparisonProduction` + production foundation | REMOVED |

Reference naming is no longer a production route dependency. The remaining
`reference33` CSS compatibility names in the product subcomponents are shared
foundation selectors and are activated by the generic production renderer, not
by a product slug.
