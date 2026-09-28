# Lifecycle / schema regression closure

**Root cause A: one bad Neakasa source value, duplicated into two public fields.** This is not a normalizer inferring workflow values, nor a generic schema mapper reading private metadata.

The original statement about a shared “Lifecycle-Owner” was in `decision.attention[3]` and `weaknesses[3]` of `src/content/products/neakasa-m1-lite.md`. ProductExperience reads those fields; Review negativeNotes directly selects weaknesses. UI list de-duplication sometimes hid the text, which did not make it safe for schema or other public consumers.

Both misplaced items were removed, and ownership was retained only in a YAML comment. Comments do not enter parsed frontmatter. The related Markdown section now describes the manufacturer's two model names without “Intent-Owner” or route-management prose. Existing real caveats (minimum weight, step height, litter restrictions and inconsistent sensor documentation) remain. No scores, price, availability, affiliate data, schema templates or ProductExperience mapping were redesigned.

## Prevention and scope

The existing data model already separates public claims from workflow metadata. A runtime keyword filter would silently alter valid pros/cons and was not needed. Three tests in `test/google-signal-closure-35.2.1.test.mjs` enforce the source boundary: (1) internal role/state labels are rejected in public input fields, while separate workflow fields remain allowed; (2) all 103 products' public nested text inputs are scanned; (3) Neakasa's ownership comment is private and product caveats remain intact. This is a release regression gate, not a claim that regex can determine the meaning of arbitrary future prose.

Post-build verification also scans every product's actual public text and structured data for the identified role/state-label class. The existing signal audit now supports `--expect-no-orphans`, so an invisible/source-only entry point fails closure validation.

- Products checked: **103**.
- Confirmed same-root-cause products before fix: **1**, Neakasa.
- Additional similar confirmed leaks: **0**.
- Remaining confirmed leaks: **0**.
- Potential leaks in the checked inputs/output: **0**.
- Product/Review JSON syntax: **103/103 valid**.
- Confirmed semantic invalid products: **0** (previously 1).
- Remaining warning products: **103**, consisting of the prior 102 plus repaired Neakasa, which still has ordinary summary-selection warnings.

Warnings are retained as diagnostic text-selection/provenance checks, not treated as fabricated reviews or unsupported claims merely because wording differs. No bulk warning cleanup occurred. All 103 editorial ratings equal the 35.2 baseline, all remain visible, no AggregateRating was introduced, and no Offer names PfotenTechnik as merchant. The current workspace has 68 Offers; the difference from 35.2's 67 belongs to the concurrent commerce update, not this closure change.

Evidence: postfix/structured-data-audit.csv, postfix/product-visible-evidence.json, validation/tests-final.log and closure.json. Product schema still refers to each actual self-canonical product URL. The missing affiliate destinations produce no Offer and remain out of scope.
