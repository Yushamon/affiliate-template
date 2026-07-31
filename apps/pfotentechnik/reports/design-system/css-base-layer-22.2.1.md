# CSS Base Layer 22.2.1

- Migrierte Selektoren: html, body, ::selection
- Doppelte Deklarationen entfernt: 0
- Legacy-Datei vorher: 130329 Bytes
- Legacy-Datei nachher: 129958 Bytes
- base.css: 506 Bytes

## Korrektur gegenüber 22.2.0

Der Regressionstest prüft jetzt ausschließlich den tatsächlich migrierten Präfix
direkt nach den Imports. Spätere Regeln wie `html, body`, Theme-Overrides,
Dark-Mode-`body`-Regeln und Media-Query-Regeln dürfen weiterhin im Legacy-System
stehen, weil ihre Kaskadenposition nicht verändert werden soll.
