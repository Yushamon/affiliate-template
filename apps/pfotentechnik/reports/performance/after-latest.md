# PfotenTechnik Performance Audit

- Status: OK
- Modus: strict
- Routen: 10/10
- Fehler: 0
- Warnungen: 6

## Routen

| Route | HTML | CSS | JS | DOM | Bilder | Befunde |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| / | 63092 B | 294344 B | 0 B | 655 | 660046 B | 0 |
| /vergleiche/ | 48434 B | 275205 B | 0 B | 428 | 0 B | 0 |
| /vergleiche/beste-futterautomaten-fuer-katzen/ | 144186 B | 320055 B | 0 B | 1294 | 293078 B | 1 |
| /vergleiche/gps-tracker-ohne-abo/ | 90114 B | 320055 B | 0 B | 741 | 271636 B | 0 |
| /produkt/petlibro-granary-2-vision/ | 89467 B | 339045 B | 5948 B | 716 | 517486 B | 0 |
| /hersteller/petlibro/ | 77106 B | 303665 B | 0 B | 639 | 1112874 B | 0 |
| /wissen/ | 61822 B | 275205 B | 0 B | 664 | 0 B | 0 |
| /smarte-futterautomaten/ | 130307 B | 336844 B | 0 B | 1395 | 3499826 B | 4 |
| /hund-trinkt-ploetzlich-viel/ | 43844 B | 336844 B | 0 B | 497 | 240320 B | 1 |
| /kontakt/ | 14998 B | 103305 B | 0 B | 191 | 0 B | 0 |

## Source

- CSS-Dateien: 44
- CSS-Bytes: 410542
- !important-Deklarationen: 880
- Hydration-Direktiven: 0
- Globale DOM-Korrektur: entfernt
- Obsolete Comparison-CSS-Dateien: 0

## Befunde

- WARNING PERF_HTML_TOO_LARGE (/vergleiche/beste-futterautomaten-fuer-katzen/): HTML-Budget überschritten: 144186 > 130000.
- WARNING PERF_HTML_TOO_LARGE (/smarte-futterautomaten/): HTML-Budget überschritten: 130307 > 105000.
- WARNING PERF_DOM_TOO_COMPLEX (/smarte-futterautomaten/): DOM-Budget überschritten: 1395 > 950.
- WARNING PERF_IMAGE_BYTES_EXCEEDED (/smarte-futterautomaten/): Bildbudget überschritten: 3499826 > 3200000.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/smarte-futterautomaten/): !important-Budget überschritten: 1108 > 1100.
- WARNING PERF_CSS_SPECIFICITY_HIGH (/hund-trinkt-ploetzlich-viel/): !important-Budget überschritten: 1108 > 1100.
