# PfotenTechnik GPS Discoverability & Data Model 1.0

Dieser Patch setzt die Punkte 1 und 2 des GPS-Audits um.

## GPS Discoverability

- GPS-Tracker in der Hauptnavigation
- Homepage-GPS-Kachel verlinkt auf `/gps-tracker/`
- Schnelleinstiege für Hunde- und Katzen-GPS
- GPS-Tracker im Footer

## Strukturiertes GPS-Datenmodell

- neues optionales `gps`-Objekt im Produktschema
- Migration der acht GPS-Produkte
- GPS-Vergleichsfilter priorisieren strukturierte Daten
- bestehende `specs` bleiben als kompatibler Fallback erhalten
- neuer Cluster-Audit `audit:gps`

## Anwendung

```bash
python3 apply-pfotentechnik-gps-discoverability-data-model-1.0.py
npm --workspace apps/pfotentechnik run audit:gps
npm --workspace apps/pfotentechnik run audit:repository
npm run build:pfotentechnik
```

Der Installer erstellt vor jeder Änderung ein Backup.
