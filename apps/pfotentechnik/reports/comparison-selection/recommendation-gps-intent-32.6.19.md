# Recommendation GPS Intent Guard 32.6.19

## Repository-Befund

Breite GPS-Vergleiche:

- beste-gps-tracker-fuer-hunde
- beste-gps-tracker-fuer-katzen

Spezialisierte GPS-Vergleiche:

- gps-tracker-mit-langer-akkulaufzeit
- gps-tracker-ohne-abo
- kleine-gps-tracker-fuer-katzen

## Problem

Bislang erhielten auch GPS-Spezialvergleiche automatisch:

- einen allgemeinen Overall-Sieger
- Leichte Tiere
- Lange Akkulaufzeit
- Ohne laufendes Mobilfunkabo

Damit konkurrierten auf einer Spezialseite mehrere andere Intents mit dem
eigentlichen Seitenzweck.

## Neue Regel

Breite GPS-Vergleiche:

- automatischer Overall bleibt aktiv
- Default-Szenarien bleiben aktiv

GPS-Spezialvergleiche:

- kein generischer automatischer Overall
- keine pauschalen Default-Szenarien
- redaktioneller winnerSlug bleibt maßgeblich
- fehlt dieser, greift der bestehende Fallback auf die kuratierte item-Reihenfolge
- explizit konfigurierte automaticRecommendations.scenarios bleiben möglich

## Trinkbrunnen

Die aktuelle Vergleichsstruktur besitzt nur:

- beste-trinkbrunnen-fuer-katzen
- beste-trinkbrunnen-fuer-hunde

Beide sind breite Familienvergleiche. Die vorhandene kapazitäts- und
tierartspezifische Automatik bleibt deshalb unverändert aktiv.

## Sicherheit

- keine Membership-Änderung
- kein Produkt wird entfernt
- Filter bleiben unverändert
