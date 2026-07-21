# PfotenTechnik Editorial Design System 6.0.2

Gemeinsamer Fix für:

- mobile Grid- und Listenfehler aus 6.0.1
- verzerrte oder zu große Produktbilder
- inkonsistente Produktkartenhöhen

## Ursache der Bildfehler

`OptimizedImage` verwendet standardmäßig:

```astro
fit="cover"
```

Die Produktkarten übergaben bisher kein eigenes `fit`.

Gleichzeitig erzwangen die Karten:

```css
picture,
img {
  width: 100%;
  height: 100%;
}
```

Bei unterschiedlich geschnittenen Produktbildern führte das zu:

- Vergrößerung
- Beschnitt
- verzerrtem Eindruck
- überdominanten Bildflächen

## Bildkorrektur

Die Produktkarte verwendet jetzt explizit:

```astro
width={480}
height={300}
layout="constrained"
fit="contain"
position="center"
```

Zusätzlich:

- kompakte Medienfläche im Format 16:10
- mobil 16:9
- Produkt maximal 70–76 % der Medienfläche
- automatische Breite und Höhe
- keine künstliche Vollhöhe
- keine Transformation
- neutraler heller Produkthintergrund
- responsive `sizes`

## Enthaltene Layoutkorrekturen

6.0.2 enthält den vollständigen Funktionsumfang von 6.0.1:

- stabile Marker- und Textspalten
- keine buchstabenweisen Umbrüche
- mobile Karten außer Produkt-Swipe einspaltig
- Entscheidung, Checks, Checklist und Produkt-Highlights repariert
- interne Links bleiben im Textwrapper

6.0.1 muss nicht separat installiert werden.

## Installation

```bash
node pfotentechnik-editorial-design-system-6.0.2-combined-fix/install-editorial-design-system-6.0.2.mjs
npm run build:pfotentechnik
```

Danach den Dev-Server vollständig neu starten.

## Prüfen

```text
/trinkbrunnen/
/futterautomat-katze/
/smarte-futterautomaten/
```

Auf Produktkarten achten:

- Produkt vollständig sichtbar
- keine abgeschnittenen Seiten
- keine Streckung
- ausreichend Rand um das Produkt
- Bildfläche nicht höher als der Textbereich

## Rollback

```bash
node pfotentechnik-editorial-design-system-6.0.2-combined-fix/rollback-editorial-design-system-6.0.2.mjs
```
