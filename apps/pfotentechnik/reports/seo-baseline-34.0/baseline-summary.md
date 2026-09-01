# SEO Baseline 34.0

Stand: 2026-09-01 · Build-HEAD: `c1a6fd9ba07595b1ec6952764a32f1f0c844a297`

| Kennzahl | Baseline |
|---|---:|
| Produktionsbuild | PASS · 367 Seiten |
| Indexierbare HTML-URLs | 255 |
| Indexierbare Dokumente inkl. RSS | 256 |
| Sitemap-URLs | 255 |
| Produkte | 101 |
| Vergleiche | 28 |
| Hersteller | 32 (+ 1 Hub) |
| Kategorie-Hubs | 6 |
| Ratgeber | 80 |
| fehlende Title / Description / H1 / Canonical | 0 / 0 / 0 / 0 |
| JSON-LD-Parsefehler im Route-Export | 0 |
| ungültige lokale Bildpfade im Route-Export | 0 |
| interne Linkziele | 367 Seiten · 0 Fehler · 0 Warnungen |
| Inhaltsgraph | 243 Knoten · 57.835 Kanten |

Die vollständige, routeweise Momentaufnahme liegt in [baseline.json](baseline.json).

## Sofort korrigierter P0

`/foundation/` war trotz `noindex` in der Sitemap. Ursache war eine fehlende statische Ausschlussregel im Sitemap-Filter; `noindex` der Seite selbst war korrekt. Die Route wurde in `astro.config.mjs` als interne Preview ausgeschlossen. Der frische Build enthält sie nicht mehr, und `audit:technical-seo` bestätigt „Keine noindex-Seite in Sitemap“.

## Audit-Urteil

Die Migration 33.3 hat keinen offenen Indexierungs-, Canonical-, Schema-, Linkziel- oder Medien-Releasefehler hinterlassen. Offene Arbeit ist priorisierte Weiterentwicklung bzw. Performance-/Datenqualität, keine Grundlage für eine weitere globale Design-System-Runde.
