# PfotenTechnik Comparison Platform 2.2.0

Robuste Neuimplementierung der Audit-Engine.

## Installation auf macOS

```bash
node ./pfotentechnik-comparison-platform-2.2.0/apply-pfotentechnik-comparison-platform-2.2.0.mjs --check
node ./pfotentechnik-comparison-platform-2.2.0/apply-pfotentechnik-comparison-platform-2.2.0.mjs

cd apps/pfotentechnik
npm run comparison:audit
```

## Danach optional

```bash
npm run comparison:fix:check
npm run comparison:fix
npm run comparison:integrity
npm run comparison:audit:strict
```

Die Datei `audit.mjs` wird vollständig ersetzt. Dadurch bleiben keine fehlerhaften `\n`-Textfragmente aus dem vorherigen Hotfix zurück.
