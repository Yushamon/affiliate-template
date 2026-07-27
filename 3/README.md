# PfotenTechnik Comparison Mobile Fix 12.1.0

Funktionaler Patch für die aktuellen Mobile-Screenshots.

## Behoben

- Kaufberatung im mobilen Header entfernt
- Burgermenü als sauberes Drei-Linien-Icon
- Produktname wieder über den Sticky-CTA-Buttons
- gequetschter Text im unteren CTA entfernt
- Vergleichskarten neu aufgeteilt
- Preis links, Fair-Badge rechts und vertikal zentriert
- CTA-Bereich direkt und klar unter dem Preis
- Dark Mode berücksichtigt

## Ausführen

```bash
node 3/pfotentechnik-comparison-mobile-fix-12.1.0.mjs
```

Optional:

```bash
node 3/pfotentechnik-comparison-mobile-fix-12.1.0.mjs --dry-run
```

Der Installer erstellt Backups, führt alle Design-System-Audits, den Build und
die Visual-QA aus und committed bei Erfolg lokal.
