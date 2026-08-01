PfotenTechnik Global Dark Mode Token Bridge 25.8.0

Der Patch löst den Dark Mode zentral über das bestehende Design-System:

- alte `--color-*`-Variablen werden global auf `--pt-color-*` gemappt
- positive, negative und Warnflächen erhalten zentrale Status-Tokens
- Product Experience 2 entfernt seine eigene Farbpalette
- alle Produkt-, Journey-, Transparenz- und Alternativ-Komponenten erben dieselbe Theme-Palette
- keine komponentenspezifischen Dark-Mode-Regeln
- keine `!important`-Regeln

Installation:
  node 3/apply-pfotentechnik-global-dark-mode-token-bridge-25.8.0.mjs

Danach:
  npm --workspace apps/pfotentechnik run build
