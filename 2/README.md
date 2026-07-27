# PfotenTechnik Content + UI Polish 4.3.0

Kumulativer Folgepatch für Vergleichsseiten, Startseite und FAQ.

## Änderungen

### Doppelte Vergleichsempfehlungen

Vergleichsseiten besitzen bereits Gewinner-, Empfehlungs- und Szenariokarten.
Der zusätzliche Markdown-Abschnitt `Unsere Empfehlungen nach Aufgabe` wiederholt
diese Auswahl. Der Installer entfernt ausschließlich diesen Abschnitt bis zur
nächsten H2. Die `Schnellentscheidung` bleibt erhalten.

### Neue Note auf der Startseite

Die Empfehlungskarten wechseln von `variant="compact"` zu
`variant="ring-compact"`. Produktseite, Vergleich und Startseite verwenden
damit dieselbe visuelle Bewertungssprache.

### Kompaktere FAQ

Geschlossene FAQ-Einträge erhalten:

- 56 bis 58 Pixel Höhe
- weniger Padding
- 16 Pixel Radius
- Chevron rechts
- keine großen leeren Kartenflächen
- vollständige Antwort erst im geöffneten Zustand

Das gilt für das allgemeine FAQ-System und das Produktseiten-FAQ.

### Weitere Korrekturen

- mobile Vergleichsseiten erhalten ausreichend Abstand zur Sticky Bar
- Startseiten-Produktaktion wird als leichte Textaktion mit Pfeil dargestellt
- Dark Mode und Reduced Motion sind berücksichtigt

## Geänderte Dateien

```text
apps/pfotentechnik/src/layouts/ProjectLayout.astro
packages/affiliate-core/src/components/home/HomeSection.astro
apps/pfotentechnik/src/styles/pfotentechnik-content-ui-polish.css
apps/pfotentechnik/src/content/comparisons/*.md
```

Bei Vergleichsdateien werden nur Kapitel mit der exakten Überschrift
`Unsere Empfehlungen nach Aufgabe` oder `Empfehlungen nach Aufgabe` entfernt.

## Installation

```powershell
node .\pfotentechnik-content-ui-polish-4.3.0\install.mjs --repo C:\hp\Projekt\affiliate-template
```

## Optional ohne Baseline-Build

```powershell
node .\pfotentechnik-content-ui-polish-4.3.0\install.mjs --repo C:\hp\Projekt\affiliate-template --skip-baseline
```

Der Abschluss-Build wird immer ausgeführt.

## Rollback

```powershell
node .\pfotentechnik-content-ui-polish-4.3.0\rollback.mjs --repo C:\hp\Projekt\affiliate-template
```
