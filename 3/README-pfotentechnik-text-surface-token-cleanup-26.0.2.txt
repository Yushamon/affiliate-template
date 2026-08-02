PfotenTechnik Text/Surface Token Cleanup 26.0.2

Bestätigte Ursache
==================
Die Browseranalyse hat die tatsächlich gewinnende Regel gefunden:

  .home3-card-content h3 {
    color: var(--pt-color-page);
  }

Der Dark-Mode-Seitengrund ist #0b1510. Deshalb wurde der Kartentitel exakt in
der Farbe seines Hintergrunds dargestellt.

Die globalen Theme-Tokens waren bereits korrekt:
- --pt-color-text: #f2f8f4
- --pt-color-page: #0b1510

Das Problem war eine Rollenverwechslung in einer konkreten CSS-Regel:
Ein Flächen-Token wurde als Textfarbe verwendet.

Was der Patch macht
===================
- durchsucht alle öffentlichen CSS- und Astro-Dateien
- ersetzt Flächen-Tokens in Vordergrund-Eigenschaften durch passende Texttokens
- korrigiert damit nicht nur den bestätigten Homepage-Kartentitel
- prüft auch color, -webkit-text-fill-color, text-decoration-color,
  caret-color, fill und stroke
- fügt einen dauerhaften Audit gegen diese Rollenverwechslung hinzu
- behält den bestehenden semantischen Homepage-Vertrag bei
- keine neue Override-Datei
- keine neuen !important-Regeln

Ausführen
=========
  node 3/apply-pfotentechnik-text-surface-token-cleanup-26.0.2.mjs

Vorprüfung
==========
  node 3/apply-pfotentechnik-text-surface-token-cleanup-26.0.2.mjs --check
