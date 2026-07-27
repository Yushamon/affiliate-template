# PfotenTechnik Price Alignment & Consistency 13.1.0

Dieser Installer behebt die Preisdarstellung auf Produkt- und Vergleichsseiten:

- Preisbeträge werden rechts ausgerichtet.
- „Zuletzt geprüft“ und vergleichbare Datumszeilen verschwinden aus der Preis-UI.
- Produktseite und Vergleich verwenden dieselbe Cent-Formatierung.
- In mobilen Vergleichslisten steht der Preis direkt oberhalb der CTA-Zeile.
- Empfehlungskarten halten Preis und CTAs am unteren Kartenende.
- Bestehende Light- und Dark-Mode-Tokens bleiben erhalten.

## Installation

ZIP in das Repository `affiliate-template` entpacken und im Repository ausführen.

### macOS / Linux

```bash
node pfotentechnik-price-alignment-consistency-13.1.0.mjs
```

### Windows PowerShell

```powershell
node .\pfotentechnik-price-alignment-consistency-13.1.0.mjs
```

Der Installer erstellt Backups unter `.patch-backups`, führt die Preis-UI-Tests aus und startet anschließend `npm run build:pfotentechnik`.

## Optionen

```bash
node pfotentechnik-price-alignment-consistency-13.1.0.mjs --check
node pfotentechnik-price-alignment-consistency-13.1.0.mjs --no-build
node pfotentechnik-price-alignment-consistency-13.1.0.mjs --commit
```

`--commit` erstellt nur einen lokalen Commit. Es wird nichts gepusht.
