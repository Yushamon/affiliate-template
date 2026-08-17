# Recommendation Overall Intent Guard 32.6.18

## Problem

Die Recommendation Engine berechnet bislang auch bei spezialisierten
Futterautomaten-Vergleichen einen automatischen Gesamtsieger.

Dieser Overall-Score berücksichtigt den konkreten Spezialintent nicht ausreichend.
Beispiele:

- mit Akku
- ohne WLAN
- Nassfutter
- Mehrtierhaushalt
- zwei Katzen
- Senioren
- kleine Hunde
- Edelstahl-Napf
- Budget

Damit konnte bei fehlendem redaktionellen winnerSlug ein allgemein gut
bewertetes Produkt gewinnen, obwohl es nicht zwingend die beste Wahl für den
konkreten Vergleichsintent ist.

## Neue Regel

Automatischer Overall bleibt aktiv für:

- beste-futterautomaten-fuer-katzen
- beste-futterautomaten-fuer-hunde
- beste-futterautomaten

Bei spezialisierten Futterautomaten-Vergleichen:

- kein generischer automatischer Overall-Sieger
- redaktioneller winnerSlug bleibt maßgeblich
- fehlt dieser, greift der bestehende sichere Fallback auf die kuratierte
  item-Reihenfolge
- explizit gepflegte automaticRecommendations.scenarios bleiben aktiv

## Unverändert

- Membership bleibt unverändert
- kein Produkt wird entfernt
- Filterlogik bleibt unverändert
- Trinkbrunnen- und GPS-Automatik werden durch diesen Patch nicht verändert
