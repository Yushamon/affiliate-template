# PfotenTechnik Content-Architektur

## Single Source of Truth

Produkte, Hersteller, Vergleiche und Wissensseiten werden durch Markdown-Dateien beschrieben. Ein Inhalt wird nicht zusätzlich in TypeScript-Listen registriert.

Die Content-Datei liefert Inhalt, SEO, Hub-Zuordnung, Navigation, Related-Content-Steuerung und fachliche Beziehungen. Astro Content Collections validieren diese Daten beim Build.

## Verantwortlichkeiten

### Content

`apps/pfotentechnik/src/content/`

- `products/`: Produktdaten und Produkttests
- `manufacturers/`: Herstellerprofile
- `comparisons/`: strukturierte Vergleiche
- `pages/`: Ratgeber, Wissen und Legacy-Entscheidungsseiten
- `schema/`: Zod-Schemas der Collections

Markdown beschreibt Entitäten und redaktionelle Inhalte. Es enthält keine Astro-Imports oder fachlichen Berechnungen.

### Content Collections

`apps/pfotentechnik/src/content.config.ts` registriert `pages`, `products`, `manufacturers` und `comparisons`.

Schemas importieren Zod ausschließlich über:

```ts
import { z } from "astro/zod";
```

### Content Registry

`apps/pfotentechnik/src/domain/content/registry.ts` vereinheitlicht alle Collections. Sie stellt unter anderem bereit:

- `getAllContent()`
- `getContentByHub()`
- `getContentByTag()`
- `getContentByType()`
- `getContentEntryBySlug()`
- `getNavigationItems()`

Die Registry enthält keine Produkt- oder Kategorielogik.

### Domain

`apps/pfotentechnik/src/domain/` enthält fachliche Filter, Regeln und Berechnungen.

Aktuelle Beispiele:

- `content/related.ts`
- `content/breadcrumbs.ts`
- `productAlternatives/`

Neue Kategorien dürfen eigene Domain-Regeln ergänzen. Futterautomatenbegriffe wie RFID, Nassfutter oder Mehrkatzenhaushalt bleiben außerhalb des Core.

### Affiliate Core

`packages/affiliate-core/` enthält generische Komponenten und Layouts. Core-Komponenten rendern fertige Props und importieren keine PfotenTechnik-Produkt- oder Herstellerdaten.

### Pages

Astro-Routen laden Collections und Domain-Ergebnisse und reichen fertige Daten an Komponenten weiter.

- `/produkt/[product]/`: Produkte aus `products`
- `/hersteller/[manufacturer]/`: Hersteller aus `manufacturers`, mit Legacy-Produktdarstellung während der Restmigration
- `/vergleiche/[comparison]/`: Vergleiche aus `comparisons`
- `/[slug]/`: Wissens- und Legacy-Pages aus `pages`

## Automatische Plattformfunktionen

### Hubseiten

Hubseiten verwenden `getContentByHub(section)`. Die Zuordnung erfolgt über:

```yaml
hub:
  sections:
    - "wissen"
```

Es gibt keine manuell gepflegten Kartenlisten und keinen Status wie `planned` oder `draft`. Eine vorhandene Markdown-Datei gilt als veröffentlicht.

### Navigation

Die Hauptnavigation wird aus `navigation` im Frontmatter erzeugt:

```yaml
navigation:
  show: true
  label: "Wissen"
  section: "wissen"
  order: 60
```

### Related Content

`getRelatedContent()` bewertet gemeinsame Tags, Hubsektionen und Inhaltstypen. Optional kann Frontmatter die Auswahl steuern:

```yaml
related:
  tags: ["app", "kamera"]
  exclude: ["anderer-slug"]
  limit: 4
```

### Breadcrumbs

Breadcrumbs werden in `domain/content/breadcrumbs.ts` aus Inhaltstyp, Kategorie, Hersteller und Hubbeziehungen erzeugt. Sichtbare Breadcrumbs und Breadcrumb-JSON-LD verwenden dieselbe Item-Liste.

### Sitemap

`apps/pfotentechnik/astro.config.mjs` liest Frontmatter während des Builds. `updatedAt` oder `publishedAt` werden als `lastmod` ausgegeben. `seo.sitemap`, `seo.noindex`, `seo.changefreq` und `seo.priority` werden berücksichtigt.

## Bild-Pipeline mit `astro:assets`

Content-Bilder liegen unter `apps/pfotentechnik/src/assets/images/`. Frontmatter verweist relativ auf diese Dateien. Die Collection-Schemas validieren Bildfelder mit Astros `image()`-Resolver und liefern `ImageMetadata` statt öffentlicher URL-Strings.

Astro-Seiten und Core-Komponenten rendern diese Metadaten über `Image`, `getImage` oder die generische Komponente `OptimizedImage.astro`. Dadurch entstehen responsive Formate, feste Abmessungen und optimierte Build-Artefakte. Direkte `<img>`-Ausgabe bleibt ausschließlich als Übergang für externe oder noch nicht migrierte Legacy-Strings bestehen.

`public/images/` wird während der Legacy-Phase parallel beibehalten. Neue Content-Dateien dürfen diesen Ordner nicht mehr referenzieren. Die dortigen Produktkopien können entfernt werden, sobald keine Legacy-Daten und keine direkten URLs mehr darauf zugreifen.

Für Produktseiten ist `hero` die neutrale Hauptansicht. `gallery-1` bis `gallery-3` zeigen jeweils andere Motive, beispielsweise Anwendung, Befüllung, Bedienelemente, Ausgabe, Reinigung oder Stromversorgung. Eine Galerie darf weder das Hero-Bild noch ein anderes Galeriebild duplizieren.

## Business-Logik und `data`

Berechnungen, Regeln und Filter gehören nach `domain`. `data` darf nur strukturierte Legacy-Inhalte enthalten und wird schrittweise reduziert.

Noch vorhandene Dateien wie `products.ts`, `manufacturers.ts`, `projectImages.ts` und Decision-Daten werden erst entfernt, wenn keine Route oder Komponente sie mehr importiert.

## Migrationsstrategie

Alte und neue Systeme dürfen vorübergehend parallel bestehen. Entfernt wird erst, wenn:

- alle Inhalte migriert sind;
- dynamische Routen funktionieren;
- Hubseiten aus Collections entstehen;
- Navigation, Related Content, Breadcrumbs und Sitemap arbeiten;
- keine relevanten Legacy-Imports verbleiben;
- `npm run build:pfotentechnik` erfolgreich ist.

## Goldene Regel

Ein neuer Standardinhalt benötigt genau eine Markdown-Datei. Eine zusätzliche Codeänderung ist nur bei einer neuen Kategorie, einer neuen fachlichen Regel oder einer neuen Plattformfähigkeit zulässig.
