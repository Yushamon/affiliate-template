# Homepage 34.1 — Discovery Recomposition Audit

Scope: `/` only. Product, comparison and category renderers were not changed.

| Previous homepage block | Decision | Reason |
| --- | --- | --- |
| Hero | Replace | Make the value proposition, real media and first discovery action immediately legible. |
| Use cases | Refine | Keep the six existing route-backed needs, but render them as editorial decision rows rather than a card grid. |
| Comparison navigation | Merge | Curate four high-value, existing comparison routes into one selective decision chapter. |
| Product recommendations | Replace | Retain one real, data-backed product moment instead of a generic recommendation grid. |
| Guide feed | Refine | Retain three route-backed guides selected by existing hub priority. |
| Method, stats, FAQ and topic-directory blocks | Merge/Remove | Their useful trust and destination functions are retained in the concise difference, category, transparency and closing chapters; duplicate dashboard/feed treatment is removed. |

## SEO and link delta

- Title, meta description, canonical, robots, H1 text and Organization/WebSite schema remain unchanged.
- Homepage text is server-rendered; there is no client hydration or hidden content.
- Internal destinations remain intentionally distributed across all six categories, four comparisons, one product, three guides, methodology, editorial and affiliate transparency. Unique internal route links changed from 30 to 23 because duplicate/feed-directory links were consolidated, not because a strategic page was orphaned.
- Image count changed from 18 to 10: the single hero, four decision images, one product image and three guides are retained as purposeful media; duplicate/feed media was removed.

## Performance and browser QA

- Homepage production output: 40,825 bytes HTML, 0 bytes page JS, 10 images / 380,262 image bytes. The performance audit reports no homepage finding.
- The repository-wide strict performance audit still reports known pre-existing non-homepage budget exceedances on a product, a category and a comparison route.
- Browser matrix: 320, 375, 430, 768, 820, 1024, 1280, 1440 and 1600 px in Light and Dark; every case has equal `clientWidth` and `scrollWidth`, one H1, loaded homepage images and a 44 px-or-larger primary action.
