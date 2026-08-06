# SEO Release Preflight

- Status: ERROR
- Modus: production
- Dauer: 1709 ms
- Phasen: 4
- Fehler: 1
- Warnungen: 0

## Phasen

- OK **Repository- und Umgebungsprüfung** – npm run audit:repository:strict
- OK **Content-Graph und Datenschema** – npm run audit:content-graph
- OK **Produktdaten-Audit** – npm run audit:products:strict
- FEHLER **Vergleichsdaten-Audit** – npm run comparison:data:audit:strict

## Fehler

- Vergleichsdaten-Audit fehlgeschlagen (Exit 1).

## Warnungen

Keine.

## Content Quality

Kein Content-Quality-Report verfügbar.
