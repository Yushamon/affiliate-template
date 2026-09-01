# PfotenTechnik Visual Legacy Audit 34.3a — Legacy Color Audit

Audit date: 2026-09-01

## Method

The audit combined a scoped source search with computed-style inspection of all 20 route records in four states each. Literals were classified before migration; no repository-wide replacement was performed.

Search targets included `#fff`, `#ffffff`, `white`, six-digit hex colors, `rgb()` / `rgba()`, old blue and green surfaces, pre-Graphite dark colors, hard-coded card backgrounds, borders, shadows and text colors. The final scoped scan of rendered legal, hub, Guide and advisor components has no UI color literal matches. The remaining `white-space` matches are CSS layout properties, not colors.

## Classification

### A — Legitimate semantic exceptions

- Foundation token definition files necessarily contain literal source values.
- Stable inverse/on-brand token values are semantic system inputs, not page-specific overrides.
- Product image stages and image backgrounds may intentionally differ from page surfaces.
- `/foundation/` deliberately presents explicit Light and Dark samples together. During outer Dark inspection, the intentional `[data-pt-mode="light"]` sample is excluded from the white-surface rule.

### B — Image / asset color

- Bitmap, WebP, AVIF and SVG artwork may contain white, blue, green or dark pixels.
- Asset pixels were not rewritten because they do not define public UI surfaces.

### C — Legacy UI color: migrated

| Surface | Initial issue | Migration |
| --- | --- | --- |
| `/wissen/` | Hard-coded teal, white cards, borders and shadows in an old hub composition | Replaced with Foundation page, surface, border, accent and shadow tokens; architecture retained |
| `/hersteller/` | Manufacturer-hub-specific pre-Graphite dark surfaces and borders | Replaced with semantic theme tokens; image-stage treatment preserved |
| `/futterautomat-berater/` | Slate/green/white advisor colors, alerts, cards and a hard-coded sticky gradient | Replaced with semantic tokens; sticky mobile action overlay removed after screenshot review |
| `/berater/futterautomat/` | Hard-coded light cards and explicit navy Dark overrides | Consolidated into one semantic Foundation layer with visible focus treatment |
| Legal / utility pages | Shared legacy white article card could survive independently of the current page background | Added `LegalPageLayout` using the Reading Axis and semantic page/text/link/divider tokens without a card shell |

### D — Test fixture / example only

- Color-string patterns used by audit tests and source scanners are not rendered UI.
- Foundation preview examples are intentional demonstrations and are classified under A when rendered.

## Non-public and deferred source

`src/components/advisor/AdvisorCompare.astro` contains old literal borders, green and slate values, but no page, component or test imports it. It is a non-rendered orphan, not a public surface. Deletion is deferred to 34.4 repository consolidation so this visual audit does not infer ownership or remove code merely because it is unused.

The shared compatibility section in `pfotentechnik-design-system.css` still contains historical literals for frozen major-experience selectors. Broad removal would redesign or destabilize frozen routes and is outside 34.3a. The route-specific manufacturer rules were tokenized, and computed inspection confirms that none of the historical pre-Graphite values survives on any audited remaining public route. Compatibility-layer consolidation is therefore a 34.4 source-cleanup concern, not an open public visual defect.

## Computed result

The browser matrix produced 80 passing route/state checks and zero findings:

- no hard-coded white UI surface in Dark;
- no audited pre-Graphite dark surface;
- page backgrounds resolve to Foundation semantic surfaces;
- shared headers and footers are present;
- body text follows the current theme;
- focus is visible on the first functional control;
- no horizontal overflow or broken media;
- legal routes resolve to `--pt-content-narrow`.

Result: legacy color surfaces are cleared from the audited public UI. Remaining literal definitions are semantic inputs, asset color, fixtures/examples or non-rendered/frozen compatibility source explicitly deferred to 34.4.
