# Product Operations Platform 1.0

## Grundsatz

`score` und `rating` bleiben ausschließlich redaktionelle Qualitätswerte. Preis, Affiliate-Ziel und Verfügbarkeit verändern diese Werte nicht. Sie steuern nur Kaufbarkeit, automatische Empfehlbarkeit, Pflegepriorität und Warnungen.

## Datenfelder

| Feld | Typ | Bedeutung |
|---|---|---|
| `price` | Objekt | Bestehender Preisblock mit `current`, `currency`, `checkedAt`, Quelle und Preiseinordnung. |
| `priceState` | `available`, `unknown`, `removed`, `stale` | Unterscheidet vorhandene, unbekannte, bewusst entfernte und veraltete Preise. |
| `priceUpdated` | Datum | Zeitpunkt der letzten bestätigten Preisänderung oder Prüfung. |
| `priceAvailable` | Boolean | Abgeleiteter, persistierter Status für einen belastbaren Preiswert. |
| `affiliateAvailable` | Boolean | Abgeleiteter, persistierter Status für ein gültiges HTTPS-Ziel. |
| `availability` | `available`, `temporarily-unavailable`, `out-of-stock`, `discontinued`, `unknown` | Redaktionell oder automatisch bestätigte Produktverfügbarkeit. |
| `availabilityReason` | Text | Optionale redaktionelle Bemerkung. |
| `availabilityUpdated` | Datum | Letzte Bestätigung des Verfügbarkeitsstatus. |
| `editorialStatus` | `complete`, `recommended`, `required`, `archived` | Status der redaktionellen Vollständigkeit. |
| `recommendationStatus` | `recommended`, `limited`, `archived` | Operative Empfehlbarkeit, getrennt vom Produktscore. |
| `maintenanceStatus` | `complete`, `recommended`, `required`, `archived` | Automatisch berechneter Pflegestatus. |

## Empfehlungslogik

Automatische Empfehlungen berücksichtigen zuerst unverändert den redaktionellen Score und die fachliche Szenarioeignung. Nur bei Gleichstand dienen Preis vorhanden, Affiliate vorhanden und bestätigte Verfügbarkeit als Tie-Breaker. Eingestellte Produkte sind nie automatisch Testsieger oder Top-Empfehlung. Nicht verfügbare Produkte erhalten keine Kaufen-CTA.

## Pflegelogik

`required` gilt für fehlenden Preis, fehlendes Affiliate-Ziel, unbekannte Verfügbarkeit oder fehlende Pflichtfelder. `recommended` gilt insbesondere bei Preisen über 90 Tagen. Bewusst gepflegte Zustände `temporarily-unavailable`, `out-of-stock` und `discontinued` erzeugen keine offenen Warnungen und erscheinen nicht in der Standard-Arbeitsliste. Eingestellte, nicht lieferbare oder bewusst archivierte Produkte erscheinen im Archiv.

## SEO Cockpit

Die Produktpflege enthält Dashboard-Kennzahlen, Arbeitsliste, vollständige Produktansicht und Archiv. Filter decken fehlende Preise, fehlende Affiliate-Ziele, Alter 30/90 Tage, alle Verfügbarkeiten und Pflegestatus ab. Preis und Verfügbarkeit werden in einem Request atomar gespeichert. Die bestätigte Serverantwort aktualisiert unmittelbar Zeile, Kennzahlen, Filterzuordnung und Priorisierung.

## Migration

`npm run product-operations:migrate` migriert alle Produktdateien. `npm run product-operations:migrate:check` prüft, ob eine Migration aussteht. Bestehende Preise, Affiliate-Links und Produktinhalte bleiben erhalten. `productStatus: discontinued` wird in `availability: discontinued` überführt. Aktive Produkte werden nur dann als verfügbar angenommen, wenn ein aktueller Preis und ein Affiliate-Ziel belastbar vorhanden sind; ansonsten bleibt die Verfügbarkeit bewusst `unknown`.

## Priorisierung

Die Arbeitsliste sortiert zuerst Pflege erforderlich, darin Preis fehlt, Affiliate fehlt, Verfügbarkeit unbekannt und fehlende Pflichtfelder. Danach folgen empfohlene Pflegefälle mit alten Preisen. Bewusst nicht verfügbare und archivierte Produkte erhalten keinen Aufgabenrang.

## Behobener Persistenzfehler

Die alte Oberfläche speicherte zwar serverseitig, übernahm die persistierte Serverantwort aber nicht. Stattdessen wartete sie auf einen verzögerten Seiten-Reload. Gleichzeitig konnten zwei Preisaktionen dieselbe Produktdatei aus einem veralteten Ausgangszustand lesen und sich gegenseitig überschreiben. Die neue Implementierung serialisiert Schreibvorgänge pro Produktdatei, dedupliziert parallele Preisprüfungen, schreibt Preis, Affiliate und Verfügbarkeit atomar und verwendet danach ausschließlich den zurückgelesenen Serverzustand. Ein zweiter Klick oder eine zweite Eingabe ist nicht mehr Teil des Zustandsmodells.

## Befehle

```bash
npm run product-operations:migrate
npm run test:product-operations
npm run audit:product-operations
npm run build:pfotentechnik
```
