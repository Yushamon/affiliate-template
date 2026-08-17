# Recommendation Scenario Intent Guard 32.6.17

## Problem

Für jeden Futterautomaten-Vergleich wurden bislang dieselben Default-Szenarien
erzeugt:

- Preis-Leistung
- App und smarte Funktionen
- Kamera und Kontrolle

Das ist bei Spezialvergleichen wie "mit Akku", "ohne WLAN", "Nassfutter",
"Mehrtierhaushalt", "Seniorenkatzen" oder "unter 100 Euro" nicht sauber.

## Neue Regel

Default-Szenarien werden nur noch für breite Allround-Vergleiche erzeugt:

- beste-futterautomaten-fuer-katzen
- beste-futterautomaten-fuer-hunde
- beste-futterautomaten

Alle anderen Futterautomaten-Vergleiche erhalten automatische Szenario-Sieger
nur dann, wenn automaticRecommendations.scenarios explizit gepflegt ist.

## Unverändert

- Redaktioneller winnerSlug bleibt maßgeblich.
- Automatische Membership bleibt unverändert.
- Produkte werden nicht entfernt.
- Feeder-Gesamtscore bleibt als Fallback verfügbar.
