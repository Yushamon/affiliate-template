# PfotenTechnik Light-Mode Islands 8.0.3

Gezielter Nachpatch für die zwei noch dunkel gebliebenen Komponenten im Light Mode:

- `DecisionNextSteps.astro`: „Deine nächsten Schritte“
- `HomeNavigation.astro`: „Empfehlungen brauchen eine überprüfbare Grundlage“

Der Installer verändert ausschließlich:

`apps/pfotentechnik/src/styles/pfotentechnik-theme-fixes.css`

Er verwendet keine Header-, Astro- oder Runtime-Textanker. Vor der Änderung wird unter `.patch-backups/` eine Sicherung angelegt. Eine zweite Ausführung ersetzt nur den markierten Patchblock und erzeugt keine Duplikate.

## Windows

Im Repository:

```powershell
node .\1\apply-pfotentechnik-light-mode-islands-8.0.3.mjs --build
```

Alternativ:

```powershell
.\1\install-windows.cmd --build
```

Ohne Build `--build` weglassen.
