# CSS Comparison System 22.7.3

- Migrierte Core-Tokens: 8
- Untersuchte top-level `:root`-Blöcke: 2
- Geänderte top-level `:root`-Blöcke: 2
- Tokens mit vorherigen Überschreibungen: 5

## Kaskadenauflösung

Bei mehrfachen top-level Deklarationen wird der Wert übernommen, der vor der
Migration durch die CSS-Kaskade wirksam war: die letzte Deklaration in
Quellreihenfolge.

Verschachtelte `:root`-Regeln innerhalb von `@media`, `@supports` oder
anderen At-Rules werden nicht migriert.

- `--comparison-text`: übernommen `#13231e`; frühere Werte: `#0d302b`
- `--comparison-muted`: übernommen `#66766f`; frühere Werte: `#647579`
- `--comparison-accent`: übernommen `#238341`; frühere Werte: `#18743b`
- `--comparison-line`: übernommen `#dce6e0`; frühere Werte: `#dce5e3`
- `--comparison-surface`: übernommen `#ffffff`; frühere Werte: `#ffffff`
