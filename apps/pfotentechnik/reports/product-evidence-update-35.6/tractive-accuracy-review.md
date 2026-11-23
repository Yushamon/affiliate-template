# Tractive-Akkufehler und weitere Tracker

Am 23.11.2026 wurden [DOG 6](https://pfotentechnik.de/produkt/tractive-dog-6/) und
[CAT 6 Mini](https://pfotentechnik.de/produkt/tractive-cat-6-mini/) direkt mit HTTP 200 abgerufen.
Beide enthalten integrierte, wiederaufladbare Akkus und passende Laufzeitbedingungen.
Keine der früher gemeldeten Akku-/Notstromfehlbehauptungen wurde in diesen Live-Bodies gefunden.
`source-access.json` enthält Hash, Abrufzeit, Canonical und Suchbefund.
PTE-0001 und PTE-0002 sind deshalb **Live verifiziert**. Das Datum des ursprünglichen Fehlers ist unbekannt.

Dies wurde getrennt vom Repository, den generierten Produktdaten, den abgeleiteten Kaufhinweisen und
finalen Build-Dokumenten geprüft. Das Wort „Notstrom“ in einer gemeinsamen Quelldatei ist kein Beweis,
dass die betreffende Produktseite diese Formulierung ausgibt. Es gibt keine neue Akkukorrektur am DOG 6.

## Eigenständiger neuer CAT-6-Mini-Befund

Die alte FAQ sagte, LIVE Tracking sei in einer Energiesparzone nicht verfügbar. Die aktuelle
[Tractive-FAQ](https://tractive.com/en/fp/battery) nennt die manuelle Aktivierung in Bluetooth-Reichweite.
PTE-0009 präzisiert nur diese Ausnahme. Das ist eine lokale, noch unveröffentlichte Korrektur;
der Akku-/Notstrombefund bleibt davon unabhängig abgeschlossen.

Der Ratgeber [Wie funktionieren GPS-Tracker?](https://pfotentechnik.de/wie-funktionieren-gps-tracker/)
erläutert nun die [zuletzt übermittelte Akkuanzeige](https://help.tractive.com/hc/en-us/articles/360001743159-How-to-check-your-tracker-s-battery-level).
Ladestand und Verbindungszeitpunkt sind zu unterscheiden. Eine angezeigte Restladung beweist bei
unterbrochener Verbindung keine aktuelle Akkureserve. Der Hinweis gilt ausdrücklich für Tractive.

## Weitere Tracker

Alle 14 vorhandenen GPS-Produktseiten sind im lokalen Renderabgleich und im Live-Abruf enthalten:
Enabot ROLA, Garmin Alpha T 20 und TT 25, Invoxia Biotracker 2026, MOVA SureTrack Pro,
PAJ PET Finder 4G Mini, Pawfit 3, Prothelis area Pets, SATELLAI Collar Go,
Tractive DOG 6/DOG 6 XL/CAT 6 Mini sowie Weenect XS/XT.
Kein zusätzlicher Akku-/Netzstromfehler derselben Art wurde im sichtbaren HTML gefunden.

Die Prüfung setzt einen austauschbaren Garmin-Akku nicht mit integriertem Tractive-Akku gleich und
verwechselt VHF-Handgerät, Mobilfunknetz, GPS-Sicht, Ladezustand und Live-Modus nicht.
Herstellermaxima bleiben als solche bezeichnet. Es wurde keine neue universelle Aussage zur
Austauschbarkeit oder Laufzeit sämtlicher Tracker eingeführt. Herstellerprofile, Akkuvergleich und
GPS-Ratgeber sind zusätzlich im `page-review.json` und in `affected-canonicals.csv` erfasst.
