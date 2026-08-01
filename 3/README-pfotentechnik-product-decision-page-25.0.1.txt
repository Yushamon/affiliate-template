PfotenTechnik Product Decision Page 25.0.1

Behebt ausschließlich den fehlgeschlagenen CSS-Hygiene-Test:
- entfernt das verbliebene !important aus ProductDetails2.astro
- korrigiert denselben Inhalt im Installer 25.0.0
- führt product-decision-page-25.0.0.test.mjs erneut aus

Installation:
  node 3/apply-pfotentechnik-product-decision-page-25.0.1.mjs

Danach:
  npm --workspace apps/pfotentechnik run test:product-experience-2
  npm --workspace apps/pfotentechnik run build
