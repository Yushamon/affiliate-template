# Geometry QA

Route: `/vergleiche/beste-haustierkameras/`

Browser matrix: 320, 375, 430, 768, 820, 1024, 1280, 1440, and 1600px; Light and Dark mode at every width (18 runs).

| Gate | Result |
|---|---|
| Document overflow | 18/18 exact `scrollWidth === clientWidth` |
| Fit section left/right vs Differences and Scenarios | 18/18 within 1px |
| Fit content start vs adjacent chapter content | 18/18 within 1px |
| Selector cards inspected | 144 total |
| Score ↔ qualitative label overlap | 0 |
| Score ↔ price overlap | 0 |
| Price ↔ product name overlap | 0 |
| Thumbnail ↔ identity overlap | 0 |
| Card child containment failures | 0 |
| Summary label ↔ icon overlap | 0 |
| Price wrapping contract | all rendered prices `white-space: nowrap` |
| Technical rows visible while open | 17 at every run |
| Summary focus treatment | 18/18 visible |
| Dark-mode white disclosure surfaces | 0 |

The complete machine-readable measurements are in `geometry-browser-qa.json`.

Exactly four final full-page screenshots were generated and opened:

- `final/comparison-haustierkameras-375-light-fit-open-full.png`
- `final/comparison-haustierkameras-375-dark-fit-open-full.png`
- `final/comparison-haustierkameras-1600-light-technical-method-open-full.png`
- `final/comparison-haustierkameras-1600-dark-technical-method-open-full.png`
