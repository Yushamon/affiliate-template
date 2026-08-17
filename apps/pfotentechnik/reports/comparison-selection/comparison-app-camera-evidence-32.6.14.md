# Comparison App & Camera Evidence 32.6.14

## Problem

Die Freitext-Fallbacks waren zu breit:

- WLAN / Wi-Fi allein erzeugte "mit-app"
- "Video" oder "Überwachung" allein erzeugte "mit-kamera"

Das kann Produkte falsch klassifizieren, obwohl die jeweilige Hardware- oder
Steuerungsfunktion nicht ausdrücklich bestätigt ist.

## Neue Regel

App:
- "mit-app" nur bei expliziter App-Steuerung / Steuerung per App
- "ohne-app" nur bei expliziter Negativaussage
- WLAN allein reicht nicht mehr

Kamera:
- "mit-kamera" nur bei explizitem Kamera-Hinweis
- "ohne-kamera" nur bei expliziter Negativaussage
- "Video" oder "Überwachung" allein reicht nicht mehr

## Unverändert

- comparisonFilters.app / comparisonFilters.camera bleiben autoritativ
- keine Produkte werden entfernt
- Membership bleibt unverändert
- fehlende Evidenz erzeugt keinen erfundenen Gegenwert
