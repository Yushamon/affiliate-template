# Subscription & Total Cost – Implementation

## DATA MODEL

Das bestehende `price`-Objekt bleibt alleinige Quelle für den Gerätepreis. Ergänzt wurde ein optionales, strukturiertes `subscription`-Objekt im Product Schema:

- Status: `required-subscription`, `required-prepaid`, `optional-subscription`, `no-subscription`, `service-included`, `unknown`
- Grundfunktionspflicht, Diensttyp und Servicemodell
- Anbieter, Quelle, Research-/Checkdatum und Inklusivmonate
- freie und bezahlte Funktionen
- Tarife mit echtem Zahlungsintervall, Bindung, Billing Mode, Zahlbetrag, Währung, Monatsäquivalent, Auto-Renew und Notiz

Schema-Refinements verhindern, dass ein Pflichtdienst als nicht erforderlich oder ein optionaler Dienst als Grundvoraussetzung modelliert wird.

`src/domain/subscriptionCosts.ts` enthält die einzige Berechnungslogik. Servicepreise werden nach 120 Tagen stale. Die 12-/24-Monats-Kosten berücksichtigen den tatsächlichen Billing-Zyklus; ein Jahresbetrag wird nicht in fiktive Monatsabbuchungen umgerechnet. Ohne aktuellen Gerätepreis oder aktuellen Servicepreis gibt es keine Gesamtkostenrechnung.

## PRODUCT UX

`PriceBox2.astro` wurde erweitert, nicht dupliziert. Auf allen 27 migrierten Produktseiten steht im oberen Kaufbereich:

1. Anschaffung
2. laufende Kosten bzw. kein Pflichtabo / optional / unknown
3. Servicemodell
4. Gesamtkosten nach zwei Jahren, nur wenn belastbar
5. Tarife, Funktionsgrenzen, 12-/24-Monats-Beispiel und Herstellerquelle in einem nativen `<details>`

Der tatsächliche Abbuchungsbetrag steht vor dem Monatsäquivalent. Pflichtdienste mit unbekanntem Preis zeigen „Zusatzkosten erforderlich – aktuellen Tarif prüfen“. Optionaldienste trennen Grundbetrieb und Premiumfunktionen. VHF ohne Mobilfunkabo weist das separate Handgerät als Hardwarekostenrisiko aus.

Die Karte verwendet ausschließlich die vorhandenen ProductExperience2/Foundation-Tokens (`--px2-*`), einen 44-px-Disclosure-Target und eine einspaltige Geometrie bis 410 px.

## COMPARISON UX

Die vorhandene Vergleichszeile `abo` ist die Kostenachse; es wurde keine breite Zusatztabelle angelegt. In den fünf bestehenden GPS-Vergleichen und im Haustierkamera-Vergleich liefert sie jetzt aus der Produktquelle:

- Pflicht/Prepaid/optional/no-subscription/unknown
- echten Zahlbetrag mit Zahlungsperiode
- 24-Monats-Szenario, wenn beide Preisarten aktuell sind

Betroffene Vergleiche:

- `/vergleiche/beste-gps-tracker-fuer-hunde/`
- `/vergleiche/beste-gps-tracker-fuer-katzen/`
- `/vergleiche/gps-tracker-mit-langer-akkulaufzeit/`
- `/vergleiche/gps-tracker-ohne-abo/`
- `/vergleiche/kleine-gps-tracker-fuer-katzen/`
- `/vergleiche/beste-haustierkameras/`

Die mobile Vergleichsdarstellung bleibt beim vorhandenen stapelnden Definition-List-System. Der GPS-Filter liest den strukturierten Status; `gps.subscriptionRequired` bleibt nur Legacy-Fallback.

## GUIDE / HUB OWNERSHIP

- Primäre modellübergreifende GPS-Kosten-Ownership: `/gps-tracker/` (vorhandener Abschnitt „Akku und laufende Kosten“).
- Spezifische No-Abo-/Hardwarekosten-Erklärung: `/vergleiche/gps-tracker-ohne-abo/`.
- Primäre Kamera-Kosten-Ownership: `/haustierkameras/` (vorhandene Cloud-/Abo- und 24-Monats-Abschnitte).
- Detaillierte aktuelle Modellbeträge: Produktseiten und relevante Vergleichszeilen.

Die vorhandenen Owner waren inhaltlich bereits geeignet; es wurden keine neue URL und keine redundante statische Tariftabelle angelegt.

## GPS DATA ASSET

Das bestehende Asset wurde auf Schema-Version 2 gehärtet:

- bevorzugt `subscription.status`, behält den Boolean nur als Fallback
- trennt `modelStatus`, `serviceType`, `serviceModel`, Pläne und Billing Mode
- übernimmt aktuelle strukturierte Preise, ohne Freitext zu parsen
- nutzt dieselbe 120-Tage-Stale-Regel
- weist Prepaid-fähige Mischmodelle separat aus
- Publication Gate bleibt `needs-review`; keine automatische Veröffentlichung

## MIGRATIONEN

- 12/12 aktive GPS-Produkte
- 8/8 aktive Haustierkameras
- 7 weitere aktive Produkte mit konkretem Repository-Hinweis
- keine URL-, Canonical-, Meta-, Rating-, Score-, Affiliate- oder Testclaim-Änderung
- keine Spotter-Produktseite

## VALIDIERUNGSCONTRACT

`test/subscription-costs.test.mjs` deckt Pflichtabo bekannt/unbekannt, Prepaid, optional, kein Abo, mehrere Pläne, Vorauszahlung, Monatsäquivalent, 12/24 Monate, fehlenden Gerätepreis, stale Evidence, falsche Free-/TCO-Zustände, GPS-Asset, Schema-/Produktabdeckung, Vergleichstext und mobile Quellgeometrie ab.
