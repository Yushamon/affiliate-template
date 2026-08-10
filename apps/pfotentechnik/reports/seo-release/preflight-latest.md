# SEO Release Preflight

- Status: ERROR
- Modus: production
- Dauer: 87952 ms
- Phasen: 20
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
- OK **Produktionsnaher Astro-Build** – npm run build
- OK **Kanonische URL-Konsistenz** – npm run audit:url-consistency:strict
- OK **Gerenderte interne Linkziele** – npm run audit:internal-link-targets:strict
- OK **Gerenderter SEO-Build-Output** – npm run audit:release-build-output:strict
- OK **Technischer SEO-Build-Audit** – npm run audit:technical-seo
- OK **Content-Quality und Kannibalisierung** – npm run audit:content-quality:strict
- FEHLER **Performance-Budget** – npm run audit:performance:strict

## Fehler

- Performance-Budget fehlgeschlagen (Exit 1).

## Warnungen

Keine.

## Content Quality

- Report: /Users/boris.buckowitz/ExtensionQA/affiliate-template/apps/pfotentechnik/reports/content-quality/cannibalization-report.md
- Indexierbare Seiten: 230
- Harte Fehler: 0
- Warnungen: 0
