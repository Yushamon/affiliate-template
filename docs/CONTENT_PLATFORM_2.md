# PfotenTechnik Content Platform 2.0

Die Plattform reduziert wiederkehrendes Frontmatter, ohne fachliche Inhalte
automatisch zu erfinden.

## Kompaktes Frontmatter

```yaml
contentPlatform:
  version: 2
  cluster: smart-feeders
  intent: buying-guide
  animal: cat
  products:
    - surefeed-microchip-pet-feeder
    - petlibro-granary-camera-feeder
  summary:
    - Zugangskontrolle verhindert Futterdiebstahl.
    - Zwei offene Näpfe lösen Futterneid nicht automatisch.
  suitableFor:
    - Haushalte mit unterschiedlichen Futtermengen
  notSuitableFor:
    - vollständig unbeaufsichtigte Langzeitversorgung
  checklist:
    - Zugang je Tier prüfen
    - Notstrom und Offline-Verhalten testen
  mistakes:
    - Nur nach Behältergröße auswählen
```

## Automatische Standardwerte

Aus `cluster` werden Kategorie, sichtbares Label und Kategoriepfad abgeleitet.
Aus `intent` werden Theme und Blockreihenfolge abgeleitet.
Aus `products` entstehen Empfehlungskarten, Vergleichstabelle und Standard-CTA.

## Cluster

- `smart-feeders`
- `water-fountains`
- `dog-feeding`
- `cat-feeding`
- `dog-health`
- `cat-health`

## Intents

- `informational`
- `buying-guide`
- `comparison-support`
- `troubleshooting`
- `how-to`
- `health-guide`

## Blocks

- `summary`
- `recommendation`
- `comparison`
- `fit`
- `checklist`
- `mistakes`

Ein Block erscheint nur, wenn die benötigten Daten vorhanden sind.

## Abwärtskompatibilität

Bestehende Felder bleiben gültig und haben Vorrang:

- `category`
- `categoryLabel`
- `categoryPath`
- `decisionKey`
- `comparisonProducts`
- `themeColor`
- `closingCta`
- `faq`

## FAQ

Die Plattform generiert keine fachlichen Antworten. Bestehende FAQ bleiben
erhalten. Mit `faqMode: none` lassen sie sich deaktivieren.

## CTA

Bei hinterlegten Produkten wird ein zurückhaltender Abschluss-CTA erzeugt.
Mit `cta.mode: off` wird er deaktiviert. Bestehende `closingCta`-Daten gewinnen.

## Migration

1. `contentPlatform` ergänzen.
2. Build ausführen.
3. Seite visuell prüfen.
4. Redundante alte Felder erst danach entfernen.

Eine sofortige Massenmigration ist nicht erforderlich.
