# pfotentechnik-feeder-journey-closure-27.1.0

Schließt genau drei offene Pflichtkanten:

1. Auswahlhilfe → Akkuvergleich
2. Auswahlhilfe → App-Vergleich
3. Mehrtiervergleich → SureFeed

Der Installer prüft nach allen Audits und nach dem Build in einem frischen
Node-Prozess, dass `futterautomaten-consolidate` nicht mehr erzeugt wird.
Zusätzlich muss ein simulierter zweiter Lauf ohne Dateiänderung enden.

Ausführen:

```bash
node 3/apply-pfotentechnik-feeder-journey-closure-27.1.0.mjs
```
