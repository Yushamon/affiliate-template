# PfotenTechnik Homepage V5

Erstellt: **2026-07-16 20:20:50 CEST**

## Ziel

Die Startseite wurde von doppelten und konkurrierenden Einstiegen bereinigt. Der direkte Vergleichseinstieg übernimmt allein die Vergleichsnavigation.

## Neue Reihenfolge

1. Hero
2. Direkter Einstieg in vier Vergleiche
3. Produktempfehlungen
4. Neue Ratgeber
5. Recherche- und Bewertungsmethodik
6. Auswahl nach Alltagssituation
7. Kennzahlen und redaktionelle Haltung
8. Zuletzt aktualisierte Inhalte
9. Transparenz-FAQ
10. Themenübersicht
11. Markenabschluss

## Bewusst entfernt

- zweiter Block „Vergleiche mit klaren Unterschieden“
- große Produktwelten-Sektion, da Einsatzszenarien und Themenübersicht dieselbe Navigationsaufgabe bereits abdecken

Die Daten bleiben im Modell vorhanden. Es wird nur vermieden, sie auf der Startseite mehrfach auszuspielen.

## Vollständige Ersatzdateien

Das ZIP enthält den vollständigen V4.1-Dateisatz mit der neuen V5-Komposition. Wichtigste Änderungen:

```text
packages/affiliate-core/src/components/home/HomePage.astro
packages/affiliate-core/src/components/home/home.css
```

## Build

```bash
rm -rf apps/pfotentechnik/dist apps/pfotentechnik/.astro
npm run build:pfotentechnik
npm run preview:pfotentechnik
```
