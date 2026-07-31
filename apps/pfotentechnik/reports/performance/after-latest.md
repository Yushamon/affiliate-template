# PfotenTechnik Performance Audit

- Status: ERROR
- Modus: strict
- Routen: 10/10
- Fehler: 3
- Warnungen: 10

## Routen

| Route | HTML | CSS | JS | DOM | Bilder | Befunde |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| / | 53688 B | 303014 B | 0 B | 613 | 773812 B | 0 |
| /vergleiche/ | 36243 B | 283855 B | 0 B | 353 | 0 B | 0 |
| /vergleiche/beste-futterautomaten-fuer-katzen/ | 120112 B | 427660 B | 0 B | 1201 | 286740 B | 3 |
| /vergleiche/gps-tracker-ohne-abo/ | 67812 B | 427660 B | 0 B | 658 | 271636 B | 3 |
| /produkt/petlibro-granary-2-vision/ | 75675 B | 346910 B | 7356 B | 768 | 365780 B | 2 |
| /hersteller/petlibro/ | 71313 B | 308952 B | 0 B | 588 | 1108574 B | 0 |
| /wissen/ | 55042 B | 279415 B | 0 B | 591 | 0 B | 0 |
| /smarte-futterautomaten/ | 125237 B | 350352 B | 0 B | 1321 | 5250022 B | 4 |
| /hund-trinkt-ploetzlich-viel/ | 39364 B | 350352 B | 0 B | 470 | 240320 B | 1 |
| /kontakt/ | 10365 B | 99636 B | 0 B | 148 | 0 B | 0 |

## Source

- CSS-Dateien: 25
- CSS-Bytes: 518445
- !important-Deklarationen: 1265
- Hydration-Direktiven: 0
- Globale DOM-Korrektur: entfernt
- Obsolete Comparison-CSS-Dateien: 0

## Befunde

- WARNING PERF_BUDGET_CSS_EXCEEDED (/vergleiche/beste-futterautomaten-fuer-katzen/): CSS-Budget überschritten: 427660 > 415000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/vergleiche/beste-futterautomaten-fuer-katzen/): !important-Budget überschritten: 1245 > 1100.
- ERROR PERF_RENDER_BLOCKING_STYLESHEET (/vergleiche/beste-futterautomaten-fuer-katzen/): 6 render-blockierende Stylesheets.
- WARNING PERF_BUDGET_CSS_EXCEEDED (/vergleiche/gps-tracker-ohne-abo/): CSS-Budget überschritten: 427660 > 415000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/vergleiche/gps-tracker-ohne-abo/): !important-Budget überschritten: 1245 > 1100.
- ERROR PERF_RENDER_BLOCKING_STYLESHEET (/vergleiche/gps-tracker-ohne-abo/): 6 render-blockierende Stylesheets.
- WARNING PERF_BUDGET_CSS_EXCEEDED (/produkt/petlibro-granary-2-vision/): CSS-Budget überschritten: 346910 > 345000.
- ERROR PERF_RENDER_BLOCKING_STYLESHEET (/produkt/petlibro-granary-2-vision/): 6 render-blockierende Stylesheets.
- WARNING PERF_HTML_TOO_LARGE (/smarte-futterautomaten/): HTML-Budget überschritten: 125237 > 105000.
- WARNING PERF_DOM_TOO_COMPLEX (/smarte-futterautomaten/): DOM-Budget überschritten: 1321 > 950.
- WARNING PERF_IMAGE_BYTES_EXCEEDED (/smarte-futterautomaten/): Bildbudget überschritten: 5250022 > 3200000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/smarte-futterautomaten/): !important-Budget überschritten: 1225 > 1100.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/hund-trinkt-ploetzlich-viel/): !important-Budget überschritten: 1225 > 1100.
