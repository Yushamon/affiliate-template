# PFOTENTECHNIK 35.0B — DATASET QUALITY

Gate: **PASS**. Research-Abdeckung 24/24, bekannte Kernfelder im Mittel 43.5 %. PASS bedeutet valide belegte Daten und explizite Lücken, nicht vollständige öffentliche Verwendbarkeit.

| Feld | Known | Unknown | N/A | Known / 24 |
|---|---:|---:|---:|---:|
| filterRequired | 7 | 17 | 0 | 29.2 % |
| filterlessOperationPossible | 7 | 17 | 0 | 29.2 % |
| filterType | 15 | 8 | 1 | 62.5 % |
| replacementInterval | 17 | 6 | 1 | 70.8 % |
| packSize | 16 | 7 | 1 | 66.7 % |
| currentFilterOffer | 12 | 11 | 1 | 50.0 % |
| annualFilterCost | 11 | 12 | 1 | 45.8 % |
| proprietaryDependency | 1 | 23 | 0 | 4.2 % |
| replacementPumpAvailability | 8 | 16 | 0 | 33.3 % |

Known-Coverage = known / 24; N/A wird separat ausgewiesen. Alle Kostenfelder beziehen sich auf den Hauptfilter. Keine vollständige Verbrauchsinventur, daher keine Gesamt-TCO.

## Outlier Review

- **lowestAnnualCost — CONFIRMED:** Catit 43722: Händlerseite exakt Variante 2235929.1, sechs Ersatzfilter, Einzelkauf 9,79 EUR. Kein Brunnenbundle, kein Abo 8,32 EUR. Hersteller bestätigt PIXI-Smart-Kompatibilität und 30 Tage.
- **highestAnnualCost — CONFIRMED:** Glacier: Variante 45005300695282, EIN Ultrafilter zu 25,99 EUR. Hersteller-FAQ zwei Monate = 60 Tage. Nur Hauptfilter; Vorfilter bleibt unberechnet.
- **shortestInterval — CONFIRMED:** 14 Tage = zwei Wochen; bei Streamside unteres Ende 14–28. Modell-/kompatible EU-Zubehörquellen erneut geprüft. Verschmutzungsbedingte Capsule-Dog-Ausnahme drei Tage separat, keine universelle Rate.
- **longestInterval — CONFIRMED:** Glacier-Hauptfilter 60 Tage; nicht mit 14/15-Tage-Vorfilter verwechselt.
- **largestRepresentativePack — CONFIRMED:** Oneisall 7 l: SKU PJ17023, Variante 46677157544171: 8 Stück für 16,99 EUR. Keine Kostenberechnung wegen widersprüchlichem Intervall. Größere Sparpacks beobachtet, nicht als Standard ausgewählt.
- **filterPriceExtremes — CONFIRMED:** Niedrigster/höchster Preis je Filter im berechenbaren Teilbestand: Catit 9,79/6 und Glacier 25,99/1. Packpreise und Stückpreise strikt getrennt.
- **filterless — CONFIRMED_WITH_REQUIRED_OTHER_CONSUMABLE:** Hersteller nennt OneWay filterlos und Cube C ausdrücklich kein Filter. Dieselbe FAQ verlangt dennoch dessen Einbau; 30-Tage-Wechsel empfohlen. Keine Nullkostenannahme; EU-Cube-C aktuell ausverkauft.
- **generic — NO_CONFIRMED_CASES:** Kein generischer Ersatz ausdrücklich freigegeben. Nicht als Beweis interpretiert, dass generischer Betrieb unmöglich ist.
- **pumpNotAvailable — NO_CONFIRMED_CASES:** Keine dauerhaft ausdrücklich nicht erhältliche Pumpe belegt. Dockstream PLWF115 ausverkauft bleibt UNKNOWN für aktuelle Beschaffbarkeit; fehlende Suchetreffer ebenfalls UNKNOWN.

9 Korrekturen/Präzisierungen während Recherche und Review; nach der Extremwertkontrolle 3 weitere Korrekturen aus dem abschließenden Quellencheck. Geschätzte Werte: 0.

- Petlibro-Vorbestelltext als verstecktes Template erkannt: Glacier/RFID nicht fälschlich ausverkauft. Variantendaten und hasPreOrderVariant:false geprüft.
- Petkit 3 Pro UVC: 1,6 l Nutzvolumen von 1,8 l Maximum getrennt.
- Oneisall 7 l: widersprüchliche 2–3/2–4 Wochen nicht als belastbare Spanne verwendet.
- Glacier-Vorfilter: widersprüchliche 14/15 Tage nicht mit Hauptfilter 60 Tage vermischt.
- Cube C: verpflichtender Einbau statt optionales Zubehör; eigener waterTreatment-Typ, keine Filterkosten-Null.
- Xiaomi 0,00-JS-Platzhalter nicht als Angebot importiert.
- Abschließender Quellencheck: Oneisall-7L-Schwamm aus explizitem Lieferumfang ergänzt.
- Abschließender Quellencheck: unbelegten PLWF115-Schwamm aus Fakteninventar entfernt und als offene Prüfung dokumentiert.
- Abschließender Quellencheck: Shell-Filtertyp an die spezifische Zubehörquelle statt die Wartungs-FAQ gebunden.

## Einzelprodukt-Lücken

### cat-mate-shell-fountain

Identität: verified.

- consumablePolicy.filterlessOperationPossible: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.powerType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.lowWaterShutdown: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.



### oneisall-7l-dog-water-fountain

Identität: verified.

- consumablePolicy.filterlessOperationPossible: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.replacementInterval: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.powerType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.lowWaterShutdown: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.required: Lieferumfang belegt Schwamm, aber keine separate belegte Ersatzpackung, Pflicht-/Intervall- oder Preisangabe.
- consumables.1.dependency: Lieferumfang belegt Schwamm, aber keine separate belegte Ersatzpackung, Pflicht-/Intervall- oder Preisangabe.
- consumables.1.packSize: Lieferumfang belegt Schwamm, aber keine separate belegte Ersatzpackung, Pflicht-/Intervall- oder Preisangabe.
- consumables.1.replacementInterval: Lieferumfang belegt Schwamm, aber keine separate belegte Ersatzpackung, Pflicht-/Intervall- oder Preisangabe.
- consumables.1.partNumber: Lieferumfang belegt Schwamm, aber keine separate belegte Ersatzpackung, Pflicht-/Intervall- oder Preisangabe.
- consumables.1.offers: Lieferumfang belegt Schwamm, aber keine separate belegte Ersatzpackung, Pflicht-/Intervall- oder Preisangabe.

- Konflikt: Dieselbe Modellseite nennt 2–3 Wochen und 2–4 Wochen. replacementInterval bleibt UNKNOWN; keine künstliche Intervallspanne.

### petkit-eversweet-max-cordless

Identität: verified.

- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.

- Konflikt: Zubehörshop empfiehlt 2–4 Wochen; exakte Modell-FAQ empfiehlt 4 Wochen. Modell-FAQ hat Vorrang; keine Mischung der Intervalle.

### petkit-eversweet-ultra

Identität: verified.

- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.powerType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.lowWaterShutdown: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.

- Konflikt: Aktuelle Hersteller-FAQ: Cube C ist strukturell erforderlich und muss eingesetzt bleiben. Bestehende öffentliche Optional-Darstellung nicht geändert (Freeze), redaktionelle Korrektur in 35.0C erforderlich. Filterlos bedeutet nicht verbrauchsmittelfrei.

### petlibro-dockstream-rfid-smart

Identität: verified.

- consumablePolicy.filterlessOperationPossible: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.1.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.1.packSize: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.powerType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.lowWaterShutdown: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.offers: Kein belastbar zuordenbares aktuelles DE/EU-Ersatzangebot mit identischer Packung und Preis bestätigt.
- consumables.0.filterType: Filter vorhanden, Material-/Schichtaufbau nicht hinreichend genau belegt.

- Konflikt: RFID-Ersatzfilter nutzt im DE-Shop ebenfalls PL-FF005-SKUs. Zuordnung nur über exakte RFID-Zubehörseite; keine pauschale Kreuzkompatibilität aus SKU abgeleitet.

### petlibro-glacier-ultrafiltration

Identität: verified.

- identity.capacityLiters: Aktuell erfolgreich gelesene modellspezifische FAQ nennt kein eindeutig zuordenbares Fassungsvermögen.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.1.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.1.packSize: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.replacementInterval: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.powerType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.lowWaterShutdown: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.offers: Kein belastbar zuordenbares aktuelles DE/EU-Ersatzangebot mit identischer Packung und Preis bestätigt.
- consumables.0.dependency: Ultrafilter erforderlich; keine explizite Aussage, ob nur proprietäres Material zulässig ist.

- Konflikt: Glacier-Vorfilter: dieselbe FAQ nennt zwei Wochen und 15 Tage. UNKNOWN; Hauptfilter 60 Tage ist davon getrennt. Vorfilterpreis fehlt, Hauptfilterkosten sind kein Gesamtverbrauch.

### petlibro-stainless-steel-fountain

Identität: verified.

- consumablePolicy.filterlessOperationPossible: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.packSize: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.powerType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.lowWaterShutdown: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers: Kein belastbar zuordenbares aktuelles DE/EU-Ersatzangebot mit identischer Packung und Preis bestätigt.
- consumables.0.filterType: Filter vorhanden, Material-/Schichtaufbau nicht hinreichend genau belegt.

- Konflikt: Vorhandene primäre Amazon-Zuordnung B0F8NFVVZD verweist auf Dockstream statt PLWF006. Kein Zubehör oder Gerätepreis aus diesem Link übernommen; geschützte Produktdatei bleibt unverändert.

### xiaomi-smart-pet-fountain-2

Identität: verified.

- consumables.0.offers: DE-Kaufseite liefert 0,00-JavaScript-Platzhalter; kein belastbarer aktueller Preis, nicht als Nullpreis importiert.
- consumablePolicy.filterlessOperationPossible: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- comparisonData.fountain.powerType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.lowWaterShutdown: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.



### cat-mate-335-pet-fountain

Identität: verified.

- consumablePolicy.filterlessOperationPossible: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.powerType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.lowWaterShutdown: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.



### feelneedy-fn-w18-8l-katzenbrunnen

Identität: verified.

- consumables.0.packSize: Drei mitgelieferte Filter sind kein bepreistes Ersatzfilterangebot. Herstellerkatalog gefundenes W22/W25-Zubehör nicht W18 zugeordnet.
- consumablePolicy.filterlessOperationPossible: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.filterType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.replacementInterval: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.lowWaterShutdown: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers: Kein belastbar zuordenbares aktuelles DE/EU-Ersatzangebot mit identischer Packung und Preis bestätigt.



### oneisall-3-2l-cordless-fountain

Identität: unresolvedEU.

- consumables.0.replacementInterval: Keine konfliktfreie, für die exakte EU-Identität bestätigte Wechselvorgabe. Zubehör von 7 l / 3,5 l EU nicht auf andere globale Varianten übertragen.
- consumablePolicy.filterlessOperationPossible: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.filterType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.packSize: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.powerType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.lowWaterShutdown: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers: Kein belastbar zuordenbares aktuelles DE/EU-Ersatzangebot mit identischer Packung und Preis bestätigt.

- Konflikt: Globale Oneisall-Variante bestätigt, exakte EU-Version und EU-Zubehör nicht abgesichert; keine Übertragung von anderer Größe/Farbe/SKU.

### petkit-eversweet-3-pro-uvc

Identität: verified.

- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.

- Konflikt: Kapazitätsabweichung aufgelöst: Hersteller-FAQ trennt 1,8 l Maximum von 1,6 l tatsächlich nutzbar.

### petlibro-dockstream-2-smart

Identität: verified.

- consumablePolicy.filterlessOperationPossible: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.1.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.1.packSize: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.replacementInterval: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.powerType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.lowWaterShutdown: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.offers: Kein belastbar zuordenbares aktuelles DE/EU-Ersatzangebot mit identischer Packung und Preis bestätigt.

- Konflikt: Ältere offizielle Modellmatrix: Filter noch nicht verfügbar. Aktuelle exakte Zubehörseite/Modellbundle vorhanden, daher aktuelle Quelle bevorzugt. Zubehör-FAQ beschreibt 8er-Pack inklusive 8 Schwämmen; ausgewählte 4er-Variante nicht automatisch als identisches Schwammbundle bepreist.

### petlibro-dockstream-2-smart-cordless

Identität: verified.

- consumablePolicy.filterlessOperationPossible: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.1.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.1.packSize: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.replacementInterval: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.powerType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.lowWaterShutdown: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.offers: Kein belastbar zuordenbares aktuelles DE/EU-Ersatzangebot mit identischer Packung und Preis bestätigt.

- Konflikt: Ältere offizielle Modellmatrix: Filter noch nicht verfügbar. Aktuelle exakte Zubehörseite/Modellbundle vorhanden, daher aktuelle Quelle bevorzugt. Zubehör-FAQ beschreibt 8er-Pack inklusive 8 Schwämmen; ausgewählte 4er-Variante nicht automatisch als identisches Schwammbundle bepreist.

### catit-pixi-smart-trinkbrunnen

Identität: verified.

- repairability.parts.0.status: Smart-Pumpe nicht mit Standard-PIXI-Pumpe 44833 verwechseln. Aufgerufene Shoproute leitet auf Marken-Startseite; keine aktuelle Smart-Pumpenverfügbarkeit belegt.
- consumablePolicy.filterlessOperationPossible: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.powerType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.



### oneisall-2-2l-cordless-fountain

Identität: unresolvedEU.

- consumables.0.replacementInterval: Keine konfliktfreie, für die exakte EU-Identität bestätigte Wechselvorgabe. Zubehör von 7 l / 3,5 l EU nicht auf andere globale Varianten übertragen.
- consumablePolicy.filterlessOperationPossible: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.filterType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.packSize: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.powerType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.lowWaterShutdown: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers: Kein belastbar zuordenbares aktuelles DE/EU-Ersatzangebot mit identischer Packung und Preis bestätigt.

- Konflikt: Globale Oneisall-Variante bestätigt, exakte EU-Version und EU-Zubehör nicht abgesichert; keine Übertragung von anderer Größe/Farbe/SKU.

### oneisall-3-5l-cordless-fountain

Identität: unresolvedEU.

- consumables.0.replacementInterval: Keine konfliktfreie, für die exakte EU-Identität bestätigte Wechselvorgabe. Zubehör von 7 l / 3,5 l EU nicht auf andere globale Varianten übertragen.
- consumablePolicy.filterlessOperationPossible: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.filterType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.packSize: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.powerType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.lowWaterShutdown: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers: Kein belastbar zuordenbares aktuelles DE/EU-Ersatzangebot mit identischer Packung und Preis bestätigt.

- Konflikt: Globale Oneisall-Variante bestätigt, exakte EU-Version und EU-Zubehör nicht abgesichert; keine Übertragung von anderer Größe/Farbe/SKU.

### petkit-eversweet-5-mini

Identität: verified.

- consumables.0.replacementInterval: Hersteller-Manual beschreibt Filter und Wechselanzeige, aber keine belastbare feste Tages-/Wochenvorgabe.
- consumablePolicy.filterlessOperationPossible: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.filterType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.packSize: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.powerType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.lowWaterShutdown: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers: Kein belastbar zuordenbares aktuelles DE/EU-Ersatzangebot mit identischer Packung und Preis bestätigt.



### petkit-eversweet-max-2-uvc

Identität: verified.

- consumables.0.packSize: EU-RECT-Filterseite nennt nur MAX CORDLESS, keine eindeutige MAX-2-UVC-Einzelfilterzuordnung; Pumpenbundle beweist keine Filterkompatibilität.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers: Kein belastbar zuordenbares aktuelles DE/EU-Ersatzangebot mit identischer Packung und Preis bestätigt.



### petkit-eversweet-solo-2-fountain

Identität: verified.

- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.



### petkit-eversweet-solo-se

Identität: verified.

- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.



### petlibro-capsule-dog-fountain

Identität: verified.

- identity.capacityLiters: Aktuell erfolgreich gelesene modellspezifische FAQ nennt kein eindeutig zuordenbares Fassungsvermögen.
- consumablePolicy.filterlessOperationPossible: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.1.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.1.packSize: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.powerType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.lowWaterShutdown: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.1.offers: Kein belastbar zuordenbares aktuelles DE/EU-Ersatzangebot mit identischer Packung und Preis bestätigt.
- consumables.0.filterType: Filter vorhanden, Material-/Schichtaufbau nicht hinreichend genau belegt.



### petlibro-dockstream-cordless

Identität: verified.

- consumablePolicy.filterlessOperationPossible: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.partNumber: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- consumables.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.powerType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.lowWaterShutdown: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.



### petsafe-streamside-trinkbrunnen

Identität: verified.

- consumables.0.offers: Spanischer EU-Listenpreis 13,99 EUR gelesen; deutscher Bezug und Lieferstatus nicht bestätigt. Kein DE-Offer daraus angelegt.
- consumablePolicy.filterlessOperationPossible: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumablePolicy.inventoryComplete: Keine umfassende Freigabe, dass alle regelmäßigen Verbrauchsteile vollständig erfasst sind. Keine Nullkosten-/Gesamt-TCO-Aussage.
- consumables.0.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.0.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.1.required: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.1.dependency: Keine ausdrückliche modellspezifische offizielle Freigabe/Pflichtaussage.
- consumables.1.offers.0.price: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.powerType: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.batteryRuntime: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.lowWaterShutdown: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.waterLevelVisible: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.pumpRemovable: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- comparisonData.fountain.dishwasherSafeParts: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.
- repairability.parts.0: Im geprüften Quellenkorpus keine hinreichend genaue, konfliktfreie Angabe für dieses Modell/EU-Angebot.

- Konflikt: DE-Geräteseite nennt PAC00-US-Teilenummern; EU-Zubehörseiten PAC19-14088/14089 bestätigen Streamside direkt. Keine US-Angebotspreise übertragen.
