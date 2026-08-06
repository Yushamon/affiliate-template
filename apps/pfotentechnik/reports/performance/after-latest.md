# PfotenTechnik Performance Audit

- Status: OK
- Modus: diagnostic
- Routen: 10/10
- Fehler: 0
- Warnungen: 6

## Routen

| Route | HTML | CSS | JS | DOM | Bilder | Befunde |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| / | 58533 B | 294462 B | 0 B | 612 | 715040 B | 0 |
| /vergleiche/ | 43801 B | 275323 B | 0 B | 385 | 0 B | 0 |
| /vergleiche/beste-futterautomaten-fuer-katzen/ | 132794 B | 307062 B | 0 B | 1205 | 286740 B | 1 |
| /vergleiche/gps-tracker-ohne-abo/ | 79993 B | 307062 B | 0 B | 661 | 271636 B | 0 |
| /produkt/petlibro-granary-2-vision/ | 85622 B | 334660 B | 5948 B | 689 | 517486 B | 0 |
| /hersteller/petlibro/ | 72499 B | 303783 B | 0 B | 596 | 1112874 B | 0 |
| /wissen/ | 57182 B | 275323 B | 0 B | 621 | 0 B | 0 |
| /smarte-futterautomaten/ | 124753 B | 336962 B | 0 B | 1309 | 3499826 B | 4 |
| /hund-trinkt-ploetzlich-viel/ | 39211 B | 336962 B | 0 B | 454 | 240320 B | 1 |
| /kontakt/ | 10365 B | 100491 B | 0 B | 148 | 0 B | 0 |

## Source

- CSS-Dateien: 44
- CSS-Bytes: 397736
- !important-Deklarationen: 880
- Hydration-Direktiven: 0
- Globale DOM-Korrektur: entfernt
- Obsolete Comparison-CSS-Dateien: 0

## Befunde

- WARNING PERF_HTML_TOO_LARGE (/vergleiche/beste-futterautomaten-fuer-katzen/): HTML-Budget überschritten: 132794 > 130000.
- WARNING PERF_HTML_TOO_LARGE (/smarte-futterautomaten/): HTML-Budget überschritten: 124753 > 105000.
- WARNING PERF_DOM_TOO_COMPLEX (/smarte-futterautomaten/): DOM-Budget überschritten: 1309 > 950.
- WARNING PERF_IMAGE_BYTES_EXCEEDED (/smarte-futterautomaten/): Bildbudget überschritten: 3499826 > 3200000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/smarte-futterautomaten/): !important-Budget überschritten: 1108 > 1100.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/hund-trinkt-ploetzlich-viel/): !important-Budget überschritten: 1108 > 1100.
