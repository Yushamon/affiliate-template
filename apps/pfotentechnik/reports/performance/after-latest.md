# PfotenTechnik Performance Audit

- Status: OK
- Modus: strict
- Routen: 10/10
- Fehler: 0
- Warnungen: 6

## Routen

| Route | HTML | CSS | JS | DOM | Bilder | Befunde |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| / | 63163 B | 294344 B | 0 B | 655 | 679100 B | 0 |
| /vergleiche/ | 48462 B | 275205 B | 0 B | 428 | 0 B | 0 |
| /vergleiche/beste-futterautomaten-fuer-katzen/ | 144047 B | 320055 B | 0 B | 1294 | 293078 B | 1 |
| /vergleiche/gps-tracker-ohne-abo/ | 90062 B | 320055 B | 0 B | 741 | 271618 B | 0 |
| /produkt/petlibro-granary-2-vision/ | 89224 B | 339045 B | 5952 B | 716 | 532156 B | 0 |
| /hersteller/petlibro/ | 77827 B | 303665 B | 0 B | 645 | 1119120 B | 0 |
| /wissen/ | 61811 B | 275205 B | 0 B | 664 | 0 B | 0 |
| /smarte-futterautomaten/ | 129956 B | 336844 B | 0 B | 1395 | 3499826 B | 4 |
| /hund-trinkt-ploetzlich-viel/ | 43774 B | 336844 B | 0 B | 497 | 240370 B | 1 |
| /kontakt/ | 14958 B | 103305 B | 0 B | 191 | 0 B | 0 |

## Source

- CSS-Dateien: 44
- CSS-Bytes: 422942
- !important-Deklarationen: 880
- Hydration-Direktiven: 0
- Globale DOM-Korrektur: entfernt
- Obsolete Comparison-CSS-Dateien: 0

## Befunde

- WARNING PERF_HTML_TOO_LARGE (/vergleiche/beste-futterautomaten-fuer-katzen/): HTML-Budget überschritten: 144047 > 130000.
- WARNING PERF_HTML_TOO_LARGE (/smarte-futterautomaten/): HTML-Budget überschritten: 129956 > 105000.
- WARNING PERF_DOM_TOO_COMPLEX (/smarte-futterautomaten/): DOM-Budget überschritten: 1395 > 950.
- WARNING PERF_IMAGE_BYTES_EXCEEDED (/smarte-futterautomaten/): Bildbudget überschritten: 3499826 > 3200000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/smarte-futterautomaten/): !important-Budget überschritten: 1108 > 1100.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/hund-trinkt-ploetzlich-viel/): !important-Budget überschritten: 1108 > 1100.
