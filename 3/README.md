# pfotentechnik-mobile-gallery-airbnb-alignment-28.1.1

Behebt die zwei sichtbaren Abweichungen zur Airbnb-Galerie:

- Der Hero-Media-Wrapper bricht auf Mobile wirklich auf `100dvw` aus dem Seitencontainer aus.
- Die feste Slide-Höhe plus `object-fit: contain` wird durch eine quadratische, bildfüllende Fläche mit `object-fit: cover` ersetzt.
- Zähler und „Alle Bilder“ liegen als Overlay auf dem Bild statt in einer zusätzlichen Leiste.
- Desktop, Lightbox, Einzelbild- und Leerzustand bleiben erhalten.

```bash
node 3/apply-pfotentechnik-mobile-gallery-airbnb-alignment-28.1.1.mjs
```


## Korrektur in 28.1.1

Der aktuelle Galeriecode enthält einige Selektoren sowohl als Basisregel als
auch innerhalb eines Mobile-Media-Queries. Version 28.1.0 zählte beide als
gleichwertige Treffer und brach vor dem Backup und vor jeder Dateiänderung ab.

Der Installer bestimmt nun die CSS-Klammerung am Fundort und ersetzt
ausschließlich die eine Regel auf Root-Ebene. Verschachtelte Regeln innerhalb
von `@media` bleiben erhalten und werden durch die neuen abschließenden
Mobile-Regeln kontrolliert überschrieben.

Diese Korrektur verändert den fachlichen Zielzustand der Galerie nicht.
