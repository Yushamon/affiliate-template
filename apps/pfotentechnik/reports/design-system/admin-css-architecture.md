# SEO Admin CSS Architecture 22.10.2

## Korrektur gegenüber 22.10.0

Der statisch eingetragene Marker `.seo-title` existiert im aktuellen
Foundation-Layer nicht. 22.10.2 verwendet stattdessen den tatsächlich
vorhandenen Marker `.seo-eyebrow`.

Zusätzlich validiert der Installer alle Ownership-Marker bereits vor dem
Schreiben der Dateien. Ein falsches Manifest kann dadurch künftig nicht erst
im nachgelagerten Test auffallen.

## Ergebnis

- Status: finalisiert
- Entrypoint vor Finalisierung: 2640 Bytes
- Entrypoint nach Finalisierung: 219 Bytes
- Layer: 6
- Entrypoint enthält nur Imports: ja

## Import-Reihenfolge

1. `seo-admin-foundation.css`
2. `seo-admin-panels.css`
3. `seo-admin-controls.css`
4. `seo-admin-content.css`
5. `seo-admin-operations.css`
6. `seo-admin-responsive.css`

## Layer-Metriken

| Layer | Bytes | Regelblöcke | Media Queries | !important |
|---|---:|---:|---:|---:|
| foundation | 4195 | 28 | 0 | 0 |
| panels | 1329 | 16 | 0 | 0 |
| controls | 1714 | 10 | 0 | 0 |
| content | 1479 | 16 | 0 | 0 |
| operations | 1400 | 13 | 0 | 0 |
| responsive | 1408 | 13 | 4 | 0 |
