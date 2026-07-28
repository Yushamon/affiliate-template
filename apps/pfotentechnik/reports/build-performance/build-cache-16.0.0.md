# Build Cache 16.0.0

Erstellt: 2026-07-28T13:06:27.321Z

Astros Bildoptimierung bleibt aktiv. Der Asset-Cache wird dauerhaft außerhalb von node_modules gespeichert.

## Befehle

- `npm --workspace apps/pfotentechnik run build:fast`
- `npm --workspace apps/pfotentechnik run build:cache:reset`
- `npm run build:pfotentechnik` bleibt der vollständige Release-Build inklusive Sitemap.

## Änderungen

- `apps/pfotentechnik/astro.config.mjs`: cacheDir und Fast-Build-Modus ergänzt
- `apps/pfotentechnik/scripts/build-fast.mjs`: Fast-Build-Runner angelegt
- `apps/pfotentechnik/package.json`: build:fast und build:cache:reset ergänzt
- `.gitignore`: Astro-Cache in .gitignore ergänzt
