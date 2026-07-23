# PfotenTechnik Quick Facts Responsive 2.5

Der Patch verbessert alle Produktseiten mit einem Abschnitt
„Das Wichtigste in Kürze“, unabhängig von der Länge und Anzahl der Einträge.

## Verhalten

- Texte werden nie abgeschnitten oder mit Ellipse gekürzt.
- `Kapazität`, `Einsatz` und `Geeignet für` werden als größere Primärinformationen dargestellt.
- Alle übrigen Fakten landen in einem flexiblen, responsiven Raster.
- Für bekannte Datentypen werden passende SVG-Icons verwendet.
- Lange Werte vergrößern ihre Karte automatisch.
- Die technischen Daten zeigen Eignungstexte ebenfalls vollständig.
- Mobile Darstellung: eine Karte pro Zeile.
- Tablet: zwei Spalten.
- Desktop: Primärinformationen getrennt, übrige Fakten flexibel.
- Light Mode und Dark Mode werden unterstützt.

## Installation

ZIP entpacken und im Repository-Root ausführen:

```bash
node <entpackter-ordner>/install.mjs
```

Der Installer erstellt ein Backup, prüft den Build und führt bei einem Fehler
automatisch ein Rollback durch.
