# PfotenTechnik Comparison Platform 2.1.0

Gemeinsamer Patch:

1. Comparison Platform 2.0.1 – Audit
2. Comparison Platform 2.0.2 – Report
3. Comparison Platform 2.0.3 – Integrity
4. Comparison Platform 2.1.0 – Metadata

## Windows-Installation

```powershell
node .\pfotentechnik-comparison-platform-2.1.0\apply-pfotentechnik-comparison-platform-2.1.0.mjs --check
node .\pfotentechnik-comparison-platform-2.1.0\apply-pfotentechnik-comparison-platform-2.1.0.mjs

cd .\apps\pfotentechnik
npm run comparison:audit
npm run comparison:metadata:check
npm run comparison:metadata
npm run build
```

Backups werden in `apps/pfotentechnik/.patch-backups/` angelegt.
