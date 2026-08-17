# Comparison Filter Evidence 32.6.10

## Änderung

Fallback-Filter dürfen negative Eigenschaften nicht mehr aus bloßer Abwesenheit
eines Merkmals ableiten.

Vorher:

- kein Mikrochip-Hinweis => automatisch "freier-zugang"
- Netzteil/Netzbetrieb => automatisch "ohne-backup"

Jetzt:

- "freier-zugang" nur bei explizitem Hinweis auf offenen/freien Zugang oder
  fehlende Zugangskontrolle
- "ohne-backup" nur bei explizitem Hinweis auf reinen Netzbetrieb bzw.
  fehlenden Notstrom/Batterie-Backup

## Priorität

Strukturierte comparisonFilters bleiben autoritativ.
Fallback-Inferenz ergänzt nur, wenn Textbelege tatsächlich vorhanden sind.

## Ziel

Keine Filteroption soll aus einer unbelegten Negativannahme entstehen.
