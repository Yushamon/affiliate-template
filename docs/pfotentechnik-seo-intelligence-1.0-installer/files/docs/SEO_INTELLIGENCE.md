# PfotenTechnik SEO Intelligence 1.0

Der Audit analysiert die interne Content-Architektur, ohne
Dateien automatisch zu verändern.

## Befehle

```bash
npm run audit:seo
npm run audit:seo:strict
```

Der Bericht entsteht unter:

```text
apps/pfotentechnik/reports/seo-intelligence.json
```

## Prüfungen

- verwaiste Seiten ohne eingehenden Content-Link
- Ratgeber mit weniger als zwei expliziten internen Links
- kommerzielle Inhalte ohne Pfad zu Vergleich, Produkt oder Hersteller
- sehr ähnliche Titel innerhalb derselben Kategorie oder desselben Clusters
- mögliche Überschneidungen der Suchintention

Berücksichtigt werden Markdown- und HTML-Links sowie
strukturierte Beziehungen aus:

- `comparisonProducts`
- `alternatives`
- `comparisons`

## Einführung

Der normale Modus blockiert bei erkannten Orphan-Seiten.
Warnungen werden nur protokolliert.

Der Strict-Modus blockiert zusätzlich bei Warnungen. Er
sollte erst aktiviert werden, nachdem Navigation und
automatisch erzeugte Links gegen den Bericht geprüft wurden.

## Grenzen

Links, die ausschließlich durch komplexe Astro-Komponenten
zur Laufzeit entstehen, können im statischen Audit fehlen.
Die Ergebnisse sind daher priorisierte Prüfhinweise und keine
automatischen Lösch-, Redirect- oder Zusammenlegungsempfehlungen.
