# PfotenTechnik Comparison Frontmatter Repair 1.0.0

Dieser Reparatur-Patch behebt doppelte Top-Level-Keys in den YAML-Frontmattern
der Vergleichsdateien.

Automatisch repariert werden:

- `faq`
- `tableTitle`
- `cardsTitle`
- `heroImage`
- `recommendation`

Bei mehreren Einträgen bleibt der inhaltlich vollständigste Block erhalten.
Ein befüllter FAQ-Block wird daher gegenüber einem später angehängten `faq: []`
bevorzugt.

Andere doppelte Keys werden aus Sicherheitsgründen nur gemeldet.

## Installation

Im Repository-Root:

```bash
node ./pfotentechnik-comparison-frontmatter-repair-1.0.0/apply-pfotentechnik-comparison-frontmatter-repair-1.0.0.mjs --check
```

Danach:

```bash
node ./pfotentechnik-comparison-frontmatter-repair-1.0.0/apply-pfotentechnik-comparison-frontmatter-repair-1.0.0.mjs
npm run dev:pfotentechnik:seo
npm run build:pfotentechnik
```

Vor jeder Änderung wird eine Sicherung unter `.patch-backups/` angelegt.
