# PFOTENTECHNIK — Subscription & Total Cost Transparency

Abschlussstand: 2026-09-02

## RESEARCH

- **GPS-Produkte geprüft:** 12/12 aktive GPS-Tracker.
- **Kameras geprüft:** 8/8 aktive Haustierkameras.
- **Produkte mit verpflichtenden Kosten:** 10; darunter neun klassische Pflichtabo-Modelle und Prothelis mit Wahl zwischen Abo und Prepaid.
- **Produkte mit optionalen Kosten:** 14; sieben Kameras und sieben weitere aktive Produkte mit vorhandenem Repository-Hinweis auf einen digitalen Zusatzdienst.
- **Produkte ohne verpflichtendes Abo:** 16; 14 optionale Dienste plus zwei VHF-Tracker ohne Mobilfunkabo.
- **Produkte mit unbekanntem Status:** 1 (`enabot-ebo-air-2`).
- **Aktuelle Preise gefunden:** 16/27. Bei GPS 9/12, bei Kameras 5/8, bei den weiteren Produkten 2/7.
- **Preise nicht belastbar ermittelbar:** 9/27. Zwei weitere GPS-Produkte benötigen keinen kostenpflichtigen Digitaldienst und sind deshalb für Servicepreise nicht anwendbar.
- **Evidence Coverage:** GPS 12/12, Kameras 8/8. Die Recherche bevorzugt offizielle Hersteller-, Preis-, Shop- und Supportquellen für Deutschland.

Details und Einzelquellen: [research.md](./research.md), [research.json](./research.json), [scope-audit.md](./scope-audit.md) und [coverage.json](./coverage.json).

## DATA MODEL

- **Vorhandene Felder wiederverwendet:** Das bestehende `price`-Objekt bleibt alleinige Quelle für Gerätepreise; `gps.subscriptionRequired` bleibt ein rückwärtskompatibler Fallback. Produktstatus, operative Preisverfügbarkeit, Vergleichszeile `abo` und bestehende Evidence-Quellen bleiben erhalten.
- **Neue Felder:** Optionales `subscription`-Objekt mit Status, Grundfunktionspflicht, Diensttyp, Servicemodell, Anbieter, Inklusivmonaten, Research-/Checkdatum, Quelle, freien/bezahlten Funktionen, Zusatzkostenhinweis und strukturierten Plänen.
- **Planmodell:** Name, Zahlperiode, Bindungsmonate, Zahlungsweise, tatsächlicher Zahlbetrag, Währung, Monatsäquivalent, Auto-Renew, Hervorhebung und Notiz.
- **Statusmodell:** `required-subscription`, `required-prepaid`, `optional-subscription`, `no-subscription`, `service-included`, `unknown`.
- **Migrationen:** 27 aktive Produkte: 12 GPS, 8 Kameras, 7 weitere begründete Servicekostenfälle.
- **Freshness:** Exakte Servicepreise gelten 120 Tage als aktuell. Danach bleiben Pflicht-/Optionalstatus und Zusatzkostenwarnung erhalten, exakte Beträge und Gesamtkosten entfallen.
- **Rechenregel:** 12-/24-Monats-Kosten verwenden den tatsächlichen Abrechnungszyklus und nur aktuelle, strukturierte Geräte- und Servicepreise. Jahres- oder Mehrjahreszahlungen werden nicht als fiktive Monatsabbuchung dargestellt.

## PRODUCT UX

- **Produktseiten mit Kostenkarte:** Alle 27 migrierten Produktseiten verwenden die erweiterte bestehende `PriceBox2` im oberen ProductExperience2-Kaufbereich; es gibt kein paralleles Preis-/Abo-Widget.
- **Bekannte Kosten:** Anschaffung, tatsächlicher Service-Zahlbetrag, Zahlungsperiode, Monatsäquivalent und belastbares 24-Monats-Beispiel sind getrennt und verständlich bezeichnet.
- **Unbekannte Zusatzkosten:** Pflichtdienste ohne belastbaren Preis zeigen eine sichtbare Zusatzkostenwarnung und niemals `0 €`, „kostenlos“ oder eine erfundene Gesamtsumme.
- **Optionale Abos:** Grundbetrieb und Premiumfunktionen sind getrennt. Optionale Cloud-/AI-Dienste werden nicht als Pflichtabo und der Grundbetrieb nicht irreführend als vollständig kostenfrei bezeichnet.
- **Tarifdetails:** Mehrere Tarife, automatische Verlängerung, Vorauszahlung, Funktionsgrenzen, 12-/24-Monats-Rechnung und Herstellerquelle liegen progressiv in einem nativen `<details>`.
- **Design:** Vorhandene Foundation-/ProductExperience2-Tokens, Light/Dark, 44-px-Disclosure-Target und mobile Einspaltengeometrie bis 410 px.

## COMPARISON UX

- **Geänderte Vergleiche:** `/vergleiche/beste-gps-tracker-fuer-hunde/`, `/vergleiche/beste-gps-tracker-fuer-katzen/`, `/vergleiche/gps-tracker-mit-langer-akkulaufzeit/`, `/vergleiche/gps-tracker-ohne-abo/`, `/vergleiche/kleine-gps-tracker-fuer-katzen/` und `/vergleiche/beste-haustierkameras/`.
- **Warum dort Kosten relevant sind:** GPS-Fernortung hängt überwiegend vom laufenden Mobilfunkdienst ab; bei Kameras bestimmt ein optionaler Cloud-/AI-Dienst den Funktionsumfang und die Langzeitkosten.
- **Umsetzung:** Die vorhandene `abo`-Zeile ist die kanonische Kostenachse. Sie zeigt Servicemodell, echten Zahlbetrag und – nur bei aktuellen, operativ verfügbaren Gerätepreisen – das 24-Monats-Szenario.
- **Mobile:** Das bestehende stapelnde Definition-List-System bleibt erhalten; keine neue breite Tabelle.
- **Build-Nachweis:** Der gebaute GPS-Vergleich enthält für Tractive `84,00 € / Jahr` und `2 Jahre 216,30 €`; der Kamera-Vergleich unterscheidet optionale Dienste und bekannte bzw. zu prüfende Tarife.

## DATA ASSET

- **Neue GPS Evidence Coverage:** 12/12 eligible Produkte, 100 %. 9 besitzen einen aktuellen bekannten Servicepreis, 1 einen sicheren Pflichtdienst mit unbekannter Tarifhöhe, 2 benötigen keinen Mobilfunkdienst.
- **Publication Gate:** Bleibt unverändert auf `needs-review`. Die Recherche verbessert die Evidence, umgeht den Freigabemechanismus aber nicht.
- **Prepaid/Abo-Trennung:** GPS-Asset Schema v2 führt Status, Diensttyp, Servicemodell, Pläne, Billing Mode und Preis-Freshness strukturiert. Prothelis wird als `subscription-or-prepaid` und separat als prepaid-fähig gezählt.
- **Aggregator:** Erfolgreich ausgeführt und idempotent erneut geprüft; 12/12 eligible, 10 Pflichtdienste, 2 ohne Mobilfunkabo, 100 % Evidence Coverage.

## SECONDARY RESEARCH

- **Spotter CatX:** Sinnvoller deutscher Research Candidate: echtes 4G-GPS, integrierte Prepaid-SIM, `required-prepaid`, keine automatische Verlängerung. 3/6/12/24 Monate werden im Voraus bezahlt; es wurde weder eine Produktseite noch ein Vergleichseintrag angelegt.
- **Litter Compatibility Readiness:** 11/11 aktive automatische Katzentoiletten besitzen das Schema, 9/11 mindestens eine Quelle und eine belastbare Aussage, aber nur 1/11 ist in allen sechs Materialachsen vollständig. Zwei Produkte besitzen weder Quelle noch belastbare Kompatibilitätsaussage. Deshalb wurde kein neues Data Asset angelegt.

Details: [litter-compatibility-readiness.md](./litter-compatibility-readiness.md).

## VALIDATION

- **Tests:** vollständige Suite 717/717 bestanden; neuer Kostenvertrag deckt Pflichtabo bekannt/unbekannt, Prepaid, optional, kein Abo, mehrere Tarife, Vorauszahlung, Monatsäquivalent, 12/24 Monate, fehlenden Gerätepreis, stale Evidence, false-free/false-TCO, GPS-Asset, Schema, Comparison und mobile CSS ab.
- **Audits:** Comparison Schema PASS (28 Seiten/ItemLists), Comparison Data PASS (28 Vergleiche, 100 % gerenderte Abdeckung), Technical SEO PASS, Strict Internal-Link Health PASS (0 Fehler, 0 Laufzeitfehler), Media PASS, Contrast PASS (38/38 Kombinationen), Responsive PASS und Performance Strict PASS.
- **Performance-Hinweis:** Der bestehende Performancevertrag meldet sechs Warnungen auf nicht durch diesen Batch veränderten Referenzseiten; keine davon ist strict-kritisch.
- **Build:** PASS, 367 Seiten.
- **Responsive QA:** 375 Light/Dark und 1600 Light/Dark: kein horizontaler Overflow, keine defekten sichtbaren Bilder, korrekte Foundation-Hintergründe, sichtbarer Pflichtstatus und sichtbare Gesamtkosten.
- **Screenshots:** [375 Light](./screenshots/tractive-dog-6-375-light.png), [375 Dark](./screenshots/tractive-dog-6-375-dark.png), [1600 Light](./screenshots/tractive-dog-6-1600-light.png), [1600 Dark](./screenshots/tractive-dog-6-1600-dark.png); Messwerte in [visual-qa.json](./screenshots/visual-qa.json).
- **Repository:** `git diff --check` PASS.

## NO CHANGE / UNKNOWN

- Keine URLs, Redirects, Canonicals, Meta-Daten, Indexability oder Intent Ownership geändert.
- Keine Affiliate-Logik, Produktbewertung, Scores oder Testclaims geändert.
- Keine neue Produktseite für Spotter CatX und kein neuer Ratgeber angelegt.
- Keine redundante Hub-Tariftabelle: `/gps-tracker/` und `/haustierkameras/` bleiben die primären modellübergreifenden Owner; `/vergleiche/gps-tracker-ohne-abo/` behält die spezifische VHF-/Hardwarekosten-Erklärung.
- Unbekannt bleiben der exakte Service-/Tarifstatus des Enabot EBO Air 2 sowie belastbare deutsche Preise für Enabot Cloud+, Reolink Cloud, PETKIT Care+, PETLIBRO Care und Whisker+.
- PAJ-Inklusivmonate wurden wegen paketabhängiger Bedingungen nicht in Gesamtkosten eingerechnet.
- Ausländische Tarife, Rabatte, Probezeiträume und nicht garantierte künftige Preisentwicklungen wurden nicht als aktuelle deutsche Dauerkosten übernommen.

**Ergebnis:** Die Produktionsoberfläche trennt Anschaffung, Pflichtdienst, Prepaid und optionale Premiumdienste. Unsichere Preisstände bleiben sichtbar als Unsicherheit; sie werden weder als kostenlos noch als belastbare Gesamtkosten ausgegeben.
