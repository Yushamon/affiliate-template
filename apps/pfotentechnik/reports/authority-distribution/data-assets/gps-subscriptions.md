# GPS-Abo Data Asset

- Snapshot-Version: `5ef20a5f081710e5`
- Erzeugt: 2026-08-25T11:55:10.843Z
- Datenstand: 2026-08-24T00:00:00.000Z
- Validation Gate: bestanden

## Kernaussage

4 von 4 auswertbaren GPS-Produkten in der aktuellen PfotenTechnik-Auswahl benötigen ein Abo; 0 kommen ohne Pflichtabo aus und 0 führen ein optionales Abo.

Pflichtabo-Anteil: 100 %. Anteil ohne Pflichtabo: 0 %. Nenner sind ausschließlich 4 auswertbare Produkte.

## Population

- GPS-Produkte gesamt: 12
- Auswertbar: 4
- Ausgeschlossen: 8
- Evidence-Abdeckung: 33.3 %
- Status unknown: 0
- required: 4
- optional: 0
- none: 0

## Methodik

Nur gps.subscriptionRequired wird als Abo-Status gelesen. Freitext wird nicht in Boolean-Werte umgewandelt. Eligible sind nur aktive Produkte mit explizitem Status und aktueller strukturierter Evidence; Unknown oder unzureichende Evidence bleiben außerhalb des belastbaren Nenners.

Abo-Preise werden nicht aus `specs` oder anderem Freitext geparst. Da kein einheitliches strukturiertes Abo-Preismodell vorhanden ist, bleibt `subscription.price.unknown = true`. Herstellerangabe und externe Reviews werden nicht als PfotenTechnik-Test ausgegeben.

## Eingeschlossene Produkte

- **Enabot ROLA PetTracker** (`enabot-rola-pettracker`) · required · [Enabot Deutschland](https://de.store.enabot.com/products/rola-pettracker-gps-tracker-for-pets) · geprüft 2026-08-15 · high
- **Invoxia Biotracker Edition 2026** (`invoxia-biotracker-2026`) · required · [Invoxia Biotracker Edition 2026](https://www.invoxia.com/en-US/petcare/minitailz-dog-tracker) · geprüft 2026-08-16 · high; [Invoxia Support – subscriptions](https://invoxia-petcare.zendesk.com/hc/en-us/articles/9652849499037--Is-a-subscription-required-to-use-the-Minitailz-Biotracker-GPS) · geprüft 2026-08-16 · high
- **Pawfit 3** (`pawfit-3`) · required · [Pawfit 3](https://www.pawfit.com/de-us/product/pawfit-3-pet-tracker.html) · geprüft 2026-08-16 · high; [Pawfit Modellvergleich](https://support.pawfit.com/hc/en-gb/articles/360019893919-What-are-the-differences-between-all-of-the-Pawfit-models) · geprüft 2026-08-16 · high
- **Prothelis area Pets** (`prothelis-area-pets`) · required · [Prothelis Shop – area Pets](https://shop.prothelis.de/area-Pets-GPS-Tracker-fuer-Tiere/09054804-02M) · geprüft 2026-08-16 · high

## Ausgeschlossene Produkte

- **Garmin Alpha T 20** (`garmin-alpha-t-20`) · Status none · Grund: subscription-evidence-missing · Keine ausreichende strukturierte Evidence
- **Garmin Alpha TT 25** (`garmin-alpha-tt-25`) · Status none · Grund: subscription-evidence-missing · Keine ausreichende strukturierte Evidence
- **PAJ PET Finder 4G Mini** (`paj-pet-finder-4g-mini`) · Status required · Grund: subscription-evidence-missing · Keine ausreichende strukturierte Evidence
- **Tractive CAT 6 Mini** (`tractive-cat-6-mini`) · Status required · Grund: subscription-evidence-missing · Keine ausreichende strukturierte Evidence
- **Tractive DOG 6** (`tractive-dog-6`) · Status required · Grund: subscription-evidence-missing · Keine ausreichende strukturierte Evidence
- **Tractive DOG 6 XL** (`tractive-dog-6-xl`) · Status required · Grund: subscription-evidence-missing · Keine ausreichende strukturierte Evidence
- **Weenect XS GPS-Tracker** (`weenect-xs`) · Status required · Grund: subscription-evidence-missing · Keine ausreichende strukturierte Evidence
- **Weenect XT GPS-Tracker** (`weenect-xt`) · Status required · Grund: subscription-evidence-missing · Keine ausreichende strukturierte Evidence

## Change Detection

Kein Change Finding: kein vorheriger Snapshot oder keine tatsächliche Datenänderung.

## Bekannte Grenzen

- Die Population ist die PfotenTechnik-Auswahl, nicht der vollständige deutsche Markt.
- Ein vorhandener Boolean ohne passende strukturierte Evidence bleibt ausgeschlossen.
- `false` bedeutet explizit kein Pflichtabo; missing/unknown wird niemals zu `false`.
- Optionale Tarife und Abo-Preise können mit dem aktuellen strukturierten Feld nicht zuverlässig ausgewertet werden.
- Das Finding ist `needs-review`, nicht automatisch öffentlich freigegeben.
