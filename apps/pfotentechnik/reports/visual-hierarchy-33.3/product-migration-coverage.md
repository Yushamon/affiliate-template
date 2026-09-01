# Product migration coverage

All 101 product entries use the shared `ProductRenderer → ProductExperience2`
path. The renderer consumes structured product data and provides generic
fallbacks for missing gallery, price, evidence, fit and alternatives.

| Class | Count | Definition |
|---|---:|---|
| A full experience | 94 | hero/media, identity and decision data available |
| B partial with fallback | 7 | one or more optional data lanes absent; generic fallback rendered |
| C data blocker | 0 | no product blocks the build or route |

No product-specific visual branch remains; missing information is not invented.
