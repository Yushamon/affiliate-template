# PfotenTechnik Source Route Discovery 33.1.0

Der aktuelle `audit:internal-links:strict` meldet 19 `LINK_TARGET_ROUTE_MISSING`-Fehler.
Sie verteilen sich ausschließlich auf drei Ziele:

- `/vergleiche/`
- `/wissen/`
- `/redaktion/`

Alle drei Routen existieren im aktuellen Repository als statische Astro-Seiten:

- `apps/pfotentechnik/src/pages/vergleiche/index.astro`
- `apps/pfotentechnik/src/pages/wissen.astro`
- `apps/pfotentechnik/src/pages/redaktion.astro`

Die Findings sind daher keine kaputten Links. Die Ursache liegt im Audit selbst:
Er kennt Content-Routen und Routen aus `dist`, aber keine statischen `src/pages`-Routen.
Da der Source-Link-Audit im Release-Preflight vor einem frischen Astro-Build läuft,
kann ein veraltetes `dist` gültige statische Seiten fälschlich als fehlend melden.

## Fix

Der Patch ergänzt einen Source-Routenvertrag:

- statische `.astro`, `.md` und `.mdx` unter `src/pages` werden direkt als gültige Routen erfasst
- `index.astro` wird korrekt auf die Verzeichnisroute abgebildet
- dynamische Routen wie `[slug].astro` oder `[...path].astro` werden bewusst nicht pauschal akzeptiert
- Content-Routen und Build-Routen bleiben unverändert zusätzlich bestehen
- keine der 19 Linkstellen wird umgeschrieben, weil deren Ziele korrekt sind

## Installation

```bash
unzip -o pfotentechnik-source-route-discovery-33.1.0.zip -d .
node 3/apply-pfotentechnik-source-route-discovery-33.1.0.mjs
```

Der Installer führt den strikten internen Source-Link-Audit selbst aus.

Danach:

```bash
npm run seo:release:check
```
