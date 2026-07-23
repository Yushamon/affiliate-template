# PfotenTechnik Product Engine 2.3 – Adaptive Renderer

Dieser Patch baut auf Product Engine 2.2 auf.

## Enthalten

- robustere Normalisierung vorhandener Legacy- und Standard-2-Daten
- Unterstützung für `decision.bestFor` und `decision.attention`
- bessere Erkennung von Quick Facts, Bildern, Alternativen und Specs
- neue adaptive Intelligence-Karte:
  - passende Zielgruppen
  - automatisch erkannte Stärken
  - relevante Hinweise
- Light- und Dark-Mode-Styling
- vollständige bestehende ProductReview-Darstellung bleibt erhalten
- Debug bleibt standardmäßig aus

## Installation

Im Repository-Root:

```bash
node <entpackter-ordner>/install.mjs
```

Voraussetzung: Product Engine 2.2 ist installiert.

Der Installer erstellt Backups, führt den PfotenTechnik-Build aus und rollt bei
einem Fehler automatisch zurück.
