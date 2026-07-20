# PfotenTechnik UI Polish 4.0.1

Korrigiert die erste UI-Polish-Version anhand der tatsächlich gerenderten Komponenten.

## Änderungen

### Premium-Icons

- verwendet die echte Klasse `.premium-v3-header-icon`
- Icon steht als kompakter Badge direkt neben Eyebrow und Überschrift
- mobil 40 px, Desktop 44 px
- Dark Mode vollständig unterstützt

### Drei passende Ansätze

- echte Klasse `.premium-v3-grid-quickFacts`
- konsistente, linksbündige Auswahlkarten
- alle drei Karten sind anklickbar
- sichtbare CTA-Zeile mit Pfeil
- Allrounder führt zum Granary WiFi
- Kompakt führt zum Fresh Element Solo
- Nassfutter führt zum bestehenden Ratgeber
- keine mitten im Satz schwebenden Chips mehr

### Gesundheitsratgeber

- verwendet die tatsächliche Klasse `.pt-health-bridge`
- weißer Hintergrund im Dark Mode entfernt
- dunkler grün-blauer Verlauf
- helle Überschrift und lesbarer Text
- mobil kompakter

## Installation

```bash
node pfotentechnik-ui-polish-4.0.1/install-ui-polish-4.0.1.mjs
npm run build:pfotentechnik
```

Danach Dev-Server vollständig neu starten.

## Rollback

```bash
node pfotentechnik-ui-polish-4.0.1/rollback-ui-polish-4.0.1.mjs
```
