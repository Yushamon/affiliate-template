# PfotenTechnik Performance Audit

- Status: OK
- Modus: diagnostic
- Routen: 10/10
- Fehler: 0
- Warnungen: 8

## Routen

| Route | HTML | CSS | JS | DOM | Bilder | Befunde |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| / | 58592 B | 293669 B | 0 B | 612 | 630552 B | 0 |
| /vergleiche/ | 42655 B | 274530 B | 0 B | 369 | 0 B | 0 |
| /vergleiche/beste-futterautomaten-fuer-katzen/ | 132732 B | 410148 B | 0 B | 1205 | 286740 B | 2 |
| /vergleiche/gps-tracker-ohne-abo/ | 79279 B | 410148 B | 0 B | 657 | 271636 B | 1 |
| /produkt/petlibro-granary-2-vision/ | 85484 B | 333945 B | 5948 B | 689 | 532172 B | 0 |
| /hersteller/petlibro/ | 71802 B | 302990 B | 0 B | 590 | 1108574 B | 0 |
| /wissen/ | 56350 B | 274530 B | 0 B | 609 | 0 B | 0 |
| /smarte-futterautomaten/ | 124155 B | 336169 B | 0 B | 1305 | 3499826 B | 4 |
| /hund-trinkt-ploetzlich-viel/ | 39211 B | 336169 B | 0 B | 454 | 240320 B | 1 |
| /kontakt/ | 10365 B | 99559 B | 0 B | 148 | 0 B | 0 |

## Source

- CSS-Dateien: 42
- CSS-Bytes: 518664
- !important-Deklarationen: 1149
- Hydration-Direktiven: 0
- Globale DOM-Korrektur: entfernt
- Obsolete Comparison-CSS-Dateien: 0

## Befunde

- WARNING PERF_HTML_TOO_LARGE (/vergleiche/beste-futterautomaten-fuer-katzen/): HTML-Budget überschritten: 132732 > 130000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/vergleiche/beste-futterautomaten-fuer-katzen/): !important-Budget überschritten: 1129 > 1100.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/vergleiche/gps-tracker-ohne-abo/): !important-Budget überschritten: 1129 > 1100.
- WARNING PERF_HTML_TOO_LARGE (/smarte-futterautomaten/): HTML-Budget überschritten: 124155 > 105000.
- WARNING PERF_DOM_TOO_COMPLEX (/smarte-futterautomaten/): DOM-Budget überschritten: 1305 > 950.
- WARNING PERF_IMAGE_BYTES_EXCEEDED (/smarte-futterautomaten/): Bildbudget überschritten: 3499826 > 3200000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/smarte-futterautomaten/): !important-Budget überschritten: 1108 > 1100.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/hund-trinkt-ploetzlich-viel/): !important-Budget überschritten: 1108 > 1100.
