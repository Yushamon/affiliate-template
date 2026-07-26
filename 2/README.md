# PfotenTechnik Product Experience Hotfix 2.0.3

Der Hotfix korrigiert die Statusdarstellung der interaktiven Kaufentscheidung und überführt Product Experience 2.0 in ein hybrides Editorial-Layout.

## Installation

Windows PowerShell:

```powershell
node .\pfotentechnik-product-experience-hotfix-2.0.3\install.mjs --repo C:\hp\Projekt\affiliate-template
```

macOS/Linux:

```bash
node ./pfotentechnik-product-experience-hotfix-2.0.3/install.mjs --repo /pfad/zum/affiliate-template
```

Der Installer ist kumulativ. Hotfix 2.0.1 muss vorhanden sein. Die Änderungen aus 2.0.2 werden bei Bedarf automatisch ergänzt und bei bereits erfolgter Installation nicht doppelt eingebaut.

## Validierung

Der Installer führt automatisch aus:

- vier Quellcode- und Layouttests
- `npm run audit:products`
- `npm run build`

Bei einem Fehler werden alle Änderungen dieses Installationslaufs zurückgesetzt.

## Rollback

```powershell
node .\pfotentechnik-product-experience-hotfix-2.0.3\rollback.mjs --repo C:\hp\Projekt\affiliate-template
```

## Optional

Nur für eine bewusste lokale Diagnose ohne Build und Audit:

```powershell
node .\pfotentechnik-product-experience-hotfix-2.0.3\install.mjs --repo C:\hp\Projekt\affiliate-template --skip-validation
```
