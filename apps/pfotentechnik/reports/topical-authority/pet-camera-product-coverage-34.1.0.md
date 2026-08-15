# Haustierkameras: Produktabdeckung validiert

Stand: 15.08.2026

## Entscheidungsgrundlage

- Der Hauptvergleich besitzt bereits drei eigenstÃ¤ndige Produktrollen: feste Schwenk-/Neigekamera, feste Interaktionskamera und mobiler Kamera-Roboter.
- Alle drei Produktseiten sind aktiv, eindeutig als `haustierkameras` kategorisiert, im Vergleich enthalten und mit einer expliziten Decision Journey versehen.
- Die vorhandenen Search-Daten sind fÃ¼r eine Erweiterung nicht belastbar: Der kombinierte 7-Tage-Datensatz ist `partial` und `lowData` (36 Impressionen insgesamt), GSC ebenfalls `lowData` (10 Impressionen). Es gibt keine Kamera-Route und keine passende Kamera-Query in den vorhandenen Listen.
- Es wurde keine externe Produkt- oder MarktprÃ¼fung durchgefÃ¼hrt. Zwei weitere Produkte nur zur bisherigen Sollzahl 5 anzulegen, wÃ¼rde keinen belegten Information Gain schaffen.

## Intent-Matrix

| Route / Datei | Aktueller Nutzer- und Suchintent | Soll-Intent | Intent-Owner | Risiko | Entscheidung | Konkrete Ã„nderung | AbhÃ¤ngigkeit | Objektives Akzeptanzkriterium |
|---|---|---|---|---|---|---|---|---|
| `/haustierkameras/` | Kameraklasse, Aufstellung, Datenschutz und Kosten vor der Modellwahl klÃ¤ren | Orientierung und Ausschlusskriterien besitzen | Route selbst | Niedrig; Modellentscheidung ist ausgelagert | behalten | Bewusst unverÃ¤ndert | Hauptvergleich | `decisionJourney.stage` bleibt `orientation`, `next` zeigt auf genau den Hauptvergleich |
| `/smarte-haustiertechnik/` | Breiter Einstieg in smarte Haustiertechnik | Nur Parent-Hub und ClusterzufÃ¼hrung | Route selbst | Mittel bei Ãœbernahme von Kameradetails | behalten | Bewusst unverÃ¤ndert | Kamera-Hub | Keine produktspezifische Kameraentscheidung auf der Parent-Route |
| `/vergleiche/beste-haustierkameras/` | Drei Produktklassen anhand Blickbereich, Interaktion, Speicherung, Abo und Kosten vergleichen | Evaluations-Owner ohne pauschalen Testsieger | Route selbst | Niedrig; Rollen sind klar getrennt | behalten | Bewusst unverÃ¤ndert | Drei Produktseiten | Genau drei `items`, drei unterschiedliche Klassen und drei passende `decisionJourney.next`-Ziele |
| `/produkt/petlibro-scout-smart-camera/` | Feste Cloudkamera mit Mehrtiererkennung und Abo prÃ¼fen | Entscheidung fÃ¼r festen Mehrtier-Blickpunkt | Route selbst | Niedrig | behalten | Produktseite bewusst unverÃ¤ndert | Vergleich, PETLIBRO | Eigener Canonical und Intent `petlibro-scout-pruefen`; Cloud-/Abo-Grenze bleibt sichtbar |
| `/produkt/furbo-360-hundekamera/` | Interaktionskamera mit Audio und Leckerliausgabe prÃ¼fen | Entscheidung fÃ¼r bewusste Ferninteraktion | Route selbst | Niedrig | behalten | Bewusst unverÃ¤ndert | Vergleich, Furbo | Eigener Canonical und Intent `furbo-360-pruefen`; Betreuung wird nicht versprochen |
| `/produkt/enabot-ebo-air-2/` | Mobilen Kameraroboter und Wohnungstauglichkeit prÃ¼fen | Entscheidung fÃ¼r beweglichen Blickpunkt | Route selbst | Niedrig | behalten | Bewusst unverÃ¤ndert | Vergleich, Enabot | Eigener Canonical und Intent `mobilen-kameraroboter-pruefen`; Fahrweg bleibt Ausschlusskriterium |
| `/hersteller/enabot/` | Herstellerkontext fÃ¼r mobile Kameraroboter | Marken- und Servicekontext, keine Produktentscheidung | Route selbst | Niedrig | behalten | Bewusst unverÃ¤ndert | EBO Air 2 | Strukturierte Produktbeziehung und Link zum Vergleich bleiben vorhanden |
| `/hersteller/furbo/` | Herstellerkontext fÃ¼r Interaktionskameras und Nanny-Dienste | Marken- und Abokontext, keine Produktentscheidung | Route selbst | Niedrig | behalten | Bewusst unverÃ¤ndert | Furbo 360 | Strukturierte Produktbeziehung und Link zum Vergleich bleiben vorhanden |
| `/hersteller/petlibro/` | Breites Ã–kosystem aus Feedern, Brunnen und Kamera | Herstellerkontext einschlieÃŸlich Scout | Route selbst | Mittel, da die Marke mehrere Cluster bedient | schÃ¤rfen | `petlibro-scout-smart-camera` in `productSlugs` ergÃ¤nzt | Scout-Produktseite | Hersteller wird Ã¼ber die strukturierte Produktbeziehung dem Kameracluster zugeordnet, nicht Ã¼ber Body-Keywords |
| Kandidaten Produkt 4 und 5 | Keine konkrete offene Produkt- oder Nutzerfrage | Nur bei neuer Entscheidungsrolle | keiner | Hoch: VariantenaufblÃ¤hung | verwerfen | Strategisches Produktminimum auf die drei belegten Klassen kalibriert | Search-Signal oder neue Nutzeraufgabe fehlen | Kein Produkt-Finding bei drei vorhandenen Klassen; keine neue Produktseite |
| Kandidat dritter Ratgeber | Keine belegte eigenstÃ¤ndige Suchintention | Nur bei eigener Nutzeraufgabe und Information Gain | keiner | Hoch: Kannibalisierung des Hubs | verwerfen | Keine neue Route | Search-Signal und eigenstÃ¤ndige Nutzerfrage fehlen | `Ratgeber 2/3` bleibt als bewusste Grenze offen |

## Reihenfolge und drei umgesetzte Verbesserungen

1. Die Produktabdeckung wurde auf drei tatsÃ¤chlich eigenstÃ¤ndige Entscheidungsrollen kalibriert; die bisherige Sollzahl 5 war fÃ¼r diesen Cluster nicht begrÃ¼ndet.
2. Topical-Authority-Loader und Journey-Audit erfassen Inline-Frontmatter sowie bestehende Ziele aus `decisionJourney.next` und `fallback` strukturiert.
3. Die fehlende strukturierte Beziehung zwischen PETLIBRO und der Scout Smart Camera wurde geschlossen.

Nach der Korrektur: Score 94/100, Status `strong`, 2 Ratgeber/Hubs, 1 Vergleich, 3 Produkte, 3 Hersteller, Journey vollstÃ¤ndig und Linkabdeckung 100 %. Das Finding `Produkte 3/5` wird nicht mehr erzeugt.

## Offene Fragen und Grenzen

- PETLIBRO Scout: Cloudumfang, KI-Funktionen und laufende Tarifkosten bleiben modell- und tarifabhÃ¤ngig.
- Furbo: Der konkrete Nutzen von Ton und Leckerliausgabe hÃ¤ngt von der Reaktion des Hundes ab; die Kamera ersetzt keine Betreuung.
- Enabot: Aktuelle Speicheroptionen und die reale Befahrbarkeit der Wohnung bleiben vor dem Kauf konkret zu prÃ¼fen.
- Ohne Kamera-spezifische Search-Daten wird weder ein zusÃ¤tzliches Modell noch ein neuer Ratgeber empfohlen.
