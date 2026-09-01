# PfotenTechnik Performance Audit

- Status: ERROR
- Modus: strict
- Routen: 10/10
- Fehler: 3
- Warnungen: 6

## Routen

| Route | HTML | CSS | JS | DOM | Bilder | Befunde |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| / | 42079 B | 301739 B | 0 B | 459 | 380262 B | 0 |
| /vergleiche/ | 48557 B | 284952 B | 0 B | 428 | 0 B | 0 |
| /vergleiche/beste-futterautomaten-fuer-katzen/ | 245682 B | 349361 B | 0 B | 2218 | 202604 B | 2 |
| /vergleiche/gps-tracker-ohne-abo/ | 61309 B | 349361 B | 0 B | 430 | 44402 B | 0 |
| /produkt/petlibro-granary-2-vision/ | 93255 B | 369374 B | 5948 B | 779 | 3997306 B | 3 |
| /hersteller/petlibro/ | 82419 B | 313412 B | 0 B | 690 | 1142258 B | 0 |
| /wissen/ | 61884 B | 284952 B | 0 B | 664 | 0 B | 0 |
| /smarte-futterautomaten/ | 65967 B | 368287 B | 0 B | 517 | 60836 B | 2 |
| /hund-trinkt-ploetzlich-viel/ | 49379 B | 368287 B | 0 B | 498 | 240320 B | 2 |
| /kontakt/ | 15008 B | 103196 B | 0 B | 191 | 0 B | 0 |

## Source

- CSS-Dateien: 45
- CSS-Bytes: 418501
- !important-Deklarationen: 866
- Hydration-Direktiven: 0
- Globale DOM-Korrektur: entfernt
- Obsolete Comparison-CSS-Dateien: 0

## Befunde

- ERROR PERF_HTML_TOO_LARGE (/vergleiche/beste-futterautomaten-fuer-katzen/): HTML-Budget überschritten: 245682 > 150000.
- ERROR PERF_DOM_TOO_COMPLEX (/vergleiche/beste-futterautomaten-fuer-katzen/): DOM-Budget überschritten: 2218 > 1550.
- WARNING PERF_BUDGET_CSS_EXCEEDED (/produkt/petlibro-granary-2-vision/): CSS-Budget überschritten: 369374 > 345000.
- WARNING PERF_HTML_TOO_LARGE (/produkt/petlibro-granary-2-vision/): HTML-Budget überschritten: 93255 > 90000.
- ERROR PERF_IMAGE_BYTES_EXCEEDED (/produkt/petlibro-granary-2-vision/): Bildbudget überschritten: 3997306 > 3000000.
- WARNING PERF_BUDGET_CSS_EXCEEDED (/smarte-futterautomaten/): CSS-Budget überschritten: 368287 > 360000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/smarte-futterautomaten/): !important-Budget überschritten: 1109 > 1100.
- WARNING PERF_BUDGET_CSS_EXCEEDED (/hund-trinkt-ploetzlich-viel/): CSS-Budget überschritten: 368287 > 360000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/hund-trinkt-ploetzlich-viel/): !important-Budget überschritten: 1109 > 1100.
