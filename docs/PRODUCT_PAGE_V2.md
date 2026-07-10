# Product Page V2

Status: Geplant

Priorität: Nach Abschluss von Sprint "Product Expansion"

---

# Ziel

Die Produktseite entwickelt sich von einem klassischen Testbericht zu einer modernen Produktdetailseite eines Fachportals.

Ziel ist es,

• die Kaufentscheidung möglichst schnell zu unterstützen
• den Testbericht weiterhin vollständig bereitzustellen
• vorhandene Produktdaten besser zu präsentieren
• Conversion und Nutzererlebnis zu verbessern

Keine neue Architektur.

Es werden ausschließlich bestehende Produktdaten besser dargestellt.

---

# Aufbau

## Bereich 1

Hero

Enthält

• Bildergalerie
• Produktname
• Kurzbeschreibung
• Bewertung
• Preis
• CTA
• Key Facts

---

## Bereich 2

Kaufentscheidung

Vier Karten

• Vorteile
• Nachteile
• Geeignet für
• Weniger geeignet für

Wichtig:

"Weniger geeignet für" basiert nicht auf den Nachteilen.

Hierfür erhält das Produktmodell ein eigenes Feld.

```ts
idealFor: []

notIdealFor: []
```

Dadurch werden Dopplungen vermieden.

---

## Bereich 3

Technische Daten

Automatisch aus dem Produktmodell.

---

## Bereich 4

Vergleich

Automatisch erzeugt

• ähnliche Produkte
• günstigere Alternative
• Premium Alternative
• Bestseller

---

## Bereich 5

Testbericht

Redaktioneller Inhalt

Beispiele

• Verarbeitung
• Einrichtung
• App
• Alltag
• Reinigung
• Erfahrungen
• Fazit

---

# Bilder

Produktbilder werden automatisch geladen.

Reihenfolge

hero.webp

gallery-1.webp

gallery-2.webp

gallery-3.webp

gallery-4.webp

Nur vorhandene Bilder werden verwendet.

Keine Platzhalter.

Keine leeren Slider.

---

# Produktmodell

Geplante Ergänzungen

price

lifecycle

idealFor

notIdealFor

---

# Design

Mobile First

Desktop erweitert lediglich die mobile Ansicht.

Große Bilder.

Klare Kaufentscheidung.

Kurze Informationswege.

---

# Nicht Bestandteil

Keine neue Product Engine

Keine neue Renderer

Keine Framework-Erweiterungen

Keine zusätzliche Datenhaltung

---

# Zielbild

Ein Besucher soll innerhalb von 20 bis 30 Sekunden entscheiden können,

ob das Produkt für ihn geeignet ist.

Der vollständige Testbericht bleibt darunter verfügbar.

Dadurch werden sowohl Suchintention als auch Kaufintention optimal erfüllt.