# Analyse der ursprünglich 19 Testfehler

Erneut vollständig reproduziert: `logs/app-before.log`. Die unabhängige Vor-35.6-Baseline
`../product-evidence-update-35.6/logs/app-tests-baseline.log` belegt die drei Altfehler.
Die Kategorien bedeuten A funktionale Regression, B sachlicher Fehler, C veralteter Snapshot/Testvertrag,
D unabhängiger Bestandsfehler, E umgebungsabhängige Prüfung. Alle ursprünglichen 19 Fälle sind nach
Einzelanalyse C; drei davon bestanden schon vorher. Zusätzliche E-Fälle der isolierten Kopie sind separat
in der Validierung erläutert, nicht in die ursprünglichen 19 hineingezählt. Die Weiterführung behält alle
fachlich korrekten Inhalte aus 35.6 bei.

## E01 · DOG 6 XL wird nicht fälschlich als hands-on getestet dargestellt

Datei: `test/external-evidence-batch-3-33.6.2.test.mjs:16:1`. Kategorie C. Zusammenhang: Bestand vor 35.6.

Ursprüngliche Meldung: AssertionError [ERR_ASSERTION]: The input did not match the regular expression /Plattformwert\s+selbst ist aber nicht produktspezifisch/. Input:

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: Ersetzte Hinweisformulierung; der tatsächlich fehlgeschlagene Regex erwartete „Plattformwert selbst ist aber nicht produktspezifisch“.

Maßnahme: Herstellerdatenstatus, ausdrücklich kein eigener Praxistest, The-Verge-Berichterstattung und externer CHIP-Labortest getrennt prüfen.

Dateien: `test/external-evidence-batch-3-33.6.2.test.mjs`.

Begründung: Eine überholte Formulierung ist kein eigener Hands-on-Test; die ursprüngliche 35.6-Kurzdiagnose war hier zu grob.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

## E02 · all built heroes keep complete product names, source-backed chips and the secondary comparison link

Datei: `test/compact-product-purchase.test.mjs:170:1`. Kategorie C. Zusammenhang: Bestand vor 35.6.

Ursprüngliche Meldung: Error: ENOENT: no such file or directory, open '/Users/boris.buckowitz/ExtensionQA/affiliate-template/apps/pfotentechnik/dist/produkt/petlibro-granary-2-vision-duo/index.html'

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: Iteration über Quellen einschließlich gesperrter Entwürfe; erwartete öffentliche Granary-2-Route fehlt zu Recht.

Maßnahme: Nur publizierte Produkte auf Hero-Ausgabe prüfen; für Entwürfe ausdrücklich Routenabwesenheit verlangen.

Dateien: `test/compact-product-purchase.test.mjs`.

Begründung: Publikationssperren müssen erhalten bleiben; keine Entwurfsseite zum Bestehen des Tests veröffentlichen.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

## E03 · all built product pages retain exact merchant URLs, metadata hooks and safe public price states

Datei: `test/compact-product-purchase.test.mjs:147:1`. Kategorie C. Zusammenhang: Bestand vor 35.6.

Ursprüngliche Meldung: AssertionError [ERR_ASSERTION]: flappie

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: Pauschale sponsored-Pflicht auch für provisionsfreie offizielle Händlerlinks; aktuell Flappie mit rel=nofollow noopener. Der Loop enthielt außerdem Entwürfe.

Maßnahme: Exakte Rel-Werte aus dem Commerce-Modell prüfen, Provision/official unterscheiden und Entwurfsabwesenheit absichern.

Dateien: `test/compact-product-purchase.test.mjs`.

Begründung: Offizielle Links sind keine automatisch provisionsberechtigten Affiliate-Links. Ziele und Produktionsausgabe bleiben unverändert.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

## S01 · 35.8-Abschlussreport ist aus dem finalen Build reproduzierbar

Datei: `test/product-integration-rendered-35.8.test.mjs:49:1`. Kategorie C. Zusammenhang: Beabsichtigte fünf Evidenzänderungen aus 35.6.

Ursprüngliche Meldung: Error: Command failed: /opt/homebrew/Cellar/node/26.3.0/bin/node /Users/boris.buckowitz/ExtensionQA/affiliate-template/apps/pfotentechnik/scripts/product-integration/report.mjs --check

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: 35.8-Berichtskette bricht im gemeinsamen Quellfreigabe-Verifier ab.

Maßnahme: Gemeinsamen Verifier mit exakter Revisionsbrücke korrigieren; --check behalten.

Dateien: `scripts/product-integration/verify.mjs`, `scripts/product-freshness/approved-changes.mjs`.

Begründung: Kein Anlass zum Neuschreiben dieses gesamten Berichts; die damalige Integration bleibt reproduzierbar.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

## S02 · 35.9: alle 110 Dateien, Scores, Preise, Affiliate-Ziele und Originale bytegenau erhalten

Datei: `test/decision-consequences-35.9.test.mjs:20:1`. Kategorie C. Zusammenhang: Beabsichtigte fünf Evidenzänderungen aus 35.6.

Ursprüngliche Meldung: AssertionError [ERR_ASSERTION]: petlibro-granary-camera-feeder

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: Whole-file-SHA aus 35.9 kollidiert mit vier begründeten neuen Produktrevisionen.

Maßnahme: Alten Bytevertrag erhalten und eine exakte Vorher-/Nachher-Brücke für 35.6 prüfen.

Dateien: `test/decision-consequences-35.9.test.mjs`, `scripts/product-evidence/approved-changes.mjs`.

Begründung: Jedes weitere Byte scheitert; fünf bewusst begrenzte Einträge, keine Wildcards und keine geschützten Routen.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

## S03 · 35.9: alle 20 Experimentseiten und 205 eingehenden Linkkanten unverändert

Datei: `test/decision-consequences-35.9.test.mjs:130:1`. Kategorie C. Zusammenhang: Beabsichtigte fünf Evidenzänderungen aus 35.6.

Ursprüngliche Meldung: AssertionError [ERR_ASSERTION]: src/content/products/petlibro-granary-camera-feeder.md: Änderung entspricht nicht dem geprüften Umfang

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: Gemeinsamer 36.0-/35.8-Quellhashvertrag scheitert vor der eigentlichen Experiment-/Buildprüfung.

Maßnahme: Nur die bekannten Revisionen belegen und anschließend sämtliche Publikations-, Link- und Experimentschutzprüfungen ausführen.

Dateien: `scripts/product-freshness/approved-changes.mjs`, `scripts/product-integration/verify.mjs`.

Begründung: Die ursprüngliche Fehlermeldung beweist keine veränderte Experimentseite. Der unabhängige Vergleich prüft sie weiterhin vollständig.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

## S04 · 35.9: vollständiger Vorher-Nachher-Report ist reproduzierbar

Datei: `test/decision-consequences-35.9.test.mjs:134:1`. Kategorie C. Zusammenhang: Beabsichtigte fünf Evidenzänderungen aus 35.6.

Ursprüngliche Meldung: Error: Command failed: /opt/homebrew/Cellar/node/26.3.0/bin/node scripts/decision-consequences/report.mjs --check

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: 35.9-Berichtskette scheitert am vorgelagerten 36.0-/35.8-Quellhashvertrag.

Maßnahme: Quellprüfung auf die explizit belegte historische Grenze plus aktuelle Revision erweitern.

Dateien: `scripts/decision-consequences/report.mjs`, `scripts/product-freshness/approved-changes.mjs`.

Begründung: Keine Entscheidungskonsequenzen oder Scores geändert; die vollständige Berichtreproduktion bleibt Pflicht.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

## S05 · 36.0: 35.5-Seiten und 205 Linkzugänge exakt erhalten; Vergleichsauswahl mindestens zehn

Datei: `test/product-freshness-36.0.test.mjs:98:1`. Kategorie C. Zusammenhang: Beabsichtigte fünf Evidenzänderungen aus 35.6.

Ursprüngliche Meldung: AssertionError [ERR_ASSERTION]: src/content/products/petlibro-granary-camera-feeder.md: Änderung entspricht nicht dem geprüften Umfang

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: Gemeinsamer 36.0-/35.8-Quellhashvertrag scheitert vor der eigentlichen Experiment-/Buildprüfung.

Maßnahme: Nur die bekannten Revisionen belegen und anschließend sämtliche Publikations-, Link- und Experimentschutzprüfungen ausführen.

Dateien: `scripts/product-freshness/approved-changes.mjs`, `scripts/product-integration/verify.mjs`.

Begründung: Die ursprüngliche Fehlermeldung beweist keine veränderte Experimentseite. Der unabhängige Vergleich prüft sie weiterhin vollständig.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

## S06 · 36.0: alle URLs, SEO-Felder, Kaufziele, Preise und 437 Originalhinweise geschützt

Datei: `test/product-freshness-36.0.test.mjs:40:1`. Kategorie C. Zusammenhang: Beabsichtigte fünf Evidenzänderungen aus 35.6.

Ursprüngliche Meldung: AssertionError [ERR_ASSERTION]: petlibro-granary-camera-feeder: unverändertes Bestandsfeld externalEvidence

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: Historischer Vollfeldvergleich behandelt neue experience-/FAQ-/Evidenzfelder als unbeabsichtigte Änderungen.

Maßnahme: Für den historischen Feldvergleich ausschließlich die fünf exakt freigegebenen Revisionen zurückprojizieren; unveränderliche Felder zusätzlich direkt schützen.

Dateien: `test/product-freshness-36.0.test.mjs`, `scripts/product-evidence/approved-changes.mjs`.

Begründung: Die aktuelle vollständige Datei muss den neuen Hash erfüllen. Scores, Kaufdaten, Metadaten und Originalhinweise dürfen nicht ausgenommen werden.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

## S07 · 36.0: selektive Änderungen reproduzierbar, keine pauschale Neufassung

Datei: `test/product-freshness-36.0.test.mjs:33:1`. Kategorie C. Zusammenhang: Beabsichtigte fünf Evidenzänderungen aus 35.6.

Ursprüngliche Meldung: AssertionError [ERR_ASSERTION]: petlibro-granary-camera-feeder: Ausgangsdatei inzwischen geändert

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: 36.0-Applier erlaubt nur seinen damaligen Ausgangs-/Endhash; neuere belegte Produktpräzisierungen passen nicht hinein.

Maßnahme: Historische Berechnung gegen die hashgeprüfte vorherige Fassung reproduzieren; --write verweigert spätere Revisionen vor jedem Schreibzugriff.

Dateien: `scripts/product-freshness/apply.mjs`, `test/product-freshness-36.0.test.mjs`.

Begründung: Kein Rückschreiben historischer Texte über die fachlich richtigen Ergänzungen aus 35.6.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

## S08 · 36.1: Report und Änderungen sind reproduzierbar, Baseline wird nicht überschrieben

Datei: `test/indexation-improvements-36.1.test.mjs:76:1`. Kategorie C. Zusammenhang: Beabsichtigte fünf Evidenzänderungen aus 35.6.

Ursprüngliche Meldung: Error: Command failed: /opt/homebrew/Cellar/node/26.3.0/bin/node scripts/indexation/report.mjs --check

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: Abgeleiteter Indexationsreport enthält Text-/Hashmerkmale vor 35.6 und 21 statt 22 ergänzten Kontextkanten.

Maßnahme: Diesen konkreten Report, sein Markdown und die Cockpit-Projektion nach semantischem Einzelvergleich aktualisieren.

Dateien: `reports/indexation-improvements-36.1.json`, `reports/indexation-improvements-36.1.md`, `src/data/seo/indexation-dashboard.json`.

Begründung: Nur fünf Quellhashes ändern sich; weitere QA-Merkmale ändern sich durch Wiederholungszählung und eine neue Kante. Historische Google-Belege bleiben unverändert.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

## S09 · 36.1: Vorher/Nachher zeigt nur belegte Kontextverbesserungen und historische Indexquellen

Datei: `test/indexation-improvements-36.1.test.mjs:57:1`. Kategorie C. Zusammenhang: Beabsichtigte fünf Evidenzänderungen aus 35.6.

Ursprüngliche Meldung: AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: Der neue F.A.Z.-Titel erzeugt durch vorhandenes Auto-Linking einen zusätzlichen gültigen Link von Granary Camera zu /futterautomat-katze/.

Maßnahme: Genau diese einzelne Kante ergänzen; ursprüngliche zwölf Kontextlinks und neun Geschenkfinder-Kanten weiter exakt zählen.

Dateien: `test/indexation-improvements-36.1.test.mjs`.

Begründung: Keine Experimentseite betroffen, keine entfernte Kante und keine neue URL. Kein allgemeines Erhöhen eines Toleranzwerts.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

## S10 · 36.1: alle 110 Produktdateien und 20 geschützten Seiten bleiben erhalten

Datei: `test/indexation-improvements-36.1.test.mjs:34:1`. Kategorie C. Zusammenhang: Beabsichtigte fünf Evidenzänderungen aus 35.6.

Ursprüngliche Meldung: AssertionError [ERR_ASSERTION]: src/content/products/petlibro-granary-camera-feeder.md

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: Dasselbe alte Quellhash-Inventar vor den vier Produktrevisionen; danach zusätzlich ortsabhängige Style-IDs in isolierter Prüfung.

Maßnahme: Exakte Revisionsbrücke und beweisgebundenen Style-/Bildvergleich verwenden.

Dateien: `test/indexation-improvements-36.1.test.mjs`, `scripts/indexation/verify.mjs`.

Begründung: 20 Quellen und 205 Zugänge werden weiterhin vollständig geprüft. Style-Code und sämtliche CSS-Eigenschaften bleiben geschützt.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

## S11 · 37.4: historical baselines and all existing product files are byte-identical to the pre-cleanup inventory

Datei: `test/release-gate-37.4.test.mjs:47:1`. Kategorie C. Zusammenhang: Beabsichtigte fünf Evidenzänderungen aus 35.6.

Ursprüngliche Meldung: AssertionError [ERR_ASSERTION]: src/content/products/petlibro-granary-camera-feeder.md

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: 37.4-Quellinventar erwartet alte Produktbytes.

Maßnahme: Begrenzte Revisionsbrücke nur bei exakt bekanntem neuem Hash zulassen.

Dateien: `test/release-gate-37.4.test.mjs`, `scripts/product-evidence/approved-changes.mjs`.

Begründung: Historische Baselines selbst werden nicht neu erzeugt; unbekannte Dateien werden unverändert streng geprüft.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

## S12 · all 110 product sources remain byte-identical, including original decisionFacts

Datei: `test/gift-guide-37.0.test.mjs:22:1`. Kategorie C. Zusammenhang: Beabsichtigte fünf Evidenzänderungen aus 35.6.

Ursprüngliche Meldung: AssertionError [ERR_ASSERTION]: src/content/products/petlibro-granary-camera-feeder.md

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: Geschenkfinder-Quellinventar friert auch redaktionelle Evidenzfelder ein.

Maßnahme: Historische Bytes und die exakt zugelassene aktuelle Revision gemeinsam validieren.

Dateien: `test/gift-guide-37.0.test.mjs`, `scripts/product-evidence/approved-changes.mjs`.

Begründung: Kein Produkt wird aus dem Inventar entfernt; Originalhinweise bleiben unverändert.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

## S13 · bestehende Scores, Teilbewertungen, SEO-Metadaten und decisionFacts bleiben exakt erhalten

Datei: `test/product-integration-rendered-35.8.test.mjs:26:1`. Kategorie C. Zusammenhang: Beabsichtigte fünf Evidenzänderungen aus 35.6.

Ursprüngliche Meldung: AssertionError [ERR_ASSERTION]: src/content/products/petlibro-granary-camera-feeder.md: Änderung entspricht nicht dem geprüften Umfang

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: Der Test ruft den gemeinsamen Freigabe-Verifier auf, der bereits beim neuen Evidenzhash abbricht. Kein nachgewiesener Scorefehler.

Maßnahme: Vorgelagerten Hashvertrag korrigieren; alle geschützten Bewertungs-/SEO-/Kaufdatenvergleiche erhalten.

Dateien: `scripts/product-freshness/approved-changes.mjs`.

Begründung: Nicht einen vermeintlichen Scorefehler durch geänderte Scores beseitigen.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

## S14 · built canonical prices and derived totals are current; ratings, destinations and technical hints remain protected

Datei: `test/gift-guide-37.1.test.mjs:14:1`. Kategorie C. Zusammenhang: Beabsichtigte fünf Evidenzänderungen aus 35.6.

Ursprüngliche Meldung: AssertionError [ERR_ASSERTION]: petlibro-one-rfid-smart-feeder:strengths

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: Geschenkkatalog friert auch die überarbeitete erste One-RFID-Stärke als alte Produktbehauptung ein.

Maßnahme: Nur für die exakt freigegebene strengths-Änderung den aktuellen, aus Quellen erzeugten Katalog erwarten.

Dateien: `test/gift-guide-37.1.test.mjs`, `scripts/product-evidence/approved-changes.mjs`.

Begründung: Score, Preise, Kaufziele und technische Merkmale bleiben separat an alte und aktuelle Originaldaten gebunden.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

## S15 · regulärer Build schützt Entwürfe, Experiment-Zugänge und Vergleichsmitgliedschaft

Datei: `test/product-integration-rendered-35.8.test.mjs:12:1`. Kategorie C. Zusammenhang: Beabsichtigte fünf Evidenzänderungen aus 35.6.

Ursprüngliche Meldung: AssertionError [ERR_ASSERTION]: src/content/products/petlibro-granary-camera-feeder.md: Änderung entspricht nicht dem geprüften Umfang

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: Gemeinsamer 36.0-/35.8-Quellhashvertrag scheitert vor der eigentlichen Experiment-/Buildprüfung.

Maßnahme: Nur die bekannten Revisionen belegen und anschließend sämtliche Publikations-, Link- und Experimentschutzprüfungen ausführen.

Dateien: `scripts/product-freshness/approved-changes.mjs`, `scripts/product-integration/verify.mjs`.

Begründung: Die ursprüngliche Fehlermeldung beweist keine veränderte Experimentseite. Der unabhängige Vergleich prüft sie weiterhin vollständig.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

## S16 · vollständiger Qualitätsreport ist reproduzierbar und erteilt keine Freigaben

Datei: `test/decision-facts-rendered-35.7.test.mjs:55:1`. Kategorie C. Zusammenhang: Beabsichtigte fünf Evidenzänderungen aus 35.6.

Ursprüngliche Meldung: Error: Command failed: /opt/homebrew/Cellar/node/26.3.0/bin/node /Users/boris.buckowitz/ExtensionQA/affiliate-template/apps/pfotentechnik/scripts/product-experience/audit-decision-facts.mjs --check

Erwartung: Historischer Vertrag unverändert erfüllt oder exakt dokumentierte 35.6-Revision; technische Schutzbedingungen bleiben aktiv.

Ursache: Quellhashes im 35.7-Report enthalten noch die alten vier Produktdateien. Die 437 Entscheidungshinweise selbst sind unverändert.

Maßnahme: Nur vier sourceHash-Werte und zugehörige Markdown-Hashes erneuern.

Dateien: `reports/decision-facts-quality-35.7.json`, `reports/decision-facts-quality-35.7.md`.

Begründung: Keine Freigaben, Hinweisfingerprints, Regeln oder Rohtexte geändert; vollständiger --check bleibt aktiv.

Ergebnis: siehe finalen vollständigen Testlauf in `validation.md`.

