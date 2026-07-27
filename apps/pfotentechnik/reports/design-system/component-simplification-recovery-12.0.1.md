# Component Simplification Recovery 12.0.1

## Ursache

Der Komponenten-Fix 12.0.0 verwendete im bestehenden Density-Layer zwei
direkte Standardwerte, die vom Token-Audit bewusst abgelehnt werden:

- `border-radius: 999px`
- `border-radius: 1rem`

## Korrektur

- `999px` → `var(--pt-radius-pill)`
- `1rem` → `var(--pt-radius-lg)`
- CSS-Dateibudget bleibt unverändert
- Token-Baseline wird nicht verändert
- offener 12.0.0-Stand bleibt vollständig erhalten

## Ersetzungen

- Pill-Radien: 3
- LG-Radien: 1
- Datei geändert: ja
