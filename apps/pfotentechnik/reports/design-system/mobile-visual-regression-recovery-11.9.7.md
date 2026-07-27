# Mobile Visual Regression Recovery 11.9.7

## Ursache

11.9.6 hat eine zusätzliche CSS-Datei angelegt. Die Regeln selbst lagen
innerhalb des Byte-Budgets, aber die Governance begrenzt die Anzahl der
CSS-Dateien bewusst auf 30.

## Korrektur

- Visual-Regression-Regeln in den bestehenden Density-Layer integriert
- separate CSS-Datei entfernt
- separaten Import aus ProjectLayout entfernt
- CSS-Budget-Baseline nicht erhöht
- Runtime-Fixes aus 11.9.6 bleiben erhalten
- Density-Layer geändert: **ja**
- ProjectLayout geändert: **ja**
- separate CSS-Datei entfernt: **ja**

## Erwartetes Budget

- cssFiles: **30**
- rootBlocks: **23**
- importantRules: **1310**
