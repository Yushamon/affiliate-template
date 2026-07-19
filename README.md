# Conversion Framework 4 – Journey Installer

Robuster, idempotenter Installer für Teil 4.

## Installation

Den Ordner in den Repository-Root entpacken und ausführen:

```bash
node conversion-framework-4-journey-installer/install-journey.mjs
npm run build:pfotentechnik
```

## Rollback

```bash
node conversion-framework-4-journey-installer/rollback-journey.mjs
```

## Enthalten

- neue Komponente `ConversionJourney.astro`
- Journey auf Produktseiten
- Journey auf Vergleichsseiten
- Journey auf Ratgeberseiten
- automatische Backups
- wiederholbare Installation ohne doppelte Blöcke

Der Installer verwendet stabile Import- und Komponentenanker statt fester Zeilennummern.
