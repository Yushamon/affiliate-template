PfotenTechnik Theme Cascade Cleanup 25.8.9

Ausgangslage
============
25.8.8 wurde bereits ausgeführt und stabilisierte das sichtbare Ergebnis,
indem die zentrale Token-Datei zuletzt geladen wurde.

Das war funktional, aber nicht die gewünschte Endarchitektur. Mehrere Dateien
enthielten weiterhin konkurrierende oder historisch gewachsene Tokenblöcke.

Was 25.8.9 aufräumt
===================
1. Eine autoritative Palette
   Nur diese Datei besitzt konkrete Projektfarben:
   apps/pfotentechnik/src/styles/pfotentechnik-design-tokens.css

2. Foundation wird reine Alias-Schicht
   apps/pfotentechnik/src/styles/foundation/tokens.css enthält danach:
   - keine Hexfarben
   - keine rgba-Werte
   - keine eigenen Light-/Dark-Paletten
   - nur Abbildungen alter Namen auf semantische Tokens

3. Affiliate Core wird reine Alias-Schicht
   packages/affiliate-core/src/styles/theme.css besitzt ebenfalls keine eigene
   Palette mehr.

4. Normale Importreihenfolge
   Die Token-Datei wird wieder vor ihren Konsumenten geladen. Das Ergebnis
   hängt nicht mehr davon ab, dass sie die Cascade als letzte Datei gewinnt.

5. Dauerhafte Absicherung
   Ein Theme-Ownership-Audit schlägt fehl, sobald Foundation oder Core wieder:
   - autoritative --pt-color-* Tokens definieren
   - feste Hex-/RGB-Farben als Palette einführen

Nicht enthalten
===============
Der Patch entfernt nicht blind jede feste Farbe aus sämtlichen Komponenten.
Stabile Bildoverlays, Statusfarben und bewusst inverse Markenflächen können
weiterhin komponentenspezifisch sein. Aufgeräumt wird die Theme-Ownership,
nicht jede einzelne dekorative Farbe.

Ausführen
=========
  node 3/apply-pfotentechnik-theme-cascade-cleanup-25.8.9.mjs

Vorprüfung
==========
  node 3/apply-pfotentechnik-theme-cascade-cleanup-25.8.9.mjs --check

Ohne vollständigen Build
========================
  node 3/apply-pfotentechnik-theme-cascade-cleanup-25.8.9.mjs --skip-build
