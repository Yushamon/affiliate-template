# Bilder für PfotenTechnik 35.1

Repository: `C:/hp/Projekt/affiliate-template`

Die folgenden drei Ordner sind angelegt. `.gitkeep` erhält sie in Git und ist kein Bild. Stand: 15.09.2026. Riko ist mit allen sechs vom Nutzer hinterlegten Originaldateien eingebunden; M9 und die optionalen IFA-Bilder fehlen weiterhin. Es wurden keine Bilder beschafft oder erzeugt.

## Riko – alle sechs vorhanden und referenziert

```text
apps/pfotentechnik/src/assets/images/products/neakasa-riko/hero.webp
apps/pfotentechnik/src/assets/images/products/neakasa-riko/thumbnail.webp
apps/pfotentechnik/src/assets/images/products/neakasa-riko/comparison.webp
apps/pfotentechnik/src/assets/images/products/neakasa-riko/gallery-1.webp
apps/pfotentechnik/src/assets/images/products/neakasa-riko/gallery-2.webp
apps/pfotentechnik/src/assets/images/products/neakasa-riko/gallery-3.webp
```

Tatsächliche Motive: Hero/Thumbnail/Comparison verwenden dieselbe gelieferte Produkt-/Zubehöransicht. Gallery-1 zeigt das Zubereitungsprinzip, Gallery-2 die App, Gallery-3 Mahlwerk und Vorratsabdichtung. Alle Bilder sind 800 × 800 Pixel und wurden erfolgreich als WebP decodiert. Alt-Texte beschreiben die realen Motive; es werden keine Katze-am-Gerät- oder Wohnumfeldfotos behauptet. Details: `riko-media.json`.

## M9 – alle sechs erforderlich

```text
apps/pfotentechnik/src/assets/images/products/neakasa-m9/hero.webp
apps/pfotentechnik/src/assets/images/products/neakasa-m9/thumbnail.webp
apps/pfotentechnik/src/assets/images/products/neakasa-m9/comparison.webp
apps/pfotentechnik/src/assets/images/products/neakasa-m9/gallery-1.webp
apps/pfotentechnik/src/assets/images/products/neakasa-m9/gallery-2.webp
apps/pfotentechnik/src/assets/images/products/neakasa-m9/gallery-3.webp
```

Motive: vollständige M9-Produktansicht, Thumbnail, neutrale Vergleichsansicht, Katze im offenen M9, korrektes Originalmotiv der TILT-SAFE-Mechanik, Wohnumfeld.

## IFA-Ratgeber – empfohlene Auswahl

```text
apps/pfotentechnik/src/assets/images/guides/ifa-2026-haustiertechnik/hero.webp
apps/pfotentechnik/src/assets/images/guides/ifa-2026-haustiertechnik/neakasa-riko.webp
apps/pfotentechnik/src/assets/images/guides/ifa-2026-haustiertechnik/neakasa-m9.webp
```

Zusätzlich ein bis drei passende Original-/Pressebilder aus dieser Auswahl:

```text
apps/pfotentechnik/src/assets/images/guides/ifa-2026-haustiertechnik/litter-robot-5.webp
apps/pfotentechnik/src/assets/images/guides/ifa-2026-haustiertechnik/lavvietag-2.webp
apps/pfotentechnik/src/assets/images/guides/ifa-2026-haustiertechnik/petsuper.webp
apps/pfotentechnik/src/assets/images/guides/ifa-2026-haustiertechnik/pawswing-neo.webp
apps/pfotentechnik/src/assets/images/guides/ifa-2026-haustiertechnik/wepaws-smart-harness.webp
```

Der Guide ist ohne diese optionalen Bilder implementiert. Die bestehende Architektur verwendet für Open Graph das vorhandene Projektbild, nicht ein erfundenes IFA-/Produktfoto. Nach dem Kopieren müssen die realen Motive geprüft und passende Referenzen/Alt-Texte ergänzt werden. Das bloße Kopieren aktiviert keine Produktseite.

## Abschluss nach dem Kopieren

Nach Bereitstellung der sechs M9-Bilder den archivierten Auftrag `inputs/codex-final-after-assets.md` fortsetzen: Bildset prüfen, M9 vollständig als manufacturer-data im bestehenden Product-v2-Schema anlegen, Unknowns erhalten und erst dann M9-Links/Hubs ergänzen. Riko ist umgesetzt; Preis/Vorbestellung wurden am 15.09.2026 gezielt geprüft. Keine LR5-Seite oder neue Architektur anlegen. Relevante Tests und Build für den dann geänderten Bestand erneut ausführen.
