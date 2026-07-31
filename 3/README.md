# PfotenTechnik CSS Comparison System + Cleanup 22.7.3

22.7.2 hat korrekt erkannt, dass einzelne Core-Tokens mehrfach mit
unterschiedlichen Werten definiert sind.

22.7.3 erhält die bestehende CSS-Kaskade: Bei mehrfachen top-level
`:root`-Deklarationen wird der letzte und damit bisher wirksame Wert übernommen.

```bash
node 3/apply-pfotentechnik-css-comparison-system-cleanup-22.7.3.mjs
```

Verschachtelte Root-Regeln innerhalb von Media Queries oder anderen At-Rules
werden nicht migriert.
