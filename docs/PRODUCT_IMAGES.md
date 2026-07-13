# Produktbilder im Monorepo

Produktbilder einer PfotenTechnik-Content-Datei liegen unter:

```text
apps/pfotentechnik/src/assets/images/products/<product-slug>/
```

Der Ordnername entspricht dem stabilen Produkt-Slug.

## Standarddateien

| Datei | Verwendung | Empfohlene Quellgröße |
| --- | --- | --- |
| `hero.webp` | Hauptansicht der Produktseite | 1200 × 800 px oder größer, 3:2 |
| `thumbnail.webp` | optionaler quadratischer Kartenausschnitt | 600 × 600 px oder größer |
| `comparison.webp` | optionaler Vergleichsausschnitt | 800 × 600 px oder größer |
| `gallery-1.webp` | reale Anwendungssituation | 1200 × 800 px oder größer, 3:2 |
| `gallery-2.webp` | funktionaler Ausschnitt, etwa Befüllung oder Bedienung | 1200 × 800 px oder größer, 3:2 |
| `gallery-3.webp` | weiterer Detailbereich, etwa Reinigung, Ausgabe oder Stromversorgung | 1200 × 800 px oder größer, 3:2 |

Thumbnail und Vergleich sind optional. Fehlen sie, verwendet die Darstellung das Hero-Bild und Astro erzeugt den passenden Ausgabeausschnitt.

## Galerie-Regel

`gallery-1` bis `gallery-3` sind keine Kopien oder bloßen Zuschnitte des Hero-Bildes. Sie zeigen unterschiedliche Situationen und Details. Auch die Galerieaufnahmen untereinander dürfen nicht identisch sein.

Geeignete Kombination:

1. Produkt mit dem passenden Tier in einer realistischen Nutzungssituation.
2. Nahaufnahme von Behälter, Deckel, Steuerung oder Befüllung.
3. Nahaufnahme von Ausgabe, Napf, Reinigung, RFID-Zugang oder Stromversorgung.

## Frontmatter

```yaml
images:
  hero:
    src: "../../assets/images/products/beispiel/hero.webp"
    alt: "Beispiel-Futterautomat als Hauptansicht"
  gallery:
    - src: "../../assets/images/products/beispiel/gallery-1.webp"
      alt: "Beispiel-Futterautomat mit Hund beim Fressen"
    - src: "../../assets/images/products/beispiel/gallery-2.webp"
      alt: "Geöffneter Futterbehälter beim Nachfüllen"
    - src: "../../assets/images/products/beispiel/gallery-3.webp"
      alt: "Ausgabeschacht und Edelstahlnapf im Detail"
```

Die Collection löst diese Pfade mit `image()` zu `ImageMetadata` auf. Seiten und Komponenten rendern sie mit `astro:assets`; es werden keine öffentlichen Bildpfade in `products.ts` ergänzt.

## Quellen und Kennzeichnung

Zulässig sind eigene Fotos, lizenzierte Bilder, freigegebene Hersteller-Medien und redaktionell erstellte Darstellungen. Quelle, Freigabe und Abrufdatum sollen intern nachvollziehbar sein. Nicht zulässig sind kopierte Amazon- oder Google-Bilder und fremde Wasserzeichen.

Eine KI-erstellte produktspezifische Darstellung darf nicht als offizielles Herstellerfoto ausgegeben werden. Alttext und Begleittext müssen bei Bedarf klar machen, dass es eine redaktionelle Darstellung ist.

## Prüfung

1. Existenz aller im Frontmatter referenzierten Dateien prüfen.
2. Hero- und Galerie-Hashes auf Duplikate prüfen.
3. Tierart und Motiv gegen Seitenthema prüfen.
4. `npm run build:pfotentechnik` ausführen.
5. Produktseite und Vergleichskarte mobil sowie auf Desktop prüfen.
