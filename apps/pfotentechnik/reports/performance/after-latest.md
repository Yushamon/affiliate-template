# PfotenTechnik Performance Audit

- Status: OK
- Modus: strict
- Routen: 10/10
- Fehler: 0
- Warnungen: 10

## Routen

| Route | HTML | CSS | JS | DOM | Bilder | Befunde |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| / | 58597 B | 298008 B | 0 B | 612 | 773812 B | 0 |
| /vergleiche/ | 40641 B | 279392 B | 0 B | 353 | 0 B | 0 |
| /vergleiche/beste-futterautomaten-fuer-katzen/ | 131473 B | 416156 B | 0 B | 1200 | 286740 B | 3 |
| /vergleiche/gps-tracker-ohne-abo/ | 79156 B | 416156 B | 0 B | 657 | 271636 B | 2 |
| /produkt/petlibro-granary-2-vision/ | 86982 B | 335433 B | 7356 B | 768 | 367580 B | 0 |
| /hersteller/petlibro/ | 71300 B | 308929 B | 0 B | 588 | 1108574 B | 0 |
| /wissen/ | 55042 B | 279392 B | 0 B | 591 | 0 B | 0 |
| /smarte-futterautomaten/ | 123894 B | 343858 B | 0 B | 1305 | 3499826 B | 4 |
| /hund-trinkt-ploetzlich-viel/ | 39128 B | 343858 B | 0 B | 454 | 240320 B | 1 |
| /kontakt/ | 10365 B | 99636 B | 0 B | 148 | 0 B | 0 |

## Source

- CSS-Dateien: 25
- CSS-Bytes: 518379
- !important-Deklarationen: 1265
- Hydration-Direktiven: 0
- Globale DOM-Korrektur: entfernt
- Obsolete Comparison-CSS-Dateien: 0

## Befunde

- WARNING PERF_BUDGET_CSS_EXCEEDED (/vergleiche/beste-futterautomaten-fuer-katzen/): CSS-Budget überschritten: 416156 > 415000.
- WARNING PERF_HTML_TOO_LARGE (/vergleiche/beste-futterautomaten-fuer-katzen/): HTML-Budget überschritten: 131473 > 130000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/vergleiche/beste-futterautomaten-fuer-katzen/): !important-Budget überschritten: 1245 > 1100.
- WARNING PERF_BUDGET_CSS_EXCEEDED (/vergleiche/gps-tracker-ohne-abo/): CSS-Budget überschritten: 416156 > 415000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/vergleiche/gps-tracker-ohne-abo/): !important-Budget überschritten: 1245 > 1100.
- WARNING PERF_HTML_TOO_LARGE (/smarte-futterautomaten/): HTML-Budget überschritten: 123894 > 105000.
- WARNING PERF_DOM_TOO_COMPLEX (/smarte-futterautomaten/): DOM-Budget überschritten: 1305 > 950.
- WARNING PERF_IMAGE_BYTES_EXCEEDED (/smarte-futterautomaten/): Bildbudget überschritten: 3499826 > 3200000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/smarte-futterautomaten/): !important-Budget überschritten: 1225 > 1100.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/hund-trinkt-ploetzlich-viel/): !important-Budget überschritten: 1225 > 1100.
