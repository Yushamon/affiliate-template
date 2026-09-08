# Consumable and replacement cost foundation (35.0A)

Foundation only. No renderer, CTA, JSON-LD, ranking or content migration consumes these fields.
Research values below are schema examples, never claims about real products.

## Existing owners

- `consumables[]`: optional stable item inventory. Each ID identifies one SKU/pack; offers for different pack sizes must use different item IDs. `required` says whether it is mandatory; known false means optional, unknown is not false. `dependency` is proprietary/generic/unknown, without a score.
- `consumablePolicy`: filter presence, officially permitted filterless operation, and explicitly researched inventory completeness. Filterless does not imply no other consumables.
- `repairability.parts[]`: existing replacement-part owner. `status` remains the availability/capability statement (supported/unavailable/unknown/notApplicable); no duplicate pumpAvailable or replacementParts list. Optional ID, name, compatibility and offers attach to the same entry. Existing partNumber and source fields remain authoritative.
- `comparisonData.fountain`: retain existing capacityLiters/material/cordless. Optional structured operating fields: powerType, batteryRuntime (min/max days and conditions), lowWaterShutdown, waterLevelVisible, pumpRemovable, dishwasherSafeParts. `repairability.warrantyNote` remains warranty owner. No duplicate material/capacity/warranty fields are added.
- `evidenceSources`: sole field-source list. Optional `sourceType` extends the existing source/url/accessedAt/assertion/fields structure. The existing research importer preserves sourceType/fields; it remains an editorial planning import, not an automatic product updater.

## Research state and field evidence

```yaml
packSize: { status: known, value: 8 }
required: { status: known, value: false }
dependency: { status: unknown }
replacementInterval: { status: notApplicable }
```

Known values require a source with the exact path, e.g. `consumables.0.packSize` in `evidenceSources[].fields`. Reordering arrays must update the paths. All eight provenance categories are supported: manufacturer, manual, officialStore, retailer, ownMeasurement, calculated, independentSource, aggregatedUserReports. Calculated is reserved for derived results, not evidence of a raw researched fact. Manufacturer intervals and a positive claim of filterless operation need manufacturer/manual/officialStore evidence. Existing untyped evidence remains valid for old products but cannot substantiate new known claims.

No quantitative noiseDb field is introduced. A future measurement field must distinguish own or documented independent measurements from subjective noise reports; existing prose is not converted into decibels.

## Offers reuse existing commerce primitives

Each optional `offers[]` entry has a unique ID, existing `price`, `priceState`, `availability`, and optional existing `affiliate`. Merchant identity and source URL remain in `price.source`; no second merchant registry. Multiple merchants may offer the same stable SKU/pack. No merchant is silently preferred and no affiliate link is emitted.

Existing safe fetch / Offer extraction / price updates are unchanged. This batch prepares storage and calculation inputs; it does not introduce an accessory crawler or auto-update product files. Accessory refresh in 35.0B can reuse the extraction service, targeting an explicit item and offer rather than the primary product price.

## Calculation API

```js
calculateConsumableCost({ product, consumableId, offerId, now, maxPriceAgeDays: 30 });
calculateThreeYearCost({ product, purchaseOffer, offerIds: { 'item-id': 'offer-id' }, now });
```

`purchaseOffer` wraps the existing primary product price/state/availability in the same offer envelope. Currency conversion and price selection are deliberately not implicit.

- `unitCost = packPrice / packSize`
- `annualCostLow = unitCost * 365 / maxDays`
- `annualCostHigh = unitCost * 365 / minDays`
- `threeYearCost = purchasePrice + 3 * mandatoryAnnualConsumableCost`

Numbers retain JavaScript double precision without intermediate rounding; presentation may format separately. Results are amortized consumption, not whole-pack cash outlay. They exclude shipping, electricity and failure-dependent parts. Constant prices/intervals over three years are a projection assumption, not a forecast.

No price, stale/unavailable price, missing timestamp, pack size, interval, selected offer or exact product compatibility means `insufficientData` and null costs. Invalid negative/zero prices, nonpositive packs/intervals, reversed ranges and numeric overflow are rejected. An explicit notApplicable interval stays notApplicable. Unknown required status blocks mandatory TCO. Only a proven complete inventory permits summing mandatory costs or concluding a zero mandatory-consumable total. Optional consumables are returned separately. Replacement pumps never enter recurring TCO.

Calculated provenance carries formula/version, sourceType calculated, input numbers, exact field paths, item/offer IDs, price source/time, relevant original evidence and projection assumptions. No manually maintained annual-cost field or extra source record is necessary.

## Validation and research

The existing `audit:products:strict` validates this foundation as part of the normal release phases. The product collection also validates it during Astro builds. Regression tests cover real old product files and synthetic new field structures; fixtures are not research.

Repository-only readiness report can be regenerated with:

```sh
node apps/pfotentechnik/scripts/product-evidence/fountain-readiness.mjs
```

35.0B must confirm facts, exact SKU/pack compatibility, interval and current offers before any calculation can be published. Keep the 34.8 observation cohort and baseline unchanged during this foundation batch.

## 35.0B internal import

`research/fountain-cost-35.0b.json` stores all 24 researched product payloads using the existing schema. They are staged separately from public Markdown because 34.6 protects exact source hashes and 34.7 freezes rendered output. No renderer imports this dataset. The existing product audit includes its evidence/commerce/variant gate; regression tests merge every record with its original product and validate the actual full product schema.

The only added consumable type is `waterTreatment`: Eversweet Ultra's structurally required Cube C is explicitly not a conventional filter. Existing calculations handle it without a separate formula. A filterless product can still have mandatory consumables.

Each item has one representative pack format. Offers on the same item must use that pack size; variant identity, observed price, availability and response hash are retained in research metadata. Other pack sizes are not mixed into that item's offers. Pump/filter bundles are explicitly named and never priced as a pump alone.

```sh
node apps/pfotentechnik/scripts/product-evidence/fountain-dataset.mjs
node apps/pfotentechnik/scripts/product-evidence/fountain-report.mjs
```

These commands reproduce the historical research snapshot at its `asOf` time, not a live price refresh. `inspectDataset(dataset, now)` can apply another date; the existing engine rejects expired prices. Reports separate primary-filter projections from complete recurring cost, keep unknowns and missing offers explicit, and provide no publication authorization. Report regeneration uses the completed validation artifact without rerunning production checks.
