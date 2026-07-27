# Component Simplification Recovery 12.0.2

## Ursache

Der Navigationstoggle in `Header.astro` wurde beim Umbau zwar semantisch
beibehalten, wurde im lokalen Zwischenstand aber vom Component-Adoption-Audit
nicht mehr als `pt-button` erkannt.

## Korrektur

- vorhandenes `class`-Attribut robust normalisiert
- `pt-button` garantiert als erste Klasse gesetzt
- `nav-toggle-button` garantiert erhalten
- keine Layout-, Token- oder CSS-Budget-Änderung
- offener Stand aus 12.0.0 und 12.0.1 bleibt erhalten

Datei geändert: bereits korrekt
