# PfotenTechnik Performance Audit

- Status: OK
- Modus: strict
- Routen: 10/10
- Fehler: 0
- Warnungen: 6

## Routen

| Route | HTML | CSS | JS | DOM | Bilder | Befunde |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| / | 42008 B | 303681 B | 0 B | 458 | 380262 B | 0 |
| /vergleiche/ | 37685 B | 294480 B | 0 B | 351 | 0 B | 0 |
| /vergleiche/beste-futterautomaten-fuer-katzen/ | 239162 B | 358647 B | 0 B | 2216 | 202604 B | 2 |
| /vergleiche/gps-tracker-ohne-abo/ | 54758 B | 358647 B | 0 B | 428 | 44402 B | 0 |
| /produkt/petlibro-granary-2-vision/ | 92549 B | 376625 B | 5948 B | 831 | 351476 B | 2 |
| /hersteller/petlibro/ | 85572 B | 297689 B | 0 B | 776 | 178238 B | 2 |
| /wissen/ | 62157 B | 286894 B | 0 B | 663 | 0 B | 0 |
| /smarte-futterautomaten/ | 64757 B | 325055 B | 0 B | 512 | 60836 B | 0 |
| /hund-trinkt-ploetzlich-viel/ | 48110 B | 325055 B | 0 B | 497 | 0 B | 0 |
| /kontakt/ | 27530 B | 286894 B | 0 B | 207 | 0 B | 0 |

## Source

- CSS-Dateien: 42
- CSS-Bytes: 420946
- !important-Deklarationen: 857
- Hydration-Direktiven: 0
- Globale DOM-Korrektur: entfernt
- Obsolete Comparison-CSS-Dateien: 0

## Befunde

- WARNING PERF_HTML_TOO_LARGE (/vergleiche/beste-futterautomaten-fuer-katzen/): HTML-Budget überschritten: 239162 > 230000.
- WARNING PERF_DOM_TOO_COMPLEX (/vergleiche/beste-futterautomaten-fuer-katzen/): DOM-Budget überschritten: 2216 > 2100.
- WARNING PERF_BUDGET_CSS_EXCEEDED (/produkt/petlibro-granary-2-vision/): CSS-Budget überschritten: 376625 > 370000.
- WARNING PERF_HTML_TOO_LARGE (/produkt/petlibro-granary-2-vision/): HTML-Budget überschritten: 92549 > 90000.
- WARNING PERF_HTML_TOO_LARGE (/hersteller/petlibro/): HTML-Budget überschritten: 85572 > 85000.
- WARNING PERF_DOM_TOO_COMPLEX (/hersteller/petlibro/): DOM-Budget überschritten: 776 > 750.
