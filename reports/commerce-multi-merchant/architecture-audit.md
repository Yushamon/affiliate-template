# Architecture audit — 2026-09-21, before implementation

- Affiliate Core: `packages/affiliate-core/src/affiliate/` owns Amazon URL normalization and tracking. Extend it with deterministic network links; retain Amazon behavior.
- Shared commerce schemas: `src/content/schema/commerce.mjs` supplies price, source, affiliate, state and availability fields. Consumable/filter offers already compose these in `consumables.mjs`. Reuse the offer core rather than introduce another price or accessory inventory.
- Persistence: product Markdown is the source of truth. `frontmatter-price.mjs` performs serialized atomic field mutations. Add per-offer mutation here; leave legacy Amazon price/affiliate fields intact and expose them as an implicit offer.
- Price Intelligence: `service.mjs`, `safe-fetch.mjs`, `extract-offer.mjs`. Current refresh is generic merchant HTML extraction, not an Amazon API. Existing `/api/admin/prices/check` and `/check-all` routes and Cockpit controls will orchestrate all configured offers, with isolated failures.
- Price/freshness: `domain/price/engine.ts` (14-day display freshness), Product Operations `ageInDays`, `formatPrice`, availability policy. Reuse these concepts; comparisons need extra variant/shipping checks and must never read commission data.
- Cockpit: `/admin/seo/prices/`, Operations router and existing dirty-form/state reconciliation. Extend these, no separate provider dashboard.
- ProductExperience2: `domain/productExperience/model.ts` -> `ProductHero2` -> `PriceBox2`; extend this commerce zone. Comparison/guide CTAs retain their existing compact layout; expose the same offer resolver for future placements.
- Filter costs: `accessoryCommerce.mjs`, `consumables.mjs`, existing calculation/fountain models remain authoritative. No new cost calculations or monetization of evidence URLs.
- Disclosure/SEO: existing product trust/methodology and affiliate-hinweis; preserve sponsored/nofollow/noopener. Canonicals/routes/sitemap unchanged. Affiliate destinations are external URLs, no redirect pages.
- Analytics: existing comparison link data attributes, no network-specific UI tracking. Add consistent merchant/product/placement/pageType metadata and Awin clickref in Affiliate Core, no tags/scripts.
- Credentials: only unrelated search-service environment keys present; no Awin feed credentials or ADCELL/Tractive program configuration found. Awin link IDs come from the user; ADCELL remains explicitly unconfigured.
- Existing tests: affiliate-core, price-intelligence, Product Operations, ProductExperience2, fountain accessory commerce, internal links, SEO/Cockpit. Full existing suites plus focused multi-merchant tests required.

Minimal extension: optional product `offers` using the shared commerce core, program configuration separate from product mappings, one normalized offer resolver and existing refresh/persistence/UI extended. No second product store, price engine, disclosure, or cockpit.

Sources: [Awin deep links](https://success.awin.com/articles/en_US/Knowledge/What-is-deep-linking-and-why-should-I-use-this), [Awin link format](https://success.awin.com/articles/en_US/Knowledge/What-does-an-affiliate-link-look-like). Commission 8% / cookie 30 days: user-provided acceptance confirmation, not independently fetched and never ranking input.
