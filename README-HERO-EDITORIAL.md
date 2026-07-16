# PfotenTechnik Hero Editorial Update

Erstellt: 2026-07-16 18:50:55 CEST

## Vollständige Ersatzdateien

```text
packages/affiliate-core/src/components/home/HomeHero.astro
packages/affiliate-core/src/components/home/home.css
apps/pfotentechnik/src/domain/home/buildHomepageModel.ts
```

## Änderungen

- Kennzahlen aus dem Hero entfernt, da sie weiter unten erneut erscheinen
- mobile Hero-Höhe reduziert
- Bildfokus stärker auf den unteren Bildbereich mit Hund und Katze gelegt
- Overlay oben transparenter und im Textbereich dunkler
- Überschrift etwas kleiner und ruhiger
- Hauptbutton klar priorisiert
- Trust-Aussagen als kompakte, halbtransparente Badges
- auf sehr schmalen Geräten stehen die Buttons untereinander

## Kontrolle

```bash
grep -n "home3-stats" packages/affiliate-core/src/components/home/HomeHero.astro
```

Dieser Befehl darf keinen Treffer liefern.

```bash
grep -n "min-height: 590px" packages/affiliate-core/src/components/home/home.css
grep -n "object-position: 58% 62%" packages/affiliate-core/src/components/home/home.css
```

Danach:

```bash
rm -rf apps/pfotentechnik/dist apps/pfotentechnik/.astro
npm run build:pfotentechnik
npm run preview:pfotentechnik
```
