# SEO Release Preflight

- Status: ERROR
- Modus: production
- Dauer: 4144 ms
- Phasen: 9
- Fehler: 1
- Warnungen: 0

## Phasen

- OK **Repository- und Umgebungsprüfung** – npm run audit:repository:strict
- OK **Content-Graph und Datenschema** – npm run audit:content-graph
- OK **Produktdaten-Audit** – npm run audit:products:strict
- OK **Vergleichsdaten-Audit** – npm run comparison:data:audit:strict
- OK **Vergleichsintegrität** – npm run comparison:audit:strict
- OK **Interner Source-Link-Audit** – npm run audit:internal-links:strict
- OK **Anchor-Governance-Audit** – npm run audit:anchor-governance:strict
- OK **Technischer SEO-Source-Audit** – npm run audit:technical-seo:source
- FEHLER **Comparison-Snippet- und Schema-Audit** – npm run audit:comparison-schema

## Fehler

- Comparison-Snippet- und Schema-Audit fehlgeschlagen (Exit 1).

## Warnungen

Keine.
