# Topical Authority Structured Products 1.2.6

Dieser Patch schließt die Umstellung der Produktzuordnung ab.

## Neue Regel

Produktseiten werden ausschließlich anhand der strukturierten Angabe

```yaml
category:
  key: "futterautomaten"
```

einem Topical-Authority-Cluster zugeordnet.

Es gibt für Produkte keinen Fallback mehr über:

- Hersteller
- Marke
- Body
- Slug
- Titel
- Beschreibung

Fehlt `category.key` oder ist der Wert nicht im Mapping bekannt, wird das
Produkt keinem Cluster zugeordnet. Dadurch werden Fehler sichtbar und nicht
durch Heuristiken verdeckt.

## Testkorrekturen

- alter Test „Modellprodukte werden über eindeutige Marken erkannt“ entfernt
- alter Product-Body-Guard ersetzt
- Source-of-Truth-Test beibehalten
- Negativtest für fehlende Kategorien ergänzt
- Test gegen Überschreiben durch gemeinsame Marken ergänzt

## Voraussetzung

Patch 1.2.5 muss installiert sein oder der Loader muss bereits enthalten:

- `categoryKey`
- `parseNestedFrontmatterValue`
- `PRODUCT_CATEGORY_CLUSTER_MAP`
- `productClusterFromCategory`

## Installation

```bash
node 2/install-topical-authority-structured-products-1.2.6.mjs
```

## Validierung

```bash
npm --workspace apps/pfotentechnik run test:topical-authority
npm --workspace apps/pfotentechnik run audit:topical-authority:strict
npm --workspace apps/pfotentechnik run build
```
