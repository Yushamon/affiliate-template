# PfotenTechnik Content Playbook

## Pflichtprüfung

Nach jeder größeren Änderung aus dem Monorepo-Root ausführen:

```powershell
npm run build:pfotentechnik
```

Datumswerte im Frontmatter immer als String schreiben:

```yaml
publishedAt: "2026-07-12"
updatedAt: "2026-07-12"
```

## Produktseite erstellen

Eine Datei anlegen unter:

```text
apps/pfotentechnik/src/content/products/<slug>.md
```

Pflichtbereiche:

- `title`, `slug`, `type`, `layout`, `description`
- `recommendation`
- `manufacturer`
- `category`
- `images.hero`
- `rating`
- `decision`
- `review`
- `strengths`, `weaknesses`
- `ratings`, `specs`, `alternatives`, `faq`
- `publishedAt`, `updatedAt`
- `seo`, `hub`, `tags`

Standardroute:

```text
/produkt/<slug>/
```

Produktbilder:

```text
apps/pfotentechnik/public/images/products/<slug>/hero.webp
apps/pfotentechnik/public/images/products/<slug>/thumbnail.webp
apps/pfotentechnik/public/images/products/<slug>/comparison.webp
apps/pfotentechnik/public/images/products/<slug>/gallery-1.webp
```

## Herstellerseite erstellen

Eine Datei anlegen unter:

```text
apps/pfotentechnik/src/content/manufacturers/<slug>.md
```

Pflichtbereiche:

- Basisfelder und SEO
- `key`, `name`, `recommendation`, `summary`
- `images.hero`
- `productSlugs`, `featuredProductSlugs`
- Produktschwerpunkte, Zielgruppen und Hinweise
- Stärken, Schwächen, Serien, Erfahrungen
- Alternativhersteller, Quellen und FAQ
- `hub.sections: ["hersteller"]`

Herstellerbild:

```text
apps/pfotentechnik/public/images/manufacturers/<slug>/hero.webp
```

## Vergleich erstellen

Eine Datei anlegen unter:

```text
apps/pfotentechnik/src/content/comparisons/<slug>.md
```

Mindestens zwei `items` sind erforderlich. Zusätzlich werden `comparisonType`, `group`, `criteria`, `recommendation` und `faq` gepflegt.

Für die automatische Hubaufnahme:

```yaml
hub:
  sections:
    - "vergleiche"
```

Standardroute:

```text
/vergleiche/<slug>/
```

## Wissensseite erstellen

Eine Datei anlegen unter:

```text
apps/pfotentechnik/src/content/pages/<slug>.md
```

Die Seite benötigt mindestens Titel, Slug, Beschreibung, Tags, Autor, Datum, SEO und Markdown-Inhalt.

Für den Wissen-Hub:

```yaml
hub:
  sections:
    - "wissen"
```

## SEO

Empfohlene Struktur:

```yaml
seo:
  title: "SEO-Titel"
  description: "Präzise Beschreibung"
  canonical: "/ziel/"
  sitemap: true
  priority: 0.8
  changefreq: "monthly"
```

`updatedAt` steuert `lastmod` in der Sitemap.

## Tags und Beziehungen

Tags werden kleingeschrieben und verbinden verwandte Inhalte. Sie beeinflussen Related Content und fachliche Auffindbarkeit.

Beziehungen verwenden veröffentlichte Slugs, keine Anzeigenamen.

## Navigation

Nur Inhalte mit `navigation.show: true` erscheinen im Header. `section` wird als kanonischer Pfad interpretiert und `order` bestimmt die Reihenfolge.

## Related Content

Standardmäßig werden Inhaltstags und Hubsektionen verwendet. `related` muss nur gepflegt werden, wenn Tags überschrieben, Slugs ausgeschlossen oder das Limit geändert werden sollen.

## Qualitätscheck

- Frontmatter validiert?
- Slug und Ordnernamen identisch?
- Bildpfade vorhanden?
- Canonical mit abschließendem Slash?
- `updatedAt` aktuell?
- Hubsektion korrekt?
- Produkt- und Herstellerbeziehungen gültig?
- Keine zweite TypeScript-Inhaltsliste ergänzt?
- Build erfolgreich?
