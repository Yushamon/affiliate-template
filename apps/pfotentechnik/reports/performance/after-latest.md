# PfotenTechnik Performance Audit

- Status: ERROR
- Modus: strict
- Routen: 10/10
- Fehler: 5
- Warnungen: 4

## Routen

| Route | HTML | CSS | JS | DOM | Bilder | Befunde |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| / | 42082 B | 301232 B | 0 B | 459 | 380262 B | 0 |
| /vergleiche/ | 48557 B | 284445 B | 0 B | 428 | 0 B | 0 |
| /vergleiche/beste-futterautomaten-fuer-katzen/ | 234453 B | 356103 B | 0 B | 2209 | 202604 B | 2 |
| /vergleiche/gps-tracker-ohne-abo/ | 50495 B | 356103 B | 0 B | 427 | 44402 B | 0 |
| /produkt/petlibro-granary-2-vision/ | 82567 B | 379285 B | 5948 B | 778 | 3997306 B | 2 |
| /hersteller/petlibro/ | 82438 B | 312905 B | 0 B | 690 | 1142258 B | 0 |
| /wissen/ | 61884 B | 284445 B | 0 B | 664 | 0 B | 0 |
| /smarte-futterautomaten/ | 133311 B | 346084 B | 0 B | 1445 | 3499826 B | 4 |
| /hund-trinkt-ploetzlich-viel/ | 43906 B | 346084 B | 0 B | 497 | 240320 B | 1 |
| /kontakt/ | 15008 B | 103196 B | 0 B | 191 | 0 B | 0 |

## Source

- CSS-Dateien: 45
- CSS-Bytes: 417170
- !important-Deklarationen: 866
- Hydration-Direktiven: 0
- Globale DOM-Korrektur: entfernt
- Obsolete Comparison-CSS-Dateien: 0

## Befunde

- ERROR PERF_HTML_TOO_LARGE (/vergleiche/beste-futterautomaten-fuer-katzen/): HTML-Budget überschritten: 234453 > 150000.
- ERROR PERF_DOM_TOO_COMPLEX (/vergleiche/beste-futterautomaten-fuer-katzen/): DOM-Budget überschritten: 2209 > 1550.
- ERROR PERF_BUDGET_CSS_EXCEEDED (/produkt/petlibro-granary-2-vision/): CSS-Budget überschritten: 379285 > 370000.
- ERROR PERF_IMAGE_BYTES_EXCEEDED (/produkt/petlibro-granary-2-vision/): Bildbudget überschritten: 3997306 > 3000000.
- WARNING PERF_HTML_TOO_LARGE (/smarte-futterautomaten/): HTML-Budget überschritten: 133311 > 105000.
- ERROR PERF_DOM_TOO_COMPLEX (/smarte-futterautomaten/): DOM-Budget überschritten: 1445 > 1400.
- WARNING PERF_IMAGE_BYTES_EXCEEDED (/smarte-futterautomaten/): Bildbudget überschritten: 3499826 > 3200000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/smarte-futterautomaten/): !important-Budget überschritten: 1109 > 1100.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/hund-trinkt-ploetzlich-viel/): !important-Budget überschritten: 1109 > 1100.
