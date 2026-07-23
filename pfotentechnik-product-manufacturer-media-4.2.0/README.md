# PfotenTechnik Product & Manufacturer Media Patch 4.2.0

Behebt drei mobile UX-Probleme:

1. Produkt-Breadcrumb verschwindet unter 720 px.
2. Hersteller-Chip verlinkt auf `/hersteller/<slug>/`.
3. Produktgalerie und Hersteller-Hero werden zentriert mit `object-fit: contain` dargestellt, damit Bilder nicht verschoben oder extrem vergrößert erscheinen.

## Windows

```powershell
py .\apply-pfotentechnik-product-manufacturer-media-4.2.0.py
```

Alternativ:

```powershell
python .\apply-pfotentechnik-product-manufacturer-media-4.2.0.py
```

Der Installer erstellt Backups, führt `npm run build:pfotentechnik` aus und rollt bei Fehlern zurück.
