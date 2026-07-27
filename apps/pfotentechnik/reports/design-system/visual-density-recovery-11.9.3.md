# PfotenTechnik Visual Density Recovery 11.9.3

## Ursache

Recovery 11.9.2 hat den Root-Guard außerhalb des Blocks eingefügt, in dem
`css` definiert wurde. Dadurch entstand ein `ReferenceError`.

## Korrektur

- kompletter Density-Audit stabil neu geschrieben
- keine Abhängigkeit mehr von vorhandenen Code-Ankern
- `css` wird ausschließlich innerhalb seines gültigen Scopes verwendet
- `:root`, `!important` und harte Hex-Farben werden geprüft
- Layout-Import und Reihenfolge werden geprüft
- erforderliche Density-Bausteine werden geprüft
- CSS-Budget-Baseline bleibt unverändert
- zuvor gefundene `:root`-Blöcke: **0**
- Density-Datei geändert: **nein**
- Audit-Datei geändert: **ja**
