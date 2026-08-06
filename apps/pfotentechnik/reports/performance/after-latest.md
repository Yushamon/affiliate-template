# PfotenTechnik Performance Audit

- Status: OK
- Modus: strict
- Routen: 10/10
- Fehler: 0
- Warnungen: 8

## Routen

| Route | HTML | CSS | JS | DOM | Bilder | Befunde |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| / | 58468 B | 294914 B | 0 B | 612 | 689736 B | 0 |
| /vergleiche/ | 42640 B | 275775 B | 0 B | 369 | 0 B | 0 |
| /vergleiche/beste-futterautomaten-fuer-katzen/ | 132630 B | 410900 B | 0 B | 1205 | 286740 B | 2 |
| /vergleiche/gps-tracker-ohne-abo/ | 79278 B | 410900 B | 0 B | 657 | 271618 B | 1 |
| /produkt/petlibro-granary-2-vision/ | 85423 B | 335121 B | 5952 B | 689 | 517452 B | 0 |
| /hersteller/petlibro/ | 71726 B | 304235 B | 0 B | 590 | 1108528 B | 0 |
| /wissen/ | 56339 B | 275775 B | 0 B | 609 | 0 B | 0 |
| /smarte-futterautomaten/ | 124402 B | 337414 B | 0 B | 1309 | 3499826 B | 4 |
| /hund-trinkt-ploetzlich-viel/ | 39141 B | 337414 B | 0 B | 454 | 240370 B | 1 |
| /kontakt/ | 10325 B | 100943 B | 0 B | 148 | 0 B | 0 |

## Source

- CSS-Dateien: 43
- CSS-Bytes: 535243
- !important-Deklarationen: 1149
- Hydration-Direktiven: 0
- Globale DOM-Korrektur: entfernt
- Obsolete Comparison-CSS-Dateien: 0

## Befunde

- WARNING PERF_HTML_TOO_LARGE (/vergleiche/beste-futterautomaten-fuer-katzen/): HTML-Budget überschritten: 132630 > 130000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/vergleiche/beste-futterautomaten-fuer-katzen/): !important-Budget überschritten: 1129 > 1100.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/vergleiche/gps-tracker-ohne-abo/): !important-Budget überschritten: 1129 > 1100.
- WARNING PERF_HTML_TOO_LARGE (/smarte-futterautomaten/): HTML-Budget überschritten: 124402 > 105000.
- WARNING PERF_DOM_TOO_COMPLEX (/smarte-futterautomaten/): DOM-Budget überschritten: 1309 > 950.
- WARNING PERF_IMAGE_BYTES_EXCEEDED (/smarte-futterautomaten/): Bildbudget überschritten: 3499826 > 3200000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/smarte-futterautomaten/): !important-Budget überschritten: 1108 > 1100.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/hund-trinkt-ploetzlich-viel/): !important-Budget überschritten: 1108 > 1100.
