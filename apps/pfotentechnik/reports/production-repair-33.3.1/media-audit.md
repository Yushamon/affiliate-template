# Production Repair 33.3.1 — Media Audit

## Shared policy

Compact decision media resolves in this order:

1. `comparison`
2. `thumbnail`
3. `hero`
4. first valid `gallery` item

The resolver returns the original metadata object, not a reconstructed URL.
Consumers use `OptimizedImage`; no product slug, brand, or finalist exception
exists.

## Consumers audited

| Surface | Result |
| --- | --- |
| Product Hero / Gallery | existing emitted Astro assets retained |
| Product Alternatives | migrated from raw/optimized split to `OptimizedImage`; compact fallback added |
| Comparison Finalists | `OptimizedImage` with compact fallback |
| Comparison relevant alternatives | `OptimizedImage` with compact fallback |
| Comparison Explorer | existing `OptimizedImage`, now receives shared model media |
| Category / manufacturer surfaces | already use `OptimizedImage` with thumbnail/hero fallback |

## Regression vectors

The resolver regression test covers all standard media, hero only, comparison
only, thumbnail only, gallery only, missing preferred source, and no optional
media. The production browser gate uses the reported PetSafe product and the
Mikrochip-Katzenklappen comparison: all rendered repair-scope images decode,
have a non-zero natural size and rendered rect, and no fallback reserves a
large blank stage.

The reported SureFlap finalist resolves through the shared gallery fallback;
the reported PetSafe alternative now keeps its Astro metadata through the
rendered `srcset` contract.
