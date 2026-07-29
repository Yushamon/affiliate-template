# PfotenTechnik Performance Audit

- Status: OK
- Modus: strict
- Routen: 10/10
- Fehler: 0
- Warnungen: 7

## Routen

| Route | HTML | CSS | JS | DOM | Bilder | Befunde |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| / | 53334 B | 303014 B | 0 B | 611 | 671908 B | 0 |
| /vergleiche/ | 36046 B | 283855 B | 0 B | 352 | 0 B | 0 |
| /vergleiche/beste-futterautomaten-fuer-katzen/ | 120272 B | 414449 B | 5116 B | 1294 | 283954 B | 1 |
| /vergleiche/gps-tracker-ohne-abo/ | 59558 B | 414449 B | 5116 B | 621 | 271304 B | 1 |
| /produkt/petlibro-granary-2-vision/ | 71781 B | 340439 B | 7356 B | 721 | 444656 B | 0 |
| /hersteller/petlibro/ | 71215 B | 308952 B | 0 B | 587 | 1108574 B | 0 |
| /wissen/ | 54945 B | 279415 B | 0 B | 590 | 0 B | 0 |
| /smarte-futterautomaten/ | 122333 B | 341678 B | 0 B | 1288 | 5250022 B | 4 |
| /hund-trinkt-ploetzlich-viel/ | 35106 B | 341678 B | 0 B | 415 | 240320 B | 1 |
| /kontakt/ | 9887 B | 99636 B | 0 B | 145 | 0 B | 0 |

## Source

- CSS-Dateien: 23
- CSS-Bytes: 499402
- !important-Deklarationen: 1271
- Hydration-Direktiven: 0
- Globale DOM-Korrektur: entfernt
- Obsolete Comparison-CSS-Dateien: 0

## Befunde

- WARNING PERF_CSS_SPECIFICITY_HIGH (/vergleiche/beste-futterautomaten-fuer-katzen/): !important-Budget überschritten: 1251 > 1100.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/vergleiche/gps-tracker-ohne-abo/): !important-Budget überschritten: 1251 > 1100.
- WARNING PERF_HTML_TOO_LARGE (/smarte-futterautomaten/): HTML-Budget überschritten: 122333 > 105000.
- WARNING PERF_DOM_TOO_COMPLEX (/smarte-futterautomaten/): DOM-Budget überschritten: 1288 > 950.
- WARNING PERF_IMAGE_BYTES_EXCEEDED (/smarte-futterautomaten/): Bildbudget überschritten: 5250022 > 3200000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/smarte-futterautomaten/): !important-Budget überschritten: 1225 > 1100.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/hund-trinkt-ploetzlich-viel/): !important-Budget überschritten: 1225 > 1100.
