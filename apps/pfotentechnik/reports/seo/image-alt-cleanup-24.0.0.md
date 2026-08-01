# Bing Image Alt Cleanup 24.0.0

## Ausgangslage

Der Bing-Export enthielt 101 Fundstellen auf 91 eindeutigen Routen. Das Muster betraf gemeinsame Bildkomponenten statt 101 unabhängiger Inhaltsfehler.

## Umsetzung

- `packages/affiliate-core/src/components/home/HomeHero.astro`: Homepage-Hero erhält einen nicht leeren Alt-Text (changed)
- `apps/pfotentechnik/src/components/product-experience-2/ProductGallery2.astro`: Galerie-Thumbnails erhalten eindeutige Alt-Texte (changed)
- `apps/pfotentechnik/src/components/product-standard-2/AlternativesGrid.astro`: Alternativenkarten beschreiben das gezeigte Produkt (changed)
- `packages/affiliate-core/src/components/ComparisonExperience.astro`: Produktbilder in der klassischen Vergleichstabelle erhalten Alt-Texte (changed)
- `packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro`: Produktbilder im interaktiven Direktvergleich erhalten Alt-Texte (changed)
- `packages/affiliate-core/src/components/ImageLightbox.astro`: Der Lightbox-Platzhalter besitzt bereits im statischen HTML einen Alt-Text (changed)
- `packages/affiliate-core/src/components/ImageLightbox.astro`: Die Lightbox verwendet auch bei fehlenden Quelldaten einen Alt-Fallback (changed)
- `packages/affiliate-core/src/components/ImageLightbox.astro`: Beim Schließen fällt die Lightbox nicht auf einen leeren Alt-Text zurück (changed)
- `apps/pfotentechnik/scripts/seo/audit-image-alt-text.mjs`: Datei wird angelegt (changed)
- `apps/pfotentechnik/test/image-alt-text-24.0.0.test.mjs`: Datei wird angelegt (changed)

## Validierung

- FEHLER: Expected double-quoted property name in JSON at position 12825 (line 168 column 1)

Nach dem Astro-Build ausführen:

```bash
npm --workspace apps/pfotentechnik run audit:image-alt:strict
```
