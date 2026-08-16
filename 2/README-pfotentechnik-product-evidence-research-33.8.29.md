# PfotenTechnik Product Evidence Research 33.8.29

Finaler gemeinsamer Research-Patch für **14 Produkte** mit nicht berechenbarer Bewertung (`rating: 0`, leere Kriterienratings, kein positiver Score).

## Was geändert wird

- fünf redaktionelle PfotenTechnik-Kriterien je Produkt
- `rating` konsistent zum Mittelwert der Kriterien
- schema-konformes `externalEvidence`
- professionelle Tests und Nutzerbewertungen strikt getrennt
- aktuelle Review-Zahlen mit `checkedAt: 2026-08-16`
- markenweite Quellen ausdrücklich als markenweit gekennzeichnet
- keine externen Sterne werden direkt in den PfotenTechnik-Score kopiert
- bei ZeroMOUSE 2.0 und PUROBOT MAX 3 wird fehlende unabhängige Testevidenz transparent im `note` dokumentiert
- Strict-Audit-Gate gegen neue aktive Produkte ohne berechenbare Bewertung

## Betroffene Produkte

- `petkit-puramax-2`
- `petsafe-streamside-trinkbrunnen`
- `prothelis-area-pets`
- `reolink-e1-zoom`
- `pettec-cam-360`
- `zeromouse-2-0`
- `invoxia-biotracker-2026`
- `pawfit-3`
- `litter-robot-4`
- `petsnowy-snow-plus`
- `cat-mate-elite-355w`
- `petkit-purobot-max-3`
- `enabot-rola-pettracker`
- `catit-pixi-smart-trinkbrunnen`

## Wichtige Research-Entscheidungen

- **Pawfit 3:** trotz sehr starkem markenweiten Trustpilot-Signal bleibt die PfotenTechnik-Wertung zurückhaltend, weil CHIP das Tracking als mangelhaft bewertet und F.A.Z. keine Empfehlung ausspricht.
- **Litter-Robot 4:** mehrere unabhängige Praxistests sind stark; das kleine schwache EU-Trustpilot-Signal wird als Service-/Markensignal getrennt gehalten.
- **PUROBOT MAX 3:** PETKIT zeigt 176 gruppierte Reviews, weist aber selbst darauf hin, dass das konkrete Produkt keine eigenen Reviews besitzt. Deshalb keine daraus abgeleitete Produktsternnote.
- **ZeroMOUSE 2.0:** großes aktuelles Nutzersignal, aber kein belastbarer unabhängiger Fachtest gefunden. Keine erfundene Professional-Review-Evidenz.
- **Prothelis Area Pets:** CHIP und F.A.Z. widersprechen sich bei der realen Akkulaufzeit. Der Patch dokumentiert diese Abweichung statt eine Scheingenauigkeit zu erzeugen.

## Ausführen

```bash
node 3/apply-pfotentechnik-product-evidence-research-33.8.29.mjs
```

Der Installer erstellt ein Backup und führt anschließend `node --check`, Regressionstests, `lint:content`, Evidence-Audit, Product-Strict-Audit und den vollständigen Build aus.
