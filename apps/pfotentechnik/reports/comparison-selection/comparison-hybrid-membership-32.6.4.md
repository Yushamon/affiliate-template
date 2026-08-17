# Comparison Hybrid Membership 32.6.4

## Produktive Regel

```text
visible products = curated items[] ∪ explicit product.comparisons[]
```

## Sicherheitsgarantien

- Bestehende `items[]` bleiben vollständig sichtbar.
- Produkt-Backlinks dürfen nur ergänzen.
- Keine automatische Entfernung.
- Keine Volltext-Heuristik.
- Keine technische Selection Rule ist produktiv aktiv.
- Bestehende Reihenfolge bleibt erhalten; neue Backlink-Produkte werden danach angehängt.
- Recommendation Engine arbeitet anschließend auf der vereinigten Kandidatenmenge.

## Erwarteter Haustierkamera-Effekt

Vorher kuratiert:

- petlibro-scout-smart-camera
- furbo-mini-360
- enabot-rola-mini
- pettec-cam-360
- reolink-e1-zoom

Zusätzlich durch explizite Backlinks:

- enabot-ebo-air-2
- furbo-360-hundekamera

Erwartete sichtbare Produktzahl: 7.

## Rollback

Backup:

`apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts.pfotentechnik-comparison-hybrid-membership-32.6.4.bak`
