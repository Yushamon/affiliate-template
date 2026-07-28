# PfotenTechnik Build Cache 16.0.0

Der Patch beschleunigt lokale Astro-Builds, ohne Astros Bildoptimierung zu ersetzen.

## Änderungen

- persistenter Asset-Cache unter `apps/pfotentechnik/.astro-cache/`
- schneller lokaler Build ohne Sitemap-Serialisierung
- plattformübergreifend für macOS und Windows
- Cache-Reset-Skript
- Backups, `--check` und Abschlussreport

## Installation

```bash
node 3/pfotentechnik-build-cache-16.0.0.mjs --check
node 3/pfotentechnik-build-cache-16.0.0.mjs
```

Optional ohne Test-Build:

```bash
node 3/pfotentechnik-build-cache-16.0.0.mjs --skip-build
```

## Verwendung

Schneller Arbeits-Build:

```bash
npm --workspace apps/pfotentechnik run build:fast
```

Vollständiger Release-Build inklusive Sitemap:

```bash
npm run build:pfotentechnik
```

Cache zurücksetzen:

```bash
npm --workspace apps/pfotentechnik run build:cache:reset
```
