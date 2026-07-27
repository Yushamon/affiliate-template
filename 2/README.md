# PfotenTechnik Comparison CTA + Price Polish 3.3.5

Kumulativer Folgepatch für die mobile Vergleichsdarstellung.

## Ziel

- Preisblock im Vergleich ruhiger darstellen
- Preislabel und Betrag sauber ausrichten
- Statusbadge sinnvoll anbinden
- CTA-Reihe hochwertiger und konsistenter wirken lassen
- Primär- und Sekundär-CTA klarer hierarchisieren
- unter 380 px sauber umbrechen

## Geänderte Datei

```text
packages/affiliate-core/src/components/comparison/comparison-mobile-price-fix-4.0.1.css
```

## Installation

Voraussetzung: `pfotentechnik-mobile-product-layout-4.0.2` ist bereits installiert,
weil dieser Patch die dort eingeführte CSS-Datei gezielt weiter verfeinert.

```powershell
node .\pfotentechnik-comparison-cta-price-3.3.5\install.mjs --repo C:\hp\Projekt\affiliate-template
```

## Rollback

```powershell
node .\pfotentechnik-comparison-cta-price-3.3.5\rollback.mjs --repo C:\hp\Projekt\affiliate-template
```
