# SEO Release Preflight

- Status: ERROR
- Modus: production
- Dauer: 3931 ms
- Phasen: 6
- Fehler: 1
- Warnungen: 0

## Phasen

- OK **Repository- und Umgebungsprüfung** – npm run audit:repository:strict
- OK **Content-Graph und Datenschema** – npm run audit:content-graph
- OK **Produktdaten-Audit** – npm run audit:products:strict
- OK **Vergleichsdaten-Audit** – npm run comparison:data:audit:strict
- OK **Vergleichsintegrität** – npm run comparison:audit:strict
- FEHLER **Interner Source-Link-Audit** – npm run audit:internal-links:strict

## Fehler

- Interner Source-Link-Audit fehlgeschlagen (Exit 1).

## Warnungen

Keine.

## Content Quality

Kein Content-Quality-Report verfügbar.
