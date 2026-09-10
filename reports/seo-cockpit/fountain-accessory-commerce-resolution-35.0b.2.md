# PfotenTechnik 35.0B.2 – Fountain Accessory Commerce Resolution

Stand: 2026-09-10 · Scope: exakt 16 in 35.0B.1 bekannte, kaufbare Filterangebote · intern

## Ergebnis

Alle 16 Angebote haben einen eindeutigen Status. Fünf Produktfälle sind über drei exakte, verfügbare Amazon-ASINs mit der vorhandenen Tracking-Mechanik `AFFILIATE_READY`. Elf bleiben als exakt kompatible und kaufbare, aber bei PfotenTechnik nicht integrierte Händlerangebote `MERCHANT_UNSUPPORTED`. Es wurden keine Suchlinks, Platzhalter, geratenen Zuordnungen oder manuellen Trackingparameter verwendet.

| Fountain | Hersteller / Modell | Filter, Kennung, Pack | Bestehender Kaufbeleg | Amazon-Prüfung | Status / Blocker |
|---|---|---|---|---|---|
| `cat-mate-shell-fountain` | Cat Mate · Shell 410/410E | 386 Dreistufenfilter · 4 | Zooplus 1405119.2 | B07N2ZHS98 exakt, derzeit nicht verfügbar | `MERCHANT_UNSUPPORTED` · Zooplus nicht integriert |
| `oneisall-7l-dog-water-fountain` | oneisall · PW02SIE7L | 7L Carbon Filter · 8 | eu.oneisall.com 46677157544171 | kein exakter kaufbarer Amazon-DE-Direktartikel verifiziert | `MERCHANT_UNSUPPORTED` |
| `petkit-eversweet-max-cordless` | PETKIT · P4115 | Filter Unit RECT 5.0 · P4171 · 5 | petkit-eu.com 46302723244267 | B0CXJC1CW5 exakt, derzeit nicht verfügbar | `MERCHANT_UNSUPPORTED` |
| `petlibro-dockstream-rfid-smart` | PETLIBRO · PLWF305 | Dockstream RFID Filter · 4 | de.petlibro.com 51661786612078 | kein exakter kaufbarer Amazon-DE-4er-Direktartikel verifiziert | `MERCHANT_UNSUPPORTED` |
| `petlibro-glacier-ultrafiltration` | PETLIBRO · PLWF007 | Glacier PL-FF007 · 1 | de.petlibro.com 45005300695282 | kein exakter kaufbarer Amazon-DE-Einzelfilter verifiziert | `MERCHANT_UNSUPPORTED` |
| `xiaomi-smart-pet-fountain-2` | Xiaomi · Fountain 2 | MJLXTZ03 · 3 | Techpunt 57327231992183 | kein exakter kaufbarer Amazon-DE-Direktartikel verifiziert | `MERCHANT_UNSUPPORTED` |
| `cat-mate-335-pet-fountain` | Cat Mate · 335E | 389 Polymer-Aktivkohle · 6 | closerpets.de | B073Q3D82W · 6er · auf Lager | `AFFILIATE_READY` |
| `petkit-eversweet-3-pro-uvc` | PETKIT · P4108 | Filter Unit 3.0 · P4161 · 5 | petkit-eu.com 46302719017195 | B0BVQPJRLH · 5er · auf Lager | `AFFILIATE_READY` |
| `petlibro-dockstream-2-smart` | PETLIBRO · PLWF106 | Dockstream 2 PL-FF005 · 4 | de.petlibro.com 52389590892910 | B0B7J16VGK kaufbar, aber 8er statt 4er | `MERCHANT_UNSUPPORTED` · `COST_INPUT_OFFER_MISMATCH` erhalten |
| `petlibro-dockstream-2-smart-cordless` | PETLIBRO · PLWF116 | Dockstream 2 PL-FF005 · 4 | de.petlibro.com 52389590892910 | B0B7J16VGK kaufbar, aber 8er statt 4er | `MERCHANT_UNSUPPORTED` · `COST_INPUT_OFFER_MISMATCH` erhalten |
| `catit-pixi-smart-trinkbrunnen` | Catit · PIXI Smart | 43722 · 6 | Zooplus 2235929.1 | B095CFB3VZ · 43722 · 6er · auf Lager | `AFFILIATE_READY` |
| `petkit-eversweet-max-2-uvc` | PETKIT · P4116 | RECT 5.0 · P4171 · 5 | petkit-eu.com | B0CXJC1CW5 exakte Filterfamilie, derzeit nicht verfügbar | `MERCHANT_UNSUPPORTED` |
| `petkit-eversweet-solo-2-fountain` | PETKIT · P4114 | Filter Unit 3.0 · P4161 · 5 | petkit-eu.com 46302719017195 | B0BVQPJRLH · 5er · auf Lager | `AFFILIATE_READY` |
| `petkit-eversweet-solo-se` | PETKIT · P4103S | Filter Unit 3.0 · P4161 · 5 | petkit-eu.com 46302719017195 | B0BVQPJRLH · 5er · auf Lager | `AFFILIATE_READY` |
| `petlibro-dockstream-cordless` | PETLIBRO · PLWF115 | Dockstream PLFF005 · 4 | de.petlibro.com 44409650970866 | B0B7J16VGK kaufbar, aber 8er statt 4er | `MERCHANT_UNSUPPORTED` · `COST_INPUT_OFFER_MISMATCH` erhalten |
| `petsafe-streamside-trinkbrunnen` | PetSafe · Streamside | PAC19-14088 · 4 | Hommel · lagernd | B07NDM8179 auf Amazon.de 404 | `MERCHANT_UNSUPPORTED` |

## Kompatibilität

16/16 Zuordnungen bleiben durch die in 35.0B.1 gespeicherte Hersteller-, Manual- oder offizielle Shop-Evidenz exakt belegt. Die Commerce-Prüfung hat keine technische Evidenz überschrieben. Für die fünf Affiliate-Fälle stimmen Produktidentität und Packung mit dem Kosteninput überein. Keine Kompatibilität wurde geraten.

## Amazon und Kostenkonsistenz

- Affiliate-ready: B073Q3D82W für Cat Mate 389/6, B0BVQPJRLH für PETKIT P4161/5 bei drei exakt belegten Modellen, B095CFB3VZ für Catit 43722/6.
- Nicht kaufbar: B07N2ZHS98 (Cat Mate 386/4) und B0CXJC1CW5 (PETKIT P4171/5) zeigten bei der Direktprüfung „Derzeit nicht verfügbar“.
- Nicht übernommen: B0B7J16VGK ist ein verfügbares PETLIBRO-8er-Pack. Die drei vorhandenen Kosteninputs beruhen auf 4er-Packs. Diese Alternativen bleiben parallel und lösen dreimal `COST_INPUT_OFFER_MISMATCH` aus; weder Preis noch Packung wurden überschrieben.
- Keine Amazon-Suchseite wurde als finales Ziel akzeptiert.

## Pumpen aus bestehender Evidenz

Neun gespeicherte Pumpenangebote wurden ohne neue Pumpenrecherche bewertet: acht sind kaufbar, exakt kompatibel und nicht affiliate-fähig (Closer Pets, oneisall und PETKIT EU); ein PETLIBRO-PLWF115-Angebot ist ausverkauft. Affiliate-ready: 0. Kaufbar non-affiliate: 8. Unresolved/unavailable: 1.

## Abschlussvalidierung

- Neue Commerce-Szenarien: 16/16 bestanden.
- Gesamttests im aktuellen Repository: 809/809 bestanden. Die 29 zuvor bestehenden Fehler wurden durch plattformneutrale Pfad-/Zeilenendenbehandlung und zwei aktualisierte semantische Erwartungen behoben; kein Test wurde entfernt.
- Produktions-Build: bestanden, 372 Seiten.
- Release-Preflight: 24/24 Phasen bestanden; Production HTTP Integrity bestanden.
- Produkt-/Evidence-Gate: 102 Produkte ohne Fehler, Fountain Research 24/24 bestanden.
- Affiliate-Paket: 26/26 bestanden; der frühere Parserfehler in `linkEngine.test.ts` ist behoben.
- Freeze: Im 35.0B.2-Change 15/15 Observation-URLs und 6/6 geschützte Quelldateien unberührt; beide Sitemap-Dateien sind bytegenau zur 35.0B.1-Baseline. Historische rohe HTML-/Dateihashes aus 35.0B.1 weichen wegen bereits eingecheckter, nicht zu 35.0B.2 gehörender Repository-Änderungen ab.
- Veröffentlichung: 0 öffentliche Content-Änderungen, 0 gerenderte Zubehör-Affiliate-Links.

## Statussummen

| Status | Anzahl |
|---|---:|
| `AFFILIATE_READY` | 5 |
| `PURCHASABLE_NON_AFFILIATE` | 0 |
| `COMPATIBILITY_UNRESOLVED` | 0 |
| `MERCHANT_UNSUPPORTED` | 11 |
| `OFFER_UNAVAILABLE` | 0 |
| `UNKNOWN` | 0 |

`OFFER_UNAVAILABLE` ist für die 16 bekannten Angebote null, weil ihre gespeicherten Kaufziele verfügbar sind. Die zwei nicht verfügbaren Amazon-Alternativen werden als Blocker des Fallbacks dokumentiert, ändern aber nicht den Status des vorhandenen kaufbaren Händlerangebots.
