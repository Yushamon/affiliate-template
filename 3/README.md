# Product Data Research Batch 2

Beide Dateien nach `3/` kopieren:

- `pfotentechnik-product-data-research-batch-2.json`
- `apply-pfotentechnik-product-data-research-batch-2-32.7.1.mjs`

Dann:

```bash
node 3/apply-pfotentechnik-product-data-research-batch-2-32.7.1.mjs
npm --workspace apps/pfotentechnik run audit:products
git diff -- apps/pfotentechnik/src/content/products
```

Der Installer schreibt nur bestätigte oder bestätigt nicht vorhandene Specs. Nicht veröffentlichte Werte werden nicht erfunden. Keine `.bak`-Dateien.
