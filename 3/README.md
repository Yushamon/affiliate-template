# pfotentechnik-mobile-gallery-viewport-height-28.1.3

Begrenzt die mobile Produktgalerie anhand der verfügbaren Bildschirmhöhe.

## Ziel

Die Galerie soll den Einstieg visuell tragen, aber nicht fast den gesamten
ersten mobilen Viewport belegen. Direkt unter dem Bild sollen bereits
Produktkategorie, Hersteller und der Beginn der Kaufentscheidung sichtbar sein.

## Höhenmodell

Standard:

```css
height: clamp(280px, 44svh, 520px);
max-height: 52svh;
```

Kurze Displays bis 700 Pixel Höhe:

```css
height: clamp(260px, 42svh, 340px);
```

Sehr hohe Displays ab 900 Pixel:

```css
height: min(46svh, 480px);
```

`svh` wird bewusst statt `vh` verwendet, damit ein- und ausblendende
Browserleisten die Galerie nicht springen lassen.

## Ausführen

```bash
node 3/apply-pfotentechnik-mobile-gallery-viewport-height-28.1.3.mjs
```
