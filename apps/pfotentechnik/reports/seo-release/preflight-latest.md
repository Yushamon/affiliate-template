# SEO Release Preflight

- Status: OK
- Modus: production
- Dauer: 232198 ms
- Phasen: 23
- Fehler: 0
- Warnungen: 0

## Phasen

- OK **Content-Discovery-Link-Vertrag** – npm.cmd run seo:discovery:check
- OK **Repository- und Umgebungsprüfung** – npm.cmd run audit:repository:strict
- OK **Content-Graph und Datenschema** – npm.cmd run audit:content-graph
- OK **Produktdaten-Normalisierungsvertrag** – npm.cmd run product:data:normalize:check
- OK **Produktdaten-Audit** – npm.cmd run audit:products:strict
- OK **Vergleichsdaten-Audit** – npm.cmd run comparison:data:audit:strict
- OK **Vergleichsintegrität** – npm.cmd run comparison:audit:strict
- OK **Interner Source-Link-Audit** – npm.cmd run audit:internal-links:strict
- OK **Anchor-Governance-Audit** – npm.cmd run audit:anchor-governance:strict
- OK **Frontmatter-Datumsvertrag** – npm.cmd run audit:frontmatter-dates:strict
- OK **Technischer SEO-Source-Audit** – npm.cmd run audit:technical-seo:source
- OK **SEO-Wachstumscluster** – npm.cmd run audit:seo-growth-clusters
- OK **Comparison-Snippet- und Schema-Audit** – npm.cmd run audit:comparison-schema
- OK **Produktionsnaher Astro-Build** – npm.cmd run build
- OK **Search-Recovery-Vertrag** – npm.cmd run seo:recovery:strict
- OK **Kanonische URL-Konsistenz** – npm.cmd run audit:url-consistency:strict
- OK **Gerenderte interne Linkziele** – npm.cmd run audit:internal-link-targets:strict
- OK **Gerenderter SEO-Build-Output** – npm.cmd run audit:release-build-output:strict
- OK **Technischer SEO-Build-Audit** – npm.cmd run audit:technical-seo
- OK **Content-Quality und Kannibalisierung** – npm.cmd run audit:content-quality:strict
- OK **Performance-Budget** – npm.cmd run audit:performance:strict
- OK **Zentrale Quality Operations** – npm.cmd run quality-ops:check
- OK **Release-Manifest** – internal

## Fehler

Keine.

## Warnungen

Keine.

## Content Quality

- Report: C:\hp\Projekt\affiliate-template\apps\pfotentechnik\reports\content-quality\cannibalization-report.md
- Indexierbare Seiten: 252
- Harte Fehler: 0
- Warnungen: 0
