# PfotenTechnik Performance Audit

- Status: ERROR
- Modus: diagnostic
- Routen: 10/10
- Fehler: 3
- Warnungen: 0

## Routen

| Route | HTML | CSS | JS | DOM | Bilder | Befunde |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| / | 42078 B | 301739 B | 0 B | 459 | 380262 B | 0 |
| /vergleiche/ | 37752 B | 292538 B | 0 B | 352 | 0 B | 0 |
| /vergleiche/beste-futterautomaten-fuer-katzen/ | 239164 B | 356705 B | 0 B | 2217 | 202604 B | 2 |
| /vergleiche/gps-tracker-ohne-abo/ | 54828 B | 356705 B | 0 B | 429 | 44402 B | 0 |
| /produkt/petlibro-granary-2-vision/ | 89557 B | 374893 B | 5948 B | 782 | 351476 B | 1 |
| /hersteller/petlibro/ | 84452 B | 299497 B | 0 B | 746 | 151412 B | 0 |
| /wissen/ | 61884 B | 284952 B | 0 B | 664 | 0 B | 0 |
| /smarte-futterautomaten/ | 64803 B | 328504 B | 0 B | 513 | 60836 B | 0 |
| /hund-trinkt-ploetzlich-viel/ | 48214 B | 328504 B | 0 B | 501 | 0 B | 0 |
| /kontakt/ | 15008 B | 103196 B | 0 B | 191 | 0 B | 0 |

## Source

- CSS-Dateien: 45
- CSS-Bytes: 418501
- !important-Deklarationen: 866
- Hydration-Direktiven: 0
- Globale DOM-Korrektur: entfernt
- Obsolete Comparison-CSS-Dateien: 0

## Befunde

- ERROR PERF_HTML_TOO_LARGE (/vergleiche/beste-futterautomaten-fuer-katzen/): HTML-Budget überschritten: 239164 > 150000.
- ERROR PERF_DOM_TOO_COMPLEX (/vergleiche/beste-futterautomaten-fuer-katzen/): DOM-Budget überschritten: 2217 > 1550.
- ERROR PERF_BUDGET_CSS_EXCEEDED (/produkt/petlibro-granary-2-vision/): CSS-Budget überschritten: 374893 > 370000.
