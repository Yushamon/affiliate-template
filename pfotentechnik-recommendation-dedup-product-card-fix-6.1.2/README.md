# PfotenTechnik Recommendation & Product Card Fix 6.1.2

## Behoben

- Produktbilder erhalten einen ruhigeren 4:3-Medienbereich.
- Bilder bleiben vollständig sichtbar und werden nicht mehr bannerartig gequetscht.
- Der CTA heißt jetzt „Produkt ansehen“.
- Der CTA wird als klarer Button dargestellt.
- Gemeinsame Mega-Hintergründe werden reduziert.
- Szenario-Karten enthalten keine doppelten Produktnamen mehr.
- Konkrete Produkte erscheinen gesammelt im visuellen Produktmodul.
- Der Abschluss-CTA wiederholt kein einzelnes Produkt mehr.
- Der Abschluss verweist stattdessen auf den passenden Vergleich.

## Geänderte Seite

```text
/futterautomat-bei-uebergewicht/
```

Die bisherige Struktur enthielt gleichzeitig:

- konkrete Produkte im Szenario-Block
- ein automatisch gefiltertes Produktmodul
- Vergleichsprodukte
- eine Vergleichsempfehlung
- einen Abschluss-CTA für erneut ein einzelnes Produkt

Der Patch macht aus dem Szenario-Block neutrale Anforderungen und lässt konkrete Modelle nur im Produkt-/Vergleichsbereich erscheinen.

## Installation

```bash
node pfotentechnik-recommendation-dedup-product-card-fix-6.1.2/install-recommendation-dedup-product-card-fix-6.1.2.mjs
npm run build:pfotentechnik
```

Danach den Dev-Server vollständig neu starten.

## Prüfen

```text
/futterautomat-bei-uebergewicht/
/futterautomat-fuer-hunde/
```

## Rollback

```bash
node pfotentechnik-recommendation-dedup-product-card-fix-6.1.2/rollback-recommendation-dedup-product-card-fix-6.1.2.mjs
```
