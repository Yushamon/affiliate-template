# SEO Release Preflight

- Status: ERROR
- Modus: production
- Dauer: 5027 ms
- Phasen: 9
- Fehler: 1
- Warnungen: 0

## Phasen

- OK **Content-Discovery-Link-Vertrag** – npm run seo:discovery:check
- OK **Repository- und Umgebungsprüfung** – npm run audit:repository:strict
- OK **Content-Graph und Datenschema** – npm run audit:content-graph
- OK **Produktdaten-Normalisierungsvertrag** – npm run product:data:normalize:check
- OK **Produktdaten-Audit** – npm run audit:products:strict
- OK **Vergleichsdaten-Audit** – npm run comparison:data:audit:strict
- OK **Vergleichsintegrität** – npm run comparison:audit:strict
- OK **Interner Source-Link-Audit** – npm run audit:internal-links:strict
- FEHLER **Anchor-Governance-Audit** – npm run audit:anchor-governance:strict

## Fehler

- Anchor-Governance-Audit fehlgeschlagen (Exit 1).

## Warnungen

Keine.

## Content Quality

Kein Content-Quality-Report verfügbar.
