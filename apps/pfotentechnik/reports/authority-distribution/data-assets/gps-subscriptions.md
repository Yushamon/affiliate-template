# GPS-Abo Data Asset

- Snapshot-Version: `ece46b7476866812`
- Erzeugt: 2026-08-25T12:51:57.475Z
- Datenstand: 2026-08-24T00:00:00.000Z
- Validation Gate: bestanden

## Kernaussage

10 von 12 auswertbaren GPS-Produkten in der aktuellen PfotenTechnik-Auswahl benötigen ein Abo; 2 kommen ohne Pflichtabo aus und 0 führen ein optionales Abo.

Pflichtabo-Anteil: 83.3 %. Anteil ohne Pflichtabo: 16.7 %. Nenner sind ausschließlich 12 auswertbare Produkte.

## Population

- GPS-Produkte gesamt: 12
- Auswertbar: 12
- Ausgeschlossen: 0
- Evidence-Abdeckung: 100 %
- Status unknown: 0
- required: 10
- optional: 0
- none: 2

## Methodik

Nur gps.subscriptionRequired wird als Abo-Status gelesen. Freitext wird nicht in Boolean-Werte umgewandelt. Eligible sind nur aktive Produkte mit explizitem Status und aktueller strukturierter Evidence; Unknown oder unzureichende Evidence bleiben außerhalb des belastbaren Nenners.

Abo-Preise werden nicht aus `specs` oder anderem Freitext geparst. Da kein einheitliches strukturiertes Abo-Preismodell vorhanden ist, bleibt `subscription.price.unknown = true`. Herstellerangabe und externe Reviews werden nicht als PfotenTechnik-Test ausgegeben.

## Eingeschlossene Produkte

- **Enabot ROLA PetTracker** (`enabot-rola-pettracker`) · required · [Enabot Deutschland](https://de.store.enabot.com/products/rola-pettracker-gps-tracker-for-pets) · geprüft 2026-08-15 · high
- **Garmin Alpha T 20** (`garmin-alpha-t-20`) · none · [Garmin Alpha T 20 K Produktseite](https://www.garmin.com/de-DE/p/714362) · geprüft 2026-08-25 · high; [Garmin Alpha T 20 Benutzerhandbuch](https://www8.garmin.com/manuals/webhelp/GUID-74035D64-33C8-4CC0-8053-23CB54692716/DE-DE/Alpha_T_20_OM_DE-DE.pdf) · geprüft 2026-08-25 · high
- **Garmin Alpha TT 25** (`garmin-alpha-tt-25`) · none · [Garmin Alpha TT 25 Produktseite](https://www.garmin.com/en-US/p/714439/) · geprüft 2026-08-25 · high; [Garmin Alpha TT 25 Benutzerhandbuch – technische Daten](https://www8.garmin.com/manuals/webhelp/GUID-992E9C90-AE40-4ED4-B3C4-9D812BD4DF89/DE-DE/GUID-436F95DA-B7C8-4AAD-AE07-BDC58BB735C2.html) · geprüft 2026-08-25 · high
- **Invoxia Biotracker Edition 2026** (`invoxia-biotracker-2026`) · required · [Invoxia Biotracker Edition 2026](https://www.invoxia.com/en-US/petcare/minitailz-dog-tracker) · geprüft 2026-08-16 · high; [Invoxia Support – subscriptions](https://invoxia-petcare.zendesk.com/hc/en-us/articles/9652849499037--Is-a-subscription-required-to-use-the-Minitailz-Biotracker-GPS) · geprüft 2026-08-16 · high
- **PAJ PET Finder 4G Mini** (`paj-pet-finder-4g-mini`) · required · [PAJ GPS – PET Finder 4G Mini](https://www.paj-gps.de/store/pet-finder-4g-mini/) · geprüft 2026-08-25 · high; [PAJ GPS – PET Finder 4G Mini Schnellstart-Anleitung](https://www.paj-gps.de/wp-content/uploads/2026/03/Bedienungsanleitung-PET-Finder-4G-Mini-JAN26-DE.pdf) · geprüft 2026-08-25 · high
- **Pawfit 3** (`pawfit-3`) · required · [Pawfit 3](https://www.pawfit.com/de-us/product/pawfit-3-pet-tracker.html) · geprüft 2026-08-16 · high; [Pawfit Modellvergleich](https://support.pawfit.com/hc/en-gb/articles/360019893919-What-are-the-differences-between-all-of-the-Pawfit-models) · geprüft 2026-08-16 · high
- **Prothelis area Pets** (`prothelis-area-pets`) · required · [Prothelis Shop – area Pets](https://shop.prothelis.de/area-Pets-GPS-Tracker-fuer-Tiere/09054804-02M) · geprüft 2026-08-16 · high
- **Tractive CAT 6 Mini** (`tractive-cat-6-mini`) · required · [Tractive Kundenservice – Tracker-Auswahl und Abo](https://help.tractive.com/hc/de/articles/360001285329-Welcher-Tracker-ist-der-richtige-f%C3%BCr-mein-Haustier) · geprüft 2026-08-25 · high
- **Tractive DOG 6** (`tractive-dog-6`) · required · [Tractive Kundenservice – Tracker-Auswahl und Abo](https://help.tractive.com/hc/de/articles/360001285329-Welcher-Tracker-ist-der-richtige-f%C3%BCr-mein-Haustier) · geprüft 2026-08-25 · high
- **Tractive DOG 6 XL** (`tractive-dog-6-xl`) · required · [Tractive Kundenservice – Tracker-Auswahl und Abo](https://help.tractive.com/hc/de/articles/360001285329-Welcher-Tracker-ist-der-richtige-f%C3%BCr-mein-Haustier) · geprüft 2026-08-25 · high
- **Weenect XS GPS-Tracker** (`weenect-xs`) · required · [Weenect – GPS-Tracker für Hunde und Abonnements](https://www.weenect.com/de/de/gps-tracker-hund/) · geprüft 2026-08-25 · high; [Weenect Hilfe-Center – Service abonnieren](https://help.weenect.com/hc/de/articles/208540125-Wie-abonniere-ich-einen-Service) · geprüft 2026-08-25 · high
- **Weenect XT GPS-Tracker** (`weenect-xt`) · required · [Weenect XT Produktseite](https://www.weenect.com/de/de/gps-tracker-hund/weenect-xt/) · geprüft 2026-08-25 · high; [Weenect Hilfe-Center – Service abonnieren](https://help.weenect.com/hc/de/articles/208540125-Wie-abonniere-ich-einen-Service) · geprüft 2026-08-25 · high

## Ausgeschlossene Produkte

Keine.

## Change Detection

Änderung erkannt: 16 Change(s) gegenüber Snapshot `5ef20a5f081710e5`.

## Bekannte Grenzen

- Die Population ist die PfotenTechnik-Auswahl, nicht der vollständige deutsche Markt.
- Ein vorhandener Boolean ohne passende strukturierte Evidence bleibt ausgeschlossen.
- `false` bedeutet explizit kein Pflichtabo; missing/unknown wird niemals zu `false`.
- Optionale Tarife und Abo-Preise können mit dem aktuellen strukturierten Feld nicht zuverlässig ausgewertet werden.
- Das Finding ist `needs-review`, nicht automatisch öffentlich freigegeben.
