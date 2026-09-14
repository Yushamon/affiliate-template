# Bilder für PfotenTechnik 35.1

Repository: `C:/hp/Projekt/affiliate-template`

Die folgenden drei Ordner sind angelegt. `.gitkeep` erhält sie in Git und ist kein Bild. Es wurden keine Bilder beschafft, erzeugt oder als Platzhalter angelegt. Stand: 14.09.2026, alle unten aufgeführten neuen Bilder fehlen.

## Riko – alle sechs erforderlich

```text
apps/pfotentechnik/src/assets/images/products/neakasa-riko/hero.webp
apps/pfotentechnik/src/assets/images/products/neakasa-riko/thumbnail.webp
apps/pfotentechnik/src/assets/images/products/neakasa-riko/comparison.webp
apps/pfotentechnik/src/assets/images/products/neakasa-riko/gallery-1.webp
apps/pfotentechnik/src/assets/images/products/neakasa-riko/gallery-2.webp
apps/pfotentechnik/src/assets/images/products/neakasa-riko/gallery-3.webp
```

Motive: exakte Produktansicht, ruhige Thumbnail-Ansicht, neutrale Vergleichsansicht, Katze am Riko, Futter-/Wasser-Zubereitungsprinzip, Wohnumfeld.

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

Den archivierten Auftrag `inputs/codex-final-after-assets.md` mit den Originaldateien in `inputs/` fortsetzen: vollständige Bildsets prüfen, Riko und M9 als manufacturer-data im bestehenden Product-v2-Schema anlegen, DE-Quellenkonflikte und M9-Unknowns erhalten, vorhandene Evidence-/Commerce-Struktur nutzen und erst dann Produktlinks/Hubs ergänzen. Riko-Preis/Vorbestellung vor Veröffentlichung von Commerce-Feldern gezielt aktuell prüfen. Keine LR5-Seite oder neue Architektur anlegen. Relevante Tests und Build für den dann geänderten Bestand erneut ausführen.
