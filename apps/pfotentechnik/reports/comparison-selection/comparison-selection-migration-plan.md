# Comparison Selection Migration Plan 32.6.1

Diese Stufe verändert die produktive Vergleichsauswahl **noch nicht**.

Grund: Der Selection-Audit vom 17.08.2026 zeigt, dass die vorhandenen
`comparisonFilters` bei mehreren einfachen Vergleichen nicht ausreichend
oder widersprüchlich gepflegt sind.

## Befund

- Haustierkameras sind bereits sauber über die Kategorie ableitbar.
- Furbo 360 und Enabot EBO Air 2 fehlen dort ausschließlich wegen der
  autoritativen `items[]`-Liste.
- Futterautomaten für Hund/Katze/Nassfutter/Kamera/Akku können theoretisch
  strukturiert ausgewählt werden, die Produktdaten sind dafür aber noch nicht
  vollständig genug.
- Szenariovergleiche wie Berufstätige, zwei Katzen, Seniorenkatzen,
  Mehrtierhaushalt oder gegen Schlingen brauchen zusätzliche semantische
  Produktmerkmale.
- Ohne WLAN darf nicht mit `app: false` gleichgesetzt werden.
- Preisvergleiche brauchen eine belastbare dynamische Preisregel.

## Zielmodell

1. Produktdaten bestimmen die technische Eignung.
2. Comparison Selection Rules bestimmen die Kandidatenmenge.
3. `items[]` wird später nur noch Override-/Sortier-/Redaktionsebene.
4. `comparisons[]` bleibt während der Migration ein starkes redaktionelles
   Signal und wird danach auf Konsistenz geprüft.
5. buildComparisonViewModel() wird erst umgestellt, wenn die Datenabdeckung
   der jeweiligen Comparison ausreichend ist.

## Phasen

### Phase A · sofort automatisierbar

- beste-haustierkameras

Hier reicht `category = haustierkameras`. Die bestehende `items[]`-Liste
unterdrückt derzeit Furbo 360 und Enabot EBO Air 2.

### Phase B · technische Felder vervollständigen

- beste-futterautomaten-fuer-hunde
- beste-futterautomaten-fuer-katzen
- beste-futterautomaten-fuer-nassfutter
- beste-futterautomaten-mit-akku
- beste-futterautomaten-mit-kamera
- futterautomat-mit-app
- beste-mikrochip-katzenklappen
- beste-gps-tracker-fuer-hunde
- beste-gps-tracker-fuer-katzen
- gps-tracker-ohne-abo
- kleine-gps-tracker-fuer-katzen
- beste-trinkbrunnen-fuer-hunde
- beste-trinkbrunnen-fuer-katzen

### Phase C · neue semantische Produktmerkmale

Benötigt werden mindestens:

- unattendedUseFit
- schedulePersistence
- multiPetFit
- individualAccess
- bowlCount
- seniorPetFit
- puppyFit
- twoCatFit
- bowlMaterial
- wifi
- antiGulpFit
- appControl
- preyDetection
- automaticCleaning

## Sicherheitsregel

Keine Comparison wird automatisch auf Selection Rules umgestellt, solange
deren Regel auf `needs-data` oder `backlink-transition` steht.

Der produktive Umbau erfolgt erst nach einem Coverage-Audit.
