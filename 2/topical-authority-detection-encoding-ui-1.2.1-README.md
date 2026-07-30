# PfotenTechnik Topical Authority 1.2.1

Behebt:

- nicht erkannte Produktmodelle und Ratgeber
- beschädigte Umlaute/Symbole
- unlesbare Kennzahlen und Chips im Dark Mode

## Installation

```bash
node 2/install-topical-authority-detection-encoding-ui-1.2.1.mjs
```

## Prüfung

```bash
npm --workspace apps/pfotentechnik run test:topical-authority
npm --workspace apps/pfotentechnik run audit:topical-authority:strict
npm --workspace apps/pfotentechnik run build
```
