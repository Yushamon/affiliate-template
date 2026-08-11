# SEO Release Preflight

- Status: ERROR
- Modus: production
- Dauer: 7599 ms
- Phasen: 14
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
- OK **Anchor-Governance-Audit** – npm run audit:anchor-governance:strict
- OK **Frontmatter-Datumsvertrag** – npm run audit:frontmatter-dates:strict
- OK **Technischer SEO-Source-Audit** – npm run audit:technical-seo:source
- OK **SEO-Wachstumscluster** – npm run audit:seo-growth-clusters
- OK **Comparison-Snippet- und Schema-Audit** – npm run audit:comparison-schema
- FEHLER **Produktionsnaher Astro-Build** – npm run build

## Fehler

- Produktionsnaher Astro-Build fehlgeschlagen (Exit 1).

## Warnungen

Keine.

## Content Quality

Kein Content-Quality-Report verfügbar.
