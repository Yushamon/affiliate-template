# Price & Availability Integrity Fix

Stand: 16.10.2026. Anwendung: `apps/pfotentechnik`. Kein Deployment ausgeführt.

## Ergebnis und Umfang

Alle **103 Produktdateien** wurden auditiert. **64 Produkte** hatten einen historischen automatischen Positivstatus, dessen Liefernachweis nicht gespeichert wurde. Diese Werte werden zur Laufzeit als **unbekannt** behandelt, bis ein Händler oder die Redaktion Verfügbarkeit ausdrücklich bestätigt. Eine konservative Einstufung beweist keine Nichtlieferbarkeit.

**Eine Produktdatei wurde gezielt korrigiert:** `petlibro-granary-2-vision.md`. Die übrigen Produktdateien bleiben unverändert. Der Audit dokumentiert außerdem **40 Preisprüfungen älter als 30 Tage**, **neun Produkte mit ungeklärter Händlerzuordnung** und **zwei Fremdwährungspreise**. Wegen überlappender Befunde und der Aktualitätsbefunde haben alle 103 Produkte mindestens einen Audithinweis; nicht jeder Hinweis ist ein nachgewiesener Datenfehler oder ein Grund, eine Seite zu entfernen.

Vollständige, einzeln nachvollziehbare Liste: [product-audit.md](product-audit.md), maschinenlesbar mit allen effektiven Händlerzuständen: [product-audit.json](product-audit.json).

## Nachgewiesene Ursachen

1. `service.mjs` ersetzte fehlendes oder unbekanntes Händler-Stock-Markup durch `available`. Der identische historische Begründungstext wurde sowohl mit als auch ohne Stock-Nachweis gespeichert. Die heutigen Daten erlauben keine sichere Rekonstruktion, welche dieser 64 Angaben tatsächlich aus `InStock` stammten.
2. `inferInitialAvailability()` leitete positive Lieferbarkeit aus aktivem Produktstatus, Preis, HTTPS-Link und Preisdatum ab. `deriveProductOperations()` übernahm außerdem das Preisdatum ersatzweise als Verfügbarkeitsdatum.
3. Händlerauflösung ließ auch bei ungeklärten Zuordnungen einen öffentlichen numerischen Preis zu; ein vorhandener generischer Shop-Link konnte eine ungeklärte explizite Zuordnung umgehen. Ein fremdwährungsbasierter Altpreis konnte in die deutsche Produkt-/Vergleichsdarstellung gelangen.
4. Der HTML-Extractor wählte unter mehreren strukturierten Angeboten den niedrigsten Preis, nutzte AggregateOffer-Spannen als Produktpreis und ergänzte bei fehlender Währung EUR.
5. Vergleichstabellen konnten die globale Kaufbarkeit eines anderen Händlers mit dem alten Affiliate-Ziel und dessen Preis kombinieren. Der Fallback auf den Preislink umging außerdem die vorangehende Linkprüfung.

## Umsetzung entlang der Datenkette

- Händlerabruf: Nur explizite Stock-Werte eines deutschen Händlerziels und ein passend ausgewiesener EUR-Preis können automatisch deutsche Verfügbarkeit bestätigen. Ein Preis ohne Stock-Signal bleibt unbekannt; eine vorher belastbar bestätigte Angabe wird durch einen Abruffehler oder eine bloße Preisantwort nicht neu datiert. Mehrdeutige Angebote, reine Preisspannen und Preise ohne Währung werden abgelehnt.
- Frontmatter: Bestehende atomare Schreib- und Serialisierungsfunktionen bleiben erhalten. Die persistierten Produkt-Operations betreffen weiterhin den Legacy-Händler; ein offizielles Angebot darf dessen Status nicht durch eine aggregierte Ableitung überschreiben. Angebotsspezifische `availabilityUpdated`-Felder werden separat gepflegt, beim Wechsel der Produktzuordnung zurückgesetzt und durch das bestehende Offer-Schema validiert.
- Laufzeit: Kaufbarkeit verlangt ein verifiziertes, regional verwendbares Angebot mit bestätigter Lieferbarkeit und gültigem Affiliate-Ziel. Ein gültiger Prüflink darf auch bei unbekannter Verfügbarkeit sichtbar bleiben; er bestätigt keine Kaufbarkeit. Unbekannte Verfügbarkeit verhindert keine redaktionelle Empfehlung. Historisch ungesicherte positive Begründungstexte werden öffentlich nicht weiter als Liefernachweis angezeigt.
- Mehrere Händler: Amazon, Awin und ADCELL bleiben erhalten. Ein ungeklärtes oder fehlgeschlagenes PETLIBRO-Angebot verdrängt kein bestätigtes Amazon-Angebot. Ein verifiziertes Angebot ohne Stock-Nachweis verdrängt auch beim selben Händler keine bestätigte Legacy-Verfügbarkeit.
- Preise: Originale USD-Bestände bleiben als Historie im Content/Cockpit erhalten. Sie werden weder in EUR umetikettiert noch als deutscher Vergleichspreis oder kaufbares Schema-Angebot ausgegeben. Preisbewertungen vergleichen nur übereinstimmende Währungen. Preis und Link in Vergleichstabellen stammen vom selben aufgelösten Angebot.
- Cockpit: Getrennte Anzeige für letzte Preisprüfung, letzte bestätigte Verfügbarkeitsprüfung und letzte redaktionelle Produktprüfung. Händlerzuordnungen, Fehler, manuelle Bearbeitung und Ein-Klick-Refresh bleiben sichtbar und funktionsfähig. Ein Preisabruf ändert `editorial.lastVerifiedAt` nicht.
- Darstellung/Schema: Produktseiten zeigen unbekannte Lieferbarkeit auch bei konfigurierten, aber ungeklärten Händlerangeboten deutlich. Product-Offers verwenden den gemeinsamen Resolver und verlangen bestätigte Kaufbarkeit, einen frischen Preis und die zugehörige Währung. Unbekannte Angebote werden weggelassen. Der Review-Schema-Fix, SEO-Titel, Canonicals und Sitemap-Regeln wurden nicht verändert.

## Vorher/Nachher

| Fall | Vorher | Nachher |
| --- | --- | --- |
| Granary 2 Vision | 129,99 USD, DE-Zuordnung unresolved, Produkt trotzdem `available` | DE-Verfügbarkeit `unknown`, kein deutscher Verkaufspreis/Offer; USD-Historie, Händler-URL und redaktionelle Informationen erhalten |
| Aktiver Datensatz mit frischem Preis und HTTPS-Link, ohne Stock | konnte `available` werden | `unknown`; redaktionell weiterhin auswählbar |
| Amazon bestätigt, PETLIBRO unresolved/Timeout | widersprüchliche Händlerzustände konnten global vermischt werden | Amazon bleibt unabhängig bestätigt; PETLIBRO-Fehler bleibt sichtbar |
| Erfolgreiche Preisantwort ohne Stock, vorher manuell bestätigt | neuer Preis konnte zugleich Lieferprüfung vortäuschen | Preisdatum aktualisiert; bestätigter Lieferstatus und dessen bisheriges Datum bleiben erhalten |
| Mehrere JSON-LD-Preise/Varianten | billigster Preis wurde übernommen | Abruf wird als mehrdeutig abgelehnt; vorhandene Daten bleiben erhalten |

## Geänderte Implementierungsdateien

Alle Pfade relativ zur Anwendung:

- `src/lib/price-intelligence/service.mjs`
- `src/lib/price-intelligence/extract-offer.mjs`
- `src/lib/price-intelligence/commerce-refresh.mjs`
- `src/lib/price-intelligence/commerce-view.mjs`
- `src/lib/product-operations/policy.mjs` und `policy.d.ts`
- `src/domain/commerceOffers.mjs`
- `src/domain/price/adapters/contentPriceAdapter.ts`
- `src/domain/price/engine.ts`
- `src/domain/comparison/buildComparisonViewModel.ts`
- `src/content/schema/commerce.mjs`
- `src/content/products/petlibro-granary-2-vision.md`
- `src/components/product-experience-2/PriceBox2.astro`
- `src/pages/admin/seo/prices.astro`
- `src/pages/produkt/[product].astro`

`frontmatter-price.mjs` wurde geprüft und wird weiterhin verwendet; seine vorhandenen Funktionen reichen mit der korrigierten Operations-Ableitung aus. Zusätzlich neu: `test/price-availability-integrity.test.mjs`, `scripts/price-intelligence/integrity-audit.mjs`, `scripts/price-intelligence/rendered-integrity-audit.mjs` und die Dateien dieses Berichtsverzeichnisses.

## Validierung

| Prüfung | Ergebnis |
| --- | --- |
| Relevante Unit-/Regressionstests (sieben Testdateien) | **74/74 PASS** |
| Vollständige Anwendungstestsuite | **937/937 PASS**, keine übersprungenen Tests |
| Production Build | **PASS**, 374 Seiten, 1 min 16 s |
| Bestehender technischer SEO-Audit (Source + Build) | **PASS** |
| Bestehender Comparison-/Product-Schema-Audit | **PASS**, 28 Vergleichsseiten / ItemLists |
| Zusätzliche Prüfung aller gerenderten Product-Schemas | **PASS**, 103 Produkte, neun bestätigte Offers, korrekte Preis-/Währungs-/Zielzuordnung |
| Erhalt der deployed Review-Freigaben | **PASS**, alle 103 Produkte gegen vorhandenen Google-Indexierungs-Bericht geprüft, weiterhin 92 Reviews |
| Gerenderte Granary-Regression | **PASS**, sichtbarer unbekannter DE-Status, kein 129,99-USD-Verkaufspreis, kein Schema-Offer |
| Vergleichsseiten | **PASS**, alle 28 HTML-Seiten geprüft; keine ausgegebenen USD-Granary-Vergleichspreise |
| Produkt-Datenintegrität | **PASS**, keine effektiv kaufbaren ungeklärten/fremdwährungsbasierten Angebote |
| `git diff --check` | **PASS** |

Der zusätzliche Output steht in [rendered-audit.json](rendered-audit.json). Der bestehende Source-/Build-SEO-Audit und der Comparison-Schema-Audit sind als [technical-seo.txt](technical-seo.txt) bzw. [comparison-schema.txt](comparison-schema.txt) beigefügt. Zusammengefasste Test-/Build-Ausgaben: [validation.txt](validation.txt).

Alle 15 geforderten Regressionsthemen sind abgedeckt: Preis ohne Stock; InStock; OutOfStock; fehlender Stock-Wert; Link ohne Preis; ungeklärtes DE-Angebot; bestätigtes Amazon neben ungeklärtem PETLIBRO; USD ohne DE-Nachweis; Abruffehler; manuelle Bestätigung; bestehende Amazon-Links; Awin; ADCELL; mehrere Händler auf einer Produktseite; strukturierte Daten ohne bestätigte Verfügbarkeit. Zusätzlich geprüft: Discontinued, ungültige Stock-Werte, mehrdeutige Variantenpreise, fehlende Währung, EUR bei ausländischem Händler, getrennte Zeitstempel und unveränderte redaktionelle Prüfdaten.

Reproduzieren ab Repository-Wurzel (Build vor den Tests, da bestehende Tests fertiges HTML prüfen):

```sh
npm run build --workspace=@affiliate-sites/pfotentechnik
npm test --workspace=@affiliate-sites/pfotentechnik
npm run audit:technical-seo --workspace=@affiliate-sites/pfotentechnik
npm run audit:comparison-schema --workspace=@affiliate-sites/pfotentechnik
node apps/pfotentechnik/scripts/price-intelligence/integrity-audit.mjs
node apps/pfotentechnik/scripts/price-intelligence/rendered-integrity-audit.mjs
```

Der beigefügte Vorher-/Nachher-Produktaudit wurde mit `integrity-audit.mjs --baseline HEAD` vor dem Commit erzeugt. Nach einem Commit für denselben Vorhervergleich die ursprüngliche Commit-ID statt `HEAD` angeben. Ohne `--baseline` wird ausschließlich der aktuelle Arbeitsbaum geprüft.

## Verbleibende Risiken und Deployment

- Die 64 historischen automatischen Lieferangaben müssen bei Bedarf erneut explizit bestätigt werden. Ohne Nachweis wird bewusst kein `InStock` behauptet; die redaktionellen Empfehlungen bleiben möglich.
- Ungeklärte Händlerzuordnungen, alte Preise und die bereits vorher fehlende ADCELL-Konfiguration werden nicht erfunden oder automatisch durch andere Modelle ersetzt. Die ADCELL-Integration bleibt implementiert; ein tatsächlich aktiviertes Programm benötigt weiterhin die bestehend geforderten verifizierten Programmdaten.
- Händler können kurzfristig Stock, Währung oder Markup ändern. Der konservativere Extractor kann deshalb häufiger eine manuelle Prüfung verlangen. Tests nutzen kontrollierte Händlerantworten und bestätigen keine aktuelle Live-Lieferbarkeit.
- Alte offizielle Angebote ohne separat dokumentiertes Verfügbarkeitsdatum erhalten kein erfundenes Prüfdatum. Das Cockpit zeigt hierfür „nie“ bzw. keinen dokumentierten Stand, bis erneut bestätigt wird.
- Es wurde kein Browser-Klicktest mit einem angemeldeten Cockpit durchgeführt. Die bestehende Editor-/Entwurfslogik, serialisierte Speicherung, Server-/Client-Markup und Provider-Isolation sind durch die Regressionstests abgedeckt; öffentliche Seiten werden anhand des fertigen HTML geprüft.

Deployment-Empfehlung nach erfolgreicher Abschlussvalidierung: gemeinsam als reguläres Release ausrollen; anschließend die priorisierten Händlerzuordnungen und Liefernachweise im bestehenden Cockpit nachpflegen. Kein automatisches Deployment.
