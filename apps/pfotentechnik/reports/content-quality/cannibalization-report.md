# Content-Quality- und Kannibalisierungsreport

- Indexierbare Seiten: 255
- Exakte Duplikate: 0
- Near-Duplicates: 0
- Offene Intent-Konflikte: 0
- Gelöste Konflikte: 2
- Manuelle Prüffälle: 0
- Harte Fehler: 11
- Warnungen: 0

## Konflikte und bewusste Abgrenzungen

### gps-bluetooth-duplicate

- Typ: exact-intent-conflict
- Status: resolved
- Schweregrad: info
- Routen: /gps-tracker-oder-bluetooth-tag/ ↔ /gps-oder-bluetooth/
- Intentionen: commercial-investigation ↔ commercial-investigation
- Maßnahme: CONSOLIDATE
- Begründung: Beide Ratgeber beantworten dieselbe Systementscheidung. Die Zielseite ist technisch präziser, besser intern eingebunden und besitzt das belastbarere Quellenfundament.
- Ähnlichkeit: nach Konsolidierung nicht erneut berechnet

### petkit-yumshare-dual-duplicate

- Typ: exact-intent-conflict
- Status: resolved
- Schweregrad: info
- Routen: /produkt/petkit-yumshare-dual/ ↔ /produkt/petkit-yumshare-dual-hopper/
- Intentionen: commercial-investigation ↔ product-research
- Maßnahme: CONSOLIDATE
- Begründung: Beide Seiten beschreiben den PETKIT YumShare Dual-Hopper 2. Die P592-Zielseite enthält die vollständigere Modellabgrenzung, aktuelle Verfügbarkeit und die gepflegten Vergleichsbezüge.
- Ähnlichkeit: nach Konsolidierung nicht erneut berechnet

### separated|/produkt/petkit-eversweet-solo-2-fountain/|/produkt/petkit-eversweet-solo-se/

- Typ: intent-separation
- Status: intentionally-separated
- Schweregrad: info
- Routen: /produkt/petkit-eversweet-solo-2-fountain/ ↔ /produkt/petkit-eversweet-solo-se/
- Intentionen: product-research ↔ product-research
- Maßnahme: DIFFERENTIATE
- Begründung: Zwei eigenständige PETKIT-Modellvarianten mit unterschiedlicher Produktidentität.
- Ähnlichkeit: 0.7191

### separated|/produkt/tractive-dog-6-xl/|/produkt/tractive-dog-6/

- Typ: intent-separation
- Status: intentionally-separated
- Schweregrad: info
- Routen: /produkt/tractive-dog-6-xl/ ↔ /produkt/tractive-dog-6/
- Intentionen: product-research ↔ product-research
- Maßnahme: DIFFERENTIATE
- Begründung: Standard- und XL-Variante besitzen unterschiedliche Größen- und Einsatzprofile.
- Ähnlichkeit: 0.7411

## Audit-Befunde

- **ERROR · CONTENT_COMPARISON_COUNT_MISMATCH** · /vergleiche/beste-automatische-katzentoiletten/: Quelldaten nennen 10 Vergleichsprodukte, gerendert erkannt wurden 11.
- **ERROR · CONTENT_COMPARISON_COUNT_MISMATCH** · /vergleiche/beste-futterautomaten-fuer-hunde/: Quelldaten nennen 4 Vergleichsprodukte, gerendert erkannt wurden 16.
- **ERROR · CONTENT_COMPARISON_COUNT_MISMATCH** · /vergleiche/beste-futterautomaten-fuer-katzen/: Quelldaten nennen 8 Vergleichsprodukte, gerendert erkannt wurden 27.
- **ERROR · CONTENT_COMPARISON_COUNT_MISMATCH** · /vergleiche/beste-futterautomaten-fuer-nassfutter/: Quelldaten nennen 5 Vergleichsprodukte, gerendert erkannt wurden 6.
- **ERROR · CONTENT_COMPARISON_COUNT_MISMATCH** · /vergleiche/beste-futterautomaten-mit-kamera/: Quelldaten nennen 3 Vergleichsprodukte, gerendert erkannt wurden 6.
- **ERROR · CONTENT_COMPARISON_COUNT_MISMATCH** · /vergleiche/beste-futterautomaten-ohne-wlan/: Quelldaten nennen 3 Vergleichsprodukte, gerendert erkannt wurden 5.
- **ERROR · CONTENT_COMPARISON_COUNT_MISMATCH** · /vergleiche/beste-haustierkameras/: Quelldaten nennen 6 Vergleichsprodukte, gerendert erkannt wurden 8.
- **ERROR · CONTENT_COMPARISON_COUNT_MISMATCH** · /vergleiche/beste-trinkbrunnen-fuer-hunde/: Quelldaten nennen 6 Vergleichsprodukte, gerendert erkannt wurden 10.
- **ERROR · CONTENT_COMPARISON_COUNT_MISMATCH** · /vergleiche/beste-trinkbrunnen-fuer-katzen/: Quelldaten nennen 11 Vergleichsprodukte, gerendert erkannt wurden 21.
- **ERROR · CONTENT_COMPARISON_COUNT_MISMATCH** · /vergleiche/futterautomat-mit-app/: Quelldaten nennen 5 Vergleichsprodukte, gerendert erkannt wurden 6.
- **ERROR · CONTENT_COMPARISON_COUNT_MISMATCH** · /vergleiche/gps-tracker-mit-langer-akkulaufzeit/: Quelldaten nennen 7 Vergleichsprodukte, gerendert erkannt wurden 8.

## Entscheidungsmatrix

- CONSOLIDATE: 2
- KEEP: 255
- NOINDEX: 111
