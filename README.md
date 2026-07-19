# Installation – Content Platform 2.0

Dieser Patch ist als achter Patch nach den sieben zuvor vorbereiteten Patches gedacht.

## Voraussetzung

Insbesondere `conversion-framework-4-journey.patch` muss bereits angewendet sein.
Der Patch erwartet deshalb `ConversionJourney` in `apps/pfotentechnik/src/pages/[slug].astro`.

## Installation

```bash
git apply --check content-platform-2.0.patch
git apply content-platform-2.0.patch
npm run build:pfotentechnik
git diff --check
```

## Rückgängig machen

```bash
git apply -R content-platform-2.0.patch
```

## Inhalt

- kompaktes `contentPlatform`-Frontmatter
- Defaults für Kategorie, Theme, Blöcke und CTA
- automatische Empfehlungs- und Vergleichsblöcke
- bestehendes Frontmatter bleibt kompatibel
- keine automatisch erfundenen FAQ oder Fachinformationen
- schrittweise Migration
