# PfotenTechnik Product & Manufacturer Media Patch 4.2.1

Behebt drei mobile UX-Probleme:

1. Produkt-Breadcrumb verschwindet unter 720 px.
2. Hersteller-Chip verlinkt auf `/hersteller/<slug>/`.
3. Produktgalerie und Hersteller-Hero werden zentriert mit `object-fit: contain` dargestellt, damit Bilder nicht verschoben oder extrem vergrößert erscheinen.

## Windows

```powershell
py .\apply-pfotentechnik-product-manufacturer-media-4.2.1.py
```

Alternativ:

```powershell
python .\apply-pfotentechnik-product-manufacturer-media-4.2.1.py
```

Der Installer erstellt Backups, führt `npm run build:pfotentechnik` aus und rollt bei Fehlern zurück.


## Windows-Hotfix 4.2.1

Unter Windows wird jetzt ausdrücklich nach `npm.cmd`, `npm.exe` und `npm` gesucht.
Falls Python npm trotzdem nicht findet, wird der Patch nicht mehr zurückgesetzt.
Der Installer beendet die Dateianpassungen erfolgreich und weist lediglich darauf hin,
den Build anschließend manuell auszuführen:

```powershell
npm run build:pfotentechnik
```
