# PfotenTechnik CSS Base Layer + Cleanup 22.2.0

Der Patch migriert den sicheren globalen Präfix aus
`pfotentechnik-design-system.css` nach `foundation/base.css`.

Er verschiebt nur unmittelbar nach dem Foundation-Import stehende Regeln aus
der Allowlist:

- `html`
- `body`
- `::selection`

Dadurch bleibt die Kaskadenposition erhalten. Spätere globale Regeln,
Media Queries und komponentenspezifische Selektoren werden nicht angefasst.

Zusätzlich entfernt der Patch doppelte Deklarationen innerhalb der migrierten
Blöcke nach CSS-Kaskadenlogik: Die letzte Deklaration gewinnt.

## Ausführen

```bash
node 3/apply-pfotentechnik-css-base-layer-cleanup-22.2.0.mjs
```

Der vollständige Build wird automatisch ausgeführt. Nur in Ausnahmefällen:

```bash
node 3/apply-pfotentechnik-css-base-layer-cleanup-22.2.0.mjs --skip-build
```
