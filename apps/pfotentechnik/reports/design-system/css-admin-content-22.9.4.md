# CSS Admin Content 22.9.4

- seo-admin.css vorher: 3921 Bytes
- seo-admin.css nachher: 2640 Bytes
- neuer Content-Layer: 1479 Bytes
- SHA-256 des migrierten Blocks: 03f99447cbaaf11b64cb3ad8a449fd8357d2576da9b79d2ca4e2c0983cd354fa

## Migriert

- table wrapper and tables
- lists and list items
- empty states
- status messages
- anchor cards

## Im Hauptlayer belassen

- findings
- workspace summary
- workspace facts
- responsive rules
- system dark-mode fallback

## Regressionen

Ältere Admin-Layer-Tests werden auf die neue Ownership aktualisiert. Sie prüfen
weiterhin, dass Content-Systeme außerhalb ihrer jeweiligen Layer vorhanden sind,
erwarten sie aber nicht mehr zwingend in `seo-admin.css`.
