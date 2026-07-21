# PfotenTechnik Recommendation Engine 4.0.2 Safe

Diese Version korrigiert den Audit-Pfad.

## Ursache

`npm --workspace apps/pfotentechnik run audit:recommendations` startet das Audit mit
`apps/pfotentechnik` als Arbeitsverzeichnis. Der bisherige Audit ergänzte trotzdem
noch einmal `apps/pfotentechnik` und suchte dadurch in einem nicht existierenden
doppelten Pfad.

## Installation

```bash
python3 apply-pfotentechnik-recommendation-engine-4.0.2-safe.py
```

Der fehlgeschlagene Lauf hat automatisch vollständig zurückgerollt. Es ist keine
manuelle Bereinigung nötig.

Nach erfolgreicher Installation:

```bash
python3 apply-pfotentechnik-money-page-intent-hotfix-4.1-safe.py
```
