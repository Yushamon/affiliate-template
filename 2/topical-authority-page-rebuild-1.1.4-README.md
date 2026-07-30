# Topical Authority Page Rebuild 1.1.4

Dieser Fix ersetzt die fehlerhafte Astro-Seite vollständig. Es gibt keine
formatabhängige Suche und keine Erkennung einzelner Codefragmente mehr.

## Installation

```bash
node 2/install-topical-authority-page-rebuild-1.1.4.mjs
```

Danach:

```bash
npm --workspace apps/pfotentechnik run test:topical-authority
npm --workspace apps/pfotentechnik run audit:topical-authority:strict
npm --workspace apps/pfotentechnik run build
```
