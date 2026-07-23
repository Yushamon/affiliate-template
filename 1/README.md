# PfotenTechnik Theme + Kaufberatung 8.0.2

Diese Version ersetzt 8.0 und 8.0.1.

Der Installer verwendet keine exakten Textanker wie `Header Props` oder `Runtime Fix Component` mehr. Er verändert ausschließlich:

- `apps/pfotentechnik/src/layouts/ProjectLayout.astro`
- `apps/pfotentechnik/src/styles/pfotentechnik-theme-fixes.css`
- `apps/pfotentechnik/src/components/SiteRuntimeFixes.astro`
- `apps/pfotentechnik/src/pages/kaufberatung.astro`

`Header.astro`, `registry.ts` und `project.config.ts` bleiben unangetastet.

## Windows

Im Repository-Stamm:

```powershell
node .\1\apply-pfotentechnik-theme-kaufberatung-8.0.2.mjs --build
```

Ohne Build:

```powershell
node .\1\apply-pfotentechnik-theme-kaufberatung-8.0.2.mjs
```

Der Installer legt Backups unter `.patch-backups/` an und ist wiederholt ausführbar.
