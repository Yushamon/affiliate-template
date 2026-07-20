# PfotenTechnik UI Polish 4.1 – Komponentenbereinigung

## Ziel

Die sichtbaren Korrekturen aus UI Polish 4.0.1 werden nicht länger nur als globale CSS-Overrides gepflegt. Die finalen Styles liegen direkt bei den Komponenten, die sie verwenden.

## Migrierte Komponenten

### PremiumRenderer

- PfotenTechnik-spezifische Scope-Klasse
- Icon-Badges
- Überschriften und Eyebrows
- Quick-Facts-Auswahlkarten
- Produktkarten
- CTA-Zeilen
- Dark Mode
- Mobile Layout
- Reduced Motion

### HealthBridge

- vollständiger Light- und Dark-Mode-Stil
- eigener Komponenten-Farbvertrag
- mobile Abstände
- CTA-Darstellung

### ConversionJourney

- Light und Dark Mode direkt in der Komponente
- Kartenraster
- Typografie
- responsive Darstellung

### ProductTrustPanel

- nutzerfreundlicher Text
- keine Kachel `Praxistest – Nicht behauptet`
- Bewertungsgrundlage und Prüfdatum
- Light und Dark Mode direkt in der Komponente

## Globale Bereinigung

Der vollständig migrierte Block

```text
PfotenTechnik UI Polish 4.0.1 Corrective
```

wird aus `pfotentechnik-design-system.css` entfernt.

Die breiteren 3.6.x- und 4.0-Regeln für Home, Vergleich, Produktseiten und Hersteller bleiben vorerst bestehen. Sie werden erst in 4.2 entfernt, nachdem ihre Zielkomponenten ebenfalls eigene finale Styles erhalten haben.

## Audit

Der Installer erstellt:

```text
apps/pfotentechnik/UI_POLISH_4_1_AUDIT.json
```

Darin stehen:

- verbleibende Patchmarker
- noch vorhandene globale Selektoren der migrierten Komponenten
- Umfang der nächsten Bereinigungsstufe

## Installation

```bash
node pfotentechnik-ui-polish-4.1-component-cleanup/install-ui-polish-4.1.mjs
npm run build:pfotentechnik
```

Danach:

```bash
npm run dev:pfotentechnik
```

Zu prüfen:

- `/futterautomat-katze/`
- `/trinkbrunnen/`
- eine Produktseite mit Trust Panel
- Conversion Journey am Seitenende

## Rollback

```bash
node pfotentechnik-ui-polish-4.1-component-cleanup/rollback-ui-polish-4.1.mjs
```
