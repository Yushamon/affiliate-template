# CSS Product System 22.8.1

- Product-CSS vorher: 35078 Bytes
- Product-CSS nachher: 33013 Bytes
- Neuer Product-Box-Layer: 2218 Bytes
- Migrierte Selektorgruppen: 14
- SHA-256 des migrierten CSS-Blocks: f10a9a20a99efa923821c943c8223d70d31310dc8af7e5b71f637618b12de41d

## Umfang

Der zusammenhängende Product-Box-Bereich am Anfang von
`packages/affiliate-core/src/styles/product.css` wurde nach
`product-box.css` verschoben.

Die Ranking-Landingpage und alle nachfolgenden produktbezogenen Systeme bleiben
in `product.css`.

## Sicherheitsgrenzen

- keine Selektoren umbenannt
- keine Deklarationen geändert
- Responsive-Regeln bleiben beim Product-Box-System
- kein neues `!important`
- Hash-Prüfung des exakt migrierten Blocks statt pauschaler Klassennamenprüfung
- weitere legitime Product-Box-Klassennamen bleiben zulässig
- vollständiger Rollback bei Test-, Audit- oder Buildfehlern
