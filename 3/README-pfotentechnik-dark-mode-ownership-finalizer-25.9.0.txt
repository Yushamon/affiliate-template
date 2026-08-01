PfotenTechnik Dark-Mode Ownership Finalizer 25.9.0

Gefundene tatsächliche Ursache
==============================
Die vorherige Bereinigung war unvollständig.

Die zentrale Datei `pfotentechnik-design-tokens.css` besitzt bereits passende
helle Dark-Mode-Texte. Gleichzeitig enthält
`pfotentechnik-design-system.css` aber weiterhin eine zweite vollständige
Dark-Mode-Palette mit eigenen `--pt-theme-*`-Werten und hart codierten
Dark-Mode-Regeln.

Dadurch entstehen zwei parallele Zustände:

- Seitenflächen und Navigation folgen teilweise `--pt-theme-*`
- Header, Homepage-Titel und Vergleichstitel folgen `--pt-color-*`

Das erklärt das sichtbare Ergebnis: dunkle Flächen mit fast schwarzer Schrift.

Was der Patch ändert
====================
1. Eine Theme-Zustandsmaschine
   - genau ein System-Dark-Mode-Block
   - ein expliziter Dark-Mode-Zustand
   - ein expliziter Light-Mode-Zustand
   - kein `:root:not(...)` und keine verteilten Teilblöcke

2. Zweite Dark-Mode-Palette entfernen
   Der komplette konkurrierende Block aus
   `pfotentechnik-design-system.css` wird entfernt.

3. Header und Footer
   - Header-Markentext greift direkt auf `--pt-color-text` zu
   - Footer bleibt auf den stabilen On-Brand-Tokens
   - keine generischen `--text`-/`--surface`-Zwischenrollen im Header

4. Homepage und Vergleiche
   Die Komponenten werden nicht mit Sonderregeln überschrieben. Sie sind
   bereits korrekt an die semantischen Tokens angeschlossen und erhalten nach
   Entfernung des Konflikts automatisch lesbare Überschriften und Tile-Titel.

5. Dauerhafte Absicherung
   Der Theme-Ownership-Audit prüft jetzt sämtliche öffentlichen CSS- und
   Astro-Quelldateien. Er blockiert:
   - `--pt-color-*`-Palette außerhalb der autoritativen Token-Datei
   - `--pt-theme-*`-Palette außerhalb der Alias-Datei
   - weitere konkurrierende System-Dark-Mode-Paletten

Keine neue Override-Datei. Keine neuen `!important`-Regeln.

Ausführen
=========
  node 3/apply-pfotentechnik-dark-mode-ownership-finalizer-25.9.0.mjs

Vorprüfung
==========
  node 3/apply-pfotentechnik-dark-mode-ownership-finalizer-25.9.0.mjs --check

Ohne vollständigen Build
========================
  node 3/apply-pfotentechnik-dark-mode-ownership-finalizer-25.9.0.mjs --skip-build
