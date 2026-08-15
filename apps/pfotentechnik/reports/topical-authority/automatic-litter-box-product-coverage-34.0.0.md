# Automatische Katzentoiletten: Produktabdeckung validiert

Stand: 15.08.2026

## Entscheidungsgrundlage

- Der Ã¼bergebene Cockpit-Stand von 2 Produkten und 0 Herstellern war technisch unvollstÃ¤ndig. Drei gÃ¼ltige Produktseiten nutzten eine Inline-YAML-Kategorie, die der Loader nicht gelesen hat.
- Im Repository sind fÃ¼nf kategorisierte und im bestehenden Hauptvergleich gefÃ¼hrte Produkte vorhanden. Vier Herstellerseiten besitzen eine strukturierte Beziehung zu mindestens einem dieser Produkte.
- Die aktuellen Search-Daten sind fÃ¼r diesen Cluster nicht entscheidungsfÃ¤hig: Der kombinierte 7-Tage-Datensatz ist als `lowData` und `partial` markiert (36 Impressionen insgesamt), der GSC-Datensatz als `lowData` (10 Impressionen). Keine Clusterroute und keine Clusterquery erscheint in den vorhandenen Seiten- oder Querylisten.
- Es wurde keine externe Produkt- oder MarktprÃ¼fung durchgefÃ¼hrt. Die Entscheidung beruht auf Repository-Bestand, strukturierten Beziehungen, vorhandener Evidenzkennzeichnung und Journey-Logik.

## Intent-Matrix

| Route / Datei | Aktueller Nutzer- und Suchintent | Soll-Intent | Aktueller Intent-Owner | Risiko | Entscheidung | Konkrete Ã„nderung | AbhÃ¤ngigkeit | Objektives Akzeptanzkriterium |
|---|---|---|---|---|---|---|---|---|
| `/automatische-katzentoiletten/` | Sicherheit, Passform, Streu, Platz und GewÃ¶hnung vor der Modellauswahl klÃ¤ren | Orientierung und Ausschlusskriterien besitzen | Route selbst | Niedrig; verweist fÃ¼r Modellwahl in den Vergleich | behalten | Bewusst unverÃ¤ndert | Hauptvergleich | Genau ein Orientation-Owner mit `next` zum Vergleich |
| `/smarte-haustiertechnik/` | Breiter Einstieg in smarte Haustiertechnik | Nur Parent-Hub und ClusterzufÃ¼hrung | Route selbst | Mittel, wenn sie Detailberatung Ã¼bernÃ¤hme | behalten | Bewusst unverÃ¤ndert | Katzenklo-Hub | Kein Modellvergleich auf der Parent-Route |
| `/vergleiche/beste-automatische-katzentoiletten/` | FÃ¼nf Modelle anhand gemeinsamer Ausschluss- und Betriebskriterien vergleichen | System- und Modellentscheidung besitzen; Varianten klar kennzeichnen | Route selbst | M1 Plus und M1 Lite sind technisch sehr nah | schÃ¤rfen | M1 Lite als Lieferumfangsvariante der offenen M1-Entscheidung und Devoko als eingeschrÃ¤nkte preisorientierte Alternative benannt | FÃ¼nf Produktseiten | Alle fÃ¼nf Slugs bleiben in `items` und `decisionJourney.next`; Empfehlung nennt beide Abgrenzungen |
| `/produkt/neakasa-m1-lite/` | Konkrete M1-Lite-Passform und Lieferumfang prÃ¼fen | Produktentscheidung fÃ¼r die Lite-Variante | Route selbst | Mittel gegenÃ¼ber M1 Plus | behalten | Bewusst unverÃ¤ndert; vorhandene FAQ, Empfehlung und Produkttext besitzen den Lieferumfangsunterschied bereits | Vergleich, Neakasa-Herstellerseite | Eigener Canonical; Intent `neakasa-m1-lite-pruefen`; Unterschied zu M1 Plus bleibt explizit |
| `/produkt/devoko-90l-automatisches-katzenklo/` | Konkretes preisorientiertes XXL-Modell trotz Datenunsicherheit prÃ¼fen | Produktentscheidung mit sichtbarer Evidenzgrenze | Route selbst | Niedrig; eigenstÃ¤ndige Bauform-, Einstieg- und Dokumentationsfrage | behalten | Bewusst unverÃ¤ndert; Unsicherheiten sind bereits in Entscheidung, Specs und Fazit markiert | Vergleich, Devoko-Herstellerseite | Eigener Canonical; Intent `devoko-90l-pruefen`; widersprÃ¼chliche Sensor-, MaÃŸ- und Garantiedaten bleiben sichtbar |
| `/produkt/litter-robot-5-pro/` | Geschlossenes Premiumsystem mit Kamera prÃ¼fen | Premium-/Kamera-Produktentscheidung | Route selbst | Niedrig | behalten | Keine InhaltsÃ¤nderung; Inline-Kategorie wird nun zentral erkannt | Whisker-Herstellerseite | `category.key` wird dem Cluster `katzentoiletten` zugeordnet |
| `/produkt/petkit-purobot-max-pro-2/` | Geschlossenes Kamera-System fÃ¼r Mehrkatzenprofile prÃ¼fen | PETKIT-Produktentscheidung mit offenen Sicherheitsfragen | Route selbst | Niedrig | behalten | Keine ProduktÃ¤nderung; Inline-Kategorie zentral erkannt | PETKIT-Herstellerseite | `category.key` wird erkannt und Herstellerbeziehung ist strukturiert |
| `/produkt/neakasa-m1-plus/` | Offene M1-Systementscheidung mit vollem Lieferumfang | PrimÃ¤re offene M1-Systemvariante | Route selbst | Mittel gegenÃ¼ber M1 Lite | behalten | Keine InhaltsÃ¤nderung; Inline-Kategorie zentral erkannt | Vergleich, Neakasa-Herstellerseite | Beide M1-Produkte bleiben getrennte Canonicals, der Vergleich bezeichnet Lite als Lieferumfangsvariante |
| `/hersteller/devoko/` | Hersteller- und Servicekontext zum Devoko 90L | Herstellerkontext, keine Modellentscheidung | Route selbst | Niedrig | behalten | Keine InhaltsÃ¤nderung; Zuordnung wird aus `productSlugs` ermittelt | Devoko-Produkt | Wird als Cluster-Hersteller gezÃ¤hlt, ohne Body-Keyword-Heuristik |
| `/hersteller/neakasa/` | Herstellerkontext zur M1-Familie | Herstellerkontext fÃ¼r beide M1-Varianten | Route selbst | Niedrig | behalten | Keine InhaltsÃ¤nderung; beide Produktbeziehungen werden strukturiert ausgewertet | M1 Plus, M1 Lite | Wird als Cluster-Hersteller gezÃ¤hlt; beide Slugs bleiben referenziert |
| `/hersteller/whisker/` | Herstellerkontext zum Litter-Robot | Herstellerkontext, keine Premium-Modellentscheidung | Route selbst | Niedrig | behalten | Keine InhaltsÃ¤nderung; Produktbeziehung wird strukturiert ausgewertet | Litter-Robot 5 Pro | Wird als Cluster-Hersteller gezÃ¤hlt |
| `/hersteller/petkit/` | MarkenÃ¼bergreifendes Ã–kosystem und Produktsortiment | Herstellerkontext einschlieÃŸlich PUROBOT | Route selbst | Mittel, weil PETKIT mehrere Cluster bedient | schÃ¤rfen | `petkit-purobot-max-pro-2` in `productSlugs` ergÃ¤nzt; Zuordnung erfolgt nicht Ã¼ber beilÃ¤ufigen Bodytext | PUROBOT-Produkt | PETKIT wird trotz anderer Produktkategorien korrekt dem Katzenklo-Cluster zugeordnet |
| Kandidat dritter Ratgeber | Noch keine belegte eigenstÃ¤ndige Suchintention | Nur bei eigener Nutzeraufgabe und Information Gain | keiner | Hoch: Quoten-Seite und Kannibalisierung des Hubs | verwerfen | Keine neue Route | Belastbare Search-Daten oder konkrete Nutzerfrage fehlen | Kein neuer Content nur fÃ¼r `Ratgeber 2/3` |

## Reihenfolge und drei umgesetzte Verbesserungen

1. Loader zentral korrigiert: Inline- und Blockschreibweisen werden fÃ¼r strukturierte Kategorien beziehungsweise Produktlisten gelesen; Hersteller werden Ã¼ber ihre Produktbeziehungen zugeordnet.
2. PETKIT-Beziehung geschlossen: PUROBOT ist im vorhandenen Herstellerdatensatz als Produkt referenziert.
3. Vergleich geschÃ¤rft: M1 Lite wird nicht als neue Systemklasse dargestellt; Devoko bleibt wegen der dokumentierten Datenlage eine eingeschrÃ¤nkte Alternative.

Nach der Korrektur: Score 90/100, Status `strong`, 2 Ratgeber/Hubs, 1 Vergleich, 5 Produkte, 4 Hersteller, Journey vollstÃ¤ndig, Linkabdeckung 75 %. Die frÃ¼heren Findings `Produkte 2/5` und `Hersteller 0/2` werden nicht mehr erzeugt. Die rechnerische LÃ¼cke `Ratgeber 2/3` bleibt bewusst offen, weil keine eigenstÃ¤ndige Suchintention belegt ist.

## Offene Fragen und Grenzen

- Devoko: Modellvariante, Sensoranzahl, AuÃŸenmaÃŸe und Garantie bleiben in den vorhandenen Quellen widersprÃ¼chlich.
- PETKIT PUROBOT: Mindestgewicht und regionale Streuliste bleiben als offene Produktfragen markiert.
- Neakasa: Die Bezeichnungen M1 Lite, M1 Plus Lite und M1 Lite Plus sind nicht durchgehend konsistent.
- Die geringere Linkabdeckung nach der Korrektur entsteht durch den nun vollstÃ¤ndigeren Clusterumfang. Es wurden keine Links nur zur Kennzahlverbesserung eingefÃ¼gt.
