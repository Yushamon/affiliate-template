PfotenTechnik Header Style Ownership Cleanup 26.0.4

Warum dieser Patch folgt
========================
26.0.3 hat den sichtbaren Header repariert. Im Repository existieren danach
aber weiterhin zwei Header-Stilquellen:

1. packages/affiliate-core/src/components/Header.astro
2. packages/affiliate-core/src/styles/header-footer.css

Das alte Shared-Stylesheet enthält weiterhin eigene Desktop-, Mobile-,
Navigation- und Burger-Regeln. Diese Konkurrenz war die Ursache dafür, dass
spätere Theme- und Responsive-Patches den Header immer wieder beschädigen
konnten.

Was 26.0.4 aufräumt
===================
- Entfernt sämtliche Header-Regeln aus header-footer.css.
- Belässt dort ausschließlich Footer-Regeln.
- Header.astro wird alleiniger Eigentümer von:
  - Container
  - Desktop-Navigation
  - Mobile-Navigation
  - Burger
  - Breakpoints
  - mobilem Außenpadding
- Ein Ownership-Audit verhindert künftig neue doppelte Header-Regeln.
- Keine neue CSS-Datei.
- Keine neue Override-Schicht.
- Keine neuen !important-Regeln.

Die sichtbare Darstellung aus 26.0.3 bleibt erhalten.

Ausführen
=========
  node 3/apply-pfotentechnik-header-style-ownership-cleanup-26.0.4.mjs

Vorprüfung
==========
  node 3/apply-pfotentechnik-header-style-ownership-cleanup-26.0.4.mjs --check
