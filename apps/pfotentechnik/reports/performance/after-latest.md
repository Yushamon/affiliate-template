# PfotenTechnik Performance Audit

- Status: OK
- Modus: strict
- Routen: 10/10
- Fehler: 0
- Warnungen: 9

## Routen

| Route | HTML | CSS | JS | DOM | Bilder | Befunde |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| / | 53356 B | 303014 B | 0 B | 611 | 698452 B | 0 |
| /vergleiche/ | 36131 B | 283855 B | 0 B | 352 | 0 B | 0 |
| /vergleiche/beste-futterautomaten-fuer-katzen/ | 113803 B | 421189 B | 0 B | 1136 | 286740 B | 2 |
| /vergleiche/gps-tracker-ohne-abo/ | 61527 B | 421189 B | 0 B | 591 | 271618 B | 2 |
| /produkt/petlibro-granary-2-vision/ | 71826 B | 340439 B | 7356 B | 723 | 400392 B | 0 |
| /hersteller/petlibro/ | 71147 B | 308952 B | 0 B | 587 | 1108528 B | 0 |
| /wissen/ | 54934 B | 279415 B | 0 B | 590 | 0 B | 0 |
| /smarte-futterautomaten/ | 121991 B | 341678 B | 0 B | 1288 | 5250022 B | 4 |
| /hund-trinkt-ploetzlich-viel/ | 35037 B | 341678 B | 0 B | 415 | 240370 B | 1 |
| /kontakt/ | 9855 B | 99636 B | 0 B | 145 | 0 B | 0 |

## Source

- CSS-Dateien: 24
- CSS-Bytes: 521253
- !important-Deklarationen: 1265
- Hydration-Direktiven: 0
- Globale DOM-Korrektur: entfernt
- Obsolete Comparison-CSS-Dateien: 0

## Befunde

- WARNING PERF_BUDGET_CSS_EXCEEDED (/vergleiche/beste-futterautomaten-fuer-katzen/): CSS-Budget überschritten: 421189 > 415000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/vergleiche/beste-futterautomaten-fuer-katzen/): !important-Budget überschritten: 1245 > 1100.
- WARNING PERF_BUDGET_CSS_EXCEEDED (/vergleiche/gps-tracker-ohne-abo/): CSS-Budget überschritten: 421189 > 415000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/vergleiche/gps-tracker-ohne-abo/): !important-Budget überschritten: 1245 > 1100.
- WARNING PERF_HTML_TOO_LARGE (/smarte-futterautomaten/): HTML-Budget überschritten: 121991 > 105000.
- WARNING PERF_DOM_TOO_COMPLEX (/smarte-futterautomaten/): DOM-Budget überschritten: 1288 > 950.
- WARNING PERF_IMAGE_BYTES_EXCEEDED (/smarte-futterautomaten/): Bildbudget überschritten: 5250022 > 3200000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/smarte-futterautomaten/): !important-Budget überschritten: 1225 > 1100.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/hund-trinkt-ploetzlich-viel/): !important-Budget überschritten: 1225 > 1100.
