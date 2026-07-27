# Design-System-Konsolidierung 11.1.0

## Ergebnis

- ProjectLayout normalisiert: **ja**
- UI-System erzeugt/aktualisiert: **ja**
- Token-Kompatibilitätsaliase ergänzt: **ja**
- Alte Root-Tokenquelle aus pfotentechnik.css entfernt: **ja**
- Zusammengeführte und entfernte Dateien: **3**

## Entfernte Quelldateien

- `apps/pfotentechnik/src/styles/pfotentechnik-theme-fixes.css`
- `apps/pfotentechnik/src/styles/pfotentechnik-cta-system.css`
- `apps/pfotentechnik/src/styles/pfotentechnik-content-ui-polish.css`

## Verbleibende CSS-Schichten im ProjectLayout

1. `pfotentechnik-design-tokens.css`
2. `pfotentechnik.css`
3. `pfotentechnik-design-system.css`
4. `pfotentechnik-ui-system.css`
5. `pfotentechnik-product-mobile-premium.css` (nur falls vorhanden)

## Regel

Neue allgemeine Theme-, CTA- oder Content-Hotfix-Dateien sollen nicht mehr angelegt werden. Allgemeine Regeln gehören in `pfotentechnik-ui-system.css`; echte Komponentenregeln in die jeweilige Komponenten-CSS-Datei.
