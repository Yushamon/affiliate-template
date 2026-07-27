# PfotenTechnik Comparison Mobile Recovery 12.1.1

Robuster Recovery-Patch für den aktuellen Mobile-Stand.

## Wichtigste Änderung

Der Kaufberatungs-CTA wird diesmal **direkt aus `Header.astro` entfernt**.
Er wird nicht nur versteckt. Zusätzlich wird die dazugehörige Runtime-Logik
entfernt, damit der CTA nicht nachträglich wieder erscheinen kann.

## Weitere Fixes

- sauberes Burgermenü
- Vergleichskarten ohne langes Bildfeld
- Bild im stabilen 4:3-Format
- Preis direkt vor den CTA-Buttons
- Preis und Fair-Badge in einer Zeile
- Produktname im Sticky-CTA vollständig sichtbar
- Top-Empfehlung kompakter

## Ausführen

```bash
node 3/pfotentechnik-comparison-mobile-recovery-12.1.1.mjs
```

Optional:

```bash
node 3/pfotentechnik-comparison-mobile-recovery-12.1.1.mjs --dry-run
```
