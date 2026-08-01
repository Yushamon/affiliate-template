PfotenTechnik Design-System-Refresh 25.8.8

Der Patch umfasst nicht nur den Header.

Behoben werden über dieselbe zentrale Ursache:
- Header-Markenname
- Homepage-Abschnittsüberschriften
- Titel sämtlicher Homepage-Tiles
- Kartenbeschreibungen
- Eyebrows und Aktionslinks
- Vergleichsübersicht und Vergleichskarten
- Produktkarten und weitere Komponenten, die semantische Tokens verwenden
- Buttons mit dunkler Aktionsfläche

Ursache
=======
Die zentrale Token-Datei wurde vor mehreren alten Kompatibilitäts- und
Design-System-Dateien geladen. Dadurch konnten später geladene Definitionen
die semantischen Farben wieder überstimmen.

Lösung
======
- Die zentrale Token-Datei wird exakt einmal und bewusst zuletzt geladen.
- Alte Styles dürfen weiter Aliasnamen bereitstellen, gewinnen aber nicht mehr
  die Cascade.
- Die eigentliche Palette wird ausschließlich in der zentralen Token-Datei
  modernisiert.
- Keine neue Override-Datei.
- Keine neuen !important-Regeln.
- Keine einzelnen Dark-Mode-Sonderregeln pro Tile.

Ausführen
=========
  node 3/apply-pfotentechnik-design-system-refresh-25.8.8.mjs

Vorprüfung
==========
  node 3/apply-pfotentechnik-design-system-refresh-25.8.8.mjs --check
