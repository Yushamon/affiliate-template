# PfotenTechnik 35.0A — Architecture audit

Audit before implementation; repository only, no external product research.

| Existing owner | Finding / reuse | Minimal gap to close |
|---|---|---|
| `src/content/schema/product.ts`, Astro products collection | Product frontmatter; inferred `ProductContentData`; optional structures supported | Optional consumables; extend existing repairability.parts, not a parallel replacementParts list |
| Product `price`, `priceState`, `availability`, `affiliate` | Merchant-neutral price snapshot and affiliate destination already exist; one primary product offer | Extract unchanged schema primitives for reuse in accessory offers; multiple offers with stable IDs, each for the same item/SKU/pack |
| `src/domain/price/types.ts`, engine and adapter | Source ID/label/type/URL, timestamp, currency; 30-day freshness in category engine | Cost calculation consumes these snapshots; no second price engine or price fetcher |
| `src/lib/price-intelligence/*`, product-operations policy | Safe fetch, structured Offer extraction, price updates and availability handling | No automation writes in 35.0A. Accessory offers can carry the same snapshot; explicit item/offer selection required |
| `src/content/schema/base.ts` evidenceSources | Existing field paths, source, URL, accessedAt and assertion | Add optional sourceType; reuse field paths for new claims, not another source registry |
| externalEvidence / product-evidence audit | Professional tests, user sources, consensus | Preserve; not a substitute for precise pack/interval evidence |
| `src/lib/seo/research/schema.ts`, `scripts/seo/import-research.mjs` | Evidence-bearing editorial opportunities; not a product-spec import engine | Preserve sourceType and fields in existing research evidence; no new import pipeline |
| `src/domain/productExperience/model.ts`, ProductExperience2 | Explicit display model and evidence UI | No integration of new fields into view models, CTA, JSON-LD or components |
| comparisonData.fountain / custom, comparisonFilters, specs | Existing capacity, materials, cordless/battery, text filter/cleaning/power facts | Keep existing owners; only missing machine-readable operational facts in comparisonData.fountain |
| repairability.parts | Pump/filter types, status, officialPart, partNumber, sourceUrl/type/verifiedAt; Streamside already has exact pump SKU | Add optional ID/name/compatibility/offers to these same entries; status remains availability/repairability owner |
| repairability.warrantyNote / experience.maintenance | Warranty and maintenance text already present | No duplicate warranty or maintenance field |

Core mapping: capacity → comparisonFilters.reservoirLiters / existing comparisonData.fountain.capacityLiters; material → existing fountain.material/custom.material/specs; cordlessOperation → existing fountain.cordless; warranty → repairability.warrantyNote. New structured operational claims, where absent: powerType, batteryRuntime (days + conditions), lowWaterShutdown, waterLevelVisible, pumpRemovable, dishwasherSafeParts under existing comparisonData.fountain. Filter presence/filterless operation and inventory completeness use optional consumablePolicy; required is per consumable, not duplicated at product level.

Consumables need pack size, manufacturer interval range, compatibility and proprietary/generic dependency. Known/unknown/notApplicable are explicit; known false is not unknown. All new researched claims reference existing evidenceSources.fields. Optional missing structures remain absent; no empty product migrations.

Commerce separates stable pack/SKU data, volatile merchant snapshots, and runtime calculation output. Mandatory TCO requires an explicitly complete consumable inventory; filterless alone never implies zero costs for sponges/cleaning cartridges. Optional items remain separate, and replacement pumps are never automatically annualized.

Schema follows the existing Astro/Zod collection path; [Astro content collections documentation](https://docs.astro.build/en/guides/content-collections/) consulted. No product sources were fetched.
