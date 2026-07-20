# PfotenTechnik UI Fix 3.6.5

## Korrekturen

### A – durchgängiger Hintergrund

Der Wrapper `.product-review-v4` wurde in einem früheren Dark-Mode-Patch selbst als dunkle Karte gestaltet. Dadurch entstand hinter mehreren Produktabschnitten ein durchgehender andersfarbiger Mittelstreifen.

3.6.5 setzt den Wrapper und die Abschnittscontainer wieder transparent. Nur echte Karten behalten eine dunkle Oberfläche.

### B – Vergleichsbilder

Ohne neue Bilddateien:

- große weiße Bildfläche entfernt
- neutraler, dezenter Bildhintergrund
- kompakter Innenabstand
- festes Seitenverhältnis
- `object-fit: cover`
- leichter Zoom gegen eingebettete weiße Ränder
- saubere Rundung
- mobile Darstellung über der Karteninformation

## Installation

```bash
node pfotentechnik-ui-fix-3.6.5/install-ui-fix-3.6.5.mjs
npm run build:pfotentechnik
```

Danach Dev-Server neu starten:

```bash
npm run dev:pfotentechnik
```

## Rollback

```bash
node pfotentechnik-ui-fix-3.6.5/rollback-ui-fix-3.6.5.mjs
```
