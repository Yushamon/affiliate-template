# User journey audit — Category → Comparison routing

Date: 2026-09-01  
Scope: six major Category/Hub routes, generic `/vergleiche/`, homepage discovery, comparison breadcrumbs and product backlinks.

## Executive finding

Before implementation, the 34.2 category renderer already avoided a direct link from a Category primary journey to the generic `/vergleiche/` overview. However, it did not expose a consistent primary-comparison CTA between orientation and requirements, and “primary comparison” was only implied by the first comparison entry and the closing CTA. That was not a stable routing contract.

The old generic comparison overview had a separate priority defect. It sorted by historic `hub.featured` and `hub.order` values. This put both Katzenklappen entries first, while Futterautomaten — the broadest commercial category and the only category with direct GSC evidence for its main comparison — started at position 10.

## Category CTA audit — before and after implementation

“Top CTA” means a comparison action between the category orientation and the requirement chapter. None existed before implementation. The “old destination” column records the first comparison destination reachable later in the old category journey.

| Category | Homepage destination | Primary Comparison | Top CTA present | Old CTA destination | New CTA destination | Secondary Comparisons | Breadcrumb parent | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Futterautomaten | `/smarte-futterautomaten/` | `beste-futterautomaten-fuer-katzen` | YES — Futterautomaten vergleichen | `/vergleiche/beste-futterautomaten-fuer-nassfutter/` via first decision path; no top CTA | `/vergleiche/beste-futterautomaten-fuer-katzen/` | Hunde; Nassfutter; zwei Katzen | `/smarte-futterautomaten/` | PASS |
| Trinkbrunnen | `/trinkbrunnen/` | `beste-trinkbrunnen-fuer-katzen` | YES — Trinkbrunnen vergleichen | `/vergleiche/beste-trinkbrunnen-fuer-katzen/`; no top CTA | `/vergleiche/beste-trinkbrunnen-fuer-katzen/` | Hunde | `/trinkbrunnen/` | PASS |
| GPS-Tracker | `/gps-tracker/` | `beste-gps-tracker-fuer-hunde` | YES — GPS-Tracker vergleichen | `/vergleiche/beste-gps-tracker-fuer-hunde/`; no top CTA | `/vergleiche/beste-gps-tracker-fuer-hunde/` | Katzen; ohne Abo; lange Akkulaufzeit | `/gps-tracker/` | PASS |
| Katzenklappen | `/katzenklappen/` | `beste-mikrochip-katzenklappen` | YES — Katzenklappen vergleichen | `/vergleiche/beste-mikrochip-katzenklappen/`; no top CTA | `/vergleiche/beste-mikrochip-katzenklappen/` | App und Beuteerkennung | `/katzenklappen/` | PASS |
| Haustierkameras | `/haustierkameras/` | `beste-haustierkameras` | YES — Haustierkameras vergleichen | `/vergleiche/beste-haustierkameras/`; no top CTA | `/vergleiche/beste-haustierkameras/` | none: only one supported category comparison | `/haustierkameras/` | PASS |
| Automatische Katzentoiletten | `/automatische-katzentoiletten/` | `beste-automatische-katzentoiletten` | YES — Katzentoiletten vergleichen | `/vergleiche/beste-automatische-katzentoiletten/`; no top CTA | `/vergleiche/beste-automatische-katzentoiletten/` | none: only one supported category comparison | `/automatische-katzentoiletten/` | PASS |

## Primary comparison decisions

- **Futterautomaten:** `beste-futterautomaten-fuer-katzen` is the strongest broad commercial owner. The category contains 37 products and the comparison has direct GSC evidence (3 impressions, average position 2.3) with an explicit signal report instruction to keep commercial anchors pointed at it.
- **Trinkbrunnen:** `beste-trinkbrunnen-fuer-katzen` is the broadest supported comparison for the site’s 24-product fountain inventory. Existing search signals around feline fountain maintenance reinforce the category, but the sample is too small to imply search volume.
- **GPS-Tracker:** `beste-gps-tracker-fuer-hunde` is the broadest current general entry for the 12-product tracker inventory. Cat, no-subscription and long-battery comparisons remain secondary paths. Existing Tractive and small-cat signals are supporting evidence, not a basis for invented volume.
- **Katzenklappen:** `beste-mikrochip-katzenklappen` is the category’s broad access-control comparison. App/prey detection is a narrower secondary decision.
- **Haustierkameras:** `beste-haustierkameras` is the only complete category comparison.
- **Automatische Katzentoiletten:** `beste-automatische-katzentoiletten` is the only complete category comparison.

All six primary and secondary destinations exist in the comparison collection. The primary choices also match the current closing destinations; the repair makes that responsibility explicit and reusable.

## Generic `/vergleiche/` priority — before

Current production order from the generated overview:

1. Mikrochip-Katzenklappen
2. Katzenklappen mit App und Beuteerkennung
3. Trinkbrunnen für Katzen
4. Trinkbrunnen für Hunde
5. Haustierkameras
6. Automatische Katzentoiletten
7. GPS-Tracker ohne Abo
8. GPS-Tracker mit langer Akkulaufzeit
9. Kleine GPS-Tracker für Katzen
10. Futterautomaten für Katzen
11. Futterautomaten für Hunde
12. Futterautomaten für Nassfutter
13. Futterautomaten für zwei Katzen
14–28. remaining specialist feeder and GPS comparisons in historic hub order

The ordering is driven by `featured`, then `hub.order`, then title. It does not represent business/user-demand priority.

## Generic `/vergleiche/` priority — implemented

The first major chapter will show three emphasized decision areas:

1. Futterautomaten
2. Trinkbrunnen
3. GPS-Tracker

The next compact chapter will show:

4. Automatische Katzentoiletten
5. Haustierkameras
6. Katzenklappen

All remaining specific comparisons stay discoverable in a compact list, grouped by the same category priority and then by explicit secondary relevance/current stable metadata. The internal tier names are not exposed to users.

Exact generated order after implementation:

1. `beste-futterautomaten-fuer-katzen`
2. `beste-trinkbrunnen-fuer-katzen`
3. `beste-gps-tracker-fuer-hunde`
4. `beste-automatische-katzentoiletten`
5. `beste-haustierkameras`
6. `beste-mikrochip-katzenklappen`
7. `beste-futterautomaten-fuer-hunde`
8. `beste-futterautomaten-fuer-nassfutter`
9. `beste-futterautomaten-fuer-zwei-katzen`
10. `beste-futterautomaten-ohne-wlan`
11. `beste-futterautomaten-mit-kamera`
12. `beste-futterautomaten-fuer-berufstaetige`
13. `beste-futterautomaten-fuer-kleine-hunde`
14. `beste-futterautomaten-fuer-mehrtierhaushalte`
15. `beste-futterautomaten-fuer-seniorenkatzen`
16. `beste-futterautomaten-fuer-welpen`
17. `beste-futterautomaten-mit-akku`
18. `beste-futterautomaten-mit-edelstahl-napf`
19. `beste-futterautomaten-unter-100-euro`
20. `futterautomat-fuer-grosse-hunde`
21. `futterautomat-gegen-schlingen`
22. `futterautomat-mit-app`
23. `beste-trinkbrunnen-fuer-hunde`
24. `beste-gps-tracker-fuer-katzen`
25. `gps-tracker-ohne-abo`
26. `gps-tracker-mit-langer-akkulaufzeit`
27. `kleine-gps-tracker-fuer-katzen`
28. `katzenklappen-mit-app-und-beuteerkennung`

## Signals used for prioritization

No search volume was invented. The order uses:

1. the current low-data GSC/SEO signal reports;
2. product breadth: Futterautomaten 37, Trinkbrunnen 24, GPS 12, Katzentoiletten 11, Katzenklappen 9, Haustierkameras 8;
3. comparison breadth and completeness;
4. commercial decision depth and the site’s established homepage/navigation importance;
5. strategic distinction between broad/core categories and narrower specialist areas.

The current GSC sample is explicitly low (47 impressions in the SEO 34.0 baseline), so it is a conservative supporting signal rather than an automated sort score.

## Homepage audit

No homepage URL change is required:

- general product-world cards and use-case entries correctly lead to Category routes;
- specific purchase decisions already deep-link to Comparison routes;
- the generic hero action correctly leads to `/vergleiche/` because no category has yet been chosen.

The Homepage 34.1.1 visual composition remains untouched. A source diff confirms no homepage route, component, stylesheet or model change was made.

## Existing downstream link flow

- Comparison finalist links resolve to real Product routes.
- Representative finalist Product pages already link back to the applicable primary Comparison through existing product comparison data and the shared recommendation resolver.
- Product breadcrumbs already return through their Category.
- Comparison breadcrumbs now use the semantic Category parent for all 28 registered comparisons. Canonicals and route URLs are unchanged.

## Implementation and regression result

- One `categoryDecisionRouting` contract owns six category primaries, contextual CTA copy, secondary paths, comparison category ownership and overview priority.
- Every category renders the primary comparison directly after its hero/orientation and before requirements.
- Category path and closing links derive comparison URLs from the contract; no category config contains a hard-coded `/vergleiche/.../` destination.
- The generic overview remains a neutral discovery page and exposes every one of the 28 comparison routes exactly once in its decision content.
- All six verified journeys pass: Homepage → Category, Category → specific primary Comparison, Comparison → first finalist Product, Product → relevant primary Comparison.
- Focused automated result: 26/26 passing across the new P0 journey suite, Category 34.2, frozen Homepage 34.1.1, Comparison 33.3.x and Product regression suites.
- Category browser result: 108/108 passing across six routes, nine widths from 320–1600 px and Light/Dark.
- Generic overview browser result: zero horizontal overflow at 320, 390, 768 and 1440 px after the narrow-title breakpoint repair.
- Production result: 367 pages built with sitemap; strict link-target and release-output gates report zero errors and zero warnings; technical SEO passes.
