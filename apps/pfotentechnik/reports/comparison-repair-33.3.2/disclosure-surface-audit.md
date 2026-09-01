# Disclosure Surface Audit

Audited production comparison disclosure owners:

- Personal Fit / Explorer
- Technical data
- Methodology and sources
- Explorer criterion groups
- Shared compact Comparison methodology component

Results:

- No relevant disclosure background declaration contains `white`, `#fff`, or `#ffffff`.
- Closed and open surfaces use `--pt33-color-surface-subtle`, `--pt33-color-surface-raised`, `--pt33-color-surface`, or their shared legacy semantic aliases.
- Native `details/summary` behavior and keyboard semantics remain intact.
- Production summary rows use one SVG chevron, a two-column label/icon layout, a clear 180-degree open state, and visible `:focus-visible` treatment.
- Browser QA opened every technical, Fit, methodology, and criterion disclosure. All five inspected disclosure groups per viewport had non-transparent semantic backgrounds in Light and Dark mode.
- Technical criteria remain flat rows separated by rules; no card was added per criterion.
- Methodology H2s render between 23.8px and 31.45px across the QA matrix, keeping “Auswahlreihenfolge 2026” supporting rather than display-sized.
