# Produktseiten UX/CRO Redesign

Die Umsetzung folgt dem bereitgestellten Mockup über gemeinsame Komponenten für sämtliche **103 Produktdetailseiten**. Es wurden keine Produktdaten, Bewertungen, Bilder, ASINs, Partnerkennungen oder Händlerprogramme neu angelegt oder geändert.

## Änderungen

- **ProductHero2.astro:** Originalgalerie vor vollständigem Produktnamen, kompakter Einordnung, bestehendem Score-Ring und maximal drei Eignungsmerkmalen. Mobile H1 und Abstände reduziert, doppelten Innenabstand entfernt. Die Chips enthalten die vorhandenen Eignungsmerkmale; nur zwei exakt gleichbedeutende Formulierungen werden gekürzt („Hunde bis 40 cm“, „Xiaomi Home“). Zahlenbeschränkungen und vollständige Beschriftungen bleiben erhalten. Der Vergleichslink folgt der Kaufkarte als sekundäre Aktion; Kategorie- und Herstellerlinks bleiben danach zugänglich.
- **PriceBox2.astro:** Zentrale Karte „Preis & Kaufen“ mit Händlername, korrekt zugeordnetem Preis und Affiliate-Button in derselben Händlerkarte. Flexibles Layout: Preis und Button nebeneinander, andernfalls untereinander. Auf engen Displays entfällt der dekorative Buttonpfeil. Keine unbekannten Preise, Versandkosten oder Datumsangaben als Platzhalter. Ohne gültige Händleroption wird kein Kaufbutton erfunden.
- **Preiszuordnung:** Validierte Händlerpreise haben Vorrang. Ein bestehender redaktioneller Preis wird nur für die einzige verifizierte Legacy-Zuordnung mit passender Währung verwendet. Unbestätigte bzw. alte Werte heißen ausdrücklich „Früherer Anschaffungspreis“ mit entsprechender Kennzeichnung; sie werden nicht als aktuell bestätigt ausgegeben. Andere Händler oder ungeklärte Varianten erben diesen Preis nicht.
- **Laufende Kosten:** Optionale Abos kompakt als aufklappbare Zeile mit tatsächlich hinterlegtem Anbieter. Bekannte Pflichtbeträge und Zahlungsbedingungen stehen außerhalb des geschlossenen Detailbereichs. Tarifdetails, Quellen, Funktionen und Rechenbeispiele bleiben erhalten. Bei `no-subscription` entfällt dieser Bereich vollständig.
- **ProductGallery29.astro:** Bestehende Galerie und Originaldateien weiterverwendet; mobile Bilder erhalten zusätzlich das vorhandene responsive `srcset`. Bildabmessungen, priorisiertes erstes Bild und Lazy Loading weiterer Bilder bleiben bestehen. Kein neues Bildmaterial und keine neue Frontend-Bibliothek.
- **ProductExperience2.astro:** Drei alte globale Listenregeln entfernt, die die Chips wieder in eine lange Liste verwandelten und doppelte Häkchen erzeugten. Weiterführende Inhalte und Einschränkungen bleiben erhalten.

Der Einleitungstext wird nicht abgeschnitten oder pauschal umgeschrieben. Beim Xiaomi bleiben insbesondere die Beschränkung auf Hunde bis 40 cm Schulterhöhe und die technischen Gründe für die Einordnung sichtbar. Je nach Breite benötigt der vollständige Text mehr als drei Zeilen. Das im Mockup beispielhaft genannte Xiaomi-Premium-Abo wird mangels entsprechendem Produktdatensatz nicht erfunden.

## Affiliate- und Messlogik

Alle Händlerziele stammen weiterhin aus `resolveCommerceOffers` / `compareCommerceOffers`. Gültige Amazon-Links bleiben auch bei unbekannter Verfügbarkeit sichtbar, einschließlich des vorhandenen Tags und unveränderter Kurzlinks. Awin und mehrere Händler bleiben erhalten. Die Rendering-Tests prüfen außerdem getrennte Adcell- und Herstellerlinks.

Das bestehende Adcell-/Tractive-Programm ist in der Konfiguration mangels verifizierter Programm-/Publisherdaten deaktiviert. Diese Einstellung wurde nicht verändert; ein produktiver Adcell-Kaufbutton wird nicht behauptet.

`data-product`, `data-merchant`, `data-placement`, `data-page-type`, `data-affiliate-link` und die vorhandenen Tracking-URLs bleiben bestehen; `data-cta-kind="regular"` ergänzt die Positionserkennung. Im Repository wurde kein aktiver clientseitiger Affiliate-Klickrecorder nachgewiesen. Es wurden keine neue Tracking-Plattform und keine zusätzliche Erfassung personenbezogener Daten eingebaut.

Ein Sticky-Kaufbutton wurde geprüft und nicht ergänzt: Die reguläre Kaufkarte rückt deutlich nach oben; die vorhandene Navigation bleibt der einzige fixierte Bereich. Damit entstehen keine zusätzlichen Überlagerungen auf kleinen Displays.

## Validierung

- Production Build: **374 Seiten erfolgreich**.
- App-Tests: **985 bestanden**, darunter **16 Rendering-/Produktseiten-Tests** zur Kaufdarstellung. Abgedeckt sind fehlende, alte und fremdwährungsbezogene Preise; ungeklärte Varianten; unbekannte Verfügbarkeit; optionale und verpflichtende Abos; Vorauszahlung; mehrere Händler; fehlende Kaufoptionen sowie alle 103 gebauten Produktseiten.
- Affiliate-Core: **26 Tests bestanden**; gezielte Amazon-/Mehrhändler-Regressionen: **44 bestanden**.
- Technischer SEO-Audit: bestanden.
- Preis-/Verfügbarkeits-Integritätsaudit: **103 Produkte, 9 zulässige Offer-Schemas, 92 Reviews, 28 Vergleichsseiten, keine Fehler**. Der bestehende Audit erwartet beim Granary 2 Vision jetzt den neutralen Hinweis ohne erfundene Händleroption.
- Editorial Lint: **0 Fehler, 238 bestehende Warnungen**.
- Ein eigenständiger Typecheck und allgemeiner Code-Linter sind nicht eingerichtet. Astro-Kompilierung und vorhandene Tests wurden ausgeführt; sie werden nicht als vollständige TypeScript-Typprüfung ausgegeben.

### Browserfälle

Acht Produkte × vier Breiten (**360, 390, 430, 1440 px**) × zwei Farbschemata (**Hell/Dunkel**) = **64 Fälle**:

1. Xiaomi Smart Pet Food Feeder 2
2. PETKIT YumShare Dual-Hopper
3. SureFeed Microchip Pet Feeder Connect – ohne bestätigten Händlerpreis
4. PETLIBRO Polar Wet Food Feeder – gleichzeitig Amazon und Awin
5. PETLIBRO Granary 2 Vision – ohne belastbaren deutschen Preis und ohne gültige Händleroption
6. Tractive CAT 6 Mini – verpflichtende laufende Kosten
7. PETLIBRO Luma Smart Litter Box – optionales Abo, mehrere Händler
8. Cat Mate Shell Fountain – ohne Kaufmöglichkeit

Alle geprüften CTA-Texte bleiben einzeilig; bei zu wenig Platz steht der Button unter dem Preis. Geprüft werden Reihenfolge im mobilen Hero, höchstens drei Chips, geladene und dimensionierte Bilder, klickbare CTA-Flächen ab 44 px, Affiliate-Attribute, Textüberlauf und doppelte Statusmeldungen. Tarifdetails werden bei 390 px per Enter geöffnet und geschlossen; die Xiaomi-Galerie wird mit Enter geöffnet und mit Escape geschlossen. Die Browserprüfung besucht keine Affiliate-Ziele.

Die lokalen Messungen zeigen **0 horizontalen Überlauf**, **beobachteten CLS 0** sowie **CTA-Kontrast ≥ 5,42:1**. Dies sind kontrollierte lokale Prüfungen, keine Behauptung verbesserter Feldwerte oder Conversion-Raten. LCP/INP und Conversion-Effekte sind nach einem gesondert autorisierten Rollout zu beobachten.

Canonicals, Robots-Angaben, Score-Werte und Händlerziele werden mit der Vorher-Messung exakt verglichen. JSON-LD wird ebenfalls exakt verglichen; lediglich buildabhängige Namen optimierter Bilddateien werden durch den SHA-256 ihrer tatsächlich vorhandenen Dateien normalisiert. Die Bildinhalte müssen dabei bytegleich sein. Offer-/Verfügbarkeits- und Review-Angaben werden nicht ausgenommen.

### Gemessene Hero-Höhe und frühere Kaufkarte (Xiaomi, hell)

| Breite | Hero vorher | Hero nachher | Kaufkarte vorher ab | Kaufkarte nachher ab |
| --- | ---: | ---: | ---: | ---: |
| 360 px | 1250 px | 1095 px | 993 px | 745 px |
| 390 px | 1279 px | 1095 px | 1022 px | 745 px |
| 430 px | 1276 px | 1102 px | 1038 px | 749 px |
| 1440 px | 1082 px | 689 px | 892 px | 534 px |

Die Positionen beziehen sich auf den Dokumentanfang im lokalen Produktionspreview. Die Kaufkarte beginnt mobil **248–289 px früher**. Die vollständige Einordnung bleibt erhalten.

### Nachweise und Reproduktion

Die exakten Maße, Schema-Snapshots, Bildprüfsummen und Links stehen in [browser-before.json](browser-before.json) und [browser.json](browser.json). Die Vorher-Messung stammt vom lokalen Hauptbranch `5d8baa38`, der bereits die vorherige kompakte Preisbox enthielt.

Mobile Ansichten bei 390 px:

- Xiaomi: [vorher hell](before-xiaomi-smart-pet-food-feeder-2-light-390.png), [nachher hell](after-xiaomi-smart-pet-food-feeder-2-light-390.png), [nachher dunkel](after-xiaomi-smart-pet-food-feeder-2-dark-390.png)
- PETKIT: [vorher hell](before-petkit-yumshare-dual-hopper-light-390.png), [nachher hell](after-petkit-yumshare-dual-hopper-light-390.png), [nachher dunkel](after-petkit-yumshare-dual-hopper-dark-390.png)

```sh
npm run build:pfotentechnik
npm --workspace apps/pfotentechnik test
npm run test:affiliate
npm --workspace apps/pfotentechnik run lint:content
npm --workspace apps/pfotentechnik run audit:technical-seo
node apps/pfotentechnik/scripts/price-intelligence/rendered-integrity-audit.mjs
node apps/pfotentechnik/scripts/price-intelligence/compact-purchase-browser.mjs --redesign
```

Für die Browserprüfung wird Chrome/Chromium benötigt (`CHROME_PATH` bei abweichendem Pfad). Das Skript stellt den Build lokal bereit und beendet Browser und Server anschließend. Für eine neue Vorher-Basis beim alten Build denselben Prüfer mit `--redesign --baseline` ausführen; danach den neuen Build erstellen und ohne `--baseline` vergleichen. Vorher-Dateien einschließlich der Bildprüfsummen aufbewahren.

## Status

Implementierung und Nachweise liegen im Review-Branch. Kein automatischer Merge und kein Deployment wurden ausgelöst. Die Produktionsdarstellung wird durch den lokalen Build nicht geändert.
