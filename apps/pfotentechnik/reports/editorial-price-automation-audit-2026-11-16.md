# Redaktionelle Preissperren am 16. November 2026

Nach Korrektur der drei neuen Brunnen sind noch 18 Produkte mit priceAutomation: editorial konfiguriert. Sieben weitere Sperren sind nach dem heutigen Modell- und Preisabgleich technisch nicht mehr nötig. Die übrigen elf Fälle sind nicht pauschal freizugeben. Diese Prüfung ändert keine weiteren Produktdaten oder Sperren.

## Ursache

Das Feld wird ausdrücklich in der Produktdatei gepflegt. Das Content-Schema setzt als Standard automatic; das SEO-Cockpit trägt editorial nicht selbst aufgrund eines fehlgeschlagenen Abrufs oder fehlender Preise ein. service.mjs verweigert mit diesem Wert die Legacy-Einzelprüfung und lässt Produkte ohne weitere konfigurierte Angebote auch bei der Sammelaktualisierung aus.

Bei den drei neuen Brunnen wurde die Sperre bereits mit Einführung in Commit 46dd92ad gesetzt. Die damalige Recherche dokumentierte ausdrücklich keine Preisextraktion, sondern die Prüfung von ASIN, Modell, Bildern und Affiliate-Links. Das rechtfertigte unbekannte Preise; die dauerhafte Unterbindung späterer Prüfungen war nach bestätigter Produktzuordnung nicht mehr nötig.

Dasselbe Muster findet sich bei den sieben weiteren bestätigten Fällen: Bei Einführung der Sperre war jeweils noch keine Affiliate-URL vorhanden. Später wurden funktionierende Amazon-Ziele eingetragen, die Sperre blieb bestehen. Beispielsweise wurde Catit PIXI Smart am 16. August in f2a3f8e2 mit unbekanntem Preis und ohne Affiliate-Link angelegt; eb9f8ffb ergänzte am 17. August den Amazon-Link. Das Feld wurde dabei nicht auf automatic zurückgestellt.

Die ursprüngliche Schutzabsicht ist aus den damaligen Datensätzen ableitbar; die Commit-Nachrichten belegen keine bewusste, dauerhaft gewünschte Sperre für die später ergänzten Amazon-Angebote.

## Sieben bestätigte überholte Sperren

Die bestehenden Händlerlinks wurden mit safeFetchText und extractOfferFromHtml geprüft, also dem Abruf und Extraktor des Cockpits. Alle folgenden Seiten lieferten HTTP 200, einen zum Produkt passenden Titel und einen ASIN-validierten EUR-Preis aus dem primären Amazon-Kaufformular. Diese beobachteten Preise wurden im Rahmen dieser Prüfung nicht übernommen.

- **Cat Mate Elite 355W Mikrochip-Katzenklappe mit Timer**: /produkt/cat-mate-elite-355w/ — 78,39 €. Sperre eingeführt in f2a3f8e2, damals ohne Affiliate-URL.
- **Catit PIXI Smart-Trinkbrunnen**: /produkt/catit-pixi-smart-trinkbrunnen/ — 93,49 €. Sperre eingeführt in f2a3f8e2, damals ohne Affiliate-URL.
- **Furbo 360° Katzenkamera**: /produkt/furbo-360-katzenkamera/ — 159,00 €. Sperre eingeführt in 2488ebfb, damals ohne Affiliate-URL.
- **Litter-Robot 4**: /produkt/litter-robot-4/ — 799,00 €. Sperre eingeführt in f2a3f8e2, damals ohne Affiliate-URL.
- **Pawfit 3**: /produkt/pawfit-3/ — 64,99 €. Sperre eingeführt in f2a3f8e2, damals ohne Affiliate-URL.
- **PETKIT PUROBOT MAX 3**: /produkt/petkit-purobot-max-3/ — 444,11 €. Sperre eingeführt in 1cb2cfba, damals ohne Affiliate-URL.
- **PetSafe Keramik-Trinkbrunnen Streamside**: /produkt/petsafe-streamside-trinkbrunnen/ — 70,99 €. Sperre eingeführt in f2a3f8e2, damals ohne Affiliate-URL.

## Elf weitere gesperrte Produkte

- **Enabot ROLA PetTracker**: /produkt/enabot-rola-pettracker/ — Keine abrufbare Händler-URL für den Preis-Updater konfiguriert.
- **Invoxia Biotracker Edition 2026**: /produkt/invoxia-biotracker-2026/ — Produktseite erreichbar und Titel vorhanden, aber der bestehende Extraktor findet keinen belastbaren strukturierten Preis. Das beweist weder fehlenden Bestand noch einen defekten Affiliate-Link.
- **Neakasa M1 Plus Lite**: /produkt/neakasa-m1-lite/ — Produktseite erreichbar und Titel vorhanden, aber der bestehende Extraktor findet keinen belastbaren strukturierten Preis. Das beweist weder fehlenden Bestand noch einen defekten Affiliate-Link.
- **Neakasa Riko**: /produkt/neakasa-riko/ — Keine Affiliate-/Händler-Ziel-URL im automatischen Pfad. Die gesonderte price.source.url wurde diagnostisch geprüft, lieferte aber ebenfalls keinen auswertbaren Preis. Die Vorbestellnotiz stammt aus September und bestätigt keinen heutigen Zustand.
- **PETKIT PuraMax 2**: /produkt/petkit-puramax-2/ — Abruf überschreitet das bestehende Größenlimit von 2.500.000 Bytes. Automatische Aktualisierung mit aktuellem Abrufpfad daher nicht bestätigt.
- **PETKIT PUROBOT CRYSTAL DUO**: /produkt/petkit-purobot-crystal-duo/ — Produktseite erreichbar und Titel vorhanden, aber der bestehende Extraktor findet keinen belastbaren strukturierten Preis. Das beweist weder fehlenden Bestand noch einen defekten Affiliate-Link.
- **PetSnowy SNOW+ (SNOW)**: /produkt/petsnowy-snow-plus/ — Produktseite erreichbar und Titel vorhanden, aber der bestehende Extraktor findet keinen belastbaren strukturierten Preis. Das beweist weder fehlenden Bestand noch einen defekten Affiliate-Link.
- **PetTec Cam 360**: /produkt/pettec-cam-360/ — Abruf überschreitet das bestehende Größenlimit von 2.500.000 Bytes. Automatische Aktualisierung mit aktuellem Abrufpfad daher nicht bestätigt.
- **Prothelis area Pets**: /produkt/prothelis-area-pets/ — Der Affiliate-Link führt zu „GPS Tracker GRETA“, nicht zum dokumentierten area Pets. Zuerst Produktzuordnung korrigieren; keine automatische Preisübernahme aus diesem Angebot.
- **Reolink E1 Zoom (4K)**: /produkt/reolink-e1-zoom/ — Abruf überschreitet das bestehende Größenlimit von 2.500.000 Bytes. Automatische Aktualisierung mit aktuellem Abrufpfad daher nicht bestätigt.
- **SureFeed Microchip Pet Feeder Connect**: /produkt/surefeed-microchip-pet-feeder-connect/ — Abruf überschreitet das bestehende Größenlimit von 2.500.000 Bytes. Zusätzlich dokumentiert die Historie eine bewusste Trennung von Einzelgerät, Hub und Bundle. Die Sperre wurde in 7a5e8f5f nach früherer automatischer Preisübernahme ausdrücklich gesetzt.

Damit ergeben sich sieben bestätigte überholte Sperren, vier Abrufprobleme durch das Größenlimit, vier erreichbare Angebote ohne extrahierbaren Preis, zwei fehlende automatische Händlerziele und eine falsche Produktzuordnung.

## Prüfung und Grenzen

Alle 18 verbliebenen editorial-Datensätze wurden vollständig inventarisiert und ihre Einführung in Git nachvollzogen. Bei 17 Produkten konnte eine Händler- oder diagnostische Quellen-URL abgerufen werden; Enabot hat kein solches Ziel. Abfragen waren lesend. Die Rohbefunde mit Zeitpunkten, Ziel-URLs, Titeln, Extraktionsergebnissen und historischen Commits stehen in ../research/editorial-price-automation-audit-2026-11-16.json.

Die bestehenden Tests für Preisintelligenz und die Trennung von Preis und Verfügbarkeit wurden erneut ausgeführt. Kein neuer Produktionscode, keine weiteren Produktpreisänderungen, keine Änderung am Größenlimit, kein Merge und kein Deployment. Die Änderungen an den zuvor beauftragten drei Brunnen bleiben bestehen.

## Anschließende Entsperrung auf Betreiberauftrag

Am 16. November 2026 wurden die sieben oben bestätigten überholten Sperren auf ausdrücklichen Auftrag auf priceAutomation: automatic umgestellt. Sie nehmen damit wieder an der Einzel- und Sammelaktualisierung des SEO-Cockpits teil. Die elf ungeklärten Fälle bleiben redaktionell gesperrt. Die Entsperrung allein aktualisiert keine gespeicherten Preise oder Verfügbarkeiten.
