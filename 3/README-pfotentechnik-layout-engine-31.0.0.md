# PfotenTechnik Layout Engine 31.0.0

## Ausführung

Im Repository-Root:

```bash
node 3/apply-pfotentechnik-layout-engine-31.0.0.mjs
```

Der Installer benötigt keine direkte Abhängigkeit von `@astrojs/compiler`.

## Architektur

- `page-layout-engine.css` wird zum einzigen Owner für Seitenbreite, Gutter, Reading Width und Full-Bleed.
- Produkt- und Vergleichsroute verwenden denselben `container--page`- und `pt-page`-Pfad.
- `comparison-detail`, `container--product`, `container--immersive` und `comparison-shell--premium` werden aus den relevanten Templates entfernt.
- Breiten-, Margin- und Padding-Ownership wird aus den Root-Regeln von `comparison-system.css` entfernt.
- Die mobile Produktgalerie bleibt über `data-mobile-gallery-full-bleed` Full-Bleed.
- Vergleichs-Tokens werden ausschließlich auf globale `--pt-color-*`-Tokens abgebildet.
- Hero, Cards und Tabellen erhalten keine eigene Theme- oder Dark-Mode-Kaskade.

## Sicherheit

- strukturorientierte CSS-Blockerkennung statt globaler Mehrzeilen-Ersetzungen
- Astro-Strukturprüfung ohne zusätzliche Package-Abhängigkeit
- Backup unter `.patch-backups/`
- vollständiger Rollback bei Test-, Lint- oder Buildfehlern
- plattformunabhängige Pfade
- idempotente Schreibvorgänge

## Automatische Prüfungen

1. `node --check 3/apply-pfotentechnik-layout-engine-31.0.0.mjs`
2. `node --test apps/pfotentechnik/test/pfotentechnik-layout-engine-31.0.0.test.mjs`
3. `npm --workspace apps/pfotentechnik run lint:content`
4. `npm --workspace apps/pfotentechnik run build`

Die mitgelieferte Fassung wurde zusätzlich in einem isolierten Workspace zweimal ausgeführt. Erster Lauf: sechs Tests grün. Zweiter Lauf: sechs Tests grün und `Geändert: 0`.
