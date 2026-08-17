# Automatic Winner Resolution 32.6.21

## Ziel

Vergleichssieger sollen sich beim Build automatisch aus den vorhandenen
Produktbewertungen aktualisieren. recommendation.winnerSlug bleibt nur ein
bewusster redaktioneller Override.

## Priorität der Siegerauflösung

1. recommendation.winnerSlug als expliziter Override
2. familienspezifische automaticRecommendation
3. zentraler score-basierter Automatic Winner Resolver
4. kein Sieger, wenn keine belastbare Bewertung vorhanden ist

Die bisherige Regel "erstes kaufbares Produkt gewinnt" entfällt vollständig.

## Score-Basis

Verwendet wird calculateProductScore(product.data).

Akzeptierte Quellen:

- score
- criteria
- rating

unrated wird ausgeschlossen.

Ein automatischer Score-Sieger benötigt mindestens 60/100.

Bei Score-Gleichstand gilt:

1. expliziter score
2. Kriterienbewertung
3. einzelnes rating
4. höhere Zahl bewerteter Kriterien

## Intent Hard Gates

Vor dem Ranking werden eindeutige Spezialanforderungen berücksichtigt:

- mit-kamera => comparisonFilters.camera === true
- ohne-abo => GPS subscriptionRequired === false
- mit-akku / Akkulaufzeit => GPS-Akkudaten bzw. backupPower
- Nassfutter => foodType enthält wet
- ohne-WLAN => app === false
- Katzen-/Hundevergleiche => strukturierte Tierart darf nicht widersprechen

Fehlende Tierart schließt ein Produkt nicht aus. Ein expliziter Widerspruch
dagegen schon.

## Ergebnis

Damit können auch Produktfamilien ohne eigene Recommendation Engine, etwa
Haustierkameras, automatisch einen sinnvollen Top-Kandidaten aus den
vorhandenen Bewertungen bestimmen.

Kein manueller winnerSlug ist für den Normalbetrieb erforderlich.

## Sicherheit

- Membership unverändert
- keine Produkte aus Vergleichen gelöscht
- Ratings unverändert
- Filter unverändert
- redaktionelle Overrides bleiben möglich
- kein Fallback auf erstes item[]
