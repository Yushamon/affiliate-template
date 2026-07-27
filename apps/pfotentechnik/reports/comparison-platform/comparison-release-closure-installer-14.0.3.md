# Comparison Release Closure Installer 14.0.0

## Änderungen

- alle 24 Vergleichsdateien auf kanonische `/vergleiche/.../`-Pfade normalisiert
- kaputte `/vergleiche/-...`-Links repariert
- Redirect-Ziele in internen Links kanonisiert
- beschädigte Größen-Kriterienschlüssel repariert
- Gewinner und Alternative auf vorhandene, empfehlungsfähige Produkte abgesichert
- Resolver-Aliase für migrierte Einsatzkriterien erweitert
- öffentlich werden nur vollständig belegte Vergleichszeilen gerendert
- wiederholte „Keine Angabe“-Ausgaben entfernt
- Sticky-Bar erhält Safe-Area- und Überdeckungsschutz
- Dark-Mode-Flächen und Texte erhalten finale Comparison-Tokens
- Daten-, Refactor- und Release-Audits auf 24 Seiten aktualisiert
- Abschlussreport trennt technische und manuelle visuelle Abnahme

## Geänderte Dateien

- apps/pfotentechnik/package.json
- apps/pfotentechnik/scripts/comparison-platform/audit.mjs
- apps/pfotentechnik/scripts/comparison-platform/coverage-audit.mjs
- apps/pfotentechnik/scripts/comparison-platform/data-audit.mjs
- apps/pfotentechnik/scripts/comparison-platform/refactor-audit.mjs
- apps/pfotentechnik/scripts/comparison-platform/release-closure.mjs
- apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts
- apps/pfotentechnik/test/comparison-release-closure-14.0.3.test.mjs
- packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro
- packages/affiliate-core/src/components/comparison/ComparisonShell.astro
- packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro
- packages/affiliate-core/src/components/comparison/ComparisonTable.astro
- packages/affiliate-core/src/components/comparison/comparison-premium-ux.css
