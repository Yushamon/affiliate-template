# PfotenTechnik Comparison Rendered UI Fix 15.4.3

Dieser Patch basiert auf den tatsächlich im Repository gerenderten Komponenten und ersetzt keine Oberfläche über eine zusätzliche Hotfix-Datei.

## Hauptkorrekturen

- `Header.astro`
  - behält `pt-button` am Navigationstoggle für die Design-System-Adoption
  - neutralisiert die dekorativen `pt-button`-Pseudoelemente lokal und ersetzt das fehleranfällige Doppel-SVG durch drei echte Hamburger-Linien
  - Hamburger und Close-State werden ausschließlich über `aria-expanded` gesteuert
  - Navigation verwendet das native `hidden`-Attribut
  - Mobile-Menü wird kompakter und Dark-Mode-fähig

- `ComparisonStickyBar.astro`
  - entfernt vier historische Style-Layer
  - entfernt sämtliche `!important`-Regeln
  - Sticky CTA wird erst eingeblendet, nachdem die Top-Empfehlung verlassen wurde
  - kurze CTA-Texte und saubere Safe-Area-Abstände

- `comparison-editorial-cover.css`
  - verwendet die bestehenden `--comparison-*`-Tokens
  - repariert Hero-H1, Filter und Top-Empfehlung im Dark Mode
  - reduziert die Filterhöhe
  - ordnet die Recommendation mobile-first

## Ausführung

```bash
node 3/apply-pfotentechnik-comparison-rendered-ui-fix-15.4.3.mjs
```

Optional ohne Prüfungen:

```bash
node 3/apply-pfotentechnik-comparison-rendered-ui-fix-15.4.3.mjs --skip-checks
```


## Korrektur gegenüber 15.4.0

Der Komponenten-Audit verlangt bei statischen Buttons die Klasse `pt-button`. 15.4.3 erfüllt diese Regel wieder. Die fehlerhaften visuellen Nebeneffekte werden nicht durch Entfernen der Primitive gelöst, sondern durch eine eng begrenzte Neutralisierung der `::before`- und `::after`-Dekorationen am Navigationstoggle.


## Menü-Performance 15.4.3

Das mobile Menü wird nicht mehr bei jedem Öffnen über `hidden` beziehungsweise `display: none` neu in den Layoutbaum eingefügt. Es bleibt vorbereitet und wird ausschließlich über `visibility`, `opacity` und `transform` aktiviert.

Zusätzlich:

- `touch-action: manipulation` am Toggle
- nur gezielte Farbtransitions am `pt-button`
- 120-ms-Öffnungsanimation
- `contain: layout paint`
- Reduced-Motion-Unterstützung


## Icon- und Desktop-Dark-Mode-Fix 15.4.3

### Burger und Close-State

- Button: 56 × 56 px
- Iconbreite: etwa 26 px
- Balkenhöhe: 3 px
- größerer Abstand zwischen den Balken
- `overflow: visible` auf Button und Icon-Container
- leicht verlängerte diagonale Linien im Close-State
- kein Abschneiden des X mehr

### Desktop Dark Mode Performance

- keine Backdrop-Filter im Desktop-Header
- keine transparente Dark-Mode-Menüfläche auf Desktop
- keine unnötigen großen Schatten
- Comparison-Flächen ohne Blur
- reduzierte Dark-Mode-Verläufe
- `contain` für bild- und layoutintensive Flächen
- Transitionen nur für Farbe und Hintergrund
