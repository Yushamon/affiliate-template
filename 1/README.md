# PfotenTechnik Product Page Polish 2.4

Dieser Installer verbessert die aktuelle produktive Produktseite, ohne Bilder zu verändern.

## Änderungen

- Sternebewertung wird entfernt
- Bewertung wird einheitlich als `xx/100` dargestellt
- interne Werte wie `editorial-review` werden nicht mehr ausgegeben
- `Geeignet für` wird aus `decision.bestFor`, `petSize` und `animal` ergänzt
- Kurzfakten werden auf maximal acht Einträge begrenzt
- sehr lange Kurzfakten werden gekürzt
- das Kurzfakten-Raster wird responsiver und weniger schmal
- der doppelte `ProductTrustPanel` wird aus der Produktseitenroute entfernt
- Product-Engine-Debug wird deaktiviert
- Light- und Dark-Mode bleiben erhalten

## Installation

ZIP entpacken und im Repository-Root ausführen:

```bash
node <entpackter-ordner>/install.mjs
```

Der Installer erstellt vor jeder Änderung ein Backup, führt
`npm run build:pfotentechnik` aus und setzt bei einem Fehler alle Änderungen zurück.
