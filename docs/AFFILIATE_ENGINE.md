# Affiliate Engine V1

Die Affiliate Engine ist die zentrale Linkauflösung für alle Websites im Monorepo. Sie liegt unter `packages/affiliate-core/src/affiliate` und erzeugt Amazon-Produkt- oder Suchlinks ausschließlich aus lokal gepflegten Produktdaten.

Sie nutzt keine Amazon Product Advertising API, ruft keine externen Seiten auf und liest keine Amazon-Daten aus Webseiten aus. Preise und Verfügbarkeiten werden deshalb nicht angezeigt.

## ASIN und Tracking-ID

Eine ASIN identifiziert ein Produkt im Amazon-Katalog. Sie besteht aus zehn Zeichen, zum Beispiel `B0D123ABCD`.

Die Tracking-ID ordnet einen Link dem Affiliate-Konto zu. Sie wird nicht in jedem Produkt wiederholt, sondern pro Projekt in `src/project.config.ts` gepflegt:

```ts
affiliate: {
  amazon: {
    trackingId: "yusha0f-21"
  }
}
```

## Produktdaten

Ein Produkt speichert unter `merchantLinks.amazon` nur eine ASIN, eine normale Amazon-URL oder einen Suchbegriff.

### ASIN

```ts
merchantLinks: {
  amazon: {
    asin: "B0D123ABCD"
  }
}
```

Die Engine erzeugt:

```text
https://www.amazon.de/dp/B0D123ABCD?tag=yusha0f-21
```

### Amazon-URL

```ts
merchantLinks: {
  amazon: {
    url: "https://www.amazon.de/Produktname/dp/B0D123ABCD"
  }
}
```

Die ASIN wird durch reines String-Parsing aus der URL gelesen. Unterstützt werden unter anderem `/dp/ASIN`, `/gp/product/ASIN`, `/gp/aw/d/ASIN` und URLs mit einem Produktnamen vor `/dp/`.

### Suchbegriff

```ts
merchantLinks: {
  amazon: {
    searchQuery: "GPS Tracker Hund"
  }
}
```

Die Engine erzeugt:

```text
https://www.amazon.de/s?k=GPS+Tracker+Hund&tag=yusha0f-21
```

## Amazon-Suchfallback

Wenn keine ASIN direkt oder aus einer URL verfügbar ist, baut die Engine einen getrackten Amazon-Suchlink. Die Reihenfolge lautet:

1. `merchantLinks.amazon.searchQuery`
2. `product.name`
3. `product.brand + product.name`

Ein Amazon-Link wird nur erzeugt, wenn `merchantLinks.amazon` vorhanden und im Projekt eine Tracking-ID konfiguriert ist.

## Legacy-Fallback

Bestehende Produkte dürfen weiterhin `affiliateUrl` verwenden. Die Primary-Link-Auflösung arbeitet in dieser Reihenfolge:

1. Amazon-Link aus `merchantLinks.amazon`
2. bestehendes `product.affiliateUrl`
3. interner Link aus `product.productUrl`

Damit bleiben bestehende Kurzlinks unverändert funktionsfähig. Neue Produktdaten benötigen keinen vollständig manuell aufgebauten Affiliate-Link mehr.

## Komponenten

`ProductBox` und `ProductRankingCard` verwenden `getPrimaryAffiliateLink()` aus dem Core. Amazon-Links erhalten automatisch:

```text
rel="sponsored nofollow noopener"
target="_blank"
```

Interne Links verwenden die Beschriftung „Zum Testbericht“ und öffnen im selben Fenster.

## Tests

```bash
npm run test:affiliate
```

Die Tests decken ASIN-Parsing, Produktlinks, Suchlinks, Tracking-ID, Legacy-Fallbacks und interne Links ab.

## Spätere Stufe 2

Eine spätere Ausbaustufe kann die Amazon Product Advertising API integrieren. Erst dann dürfen zulässige dynamische Amazon-Produktdaten nach den jeweils geltenden Bedingungen verarbeitet werden. V1 bleibt vollständig lokal und erzeugt ausschließlich Links.
