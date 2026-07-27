# PfotenTechnik Design-System Governance 11.6.0

## Aktueller Bestand

- CSS-Dateien: **28**
- CSS-Größe: **476.715 Bytes**
- `!important`-Regeln: **1310**
- `:root`-Blöcke: **23**
- harte Hex-Farben: **679**
- Media Queries: **169**

## Installierte Schutzmechanismen

- zentrales Kommando für alle Design-System-Audits
- CSS-Dateibudget
- Größenbudget mit vier Prozent Reserve
- keine neuen `!important`-Regeln
- keine zusätzlichen `:root`-Blöcke
- keine neuen harten Hex-Farben
- versionierte Baseline

## Zentrales Kommando

```bash
npm --workspace apps/pfotentechnik run design-system:check
```

## Baseline bewusst aktualisieren

Die Baseline soll nur angepasst werden, wenn eine geprüfte funktionale Erweiterung das Budget legitim erhöht. Sie befindet sich unter:

```text
apps/pfotentechnik/scripts/design-system/css-budget-baseline.json
```
