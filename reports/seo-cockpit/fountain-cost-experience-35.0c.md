# PFOTENTECHNIK 35.0C — Fountain Filter Cost Experience

Status: **IMPLEMENTIERT / PRODUKTIV DEAKTIVIERT / NICHT AKTIVIERUNGSFREI**

## Ergebnis

Die ProductExperience2-Erweiterung „Filter & laufende Kosten“ ist implementiert. Der zentrale Gate-Wert `fountainRunningCosts.productionEnabled` steht auf `false`. Eine Vorschau ist ausschließlich im Dev-Modus mit `PFOTENTECHNIK_FOUNTAIN_COSTS_PREVIEW=true` möglich; es gibt keinen Datumsschalter.

Der produktive Build enthält **0** neue Überschriften, State-Attribute, Affiliate-CTAs, neue ASINs, interne Links oder Schema-Ausgaben aus 35.0C.

## Architektur und Placement

Der kleine, wiederverwendbare `ProductRunningCosts`-Block hängt im bestehenden ProductExperience2-Pfad direkt nach der zentralen Decision-Zone und vor Everyday-Timeline, Community, Details, Evidence und Alternativen. Damit bleibt er sekundäre Entscheidungsinformation, ohne Hero, Haupturteil oder Commerce zu dominieren.

Wiederverwendet werden:

- `calculateConsumableCost` für Preis/Packungsgröße/Intervall,
- `classifyAccessoryOffer` und die bestehende Amazon-Tracking-ID für exakt verifizierte Direktangebote,
- das 35.0B-Research-Asset und seine Provenance,
- ProductExperience2-Tokens und der vorhandene semantische Seitenfluss.

Neue parallele Infrastruktur, Schema-Erweiterungen und Content-Migrationen: **0**.

## UI-Vertrag

| State | Anzahl | Verhalten |
| --- | ---: | --- |
| FULL | 5 | Kosten, Intervall, verifiziertes Angebot und Affiliate-CTA |
| COST_ONLY | 10 | Kosten und vorhandenes Intervall, kein CTA |
| OFFER_ONLY | 1 | Angebot, keine Jahreskosten, kein CTA |
| INFO_ONLY | 8 | Filter-/Wartungsinformation, keine Jahreskosten, kein CTA |
| HIDE | 0 | Renderer liefert `null` |

Bereiche bleiben Bereiche; ein fixes Intervall ergibt eine gerundete Einzelangabe. Fehlender/ungültiger aktueller Preis oder fehlendes Intervall unterdrückt die Kosten vollständig. Bei unbekannter Filterpflicht wird weder „Pflicht“ noch „optional“ behauptet. Pumpen, Drei-Jahres-TCO, Produktpreisaddition, Dataset-Rankings und Vergleichsclaims sind ausgeschlossen.

Die drei PETLIBRO-Fälle mit `COST_INPUT_OFFER_MISMATCH` bleiben getrennt und `COST_ONLY`. Der Preis des 8er-Packs wird nicht mit dem 4er-Kosteninput kombiniert.

## Preview

Expliziter lokaler Dev-Preview per Hintergrundserver:

| State | Beispiel | HTTP | State | CTA |
| --- | --- | ---: | --- | --- |
| FULL | cat-mate-335-pet-fountain | 200 | gerendert | ja |
| COST_ONLY | petlibro-dockstream-2-smart | 200 | gerendert | nein |
| OFFER_ONLY | oneisall-7l-dog-water-fountain | 200 | gerendert | nein |
| INFO_ONLY | petkit-eversweet-ultra | 200 | gerendert | nein |

## Production Freeze

- Build: **PASS**, 372 Seiten.
- Neue 35.0C-Ausgabe in Production: **0**.
- Sechs geschützte Quelldateien im 35.0C-Diff: **0/6 geändert**.
- Die in 35.0B.1 gespeicherten historischen Hashes dieser sechs Dateien waren schon vor 35.0C veraltet; das ist kein 35.0C-Change.
- Observation-Kohorte: 10/15 Seiten bytegleich; 15/15 ohne 35.0C-Featureausgabe.
- Fünf Seiten zeigen im Buildvergleich ausschließlich bereits vorhandene Media-Rollen-Drift (`thumbnail`/`comparison` zu `hero`). Sie betrifft Bildpfade und ist nicht durch den deaktivierten Kostenblock verursacht. Deshalb wird keine falsche 15/15-Bytegleichheit behauptet.
- Sitemap gegenüber dem unmittelbar vor 35.0C gesicherten Build: bytegleich.

## Validation

- Neue 35.0C-Tests: **23/23 PASS**, darin alle 20 verlangten Szenarien.
- Gesamtsuite vorher: **809/809 PASS**.
- Gesamtsuite nachher: **832/832 PASS**.
- Neue Fehler durch 35.0C: **0**.
- Affiliate-Core: **26/26 PASS**.
- Release-Diagnose: **22/22 PASS**; Build- und Production-Phasen im Diagnosemodus bewusst übersprungen. Die letzte volle 24/24-Production-Verifikation bleibt 35.0B.2.
- Evidence-Audit: 101/102 erfasst; 72 vollständig, 29 teilweise, 1 fehlend. Die 24 Fountain-Manifest-Einträge wurden zusätzlich vollständig im neuen Test validiert.

## Aktivierung

Zur späteren manuellen Freigabe ist genau der zentrale Wert `fountainRunningCosts.productionEnabled` auf `true` zu setzen und anschließend der vollständige Aktivierungs-/Visual-QA-Batch auszuführen.

**35.0C ACTIVATION READY: NO**

Blocker:

1. Der 34.8-Beobachtungszeitraum läuft bis 2026-09-21T13:27:50.265Z.
2. Vier echte Browser-Screenshots und Browser-Geometrie/Layout-Shift-Messungen fehlen, weil in dieser Umgebung kein Browser-Backend verfügbar ist.
3. Fünf Freeze-Seiten besitzen unabhängige Media-Rollen-Drift und sind deshalb nicht bytegleich zum unmittelbar vorher vorhandenen `dist`.
