# PfotenTechnik UI Polish 5.0 – Editorial Renderer

Der Patch wertet bestehende `premiumBlocks` zentral auf. Keine Markdown-Datei wird verändert.

## Mobile-first Layouts

- `answer`: Spotlight
- `quickFacts`: nummerierte Karten, Desktop-Bento
- `scenarios`: Editorial Stories
- `decision`: nummerierter Prozess
- `checks`: Qualitätsband
- `mistakes`: Warnkarten
- `products`: mobil Swipe-Reihe, Desktop Grid

## Voraussetzung

UI Polish 4.1 und 4.1.1 müssen installiert sein.

## Installation

```bash
node pfotentechnik-ui-polish-5.0-editorial-renderer/install-ui-polish-5.0.mjs
npm run build:pfotentechnik
```

Danach Dev-Server neu starten.

## Prüfen

- `/trinkbrunnen/`
- `/futterautomat-katze/`
- `/smarte-futterautomaten/`

Breiten: 360, 390, 430, 768, 1024 und 1440 px.

## Rollback

```bash
node pfotentechnik-ui-polish-5.0-editorial-renderer/rollback-ui-polish-5.0.mjs
```
