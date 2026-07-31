# CSS Admin Controls 22.9.3

- seo-admin.css vorher: 5439 Bytes
- seo-admin.css nachher: 3921 Bytes
- neuer Control-Layer: 1714 Bytes
- SHA-256 des migrierten Blocks: 3eac9a6312d08a6d01f16c08180a042da63fddb13d8ecf5a70fc5470e57efafc

## Migriert

- badge groups
- actions
- source state
- tabs
- severity badges
- filter grid
- toolbar
- labels
- select, input and textarea controls

## Im Hauptlayer belassen

- tables
- lists
- empty states
- status
- anchor cards
- findings
- workspace summary
- responsive rules
- system dark-mode fallback

## Regressionen

Die Tests aus 22.9.0 und 22.9.2 werden bewusst auf die neue Layer-Struktur
aktualisiert. Sie prüfen weiterhin die Ownership, erwarten migrierte Controls
aber nicht mehr fälschlich in `seo-admin.css`.
