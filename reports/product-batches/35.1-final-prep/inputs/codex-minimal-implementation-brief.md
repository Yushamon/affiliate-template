# PfotenTechnik 35.1 — Minimal-Codex-Implementierungsbrief

Ziel: Codex soll **nicht erneut breit recherchieren**. Die Webrecherche liegt im Research Packet vor.

## Vorhandene Recherche zuerst lesen

- `neakasa-riko.json`
- `neakasa-m9.json`
- `ifa-pettech-products.json`
- `litter-robot-5.json`
- `source-conflicts.json`
- `image-manifest.json`
- `ifa-2026-haustiertechnik-draft.md`
- `neakasa-riko-product-draft.md`
- `neakasa-m9-product-draft.md`

Nur bei einem Schema-Konflikt oder einer für Go-Live zwingend dynamischen Angabe (Preis/Verfügbarkeit) erneut ins Web gehen.

## Wichtiger Repo-Befund

Aktuelles Product-Schema:
- `images` ist Pflicht.
- `images.hero` ist Pflicht.
- `productStatus` erlaubt nur `active | discontinued | legacy | unknown`.
- Es gibt keinen `preorder`/`upcoming`-ProductStatus.
- `price` ist Pflicht.

Daher:
1. **Keine Produktdatei in `src/content/products/` anlegen, solange `hero.webp` fehlt**, wenn dies den Build brechen würde.
2. Schema nicht nur für diesen Batch erweitern.
3. Riko/M9 zunächst als vorbereitete Drafts/Research behandeln oder erst nach Media-Bereitstellung produktiv schreiben.
4. IFA-Seite kann ohne Hero angelegt werden, weil `heroImage` im Page-Schema optional ist. Keine kaputte Bildreferenz setzen.

## Riko Source of Truth DE

Primär:
`https://neakasa.de/products/neakasa-riko-smart-wet-food-feeder`

Bei Konflikten mit der EU-Seite gelten für die deutsche PfotenTechnik-Seite die aktuellen DE-Werte.

Aktueller dynamischer Stand 14.09.2026:
- 199,99 € Early-Bird
- regulär 299,99 €
- Early-Bird bis 20.09.
- Versand voraussichtlich ab 21.09.

Preis/Versand unmittelbar vor Go-Live kurz neu prüfen.

## M9

Primär:
`https://neakasa.de/blogs/news/ifa-2026-neakasa`

Launch angekündigt 09.10.2026.
Keine unbekannten Werte schätzen.

## Litter-Robot

Keine neue LR5-Datei in 35.1.
LR5 und LR5 Pro sind getrennte Modelle, aber eine zusätzliche DE-Produktseite wird separat entschieden.

## Implementierung mit möglichst wenig Codex-Verbrauch

Phase 1:
- Repo-Schema kurz validieren.
- IFA-Guide aus vorbereitetem Draft integrieren.
- interne Links nur zu bereits existierenden URLs setzen; Riko/M9-Link erst setzen, wenn Produktseiten real existieren.
- Tests/Build einmal.

Phase 2 nach manueller Bildbereitstellung:
- Riko-Produktdraft übernehmen.
- M9-Produktdraft übernehmen.
- Bildreferenzen ergänzen.
- vorhandene Hersteller-/Hub-/Comparison-Architektur wiederverwenden.
- relevante Tests/Build einmal.

Keine Screenshot-Serie in Phase 1.
