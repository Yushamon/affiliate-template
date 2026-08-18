# PfotenTechnik Product Data Research Batch 3

Produkte:
- oneisall 7L Dog Water Fountain
- Pawfit 3
- PETLIBRO Dockstream 2 Smart Cordless
- FEELNEEDY FN-W18 8L
- Oneisall 2-in-1 Automatic Cat Feeder and Water Dispenser

Der Installer schreibt nur `confirmed` oder `confirmed_absent`.
`not_published` wird bewusst nicht in die Produkt-MD geschrieben.

Beide Dateien nach `3/` kopieren und aus dem Repository-Root ausführen:

```bash
node 3/apply-pfotentechnik-product-data-research-batch-3-32.7.2.mjs
npm --workspace apps/pfotentechnik run audit:products
git diff -- apps/pfotentechnik/src/content/products
```

Keine `.bak`-Dateien.
