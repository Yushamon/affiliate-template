# PfotenTechnik Comparison Experience 32.0.2

Korrektur der Token-Grenze aus 32.0.1.

## Ursache

`--comparison-selected-count` war keine Farb- oder Theme-Variable. Sie wird im Explorer zur Laufzeit gesetzt und bestimmt ausschließlich die Anzahl der sichtbaren Produktspalten.

Der Test verbot jedoch pauschal jedes `--comparison-*`.

## Änderung

Die strukturelle Variable heißt jetzt konsistent:

```css
--pt-comparison-selected-count
```

Der Installer aktualisiert:

- `comparison-experience.css`
- den JavaScript-Setter in `ComparisonExplorer.astro`
- die Grid-Berechnungen
- die Architekturtests

Weiterhin strikt verboten bleiben:

- Vergleichs-Farbvariablen
- `var(--comparison-*)`
- `.dark`
- `.theme-dark`
- `[data-theme]`

Alle Farben und Dark-Mode-Werte laufen ausschließlich über die globalen `--pt-color-*`-Tokens.

## Ausführung

```bash
node 3/apply-pfotentechnik-comparison-experience-32.0.2.mjs
```
