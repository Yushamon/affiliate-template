PfotenTechnik Petporte Media Path Repair 32.4.3

Der lokale Produktordner enthält exakt:
- hero.webp
- thumbnail.webp
- comparison.webp
- gallery-1.webp
- gallery-2.webp
- gallery-3.webp

32.4.3 richtet die Produkt-MD exakt auf diese sechs Dateien aus.

Geändert werden nur die Medienreferenzen:
- images.hero -> hero.webp
- images.thumbnail -> thumbnail.webp
- images.comparison -> comparison.webp
- images.gallery -> gallery-1.webp, gallery-2.webp, gallery-3.webp

Alte erfundene Referenzen wie:
- petsafe-petporte-smart-flap-09-glass.webp
- petsafe-petporte-smart-flap-10-size.webp
- nummerierte 01/02/03-Dateien

werden vollständig aus dem Galerieblock entfernt.

Der Installer prüft anschließend jede .webp-Referenz auf Existenz und führt direkt den echten Astro-Build aus.

Ausführen:
node 3/apply-pfotentechnik-petporte-media-path-repair-32.4.3.mjs
