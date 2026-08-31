# Multi-Pet Capability V1

Stand: 28. August 2026. Strukturierte Abdeckung: 19 Produkte — 11 automatische Katzentoiletten, 5 Mikrochip-Katzenklappen und 3 identifizierende Futterautomaten.

- Shared use: 16 supported, 1 partial, 2 unknown
- Individuelle Identifikation: 17 Produkte; 2 unknown
- Individueller Zugang: 5 supported, 3 partial, 11 notApplicable
- Individuelle Fütterung: 1 supported, 2 partial, 16 notApplicable
- Individuelle Nutzungsdaten: 9 supported, 3 partial, 5 unavailable, 2 unknown

Das Modell trennt bewusst:

- gemeinsame Nutzung (`sharedUse`),
- Identifikationsmethode,
- individuelle Profile,
- individuellen Zugang,
- individuelle Fütterung,
- individuelle Nutzungsdaten.

Eine Schale für zwei Tiere, zwei Näpfe, mehrere App-Nutzer oder eine Kamera gelten nicht automatisch als Tieridentifikation. Unterstützte individuelle Zugangs-, Fütterungs- oder Nutzungsfunktionen sind ohne echte Identifikationsmethode im Schema und im Audit unzulässig.

## Capability Matrix

| Produkt | Shared | Identifikation | Zugang | Fütterung | Analytics |
|---|---|---|---|---|---|
| Cat Mate Elite 355W | supported | Mikrochip + RFID-Tag | partial | n/a | unavailable |
| Devoko 90L | unknown | unknown | n/a | n/a | unknown |
| Litter-Robot 4 | supported | Gewicht | n/a | n/a | supported |
| Litter-Robot 5 Pro | supported | Gewicht + Kamera/AI | n/a | n/a | supported |
| Neakasa M1 Plus Lite | supported | Gewicht | n/a | n/a | partial |
| Neakasa M1 Plus | supported | Gewicht | n/a | n/a | partial |
| PETKIT PuraMax 2 | supported | Gewicht | n/a | n/a | partial |
| PETKIT Crystal Duo | supported | Gewicht + Kamera/AI | n/a | n/a | supported |
| PETKIT MAX 3 | supported | Gewicht + Kamera/AI | n/a | n/a | supported |
| PETKIT MAX PRO 2 | supported | Gewicht + Kamera/AI | n/a | n/a | supported |
| PETLIBRO Luma | supported | Gewicht + Kamera/AI | n/a | n/a | supported |
| PETLIBRO ONE RFID | partial | RFID-Tag | supported | supported | supported |
| PetSafe Mikrochipklappe | supported | Mikrochip + RFID-Tag | partial | n/a | unavailable |
| PetSnowy SNOW+ | unknown | unknown | n/a | n/a | unknown |
| SureFeed Connect | supported | Mikrochip + RFID-Tag | supported | partial | supported |
| SureFeed Basis | supported | Mikrochip + RFID-Tag | supported | partial | unavailable |
| SureFlap DualScan | supported | Mikrochip + RFID-Tag | supported | n/a | unavailable |
| SureFlap Connect | supported | Mikrochip + RFID-Tag | supported | n/a | supported |
| SureFlap Basis | supported | Mikrochip + RFID-Tag | partial | n/a | unavailable |

## Identifikationsmethoden

Methoden können kombiniert auftreten: Mikrochip 7, RFID-Tag 8, Gewicht 9, Kamera/AI 5, unknown 2. `none` wurde bei keinem der gezielt ausgewählten Produkte als belegte Methode gesetzt.

## Fachliche Einordnung

- Automatische Katzentoiletten identifizieren Tiere, soweit belegt, über Gewicht; neuere Modelle ergänzen Kamera-KI. Ähnlich schwere Tiere bleiben ohne klare Herstellerdokumentation als Einschränkung `unknown`.
- SureFeed und PETLIBRO ONE RFID koppeln Zugriff beziehungsweise Fütterung an Mikrochip oder Halsband-Tag. Der Funktionsumfang der individuellen Verlaufsdaten unterscheidet sich zwischen Basismodell und Connect-/RFID-Modell.
- Standard-Mikrochipklappen erkennen berechtigte Tiere, steuern aber nicht zwingend Ein- und Ausgang je Tier. DualScan beziehungsweise Connect werden daher separat abgebildet.
- `sharedUse: supported` ist keine Aussage über individuelle Rechte oder Messwerte.

## Bekannte Grenzen

Die Datenstruktur kann dokumentierte Mindestgewichtsdifferenzen und Beschreibungen für ähnlich schwere Tiere aufnehmen. Im vorhandenen Evidence-Bestand war jedoch keine modellbezogene Grenze hinreichend belastbar, um sie zu verallgemeinern; die entsprechenden Litter-Box-Angaben bleiben konservativ `unknown`. Standard-Mikrochipklappen bieten zudem nur teilweise individuelle Richtungsrechte, auch wenn mehrere Tier-IDs gespeichert werden können.

Alle nicht unbekannten Multi-Pet-Aussagen sind mit Hersteller-URLs am jeweiligen Produktdatensatz verknüpft. Die Felder sind optional und damit rückwärtskompatibel für die übrigen Produkte.
