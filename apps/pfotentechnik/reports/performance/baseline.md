# PfotenTechnik Performance-Baseline

Messung vom 29. Juli 2026 gegen Commit `c5d1e4a` mit `astro build`. Die Werte stammen aus dem vollständigen Produktions-Build (206 Routen, 3.704 Bildtransformationen). HTML ist unkomprimiert, `br` ist Brotli, CSS/JS/Bilder sind die pro Route referenzierten, eindeutigen Build-Assets.

| Route | HTML | br | DOM | CSS | JS | Bilder |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 60.469 B | 11.736 B | 612 | 316.259 B | 0 B | 2.646.890 B |
| `/vergleiche/` | 40.617 B | 7.237 B | 353 | 297.100 B | 0 B | 0 B |
| `/vergleiche/beste-futterautomaten-fuer-katzen/` | 124.980 B | 19.545 B | 1.295 | 423.889 B | 4.966 B | 530.110 B |
| `/vergleiche/gps-tracker-ohne-abo/` | 64.039 B | 13.309 B | 622 | 423.889 B | 4.966 B | 457.340 B |
| `/produkt/petlibro-granary-2-vision/` | 76.602 B | 14.658 B | 722 | 340.439 B | 7.356 B | 469.704 B |
| `/hersteller/petlibro/` | 76.979 B | 14.724 B | 588 | 322.197 B | 0 B | 1.856.764 B |
| `/wissen/` | 59.516 B | 10.186 B | 591 | 292.660 B | 0 B | 0 B |
| `/smarte-futterautomaten/` | 126.976 B | 27.857 B | 1.289 | 354.923 B | 0 B | 5.387.506 B |
| `/hund-trinkt-ploetzlich-viel/` | 39.872 B | 9.313 B | 417 | 354.923 B | 0 B | 398.366 B |
| `/kontakt/` | 9.887 B | 2.491 B | 145 | 99.636 B | 0 B | 0 B |

## Ausgangslage

- Globales Produkt-Mobile-CSS wurde auf jeder öffentlichen Route geladen.
- `SiteRuntimeFixes.astro` suchte nach dem Laden Überschriften und Produktkarten, las berechnete Styles und ergänzte Markup-Zustände nachträglich.
- Das Vergleichssystem wurde zwar in ein Laufzeit-Stylesheet zusammengeführt, acht obsolete Quelldateien blieben jedoch parallel bestehen.
- Die Standard-Bildkomponente überließ responsive Breiten häufig Astos automatischer Auswahl; der Build erzeugte dadurch 3.704 Varianten.
- Öffentliche Seiten hatten keine Framework-Hydration; das relevante ausgelieferte JavaScript war klein und funktionsbezogen.
- Es werden keine Webfonts ausgeliefert. Deshalb gab es keinen Font-Preload- oder `font-display`-Eingriff.

Browserbasierte Lighthouse-/CWV-Labwerte sind nicht als belastbare Baseline ausgewiesen: Der verfügbare Browser-Binary war in dieser Umgebung nicht ausführbar. Das Release-Gate verwendet deshalb reproduzierbare Produktionsartefakt-, DOM-, Asset- und LCP-Delivery-Prüfungen; reale CWV bleiben eine externe Feldmessung.
