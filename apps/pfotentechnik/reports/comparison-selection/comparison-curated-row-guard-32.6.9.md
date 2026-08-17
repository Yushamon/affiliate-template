# Comparison Curated Row Guard 32.6.9

## Problem

Seit der globalen Backlink-Union können zusätzliche Produkte in einem Vergleich
sichtbar werden, obwohl für einzelne Kriterien noch keine vollständigen
Vergleichswerte vorliegen.

Die bisherige Zeilenlogik verlangte Vollabdeckung über ALLE sichtbaren Produkte.
Ein einziges ergänztes Produkt ohne Wert konnte dadurch eine zuvor vollständige
Vergleichszeile für alle Nutzer entfernen.

## Neue Regel

Wenn mindestens zwei kuratierte items[] vorhanden sind:

- Sichtbarkeit einer Kriterienzeile richtet sich nach der vollständigen
  Abdeckung der kuratierten items[].
- Backlink-Produkte dürfen fehlende Werte haben, ohne die kuratierte Zeile
  zu löschen.
- Vorhandene Werte von Backlink-Produkten werden selbstverständlich angezeigt.

Wenn keine ausreichende kuratierte Basis existiert, bleibt die bisherige strenge
Vollabdeckung über alle sichtbaren Produkte bestehen.

## Unverändert

- Kein Produkt wird aus dem Vergleich entfernt.
- Membership bleibt items[] ∪ product.comparisons[].
- Keine Volltext-Heuristik entscheidet über Membership.
- Redaktionelle Rankings bleiben geschützt.
