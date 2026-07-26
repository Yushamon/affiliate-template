# PfotenTechnik Mobile Product Layout 4.0.2

Kumulative Korrektur für Version 4.0.1.

## Korrigiert

- übermäßiger Leerraum zwischen Mobile-Header und Produktgalerie
- verschobene Hauptbilder bei wechselnden Bildformaten
- links ausgerichtete Thumbnail-Gruppe mit ungenutztem Platz rechts
- unterschiedlich wirkende aktive und inaktive Thumbnail-Flächen

## Neue Galeriegeometrie

- Seitenstart: 14 bis 20 Pixel statt 76 bis 88 Pixel Zusatzabstand
- Galerie-Stage: stabile 4:3-Achse
- Hauptbild: `object-fit: contain` und exakt zentrierte Position
- keine erzwungene viewportabhängige Bildhöhe mehr
- vier Thumbnails teilen sich die vollständige Galeriebreite
- weitere Thumbnails bleiben horizontal scrollbar
- aktiver Rahmen verändert die Elementgröße nicht

Der Vergleichspreis-Fix und der Windows-Installer-Fix aus Version 4.0.1 sind
weiterhin vollständig enthalten.

## Installation

```powershell
node .\pfotentechnik-mobile-product-layout-4.0.2\install.mjs --repo C:\hp\Projekt\affiliate-template
```

Version 4.0.2 kann direkt über eine installierte Version 4.0.1 installiert
werden.

## Rollback

```powershell
node .\pfotentechnik-mobile-product-layout-4.0.2\rollback.mjs --repo C:\hp\Projekt\affiliate-template
```
