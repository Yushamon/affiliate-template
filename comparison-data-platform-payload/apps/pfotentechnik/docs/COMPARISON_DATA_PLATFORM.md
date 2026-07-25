# Comparison Data Platform

Die Produktdateien sind die zentrale Datenquelle für Vergleichstabellen.

## Quellenreihenfolge

1. `items[].overrides`
2. veraltete `items[].values` als Kompatibilitätsfallback
3. `criteria[].source`
4. `product.comparisonData.custom`
5. übrige strukturierte `product.comparisonData`-Felder
6. strukturierte Produktfelder wie `comparisonFilters` und `gps`
7. `specs` über normalisierte Kriterien-Aliase
8. `fallback` oder `–`

## Schlanke Vergleichsseite

```yaml
criteria:
  - key: "kuehlung"
    label: "Kühlung"
  - key: "mahlzeiten"
    label: "Mahlzeiten"
  - key: "app"
    label: "App"

items:
  - slug: "petlibro-polar-wet-food-feeder"
    type: "product"
    recommendation: "Beste aktive Kühlung"

  - slug: "cat-mate-c500"
    type: "product"
    recommendation: "Beste lokale Zeitsteuerung"
```

## Produktdaten

```yaml
comparisonData:
  version: 1
  feeder:
    coolingType: "thermoelectric"
    mealCount: 3
  custom:
    kuehlung: "Aktive thermoelektrische Kühlung"
    mahlzeiten: "3 Fächer mit je 200 ml"
```

`custom` dient der kontrollierten Migration bestehender Vergleichswerte. Neue Produktdaten sollten nach Möglichkeit in `general`, `feeder`, `fountain`, `gps` oder `editorial` gepflegt werden.

## Overrides

Nur kontextabhängige redaktionelle Aussagen gehören in die Vergleichsseite:

```yaml
items:
  - slug: "cat-mate-c500"
    type: "product"
    overrides:
      profil: "Beste Offline-Lösung in diesem Vergleich"
      grenze: "Kühlakkus sind keine aktive Kühlung"
```

## Befehle

```bash
npm run comparison:data:migrate:check
npm run comparison:data:migrate
npm run comparison:data:audit
npm run comparison:data:audit:strict
npm run comparison:data:test
```
