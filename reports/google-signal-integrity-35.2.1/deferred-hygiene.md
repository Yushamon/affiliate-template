# Deferred hygiene — no implementation in 35.2.1

## Redirect normalization — P2 URL HYGIENE

Reuse 35.2's complete finite variant matrix: **1,037 combined variants take multiple hops**. None are current internal links or sitemap entries; all ultimately reach the correct 200 canonical. No new internal exposure in the final build. No redirects or Cloudflare settings were changed.

Future edge design, subject to review of the real deployed rule set: handle http/www together, preserve the canonical path and query string, and emit one **301** directly to `https://pfotentechnik.de/<canonical-path>`. For an extensionless document path, apply the known slash policy in that same target; leave asset/file extensions alone. Combine only verified predecessor aliases with their existing successor mapping if the edge supports it. Keep unknown paths as real 404 and avoid redirecting arbitrary garbage to home. Avoid rules that repeat/override origin normalization; test the complete protocol × host × slash matrix before any infrastructure deployment. This is a design note, not implemented configuration.

## Lastmod — NO_CHANGE

**LASTMOD_PARTIALLY_TRUSTWORTHY**, not a build timestamp. The final sitemap XML is byte-identical to 35.2: 260 URLs, 248 source dates, 12 omissions. No updatedAt, publishedAt, sitemap logic or freshness timestamp was changed by this package. Known limited trustworthiness does not block a freeze.

## Affiliate price audit — separate maintenance scope

`price:audit:strict` still fails for two missing affiliate destinations:

- `/produkt/litter-robot-5-pro/`: no confirmed price/affiliate destination.
- `/produkt/neakasa-riko/`: no configured affiliate destination; uncertain availability is preserved.

Both pages remain indexable, useful product pages and emit no fabricated Offer. No affiliate or commerce repair was performed. Follow-up belongs to the existing product-maintenance process if/when verified destinations become available; do not guess values to make this audit green.

## Other nonblocking items

The original four near-orphans were reviewed, with NO_CHANGE or PAGE_ROLE_JUSTIFIES_LOW_LINKING outcomes. One intended hub link is sufficient for the newly reachable advisor. Existing publisher-local SKU and legacy audit-counter limitations remain. Ordinary schema text-selection warnings are not confirmed semantic errors and were not bulk fixed.

Severity accounting retains four P2 groups (redirect variants, limited internal-support hygiene, partial lastmod trust, affiliate-target maintenance) and three P3 groups (publisher SKU provenance, legacy audit count, unconfirmed schema wording/provenance warnings). These categories describe deferred triage, not an instruction to start another technical batch.
