# pfotentechnik-canonical-url-consistency-33.0.2

Der 33.0.1-Build war erfolgreich. Die 92 URL-Audit-Fehler entstanden anschließend durch einen zu strengen neuen Audit-Vertrag: Auch `/admin/`- und `noindex`-HTML-Seiten wurden als canonical-pflichtig behandelt.

Das widerspricht der bereits bestehenden Repository-Policy in `scripts/audit-internal-link-targets.mjs`, die Canonicals nur für indexierbare Seiten verlangt.

33.0.2 korrigiert das:

- Canonical-Pflicht nur für indexierbare HTML-Seiten.
- `/admin/` und Seiten mit `meta robots=noindex` benötigen keinen Canonical.
- Vorhandene Canonicals auf solchen Seiten werden weiterhin validiert.
- Filter-Query-Links, falsche absolute www-Links, kaputte `/vergleiche/-...`-Routen und Sitemap-State-URLs bleiben harte Fehler.
- Der Audit meldet getrennt die Zahl indexierbarer und Noindex/Admin-Seiten.
- Der vollständige funktionale Fix aus 33.0.1 ist erneut enthalten, weil 33.0.1 sauber zurückgerollt hat.

## Installation

```bash
unzip -o pfotentechnik-canonical-url-consistency-33.0.2.zip -d .
node 3/apply-pfotentechnik-canonical-url-consistency-33.0.2.mjs
```

Anschließend:

```bash
npm run seo:release:check
```
