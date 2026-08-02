PfotenTechnik Home Layout Ownership Cleanup 26.0.6

Was aufgeräumt wird
===================
Das generische Shared-Stylesheet `packages/affiliate-core/src/styles/layout.css`
enthält bislang Homepage-spezifische Regeln:

- .container--home
- .home3-hero
- .home3-hero__content
- einen leeren Media-Block

Das vermischt allgemeines Seitenlayout mit der aktuellen Homepage-Architektur.

26.0.6 verschiebt diese Regeln in die bereits von HomePage.astro importierte
kanonische Datei:

  packages/affiliate-core/src/components/home/home.css

Danach gilt:

- layout.css enthält nur generische Layoutregeln
- home.css besitzt das komplette Homepage-Layout
- HomePage.astro importiert die Homepage-Stile selbst
- keine zusätzliche Override-Datei
- keine neuen !important-Regeln

Voraussetzung
=============
Die vorherigen Header- und Footer-Cleanups sollten angewendet sein. Der Patch
verändert Header und Footer selbst nicht.

Ausführen
=========
  node 3/apply-pfotentechnik-home-layout-ownership-cleanup-26.0.6.mjs

Vorprüfung
==========
  node 3/apply-pfotentechnik-home-layout-ownership-cleanup-26.0.6.mjs --check
