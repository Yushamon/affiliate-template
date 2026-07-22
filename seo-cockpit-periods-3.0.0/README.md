# SEO Cockpit Periods 3.0.0

Lädt bei einem einzigen Sync:

- 24 Stunden
- 7 Tage
- 28 Tage
- 3 Monate
- 6 Monate
- 12 Monate

Jeder Zeitraum wird mit dem unmittelbar vorherigen Zeitraum gleicher Länge verglichen. Standard im Cockpit sind 7 Tage.

## Installation

```bash
unzip seo-cockpit-periods-3.0.0.zip
node seo-cockpit-periods-3.0.0/install-seo-cockpit-periods-3.0.0.mjs
npm run seo:cockpit
```

Danach:

```bash
cd apps/pfotentechnik
npx astro dev
```

Öffnen:

```text
http://localhost:4321/admin/seo/cockpit/
```

Die 24-Stunden-Ansicht nutzt aktuelle GSC-Daten des laufenden Tages. Diese können noch unvollständig sein.
