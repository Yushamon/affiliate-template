# Comparison Editorial Ranking Guard 32.6.8

## Problem

Seit 32.6.7 darf product.comparisons[] die Teilnehmermenge eines Vergleichs
global ergänzen.

Die Recommendation Engine lief bereits auf dieser erweiterten Menge und hatte
bisher Vorrang vor einem explizit gepflegten recommendation.winnerSlug.

Dadurch hätte ein neu ergänztes Backlink-Produkt einen redaktionell gesetzten
Sieger still ersetzen können.

## Neue Priorität

1. Expliziter recommendation.winnerSlug / alternativeSlug
2. Automatic Recommendation Engine
3. Erstes kaufbares kuratiertes item[]
4. Ergänztes Backlink-Produkt erst als letzter Fallback

## Unverändert

- visible = items[] ∪ product.comparisons[]
- keine automatische Entfernung
- keine Volltext-Heuristik für Membership
- Registry bleibt unverändert
