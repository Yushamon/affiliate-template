# Technical SEO Audit

Frischer Produktionsbuild vom 2026-09-01: **PASS**, 367 Seiten.

| Prüfung | Ergebnis |
|---|---|
| Sitemap vorhanden / gebaute URLs | PASS / PASS |
| Sitemap enthält keine interne, Fehler- oder noindex-Seite | PASS |
| Robots | `User-agent: *`, `Allow: /`, Sitemap referenziert |
| Canonicals | 255/255 indexierbare HTML-Routen vorhanden und konsistent |
| Titles, Descriptions, H1 | je 255/255 vorhanden; keine mehrfachen H1 im Route-Export |
| JSON-LD-Beispiele (Guide, Comparison, Product, Manufacturer) | parsebar und vollständig nach bestehendem Audit |
| Admin | 111 noindex/Admin-HTML-Seiten; Audit PASS |
| interne Linkziele | 367 Seiten, 0 Fehler, 0 Warnungen |
| Bild-Alt-Audit | 0 blockierende Fehler; 3 nicht blockierende Hinweise |

## Server-rendered safety

Im statischen Build liegen Produkt-Facts, Evidence, Failure Modes, FAQ und Alternativen sowie Comparison-Finalisten, weitere Alternativen, Explorer-Inhalte, FAQ und Quellen im HTML vor. Native `details` bleibt progressive Offenlegung; relevante Inhalte sind nicht client-only. Guide-, Product- und Comparison-Seiten enthalten keine Hydration-Direktiven laut Performance-Audit.

## Post-33.3 Regressionen

| Priorität | Befund | Status |
|---|---|---|
| P0 | `/foundation/` in Sitemap trotz noindex | behoben und neu validiert |
| P1 | vier harte Performance-Budgetüberschreitungen | offen, siehe `prioritized-backlog.md` |
| P2 | neun indexierbare Dokumente ohne eingehenden Link im Linkgraph | offen, keine Broken Links |

Keine Canonical-Änderung, kein URL-Bruch und keine veränderte Indexability durch die automatische Finalistenauswahl nachweisbar.
