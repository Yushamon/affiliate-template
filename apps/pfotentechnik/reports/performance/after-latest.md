# PfotenTechnik Performance Audit

- Status: OK
- Modus: strict
- Routen: 10/10
- Fehler: 0
- Warnungen: 10

## Routen

| Route | HTML | CSS | JS | DOM | Bilder | Befunde |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| / | 58608 B | 298031 B | 0 B | 612 | 773812 B | 0 |
| /vergleiche/ | 40641 B | 279415 B | 0 B | 353 | 0 B | 0 |
| /vergleiche/beste-futterautomaten-fuer-katzen/ | 131455 B | 416206 B | 0 B | 1200 | 286740 B | 3 |
| /vergleiche/gps-tracker-ohne-abo/ | 79156 B | 416206 B | 0 B | 657 | 271636 B | 2 |
| /produkt/petlibro-granary-2-vision/ | 86985 B | 335456 B | 7356 B | 768 | 367580 B | 0 |
| /hersteller/petlibro/ | 71292 B | 308952 B | 0 B | 588 | 1108574 B | 0 |
| /wissen/ | 55042 B | 279415 B | 0 B | 591 | 0 B | 0 |
| /smarte-futterautomaten/ | 123902 B | 343881 B | 0 B | 1305 | 3499826 B | 4 |
| /hund-trinkt-ploetzlich-viel/ | 39128 B | 343881 B | 0 B | 454 | 240320 B | 1 |
| /kontakt/ | 10365 B | 99636 B | 0 B | 148 | 0 B | 0 |

## Source

- CSS-Dateien: 25
- CSS-Bytes: 518445
- !important-Deklarationen: 1265
- Hydration-Direktiven: 0
- Globale DOM-Korrektur: entfernt
- Obsolete Comparison-CSS-Dateien: 0

## Befunde

- WARNING PERF_BUDGET_CSS_EXCEEDED (/vergleiche/beste-futterautomaten-fuer-katzen/): CSS-Budget überschritten: 416206 > 415000.
- WARNING PERF_HTML_TOO_LARGE (/vergleiche/beste-futterautomaten-fuer-katzen/): HTML-Budget überschritten: 131455 > 130000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/vergleiche/beste-futterautomaten-fuer-katzen/): !important-Budget überschritten: 1245 > 1100.
- WARNING PERF_BUDGET_CSS_EXCEEDED (/vergleiche/gps-tracker-ohne-abo/): CSS-Budget überschritten: 416206 > 415000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/vergleiche/gps-tracker-ohne-abo/): !important-Budget überschritten: 1245 > 1100.
- WARNING PERF_HTML_TOO_LARGE (/smarte-futterautomaten/): HTML-Budget überschritten: 123902 > 105000.
- WARNING PERF_DOM_TOO_COMPLEX (/smarte-futterautomaten/): DOM-Budget überschritten: 1305 > 950.
- WARNING PERF_IMAGE_BYTES_EXCEEDED (/smarte-futterautomaten/): Bildbudget überschritten: 3499826 > 3200000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/smarte-futterautomaten/): !important-Budget überschritten: 1225 > 1100.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/hund-trinkt-ploetzlich-viel/): !important-Budget überschritten: 1225 > 1100.
