# Einzelentscheidungen zu 16 Snapshot-Konflikten

Die alten Baselines werden nicht überschrieben. Eine neue, bewusst kleine Revisionsliste verbindet die
fünf geprüften Ausgangs-/Enddateien. Negative Tests verhindern unreviewte Zusatzbytes, Scoreänderungen,
Experiment-Ausnahmen und das erneute Überschreiben durch einen historischen Applier.

Tatsächliche Snapshot-Dateiänderungen: vier Quellhashes im JSON-/Markdown-Report 35.7 sowie der konkret
betroffene Indexationsreport 36.1 mit Markdown und Cockpit-Projektion. Belege:
`snapshot-edits.json`, `indexation-snapshot-edits.json`. Keine pauschale Regeneration sämtlicher Snapshots.

## S01 · 35.8-Abschlussreport ist aus dem finalen Build reproduzierbar

35.8-Berichtskette bricht im gemeinsamen Quellfreigabe-Verifier ab.

Entscheidung: Gemeinsamen Verifier mit exakter Revisionsbrücke korrigieren; --check behalten.

Betroffene Dateien: `scripts/product-integration/verify.mjs`, `scripts/product-freshness/approved-changes.mjs`.

Kein Anlass zum Neuschreiben dieses gesamten Berichts; die damalige Integration bleibt reproduzierbar.

Nachprüfung: finaler unverändert aktivierter Test, siehe `validation.md`.

## S02 · 35.9: alle 110 Dateien, Scores, Preise, Affiliate-Ziele und Originale bytegenau erhalten

Whole-file-SHA aus 35.9 kollidiert mit vier begründeten neuen Produktrevisionen.

Entscheidung: Alten Bytevertrag erhalten und eine exakte Vorher-/Nachher-Brücke für 35.6 prüfen.

Betroffene Dateien: `test/decision-consequences-35.9.test.mjs`, `scripts/product-evidence/approved-changes.mjs`.

Jedes weitere Byte scheitert; fünf bewusst begrenzte Einträge, keine Wildcards und keine geschützten Routen.

Nachprüfung: finaler unverändert aktivierter Test, siehe `validation.md`.

## S03 · 35.9: alle 20 Experimentseiten und 205 eingehenden Linkkanten unverändert

Gemeinsamer 36.0-/35.8-Quellhashvertrag scheitert vor der eigentlichen Experiment-/Buildprüfung.

Entscheidung: Nur die bekannten Revisionen belegen und anschließend sämtliche Publikations-, Link- und Experimentschutzprüfungen ausführen.

Betroffene Dateien: `scripts/product-freshness/approved-changes.mjs`, `scripts/product-integration/verify.mjs`.

Die ursprüngliche Fehlermeldung beweist keine veränderte Experimentseite. Der unabhängige Vergleich prüft sie weiterhin vollständig.

Nachprüfung: finaler unverändert aktivierter Test, siehe `validation.md`.

## S04 · 35.9: vollständiger Vorher-Nachher-Report ist reproduzierbar

35.9-Berichtskette scheitert am vorgelagerten 36.0-/35.8-Quellhashvertrag.

Entscheidung: Quellprüfung auf die explizit belegte historische Grenze plus aktuelle Revision erweitern.

Betroffene Dateien: `scripts/decision-consequences/report.mjs`, `scripts/product-freshness/approved-changes.mjs`.

Keine Entscheidungskonsequenzen oder Scores geändert; die vollständige Berichtreproduktion bleibt Pflicht.

Nachprüfung: finaler unverändert aktivierter Test, siehe `validation.md`.

## S05 · 36.0: 35.5-Seiten und 205 Linkzugänge exakt erhalten; Vergleichsauswahl mindestens zehn

Gemeinsamer 36.0-/35.8-Quellhashvertrag scheitert vor der eigentlichen Experiment-/Buildprüfung.

Entscheidung: Nur die bekannten Revisionen belegen und anschließend sämtliche Publikations-, Link- und Experimentschutzprüfungen ausführen.

Betroffene Dateien: `scripts/product-freshness/approved-changes.mjs`, `scripts/product-integration/verify.mjs`.

Die ursprüngliche Fehlermeldung beweist keine veränderte Experimentseite. Der unabhängige Vergleich prüft sie weiterhin vollständig.

Nachprüfung: finaler unverändert aktivierter Test, siehe `validation.md`.

## S06 · 36.0: alle URLs, SEO-Felder, Kaufziele, Preise und 437 Originalhinweise geschützt

Historischer Vollfeldvergleich behandelt neue experience-/FAQ-/Evidenzfelder als unbeabsichtigte Änderungen.

Entscheidung: Für den historischen Feldvergleich ausschließlich die fünf exakt freigegebenen Revisionen zurückprojizieren; unveränderliche Felder zusätzlich direkt schützen.

Betroffene Dateien: `test/product-freshness-36.0.test.mjs`, `scripts/product-evidence/approved-changes.mjs`.

Die aktuelle vollständige Datei muss den neuen Hash erfüllen. Scores, Kaufdaten, Metadaten und Originalhinweise dürfen nicht ausgenommen werden.

Nachprüfung: finaler unverändert aktivierter Test, siehe `validation.md`.

## S07 · 36.0: selektive Änderungen reproduzierbar, keine pauschale Neufassung

36.0-Applier erlaubt nur seinen damaligen Ausgangs-/Endhash; neuere belegte Produktpräzisierungen passen nicht hinein.

Entscheidung: Historische Berechnung gegen die hashgeprüfte vorherige Fassung reproduzieren; --write verweigert spätere Revisionen vor jedem Schreibzugriff.

Betroffene Dateien: `scripts/product-freshness/apply.mjs`, `test/product-freshness-36.0.test.mjs`.

Kein Rückschreiben historischer Texte über die fachlich richtigen Ergänzungen aus 35.6.

Nachprüfung: finaler unverändert aktivierter Test, siehe `validation.md`.

## S08 · 36.1: Report und Änderungen sind reproduzierbar, Baseline wird nicht überschrieben

Abgeleiteter Indexationsreport enthält Text-/Hashmerkmale vor 35.6 und 21 statt 22 ergänzten Kontextkanten.

Entscheidung: Diesen konkreten Report, sein Markdown und die Cockpit-Projektion nach semantischem Einzelvergleich aktualisieren.

Betroffene Dateien: `reports/indexation-improvements-36.1.json`, `reports/indexation-improvements-36.1.md`, `src/data/seo/indexation-dashboard.json`.

Nur fünf Quellhashes ändern sich; weitere QA-Merkmale ändern sich durch Wiederholungszählung und eine neue Kante. Historische Google-Belege bleiben unverändert.

Nachprüfung: finaler unverändert aktivierter Test, siehe `validation.md`.

## S09 · 36.1: Vorher/Nachher zeigt nur belegte Kontextverbesserungen und historische Indexquellen

Der neue F.A.Z.-Titel erzeugt durch vorhandenes Auto-Linking einen zusätzlichen gültigen Link von Granary Camera zu /futterautomat-katze/.

Entscheidung: Genau diese einzelne Kante ergänzen; ursprüngliche zwölf Kontextlinks und neun Geschenkfinder-Kanten weiter exakt zählen.

Betroffene Dateien: `test/indexation-improvements-36.1.test.mjs`.

Keine Experimentseite betroffen, keine entfernte Kante und keine neue URL. Kein allgemeines Erhöhen eines Toleranzwerts.

Nachprüfung: finaler unverändert aktivierter Test, siehe `validation.md`.

## S10 · 36.1: alle 110 Produktdateien und 20 geschützten Seiten bleiben erhalten

Dasselbe alte Quellhash-Inventar vor den vier Produktrevisionen; danach zusätzlich ortsabhängige Style-IDs in isolierter Prüfung.

Entscheidung: Exakte Revisionsbrücke und beweisgebundenen Style-/Bildvergleich verwenden.

Betroffene Dateien: `test/indexation-improvements-36.1.test.mjs`, `scripts/indexation/verify.mjs`.

20 Quellen und 205 Zugänge werden weiterhin vollständig geprüft. Style-Code und sämtliche CSS-Eigenschaften bleiben geschützt.

Nachprüfung: finaler unverändert aktivierter Test, siehe `validation.md`.

## S11 · 37.4: historical baselines and all existing product files are byte-identical to the pre-cleanup inventory

37.4-Quellinventar erwartet alte Produktbytes.

Entscheidung: Begrenzte Revisionsbrücke nur bei exakt bekanntem neuem Hash zulassen.

Betroffene Dateien: `test/release-gate-37.4.test.mjs`, `scripts/product-evidence/approved-changes.mjs`.

Historische Baselines selbst werden nicht neu erzeugt; unbekannte Dateien werden unverändert streng geprüft.

Nachprüfung: finaler unverändert aktivierter Test, siehe `validation.md`.

## S12 · all 110 product sources remain byte-identical, including original decisionFacts

Geschenkfinder-Quellinventar friert auch redaktionelle Evidenzfelder ein.

Entscheidung: Historische Bytes und die exakt zugelassene aktuelle Revision gemeinsam validieren.

Betroffene Dateien: `test/gift-guide-37.0.test.mjs`, `scripts/product-evidence/approved-changes.mjs`.

Kein Produkt wird aus dem Inventar entfernt; Originalhinweise bleiben unverändert.

Nachprüfung: finaler unverändert aktivierter Test, siehe `validation.md`.

## S13 · bestehende Scores, Teilbewertungen, SEO-Metadaten und decisionFacts bleiben exakt erhalten

Der Test ruft den gemeinsamen Freigabe-Verifier auf, der bereits beim neuen Evidenzhash abbricht. Kein nachgewiesener Scorefehler.

Entscheidung: Vorgelagerten Hashvertrag korrigieren; alle geschützten Bewertungs-/SEO-/Kaufdatenvergleiche erhalten.

Betroffene Dateien: `scripts/product-freshness/approved-changes.mjs`.

Nicht einen vermeintlichen Scorefehler durch geänderte Scores beseitigen.

Nachprüfung: finaler unverändert aktivierter Test, siehe `validation.md`.

## S14 · built canonical prices and derived totals are current; ratings, destinations and technical hints remain protected

Geschenkkatalog friert auch die überarbeitete erste One-RFID-Stärke als alte Produktbehauptung ein.

Entscheidung: Nur für die exakt freigegebene strengths-Änderung den aktuellen, aus Quellen erzeugten Katalog erwarten.

Betroffene Dateien: `test/gift-guide-37.1.test.mjs`, `scripts/product-evidence/approved-changes.mjs`.

Score, Preise, Kaufziele und technische Merkmale bleiben separat an alte und aktuelle Originaldaten gebunden.

Nachprüfung: finaler unverändert aktivierter Test, siehe `validation.md`.

## S15 · regulärer Build schützt Entwürfe, Experiment-Zugänge und Vergleichsmitgliedschaft

Gemeinsamer 36.0-/35.8-Quellhashvertrag scheitert vor der eigentlichen Experiment-/Buildprüfung.

Entscheidung: Nur die bekannten Revisionen belegen und anschließend sämtliche Publikations-, Link- und Experimentschutzprüfungen ausführen.

Betroffene Dateien: `scripts/product-freshness/approved-changes.mjs`, `scripts/product-integration/verify.mjs`.

Die ursprüngliche Fehlermeldung beweist keine veränderte Experimentseite. Der unabhängige Vergleich prüft sie weiterhin vollständig.

Nachprüfung: finaler unverändert aktivierter Test, siehe `validation.md`.

## S16 · vollständiger Qualitätsreport ist reproduzierbar und erteilt keine Freigaben

Quellhashes im 35.7-Report enthalten noch die alten vier Produktdateien. Die 437 Entscheidungshinweise selbst sind unverändert.

Entscheidung: Nur vier sourceHash-Werte und zugehörige Markdown-Hashes erneuern.

Betroffene Dateien: `reports/decision-facts-quality-35.7.json`, `reports/decision-facts-quality-35.7.md`.

Keine Freigaben, Hinweisfingerprints, Regeln oder Rohtexte geändert; vollständiger --check bleibt aktiv.

Nachprüfung: finaler unverändert aktivierter Test, siehe `validation.md`.

## Nachgewiesene technische Build-Artefakte

Die isolierte Kopie verändert ortsabhängige Astro-Scope-IDs von ProductScore/TableOfContents und den
Namen eines ansonsten identischen CSS-Bundles. Eine zusätzliche Beweisprüfung verlangt identische
Komponenten-Quellhashes und bis auf genau diese IDs bytegleiches CSS. Erst danach dürfen die IDs im
DOM-Vergleich normalisiert werden. Die tatsächliche Website wird dabei nicht umgeschrieben.
Geänderte Farben oder Komponentenquellen scheitern an eigenen Negativtests.

Der aktualisierte Indexationsreport ändert nur fünf Inhaltsquellhashes. Andere betroffene QA-Einordnungen
folgen aus der geänderten Wiederholungshäufigkeit identischer Absätze oder der einen neuen Titel-Kante;
sie ändern keine Produkt-Scores oder Website-Rangfolgen. GSC-/HTTP-Quelldaten behalten ihre Originaldaten.
