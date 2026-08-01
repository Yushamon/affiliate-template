# PfotenTechnik Performance Audit

- Status: OK
- Modus: strict
- Routen: 10/10
- Fehler: 0
- Warnungen: 8

## Routen

| Route | HTML | CSS | JS | DOM | Bilder | Befunde |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| / | 58422 B | 295502 B | 0 B | 612 | 801488 B | 0 |
| /vergleiche/ | 40626 B | 276886 B | 0 B | 353 | 0 B | 0 |
| /vergleiche/beste-futterautomaten-fuer-katzen/ | 131324 B | 412513 B | 0 B | 1200 | 286740 B | 2 |
| /vergleiche/gps-tracker-ohne-abo/ | 79104 B | 412513 B | 0 B | 657 | 271618 B | 1 |
| /produkt/petlibro-granary-2-vision/ | 86947 B | 332198 B | 7356 B | 770 | 367562 B | 0 |
| /hersteller/petlibro/ | 71234 B | 306201 B | 0 B | 588 | 1108528 B | 0 |
| /wissen/ | 55031 B | 276886 B | 0 B | 591 | 0 B | 0 |
| /smarte-futterautomaten/ | 123551 B | 341293 B | 0 B | 1305 | 3499826 B | 4 |
| /hund-trinkt-ploetzlich-viel/ | 39058 B | 341293 B | 0 B | 454 | 240370 B | 1 |
| /kontakt/ | 10325 B | 99251 B | 0 B | 148 | 0 B | 0 |

## Source

- CSS-Dateien: 42
- CSS-Bytes: 531991
- !important-Deklarationen: 1243
- Hydration-Direktiven: 0
- Globale DOM-Korrektur: entfernt
- Obsolete Comparison-CSS-Dateien: 0

## Befunde

- WARNING PERF_HTML_TOO_LARGE (/vergleiche/beste-futterautomaten-fuer-katzen/): HTML-Budget überschritten: 131324 > 130000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/vergleiche/beste-futterautomaten-fuer-katzen/): !important-Budget überschritten: 1223 > 1100.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/vergleiche/gps-tracker-ohne-abo/): !important-Budget überschritten: 1223 > 1100.
- WARNING PERF_HTML_TOO_LARGE (/smarte-futterautomaten/): HTML-Budget überschritten: 123551 > 105000.
- WARNING PERF_DOM_TOO_COMPLEX (/smarte-futterautomaten/): DOM-Budget überschritten: 1305 > 950.
- WARNING PERF_IMAGE_BYTES_EXCEEDED (/smarte-futterautomaten/): Bildbudget überschritten: 3499826 > 3200000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/smarte-futterautomaten/): !important-Budget überschritten: 1202 > 1100.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/hund-trinkt-ploetzlich-viel/): !important-Budget überschritten: 1202 > 1100.
