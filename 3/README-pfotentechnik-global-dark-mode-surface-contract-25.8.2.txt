PfotenTechnik Global Dark Mode Surface Contract 25.8.2

Problem
-------
Der System-Dark-Mode greift inzwischen global, aber mehrere Komponenten
verwenden weiterhin feste Light-Mode-Farben oder benutzen einen Surface-Token
als Textfarbe.

Dadurch entstehen unter anderem:
- fast schwarze Überschriften auf dunklen Flächen
- weiße Karten mit nahezu weißem Text
- dunkle Kartentitel auf dunklen Cards
- kaum sichtbare Markenbezeichnungen in Header und Footer
- uneinheitliche Hubs für Vergleiche und Hersteller

Lösung
------
25.8.2 trennt drei semantische Rollen:

1. Theme-abhängige Seitenflächen und Texte
   - --pt-color-text
   - --pt-color-text-muted
   - --pt-color-surface
   - --pt-color-surface-soft
   - --pt-color-border

2. Stabile Vordergründe auf dauerhaft dunklen Flächen
   - --pt-color-text-inverse
   - --pt-color-text-inverse-muted

3. Helle Bildbühnen für Produkt- und Herstellerbilder
   - --pt-color-media-stage

Angepasst werden:
- Homepage-Hero
- Homepage-Ratgeber-, Produkt- und Bedarfskarten
- Vergleichsübersicht
- Herstellerübersicht
- automatische Geeignet-/Nicht-geeignet-Karten
- automatische Tabellen und Empfehlungsblöcke
- Markenname im Header
- Markenname im Footer

Wichtig
-------
Der Patch fügt keine neue komponentenspezifische Dark-Mode-Palette hinzu.
Die betroffenen Komponenten erben stattdessen die zentralen Design-Tokens.
Doppelte data-theme-, .dark- und prefers-color-scheme-Regeln in
AutoContentBlocks werden entfernt.

Installation
------------
node 3/apply-pfotentechnik-global-dark-mode-surface-contract-25.8.2.mjs

Danach:
npm --workspace apps/pfotentechnik run build

Im Browser anschließend hart neu laden.

Validierung
-----------
Der Installer führt automatisch aus:

npm --workspace apps/pfotentechnik run test:product-dark-mode
npm --workspace apps/pfotentechnik run test:product-ux-cleanup
npm --workspace apps/pfotentechnik run product-standard-3:release:no-build

Zusätzlich entsteht:
apps/pfotentechnik/test/global-dark-mode-surface-contract-25.8.2.test.mjs
