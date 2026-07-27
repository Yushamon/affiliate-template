# Component Simplification Recovery 12.0.3

## Ursache

Der Component-Adoption-Audit wertet jedes statische class-Attribut einzeln aus.
Die Unterelemente

- `nav-toggle-button__icon`
- `nav-toggle-button__label`

wurden deshalb wegen des Wortes `button` fälschlich als nicht adoptierte
Buttons erkannt.

## Korrektur

- `nav-toggle-button__icon` → `nav-toggle__icon`
- `nav-toggle-button__label` → `nav-toggle__label`
- echter Button bleibt `pt-button nav-toggle-button`
- zugehörige CSS-Selektoren synchron aktualisiert
- keine Design-, Token- oder Budgetänderung

Header geändert: ja
Density-CSS geändert: ja
