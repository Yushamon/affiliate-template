# Failure Mode V1 — Evidence Report

Stand: 2026-08-28

## Coverage

- Produkte geprüft: **9**
- Produkte mit `failureModes`: **9**
- Produkte mit allen vier V1-Modi strukturell erfasst: **9**
- Produkte mit vollständig belegten vier Modi: **0**
- Felder gesamt: **36**
- `supported`: **3**
- `partial`: **2**
- `unavailable`: **3**
- `unknown`: **25**
- `notApplicable`: **3**

V1 umfasst drei Futterautomaten, drei Mobilfunk-GPS-Tracker und drei Kameras. Katzenklappen, Trinkbrunnen und automatische Katzentoiletten wurden nicht in das Schema-Batch gezwungen. Das Modell ist optional; bestehende Produkte ohne `failureModes` bleiben valide.

## Products

| Produkt | Strom | WLAN | Internet | Cloud | Quellenstatus |
|---|---|---|---|---|---|
| PETLIBRO Polar Wet Food Feeder | partial | unknown | unknown | unknown | Herstellerbeleg für Zeitplan bis 12 h und netzabhängige Kühlung |
| PETKIT YumShare Solo 2 | partial | supported | unknown | unknown | Herstellerbeleg für Batterie-/Kameragrenze und WLAN-Zeitplan |
| PETLIBRO Air WiFi Feeder | supported | unknown | supported | unknown | Hersteller-/Supportbeleg für Akku und Offline-Zeitplan |
| Tractive DOG 6 | notApplicable | unknown | unavailable | unknown | Supportbeleg für fehlende Fernortung ohne Mobilfunk |
| Weenect XS | notApplicable | unknown | unavailable | unknown | Herstellerbeleg für Mobilfunkabhängigkeit |
| Pawfit 3 | notApplicable | unknown | unavailable | unknown | Herstellerbeleg für eSIM-/Mobilfunkabhängigkeit |
| PetTec Cam 360 | unknown | unknown | unknown | unknown | lokale Speicherung belegt, Ausfallverhalten nicht getrennt belegt |
| Furbo 360° Katzenkamera | unknown | unknown | unknown | unknown | Funktionen/Tarif belegt, Ausfallverhalten nicht belegt |
| Reolink E1 Zoom | unknown | unknown | unknown | unknown | lokale Wege belegt, Ausfallverhalten nicht getrennt belegt |

## Known Unknowns

- PETLIBRO Polar: Motor-/Öffnungsschritte, WLAN, App, Benachrichtigungen und Cloud im Batteriebetrieb.
- PETKIT Solo 2: Internet- und Cloudausfall getrennt vom WLAN-Ausfall.
- PETLIBRO Air: reiner WLAN- und Herstellerdienstausfall.
- Tracker: lokale Positionsaufzeichnung, spätere Synchronisierung und Restfunktionen im Funkloch.
- Kameras: lokale Aufnahme/Erkennung bei WLAN- oder Internetausfall, LAN-Livebild, Audio, Push und Wiederanlauf.

## Do Not Infer

- Ein Batterie-Backup für einen Zeitplan belegt keine aktive Kühlung, Kamera, App oder Push-Funktion.
- `microSD` belegt nicht automatisch Aufnahme oder Erkennung bei WLAN-/Internetausfall.
- GPS-Fix belegt keine Übertragung an die App und keine spätere Synchronisierung.
- „Cloud optional“ belegt kein definiertes Verhalten bei Ausfall des Herstellerdienstes.
- Ein akkubetriebener Tracker macht einen Haushalts-Stromausfall `notApplicable`; das sagt nichts über leeren Akku oder Ladeausfall.

## Schema Contract

Pro optionalem Modus: `status`, `behavior`, optional `sourceUrl`, `sourceType`, `verifiedAt`. Die Statuswerte sind auf `supported`, `partial`, `unavailable`, `unknown`, `notApplicable` begrenzt. Jeder nicht unbekannte und anwendbare Claim benötigt das vollständige Evidence-Triple. `unknown` darf bewusst ohne Quellen-URL gespeichert werden.
