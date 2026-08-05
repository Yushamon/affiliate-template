# Product Gallery V29.2.1

Korrigiert den tatsächlichen verbleibenden Layout-Owner:

- `pt-product-detail` verliert auf Mobile sämtliches horizontales Padding
- die Galerie erhält keinen eigenen Viewport-Hack
- Inhaltskarten und Folgeabschnitte behalten 12 px Außenabstand
- das aktive Lightbox-Thumbnail wird erst nach `showModal()` zentriert
- kleine Thumbnail-Sätze werden zentriert, große bleiben scrollbar

Ausführen:

```bash
node 3/apply-pfotentechnik-product-gallery-v29-29.2.1.mjs
```
