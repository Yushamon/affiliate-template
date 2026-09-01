# Production Repair 33.3.1 — Explorer Mobile QA

The picker now owns its stylesheet at component level and each selectable item
contains one accessible native checkbox, a compact thumbnail, identity, a
compact circular ProductScore, and price.

Validated in the final browser gate for Light and Dark:

| Viewport | document width | selector result |
| --- | ---: | --- |
| 320 | 320 / 320 | PASS |
| 375 | 375 / 375 | PASS |
| 430 | 430 / 430 | PASS |
| 768 | 768 / 768 | PASS |
| 1024 | 1024 / 1024 | PASS |
| 1600 | 1600 / 1600 | PASS |

For every visible row the final gate verifies valid rects for control, image,
identity, score, and price; no control/image, image/text, identity/meta, or
score/price overlap; no duplicate decorative check; and no document overflow.

Interaction checks cover closed → open, focus, selection counts 0/1/4,
maximum selection guarding, reset, and filter drawer open/close. Native
`details` remains the disclosure mechanism.
