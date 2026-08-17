# Comparison Global Backlink Union 32.6.7

## Regel

visible = curated items[] ∪ explicit product.comparisons[]

## Sicherheitsgrenzen

- items[] wird niemals automatisch gekürzt.
- product.comparisons[] darf ausschließlich ergänzen.
- Duplikate werden über den Produkt-Slug verhindert.
- Die bestehende kuratierte Reihenfolge bleibt vorne erhalten.
- Keine technische Selection Rule wird aktiviert.
- Keine Volltext-Heuristik wird benutzt.
- comparisonSelectionRegistry.ts bleibt unverändert.
- needs-data und backlink-transition bleiben als Reifestatus erhalten.

## Architektur

Die Registry beschreibt künftig ausschließlich die Reife einer späteren
merkmalbasierten Selection Rule.

Die explizite Produkt-zu-Vergleich-Beziehung in product.comparisons[] ist
davon unabhängig und darf sofort als sichere zusätzliche Mitgliedschaft
verwendet werden.
