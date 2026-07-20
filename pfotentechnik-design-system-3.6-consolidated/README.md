# PfotenTechnik Design System 3.6 – Consolidated

Dieses Paket ersetzt die bisherige Kette versionierter CSS-Dateien durch eine zentrale Datei.

## Vorher

`ProjectLayout.astro` importiert unter anderem:

```astro
import "../styles/pfotentechnik-brand-system.css";
import "../styles/pfotentechnik-brand-system-v2.css";
import "../styles/pfotentechnik-design-system-v3.css";
import "../styles/pfotentechnik-home-comparison-v3.1.css";
import "../styles/pfotentechnik-design-system-v3.3.css";
import "../styles/pfotentechnik-design-system-v3.4.css";
import "../styles/pfotentechnik-design-system-v3.5.css";
import "../styles/pfotentechnik-dark-mode-3.6.css";
```

## Nachher

Es bleiben nur:

```astro
import "../styles/pfotentechnik.css";
import "../styles/pfotentechnik-design-system.css";
```

`pfotentechnik.css` bleibt die technische Basis.  
`pfotentechnik-design-system.css` enthält alle Branding-, Homepage-, Vergleichs-, Produkt- und Dark-Mode-Regeln.

## Was der Installer macht

1. sichert `ProjectLayout.astro` und alle alten CSS-Dateien,
2. liest die bestehenden CSS-Dateien in ihrer bisherigen Lade-Reihenfolge,
3. führt sie in `pfotentechnik-design-system.css` zusammen,
4. hängt Dark Mode 3.6 als letzte Override-Schicht an,
5. entfernt alle alten versionierten Imports,
6. löscht die alten versionierten CSS-Dateien nach dem Backup,
7. erstellt ein Manifest für einen vollständigen Rollback.

## Entfernte Dateien

Soweit vorhanden:

- `pfotentechnik-brand-system.css`
- `pfotentechnik-brand-system-v2.css`
- `pfotentechnik-design-system-v3.css`
- `pfotentechnik-home-comparison-v3.1.css`
- `pfotentechnik-design-system-v3.3.css`
- `pfotentechnik-design-system-v3.4.css`
- `pfotentechnik-design-system-v3.5.css`
- `pfotentechnik-dark-mode-3.6.css`

## Installation

Im Root des Repositories:

```bash
node pfotentechnik-design-system-3.6-consolidated/install-design-system-3.6.mjs
npm run build:pfotentechnik
```

## Kontrolle

```bash
grep -n "styles/pfotentechnik" apps/pfotentechnik/src/layouts/ProjectLayout.astro
ls apps/pfotentechnik/src/styles/pfotentechnik*
```

Erwartete Imports:

```text
pfotentechnik.css
pfotentechnik-design-system.css
```

## Rollback

```bash
node pfotentechnik-design-system-3.6-consolidated/rollback-design-system-3.6.mjs
```
