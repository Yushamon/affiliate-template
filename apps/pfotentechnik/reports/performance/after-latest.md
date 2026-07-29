# PfotenTechnik Performance Audit

- Status: OK
- Modus: strict
- Routen: 10/10
- Fehler: 0
- Warnungen: 7

## Routen

| Route | HTML | CSS | JS | DOM | Bilder | Befunde |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| / | 53268 B | 303014 B | 0 B | 611 | 671926 B | 0 |
| /vergleiche/ | 36031 B | 283855 B | 0 B | 352 | 0 B | 0 |
| /vergleiche/beste-futterautomaten-fuer-katzen/ | 120152 B | 410644 B | 4974 B | 1294 | 283948 B | 1 |
| /vergleiche/gps-tracker-ohne-abo/ | 59507 B | 410644 B | 4974 B | 621 | 271286 B | 1 |
| /produkt/petlibro-granary-2-vision/ | 71791 B | 340439 B | 7356 B | 723 | 444704 B | 0 |
| /hersteller/petlibro/ | 71147 B | 308952 B | 0 B | 587 | 1108528 B | 0 |
| /wissen/ | 54934 B | 279415 B | 0 B | 590 | 0 B | 0 |
| /smarte-futterautomaten/ | 121991 B | 341678 B | 0 B | 1288 | 5250022 B | 4 |
| /hund-trinkt-ploetzlich-viel/ | 35037 B | 341678 B | 0 B | 415 | 240370 B | 1 |
| /kontakt/ | 9855 B | 99636 B | 0 B | 145 | 0 B | 0 |

## Source

- CSS-Dateien: 23
- CSS-Bytes: 502229
- !important-Deklarationen: 1264
- Hydration-Direktiven: 0
- Globale DOM-Korrektur: entfernt
- Obsolete Comparison-CSS-Dateien: 0

## Befunde

- WARNING PERF_CSS_SPECIFICITY_HIGH (/vergleiche/beste-futterautomaten-fuer-katzen/): !important-Budget überschritten: 1244 > 1100.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/vergleiche/gps-tracker-ohne-abo/): !important-Budget überschritten: 1244 > 1100.
- WARNING PERF_HTML_TOO_LARGE (/smarte-futterautomaten/): HTML-Budget überschritten: 121991 > 105000.
- WARNING PERF_DOM_TOO_COMPLEX (/smarte-futterautomaten/): DOM-Budget überschritten: 1288 > 950.
- WARNING PERF_IMAGE_BYTES_EXCEEDED (/smarte-futterautomaten/): Bildbudget überschritten: 5250022 > 3200000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/smarte-futterautomaten/): !important-Budget überschritten: 1225 > 1100.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/hund-trinkt-ploetzlich-viel/): !important-Budget überschritten: 1225 > 1100.
