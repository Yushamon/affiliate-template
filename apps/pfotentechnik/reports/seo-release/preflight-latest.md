# SEO Release Preflight

- Status: ERROR
- Modus: production
- Dauer: 2261 ms
- Phasen: 5
- Fehler: 1
- Warnungen: 0

## Phasen

- OK **Repository- und Umgebungsprüfung** – npm run audit:repository:strict
- OK **Content-Graph und Datenschema** – npm run audit:content-graph
- OK **Produktdaten-Audit** – npm run audit:products:strict
- OK **Vergleichsdaten-Audit** – npm run comparison:data:audit:strict
- FEHLER **Vergleichsintegrität** – npm run comparison:audit:strict

## Fehler

- Vergleichsintegrität fehlgeschlagen (Exit 1).

## Warnungen

Keine.

## Content Quality

Kein Content-Quality-Report verfügbar.
