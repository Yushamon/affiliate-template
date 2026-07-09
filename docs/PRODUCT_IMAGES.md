# Produktbilder im Monorepo

Produktbilder liegen immer innerhalb der jeweiligen App:

```text
apps/<projekt>/public/images/products/<product-key>/
```

Der Ordnername entspricht dem stabilen Produkt- beziehungsweise URL-Key. Projektspezifische Bildrechte und Dateien bleiben damit von anderen Websites getrennt.

## Erlaubte Dateinamen

| Datei | Verwendung | Empfohlene Größe |
| --- | --- | --- |
| `hero.webp` | großes Bild auf Produktdetailseiten | 1400 × 1400 px |
| `thumbnail.webp` | RankingCards, ProductBoxen und Teaser | 800 × 800 px |
| `comparison.webp` | Vergleichstabellen und kompakte Vergleiche | 600 × 600 px |
| `gallery-1.webp` | optionales Detailbild | 1200 × 1200 px |
| `gallery-2.webp` | optionales Detailbild | 1200 × 1200 px |
| `gallery-3.webp` | optionales Detailbild | 1200 × 1200 px |

WebP ist das Standardformat. Bilder sollten einen ruhigen Hintergrund, genügend Rand um das Produkt und keine eingebetteten Preise, Rabatttexte oder fremden Wasserzeichen enthalten. Dateinamen werden nicht um Varianten wie `final`, `new` oder Datumsangaben erweitert.

## Erlaubte Quellen

- Hersteller-Pressebilder mit dokumentierter Nutzungserlaubnis
- offizielle Hersteller-Media-Kits
- eigene Produktfotos
- ordnungsgemäß lizenzierte Bilder
- später Bilder über die Amazon Product Advertising API unter deren Bedingungen

Die Bildquelle, Lizenz beziehungsweise Freigabe und das Abrufdatum sollten projektintern nachvollziehbar dokumentiert werden.

## Nicht erlaubte Quellen

- manuell heruntergeladene Amazon-Bilder
- aus der Google-Bildersuche kopierte Dateien
- blind von Hersteller- oder Händlerseiten gescrapte Bilder
- KI-generierte Bilder als Abbildung eines konkreten Produkts
- Bilder ohne nachvollziehbare Nutzungsrechte

## Neues Produktbild hinterlegen

1. Den passenden Ordner unter `public/images/products/<product-key>/` öffnen oder anlegen.
2. Nur rechtlich freigegebene Dateien mit den standardisierten Namen ablegen.
3. Das Bild auf korrekten Ausschnitt, Farbraum und angemessene Dateigröße prüfen.
4. Die projektspezifische `products.ts` bleibt unverändert, sofern die
   Standarddateinamen verwendet werden.
5. Beide App-Builds ausführen und Produktdetail-, Ranking- und Vergleichsansicht prüfen.

Der Core erzeugt die Standardpfade aus dem Produkt-Key. Kann der Browser eine
Datei nicht laden, probiert die gemeinsame Bildkomponente nacheinander das
Legacy-Feld `image` und `projectImages.product`. Dafür sind keine
Dateisystemzugriffe zur Laufzeit erforderlich.

## Optionale Überschreibung in `products.ts`

Das Bildmodell ist optional und wird nur benötigt, wenn ein Produkt von der
Standardkonvention abweicht. Ein manuell gesetzter Pfad hat weiterhin Vorrang:

```ts
{
  image: "/images/project/pfotentechnik/product.webp",
  images: {
    hero: "/images/products/beispiel-produkt/hero.webp",
    thumbnail: "/images/products/beispiel-produkt/thumbnail.webp",
    comparison: "/images/products/beispiel-produkt/comparison.webp",
    gallery: [
      "/images/products/beispiel-produkt/gallery-1.webp",
      "/images/products/beispiel-produkt/gallery-2.webp"
    ]
  }
}
```

Ein unvollständiges Objekt ist zulässig:

```ts
images: {
  thumbnail: "/images/products/beispiel-produkt/thumbnail.webp"
}
```

## Prioritäten im Core

- Ranking und Teaser: `images.thumbnail` → automatisches `thumbnail.webp` → `image` → Projektfallback
- Produktdetail: `images.hero` → automatisches `hero.webp` → `image` → Projektfallback
- Vergleich: `images.comparison` → automatisches `comparison.webp` → `image` → Projektfallback
- Galerie: `images.gallery` → automatische Pfade `gallery-1.webp` bis `gallery-3.webp`

Die Helfer in `packages/affiliate-core/src/utils/productImages.ts` erzeugen die
Pfade ausschließlich aus Produktdaten und ProductKey. Sie führen zur Laufzeit
keine Dateisystemzugriffe aus. `ProductImage.astro` verarbeitet Ladefehler im
Browser und wechselt dann zum nächsten Kandidaten.
