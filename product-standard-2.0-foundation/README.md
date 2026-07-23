# Produktstandard 2.0 – Foundation

Die Foundation ist rückwärtskompatibel:

- Legacy-Seiten bleiben funktionsfähig.
- Neue Blöcke rendern nur, wenn Daten vorhanden sind.
- Fehlende Bilder erzeugen keinen Buildfehler.
- Das Audit meldet fehlende Bilder und Inhalte an den SEO Copilot.

## Installation

Im Repository-Root:

```bash
node /Pfad/product-standard-2.0-foundation/install.mjs
```

## Integration

In `apps/pfotentechnik/src/pages/produkt/[product].astro`:

```astro
---
import ProductStandard2 from "../../components/product-standard-2/ProductStandard2.astro";
---
```

An gewünschter Stelle:

```astro
<ProductStandard2 product={product} />
```

Ohne `productStandard2`-Daten wird nichts gerendert.

## Audit

```bash
npm --workspace apps/pfotentechnik run audit:product-standard-2
```

Reports:

- `apps/pfotentechnik/reports/product-standard-2-audit.json`
- `apps/pfotentechnik/reports/product-standard-2-audit.md`
