# Vergleichsplattform Refactor 10.0.0

Stand: 2026-07-27  
Status: **vor Validierung**

## Zielarchitektur

Alle kommerziellen Vergleiche werden ausschließlich unter `/vergleiche/` ausgeliefert. Wissens- und Evergreenartikel bleiben als eigenständige Informationsseiten bestehen.

## URL-Mapping und Redirects

| Alt | Neu |
| --- | --- |
| `/beste-futterautomaten-fuer-berufstaetige/` | `/vergleiche/beste-futterautomaten-fuer-berufstaetige/` |
| `/beste-futterautomaten-fuer-hunde/` | `/vergleiche/beste-futterautomaten-fuer-hunde/` |
| `/beste-futterautomaten-fuer-katzen/` | `/vergleiche/beste-futterautomaten-fuer-katzen/` |
| `/beste-futterautomaten-fuer-kleine-hunde/` | `/vergleiche/beste-futterautomaten-fuer-kleine-hunde/` |
| `/beste-futterautomaten-fuer-mehrtierhaushalte/` | `/vergleiche/beste-futterautomaten-fuer-mehrtierhaushalte/` |
| `/beste-futterautomaten-fuer-nassfutter/` | `/vergleiche/beste-futterautomaten-fuer-nassfutter/` |
| `/beste-futterautomaten-fuer-seniorenkatzen/` | `/vergleiche/beste-futterautomaten-fuer-seniorenkatzen/` |
| `/beste-futterautomaten-fuer-welpen/` | `/vergleiche/beste-futterautomaten-fuer-welpen/` |
| `/beste-futterautomaten-fuer-zwei-katzen/` | `/vergleiche/beste-futterautomaten-fuer-zwei-katzen/` |
| `/beste-futterautomaten-mit-akku/` | `/vergleiche/beste-futterautomaten-mit-akku/` |
| `/beste-futterautomaten-mit-edelstahl-napf/` | `/vergleiche/beste-futterautomaten-mit-edelstahl-napf/` |
| `/beste-futterautomaten-mit-kamera/` | `/vergleiche/beste-futterautomaten-mit-kamera/` |
| `/beste-futterautomaten-ohne-wlan/` | `/vergleiche/beste-futterautomaten-ohne-wlan/` |
| `/beste-futterautomaten-unter-100-euro/` | `/vergleiche/beste-futterautomaten-unter-100-euro/` |
| `/beste-gps-tracker-fuer-hunde/` | `/vergleiche/beste-gps-tracker-fuer-hunde/` |
| `/beste-gps-tracker-fuer-katzen/` | `/vergleiche/beste-gps-tracker-fuer-katzen/` |
| `/beste-trinkbrunnen-fuer-hunde/` | `/vergleiche/beste-trinkbrunnen-fuer-hunde/` |
| `/beste-trinkbrunnen-fuer-katzen/` | `/vergleiche/beste-trinkbrunnen-fuer-katzen/` |
| `/futterautomat-fuer-grosse-hunde/` | `/vergleiche/futterautomat-fuer-grosse-hunde/` |
| `/futterautomat-fuer-zwei-katzen/` | `/vergleiche/beste-futterautomaten-fuer-zwei-katzen/` |
| `/futterautomat-gegen-schlingen/` | `/vergleiche/futterautomat-gegen-schlingen/` |
| `/futterautomat-mit-app/` | `/vergleiche/futterautomat-mit-app/` |
| `/futterautomat-mit-kamera/` | `/vergleiche/beste-futterautomaten-mit-kamera/` |
| `/futterautomat-nassfutter/` | `/vergleiche/beste-futterautomaten-fuer-nassfutter/` |
| `/futterautomat-ohne-wlan/` | `/vergleiche/beste-futterautomaten-ohne-wlan/` |
| `/gps-tracker-mit-langer-akkulaufzeit/` | `/vergleiche/gps-tracker-mit-langer-akkulaufzeit/` |
| `/gps-tracker-ohne-abo/` | `/vergleiche/gps-tracker-ohne-abo/` |
| `/kleine-gps-tracker-fuer-katzen/` | `/vergleiche/kleine-gps-tracker-fuer-katzen/` |

## Migrierte und zusammengeführte Seiten

- Keine Migration in diesem Lauf

## Qualitativ vereinheitlichte Vergleichsseiten

- `/vergleiche/beste-futterautomaten-fuer-berufstaetige/`
- `/vergleiche/beste-futterautomaten-fuer-hunde/`
- `/vergleiche/beste-futterautomaten-fuer-katzen/`
- `/vergleiche/beste-futterautomaten-fuer-kleine-hunde/`
- `/vergleiche/beste-futterautomaten-fuer-mehrtierhaushalte/`
- `/vergleiche/beste-futterautomaten-fuer-nassfutter/`
- `/vergleiche/beste-futterautomaten-fuer-seniorenkatzen/`
- `/vergleiche/beste-futterautomaten-fuer-welpen/`
- `/vergleiche/beste-futterautomaten-fuer-zwei-katzen/`
- `/vergleiche/beste-futterautomaten-mit-akku/`
- `/vergleiche/beste-futterautomaten-mit-edelstahl-napf/`
- `/vergleiche/beste-futterautomaten-mit-kamera/`
- `/vergleiche/beste-futterautomaten-ohne-wlan/`
- `/vergleiche/beste-futterautomaten-unter-100-euro/`
- `/vergleiche/beste-gps-tracker-fuer-hunde/`
- `/vergleiche/beste-gps-tracker-fuer-katzen/`
- `/vergleiche/beste-trinkbrunnen-fuer-hunde/`
- `/vergleiche/beste-trinkbrunnen-fuer-katzen/`
- `/vergleiche/futterautomat-fuer-grosse-hunde/`
- `/vergleiche/futterautomat-gegen-schlingen/`
- `/vergleiche/futterautomat-mit-app/`
- `/vergleiche/gps-tracker-mit-langer-akkulaufzeit/`
- `/vergleiche/gps-tracker-ohne-abo/`
- `/vergleiche/kleine-gps-tracker-fuer-katzen/`

## Plattformweite Verbesserungen

- einheitliche Canonicals unter `/vergleiche/`
- ausschließlich indexierbare Vergleichszielseiten in der Sitemap
- Root-Aliase mit permanenten 301-Redirects
- gemeinsame Kurzantwort in der ComparisonShell
- konsistente Testsieger-, Preis-Leistungs- und Alternativenkennzeichnung
- mindestens sechs FAQ je Vergleich
- verpflichtende Abschnitte für Eignung, Methodik, Quellen und weiterführende Links
- vollständiger ItemList- und FAQ-Schema-Pfad über die zentrale Route
- aktualisierte interne Links in Content, Navigation, CTA-Modulen und Komponenten
- mobile Sprungnavigation, Sticky CTA und Dark-Mode-Unterstützung über die gemeinsame Shell

## Validierung

- Noch nicht ausgeführt

## Scope-Abgrenzung

Wissensartikel, Evergreenartikel, Kaufberater, Produktseiten und Herstellerseiten wurden inhaltlich nicht verändert. Dort wurden ausschließlich interne Links auf kanonische Vergleichsrouten aktualisiert.
