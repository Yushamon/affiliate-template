# Recommendation Family Guard 32.6.16

## Befund

Die automatische Recommendation Engine besitzt derzeit eigene fachliche
Scoring-Logik für:

- Futterautomaten
- Trinkbrunnen
- GPS-Tracker

Andere Produktfamilien fallen auf "generic" zurück.

Der Generic-Pfad besitzt keine belastbare familienspezifische Bewertung.
Insbesondere automatische Katzentoiletten, Haustierkameras und Katzenklappen
würden überwiegend aus allgemeinem Produktscore, Tierart und einfachen
Preis-Szenarien gerankt.

## Änderung

Für family === "generic":

- kein automatischer Gesamtsieger
- keine automatischen Szenario-Sieger
- vorhandener redaktioneller winnerSlug bleibt maßgeblich
- vorhandener redaktioneller alternativeSlug bleibt maßgeblich
- vorhandener Empfehlungstext bleibt erhalten

## Unverändert

Automatische Recommendation bleibt aktiv für:

- feeder
- water-fountain
- gps-tracker

Neue Produktfamilien können später gezielt mit eigener Scoring-Logik ergänzt
werden, ohne die sichere redaktionelle Basis zu verändern.
