PfotenTechnik Product FAQ Cleanup 25.6.0

Bereinigt ausschließlich:
- petlibro-space-smart-feeder.md
- weenect-xs.md
- weenect-xt.md

Vorgehen:
- maximal 12 FAQ pro Seite
- Reihenfolge bleibt erhalten
- keine Antworten werden umgeschrieben
- vollständiges Backup der geänderten Produktdateien
- Regressionstest und Product-Standard-3-Audit laufen direkt

Installation:
  node 3/apply-pfotentechnik-product-faq-cleanup-25.6.0.mjs

Danach:
  npm --workspace apps/pfotentechnik run product-standard-3:release
