PfotenTechnik Footer Style Ownership Cleanup 26.0.5

Voraussetzung
=============
26.0.4 muss angewendet sein. Der Installer bricht ab, falls
header-footer.css noch Header-Regeln enthält.

Was der Patch macht
===================
Nach 26.0.4 enthält header-footer.css nur noch Footer-Regeln. Damit ist der
Dateiname irreführend und die Darstellung bleibt unnötig von einer globalen
Stylesheet-Datei abhängig.

26.0.5:

- verschiebt sämtliche Footer-Regeln direkt nach Footer.astro
- entfernt den Import aus global.css
- entfernt header-footer.css vollständig
- macht Footer.astro zum einzigen Eigentümer der Footer-Darstellung
- erhält Desktop-, Tablet- und Mobile-Layout
- erhält alle semantischen Dark-Mode-Farben
- verhindert künftig, dass Footer und Header erneut in einer Datei vermischt
  werden

Keine neue CSS-Datei. Keine Override-Schicht.

Ausführen
=========
  node 3/apply-pfotentechnik-footer-style-ownership-cleanup-26.0.5.mjs

Vorprüfung
==========
  node 3/apply-pfotentechnik-footer-style-ownership-cleanup-26.0.5.mjs --check
