# Measurement Plan — Trinkbrunnen 34.6

## Measurement start

Do not judge the 2026-08-21 intervention from the current export. Resync search data after the tracker deadline (2026-09-11) and preferably after 2026-09-18, when a complete 28-day post-intervention window beginning 2026-08-22 can exist. Continue to label absent rows UNKNOWN.

## Primary measurements

For every URL:

1. Google page impressions, clicks, CTR and average position for an entirely post-intervention window.
2. Query-level impressions, clicks, CTR and position for the primary cluster named in `query-intent-map.md`.
3. Query-to-URL ownership: whether the intended URL remains the ranking URL.
4. Brand/non-brand split where query disclosure supports it.

Use the established minimum of 20 impressions per URL or coherent query cluster before interpreting CTR direction. Do not combine unrelated queries merely to clear the threshold.

## Secondary measurements

- Change in disclosed-query coverage and anonymous/unreported share.
- Whether any target begins competing with the hub, comparison, cleaning or another target URL for the same query cluster.
- Indexability, canonical and generated-link health.
- If first-party analytics becomes available, engaged sessions and onward clicks; these are currently UNKNOWN and must not be inferred from search clicks.

## Decision states

| State | Evidence requirement | Action |
|---|---|---|
| KEEP | Observation window mature; query ownership stable; no technical regression; performance direction interpretable or still healthy | Retain current page contract |
| WATCH | Fewer than 20 relevant impressions, material query disclosure gaps, mixed direction or absent current row | Preserve page and extend observation |
| REASSESS | Mature, sufficiently sized data shows a repeatable mismatch, wrong ranking URL or material deterioration relative to the saved baseline | Form one new hypothesis and change only the responsible layer |
| REVERT | A specific 2026-08-21 change can be isolated and sufficiently sized post-change evidence shows it caused a material regression | Restore that exact prior element, then restart measurement |

No fixed uplift percentage is declared because the samples are too small to support a credible numeric target.

## URL-specific success questions

| URL | Primary success question |
|---|---|
| Multiple cats | Does the specialist page retain ownership of count/placement queries and earn measurable interaction once sufficiently exposed? |
| Loud pump | Does the troubleshooting page retain symptom-query ownership without leaking to pump-cleaning content? |
| Material | Does the comparison guide own generic stainless-vs-ceramic-vs-plastic queries while branded model queries remain on products? |
| Daily water | Does the page gain visibility for water-change frequency without conflicting with full-cleaning content? |
| Filter | Which actual query cluster generates its impressions, and does it concern interval, replacement procedure or cost? |
| PETLIBRO | Does the product URL retain the disclosed branded stainless-fountain query and move into an interpretable sample? |
