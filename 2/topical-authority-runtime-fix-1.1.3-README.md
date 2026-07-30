# Topical Authority Runtime Fix 1.1.3

Behebt zwei Fehler:

1. Astro-Build bricht bei `/admin/seo/topical-authority/` mit
   `Cannot read properties of undefined (reading 'map')` ab.
2. Der Test prüft noch Implementierungsdetails der alten Loader-Version.

## Installation

ZIP im Repository-Root entpacken. Bei Nutzung des Ordners `2`:

```bash
node 2/install-topical-authority-runtime-fix-1.1.3.mjs
```

Alternativ bei Ordner `3`:

```bash
node 3/install-topical-authority-runtime-fix-1.1.3.mjs
```

## Danach

```bash
npm --workspace apps/pfotentechnik run test:topical-authority
npm --workspace apps/pfotentechnik run audit:topical-authority:strict
npm --workspace apps/pfotentechnik run build
```
