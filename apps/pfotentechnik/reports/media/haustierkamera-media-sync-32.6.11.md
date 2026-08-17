# Haustierkamera Media Sync 32.6.11

## Regel

Die Produkt-MD wird ausschließlich aus tatsächlich vorhandenen WebP-Dateien
im jeweiligen Produktordner synchronisiert.

- hero.webp → images.hero
- thumbnail.webp → images.thumbnail, falls vorhanden
- comparison.webp → images.comparison, falls vorhanden
- gallery-N.webp → images.gallery, numerisch sortiert
- keine nicht existierenden Bildpfade werden erfunden
- wenn comparison.webp fehlt, nutzt die bestehende Comparison Engine weiterhin
  thumbnail bzw. hero als Fallback

## Ergebnis

### enabot-ebo-air-2

- Status: ok
- Vergleichsbild: hero.webp fallback
- Dateien: hero.webp

### enabot-rola-mini

- Status: ok
- Vergleichsbild: comparison.webp
- Dateien: comparison.webp, gallery-1.webp, gallery-2.webp, gallery-3.webp, hero.webp, thumbnail.webp

### pettec-cam-360

- Status: ok
- Vergleichsbild: comparison.webp
- Dateien: comparison.webp, gallery-1.webp, hero.webp, thumbnail.webp

### reolink-e1-zoom

- Status: ok
- Vergleichsbild: comparison.webp
- Dateien: comparison.webp, gallery-1.webp, gallery-2.webp, gallery-3.webp, hero.webp, thumbnail.webp
