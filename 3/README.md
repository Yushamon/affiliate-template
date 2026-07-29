# PfotenTechnik Mobile Layout Recovery 16.2.0

Behebt die fehlerhafte mobile Darstellung der Alternativenkarten nach 16.1.0.

## Korrekturen

- Produktnamen brechen nicht mehr buchstabenweise um.
- Alternativenkarten sind auf 414 px vollständig einspaltig.
- Produktbild, Titel, Beschreibung, Score und Preis erhalten eine klare Reihenfolge.
- Redaktionelle Badges werden pro Vergleich nur einmal vergeben.
- Doppelte `Preis-Leistungs-Tipp`-Badges werden verhindert.
- Sticky-Bar begrenzt den Produktnamen auf eine Zeile und erhält einen höheren CTA.
- Keine neue CSS-Datei.

## Ausführung

```bash
node 3/apply-pfotentechnik-comparison-mobile-layout-recovery-16.2.0.mjs
```

Optional ohne Prüfungen:

```bash
node 3/apply-pfotentechnik-comparison-mobile-layout-recovery-16.2.0.mjs --skip-checks
```
