PfotenTechnik SEO Cockpit Patch Quality Standard Hotfix 2.2.1

Ursache:
Der Installer 2.2.0 hat unter Windows einen bereits absoluten Pfad erneut
an die Repository-Wurzel angehängt:

  C:\repo\C:\repo\2\installer.mjs

Die Änderungen an growth.ts, prompt-builder.ts, Test und package.json waren
zu diesem Zeitpunkt bereits geschrieben.

Der Hotfix:
- validiert den bereits angewendeten Cockpit-Stand
- verwendet fileURLToPath(import.meta.url) für node --check
- verwendet unter Windows npm.cmd
- verwendet unter macOS und Linux npm
- macht den vorhandenen Installer 2.2.0 ebenfalls plattformfest
- führt die Cockpit- und Research-Tests aus
- verändert die Prompt-Inhalte nicht erneut

Installation unter Windows:
  node ./2/apply-pfotentechnik-seo-cockpit-patch-quality-standard-hotfix-2.2.1.mjs
