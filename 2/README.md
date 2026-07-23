# PfotenTechnik Product Engine 2.2 – Production Renderer

Dieser Patch stellt die vollständige Produktdarstellung wieder her und behält
den neuen ProductRenderer als zentrale Rendering-Grenze bei.

## Was sich ändert

- `ProductRenderer` rendert intern den vollständigen, bewährten `ProductReview`.
- Hero, Galerie, Bewertung, Kaufbox, Quick Facts, Entscheidung, Pro/Contra,
  technische Daten und Alternativen funktionieren wieder wie zuvor.
- Bereits vorhandene Product-Engine-Daten können zusätzlich über
  `SuitabilityMatrix` und `ContextSpecs` dargestellt werden.
- Die Debug-Ausgabe ist standardmäßig deaktiviert.
- Debug erscheint nur noch, wenn beide Bedingungen erfüllt sind:
  - `debug={true}`
  - `PUBLIC_PRODUCT_ENGINE_DEBUG=true`

Die Produktseitenroute aktiviert Debug nicht.

## Installation

ZIP entpacken und im Repository-Root ausführen:

```bash
node <entpackter-ordner>/install.mjs
```

Der Installer sichert die ersetzten Dateien, führt
`npm run build:pfotentechnik` aus und rollt bei einem Fehler automatisch zurück.
