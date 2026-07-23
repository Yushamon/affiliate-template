# PfotenTechnik Product Dark + Mobile Fix 4.2

Behebt auf Produktseiten:

- nicht konsistent angewendeten Dark Mode im ProductRenderer
- helle Alltagstest-, Hinweis-, Galerie- und Buybox-Flächen im Dark Mode
- horizontal abgeschnittene obere Elemente auf Mobilgeräten
- nicht mittig ausgerichtete Produktseiten-Inhalte
- Überbreite durch lange Titel, Chips, Metadaten und Grid-Kinder
- zu starre Galeriehöhen und Metadaten-Spalten auf kleinen Displays

## Installation

ZIP entpacken und den Ordnerinhalt in das Root-Verzeichnis des Repositories legen. Danach:

```bash
node install.mjs
npm run build:pfotentechnik
```

Der Installer ist idempotent. Er kann erneut ausgeführt werden und ersetzt dann nur seinen eigenen markierten CSS-Block.

## Geänderte Datei

`apps/pfotentechnik/src/pages/produkt/[product].astro`

## Technische Hinweise

Der Fix unterstützt mehrere vorhandene Theme-Varianten:

- `html[data-theme="dark"]`
- `html.dark`
- `body[data-theme="dark"]`
- `body.dark`
- beliebige übergeordnete Elemente mit `[data-theme="dark"]`
