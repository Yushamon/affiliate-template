# CSS Admin Foundation 22.9.0

- seo-admin.css vorher: 10582 Bytes
- seo-admin.css nachher: 6589 Bytes
- neuer Foundation-Layer: 4195 Bytes
- SHA-256 des migrierten Blocks: 99adaa1d93c70d031e625b63a49d807b15681d4e7291e7304d478b0183a4667a

## Migriert

- admin tokens
- explicit dark theme tokens
- global admin reset
- admin shell
- topbar
- brand
- theme and base button shell
- primary navigation
- context navigation
- page header
- section header

## In seo-admin.css belassen

- panels and cards
- grids and stacks
- metrics
- badges
- filters and toolbar
- tables
- lists and empty states
- status
- anchor cards
- findings
- workspace summary
- responsive feature rules
- system dark-mode fallback

## Sicherheitsgrenzen

- Extraktion ausschließlich zwischen realer Dateigrenze und eindeutigem Section-Header-Endblock
- keine Selektoren umbenannt
- keine Deklarationen geändert
- keine pauschale Prüfung wiederverwendeter Klassennamen
- Hash-Prüfung des exakt migrierten Blocks
- vollständiger Rollback bei Test-, Audit- oder Buildfehlern
