# PfotenTechnik 35.8.1 – Redaktionelle Abschlusskorrektur

Prüfstand: 16.11.2026. Kein Merge, kein Deployment, keine zusätzlichen Produkte.

- **MOVA: 58/100** (Ortung 3,0; App 3,0; Akku 2,5; Tragekomfort 3,5; Kosten 2,5). Leichtere Bauform positiv gewichtet; begrenzte App, kurze Fremdtest-Laufzeiten und widersprüchliche Erfahrungen mit Geofence-Alarmen begrenzen die Einordnung. Keine eigene Praxismessung.
- **SATELLAI: 62/100** (Ortung 3,5; App 3,5; Akku 3,0; Tragekomfort 3,0; Kosten 2,5). App und Akku günstiger eingeordnet, höhere Gerätemasse berücksichtigt. CHIP nennt 108 Stunden im eigenen Laufzeittest; der Hersteller-Maximalwert wurde nicht als Alltagsergebnis übernommen. Keine Umrechnung fremder Testnoten. Das Kostenkriterium bleibt bei beiden gleich; Gerätepreis und Lieferstatus beeinflussen den Score nicht.
- **Invoxia:** 219 € ausdrücklich als „Paketangebot: Gerät inklusive Max-GPS-Jahrespaket (12 Monate)“ und Paketpreis gekennzeichnet. Die bereits hinterlegten zwölf Inklusivmonate bleiben erhalten. Rechenprobe: 12 Monate **219 €**, 24 Monate **348,90 €** beim hinterlegten Verlängerungstarif von 129,90 €/Jahr; keine doppelte Berechnung des ersten Jahres. Die Kostenanzeige bezeichnet den Tarif ausdrücklich als Kosten nach der Inklusivzeit.
- **Entscheidungshilfen:** Gleichwertige automatisch erzeugte GPS-Konsequenzen werden zu einer Aussage gebündelt; zugehörige technische Werte bleiben sichtbar, weitere relevante Merkmale rücken nach. CAT 6 Mini, DOG 6 und DOG 6 XL enthalten den Laufzeithinweis jeweils einmal. Die Zusammenfassung betrifft die Ausgabe, nicht die Originaldaten. Andere Kategorien bleiben zum Schutz von 35.5 unverändert. Alle **437 gesperrten Originalhinweise in 73 Dateien** sind per SHA-256-Abgleich unverändert; keine Freigaben aktiviert. mAh-Angaben erzeugen weiterhin keine Volumen-/Nachfüllhinweise.
- **SATELLAI-Verfügbarkeit:** unverändert `unknown`. Im Preisbereich steht ausdrücklich „Lieferbarkeit nicht bestätigt. Ein hinterlegter Preis belegt keine Lieferbarkeit.“ Die Produkt-Angebotsdaten behaupten keinen Lagerbestand; der korrekt zugeordnete Hersteller-CTA bleibt nutzbar.

## Quellen und Einordnung

Eigenständige Fremdtests, jeweils am 16.11.2026 geprüft: [connect, direkter Vergleich](https://www.connect.de/testbericht/gps-tracker-hunde-tractive-dog-6-satellai-collar-go-mova-suretrack-pro-test-3213978.html), [F.A.Z. Kaufkompass, SureTrack Pro](https://www.faz.net/kaufkompass/test/der-beste-gps-tracker-fuer-hunde/), [CHIP, Collar Go](https://www.chip.de/test-kaufberatung/hobby-freizeit/satellai-collar-g-im-test_e5ceb9ad-a5bb-41db-a82e-61edb2590e56.html). Unterschiede und widersprüchliche Erfahrungen werden als redaktionelle Einschätzung mit Grenzen ausgewiesen; technische Herstellerangaben bleiben davon getrennt. Quellen und Kriterienbezug sind an beiden Produkten hinterlegt.

## Prüfung

Build erfolgreich: **390 Seiten**. `npm run test:product-integration`: **145 bestanden, 0 Fehler**. Zusätzlich **32 Browser-Fälle** in 375/1600 px, jeweils Light/Dark: 24 Fälle der ursprünglichen Charge sowie acht Fälle für CAT 6 Mini und DOG 6 XL. Galerie, Preise, CTA-Ziele, Canonical, Robots, Bilder und Überlauf geprüft. Die Regressionstests vergleichen die gerenderten Kaufziele mit den exakt zugeordneten Angeboten und prüfen Paketkosten, unbekannten Lagerbestand, Originalhinweise und konsolidierte Aussagen.

Experiment 35.5: **20 gerenderte Experiment-/Kontrollseiten und 205 eingehende Linkkanten unverändert**. Bestehende Scores außerhalb MOVA/SATELLAI, Affiliate-Ziele, SEO-Metadaten und Veröffentlichungssperren erhalten. Diff einschließlich neuer Dateien geprüft, keine Whitespace-Fehler. 35.7-Qualitätsreport erneut geprüft, generierte 35.8-Reports auf den finalen Datenstand aktualisiert.

QA-Nachweise: [ursprüngliche Charge](product-integration-35.8/browser.json), [CAT 6 Mini / DOG 6 XL](product-integration-35.8.1-qa/browser.json), [Schutzregeln und gerenderte Aussagen](product-integration-35.8/verification.json). Die PNG-Dateien sind lokale QA-Artefakte; ihre Prüfsummen stehen in den Nachweisen.
