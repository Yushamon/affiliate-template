# PfotenTechnik Airbnb Product Gallery 28.0.1

Ersetzt `ProductGallery2.astro` vollständig durch eine Airbnb-inspirierte Editorial-Galerie.

- Desktop-Mosaik mit einem Hauptbild und bis zu vier Nebenkacheln
- Mobile Scroll-Snap-Galerie
- Vollbilddialog mit Tastatur, Swipe, Zoom und Thumbnail-Leiste
- 0 Bilder: neutraler Leerzustand
- 1 Bild: keine Navigation und keine Thumbnail-Leiste, aber vergrößerbar
- 2 bis 5 Bilder: vollständiges Mosaik
- mehr als 5 Bilder: fünf Kacheln plus „Alle Bilder“
- vorhandene globale Lightbox kollidiert nicht, da Galeriebilder in Buttons liegen
- alter Thumbnail-Swap, Touch-Code und Legacy-CSS werden entfernt

```bash
node 3/apply-pfotentechnik-airbnb-product-gallery-28.0.1.mjs
```


## Mobile Full-Bleed in 28.0.1

Die Galerie wird auf mobilen Viewports bewusst aus dem gepaddeten
Produktseiten-Container herausgezogen:

```css
width: 100vw;
margin-inline: calc(50% - 50vw);
```

Dadurch reichen die Produktbilder links und rechts bis an den Displayrand.

Zähler und „Alle Bilder“-Button bleiben mit 16 Pixel Innenabstand im
bestehenden Inhaltsraster. Auch der Leerzustand behält seitlich 16 Pixel
Abstand. Desktop bleibt unverändert.
