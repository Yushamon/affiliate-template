# PfotenTechnik CSS Product System + Cleanup 22.8.0

Voraussetzung: 22.7.3 wurde erfolgreich installiert.

Ausführen:

```bash
node 3/apply-pfotentechnik-css-product-system-cleanup-22.8.0.mjs
```

Der Installer verschiebt den zusammenhängenden Product-Box-Bereich aus
`packages/affiliate-core/src/styles/product.css` nach `product-box.css`.

Ranking-, Produktlisten- und weitere produktbezogene Regeln bleiben in
`product.css`. Tests, CSS-Audit, vollständiger Build und Rollback sind
integriert.
