# pfotentechnik-mobile-gallery-zero-edge-28.1.5

Ergänzt den Zero-Edge-Galerie-Patch um korrekt zentrierte
Lightbox-Vorschaubilder.

## Problem

Die Vorschaubilder erscheinen innerhalb der unteren Kacheln nach unten
verschoben. Der Thumbnail-Button besitzt bislang keinen eindeutigen
Zentrierungs-Owner. Außerdem bleibt der normale Inline-Zeilenabstand wirksam.

## Lösung

Thumbnail-Button:

```css
display: grid;
place-items: center;
line-height: 0;
```

Thumbnail-Bild:

```css
width: 100%;
height: 100%;
margin: 0;
object-fit: cover;
object-position: center center;
```

Die Vorschaukacheln werden auf 88 × 66 Pixel vereinheitlicht. Die aktive
Markierung, horizontale Navigation und Safe-Area bleiben erhalten.

## Ausführen

```bash
node 3/apply-pfotentechnik-mobile-gallery-zero-edge-28.1.5.mjs
```
