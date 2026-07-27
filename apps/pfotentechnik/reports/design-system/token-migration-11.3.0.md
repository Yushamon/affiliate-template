# PfotenTechnik Design-Token-Migration 11.3.0

## Ergebnis

- CSS-Dateien mit Migrationen: **14**
- Ersetzte harte Standardwerte: **91**
- Ergänzte zentrale Tokens: **6**

## Geänderte Dateien

- `apps/pfotentechnik/src/styles/pfotentechnik-design-system.css`
- `apps/pfotentechnik/src/styles/pfotentechnik.css`
- `packages/affiliate-core/src/styles/article.css`
- `packages/affiliate-core/src/styles/calculator.css`
- `packages/affiliate-core/src/styles/manufacturer.css`
- `packages/affiliate-core/src/styles/misc.css`
- `packages/affiliate-core/src/styles/premium-page.css`
- `packages/affiliate-core/src/styles/product.css`
- `packages/affiliate-core/src/styles/ui.css`
- `packages/affiliate-core/src/components/comparison/comparison-mobile-price-fix-4.0.1.css`
- `packages/affiliate-core/src/components/comparison/comparison-premium-seo.css`
- `packages/affiliate-core/src/components/comparison/comparison-premium-ux.css`
- `packages/affiliate-core/src/components/comparison/comparison.css`
- `packages/affiliate-core/src/components/home/home.css`

## Sicherheitsumfang

Automatisch ersetzt wurden ausschließlich exakte Einzelwerte in diesen Deklarationen:

- Text-, Hintergrund- und Rahmenfarben
- Fill und Stroke
- Border-Radien

Nicht automatisch verändert wurden:

- Gradients
- RGB-/RGBA-Mischfarben
- komplexe Schatten
- komponentenspezifische Sonderfarben
- Werte innerhalb von calc(), clamp() oder Mehrfachdeklarationen
