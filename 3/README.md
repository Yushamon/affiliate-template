# PfotenTechnik Quick Facts Framework 3.0

Dieser Patch ersetzt den bisherigen JavaScript-DOM-Enhancer durch eine native
Astro-Implementierung direkt im `ProductRenderer`.

## Verbesserungen

- keine nachträgliche DOM-Manipulation
- kein MutationObserver
- keine `:global(...)`-Warnungen
- keine abgeschnittenen Texte
- `Kapazität`, `Einsatz` und `Geeignet für` als separate Primärkarten
- übrige Angaben als adaptives technisches Raster
- semantische SVG-Icons
- automatische Kartenhöhe nach Inhalt
- Desktop: drei Primärkarten plus flexibles Datenraster
- Tablet: Primärkarten untereinander, technische Daten zweispaltig
- Mobile: alle Karten einspaltig
- Dark Mode über bestehende Product-Renderer-Variablen
- alter `ProductQuickFactsEnhancer` wird entfernt

## Installation

ZIP entpacken und im Repository-Root ausführen:

```bash
node <entpackter-ordner>/install.mjs
```

Der Installer legt ein Backup an, prüft den Build und rollt bei Fehlern
automatisch zurück.
