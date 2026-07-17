# PfotenTechnik – technisches SEO-Fixpaket

Dieses Paket setzt die priorisierten technischen Korrekturen aus dem SEO-Audit um, ohne komplette Repository-Dateien blind zu überschreiben.

## Enthaltene Korrekturen

1. Nicht-Startseiten erhalten standardmäßig `WebPage` statt pauschal `Article`.
2. `Article`-Datumsangaben werden nur ausgegeben, wenn die jeweilige Seite echte Daten liefert.
3. Wissensseiten berücksichtigen `seo.canonical`.
4. Vergleichsseiten verwenden `WebPage`-Schema.
5. Produktseiten verlieren den fest codierten Veröffentlichungs-Fallback.
6. Produktseiten erhalten `Product`-JSON-LD mit eingebettetem redaktionellem `Review`.
7. Produktseiten verwenden zusätzlich `WebPage` statt eines parallelen generischen `Article`.

## Installation

ZIP im Root von `Yushamon/affiliate-template` entpacken und ausführen:

```bash
node install-seo-fixes.mjs
npm run build:pfotentechnik
```

Vor jeder Änderung legt der Installer Backups unter folgendem Pfad an:

```text
.seo-fix-backup-2026-07-17/
```

Der Installer prüft jeden erwarteten Codeabschnitt. Weicht eine Datei inzwischen ab, bricht er ab, statt unkontrolliert Code zu verändern.

## Betroffene Dateien

- `packages/affiliate-core/src/layouts/AffiliateLayout.astro`
- `apps/pfotentechnik/src/pages/[slug].astro`
- `apps/pfotentechnik/src/pages/vergleiche/[comparison].astro`
- `apps/pfotentechnik/src/pages/produkt/[product].astro`

## Noch manuell zu prüfen

- Das Publisher-Logo sollte ein eigenständiges, crawlbares Markenlogo sein und nicht nur das Favicon.
- Die Standard-OG-Grafik sollte mindestens 1200 × 630 px groß sein.
- Nach dem Build sollten einzelne Produktseiten mit dem Rich Results Test und dem Schema Markup Validator geprüft werden.
- Der Sitemap-Output sollte kontrolliert werden, insbesondere die Produktpfade unter `/produkt/`.
