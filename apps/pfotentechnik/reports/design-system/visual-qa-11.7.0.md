# PfotenTechnik Visual QA Foundation 11.7.0

## Ergebnis

- analysierte Seiten: **202**
- Warnungen: **328**
- schwere Risiken: **0**

## Seitentypen

- Admin: **8**
- Ratgeber: **80**
- Hersteller: **19**
- Startseite: **1**
- Kaufberatung: **1**
- Produkt: **68**
- Vergleich: **25**

## Dauerhafte Kommandos

```bash
npm --workspace apps/pfotentechnik run design-system:visual-qa
npm --workspace apps/pfotentechnik run design-system:visual-qa:strict
```

Der nicht-strikte Lauf erzeugt eine priorisierte Prüfliste. Der strikte Lauf schlägt bei festen Pixelbreiten oder fehlenden H1-Strukturen fehl.
