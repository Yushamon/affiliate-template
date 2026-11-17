# Indexierungsoptimierung und Seitenstruktur 36.1

Stand: 16.11.2026. 270 selbstkanonische öffentliche HTML-Seiten geprüft; 269 indexierbare Sitemap-URLs. Die absichtlich nicht indexierbare Foundation-Vorschau ist separat enthalten. Adminseiten sind aus der öffentlichen Analyse ausgeschlossen.

## Datenstand und Grenzen

Kein lokaler OAuth-Client, Token oder Property-Konfiguration vorhanden. Keine GSC-API-/URL-Inspection-Abfrage, kein Indexierungsantrag. Der vorhandene GSC-CSV-Import vom **16.11.2026** enthält Performance für **15.08.–14.11.2026**: 60 Seitenzeilen und elf globale Suchanfragen. URL-Query-Paare fehlen; Suchanfragen werden deshalb keiner einzelnen Seite zugeschrieben. Die Originaldateien des Imports sind per SHA geprüft.

Die letzten verifizierten exakten **Indexierungszustände stammen vom 02.11.2026**. Auch die Coverage-Originale wurden gegen den vorhandenen Quellenkatalog per SHA verifiziert. Nicht in diesem Export enthaltene URLs bleiben unbekannt. Letzter Crawl und Google-selected Canonical werden nur mit Beleg ausgegeben; 1970-01-01 gilt nicht als echter Crawl. Eine Sitemap-Zuordnung aus Google ist nicht verfügbar; die technische Sitemap-Mitgliedschaft wird separat geprüft.

## Technisches Ergebnis

275 lesende Live-GET-Prüfungen vom 2026-11-16T14:37:04.517Z bis 2026-11-16T14:37:27.907Z: alle 269 Canonical-URLs direkt HTTP 200 mit passendem Canonical. Zwei Host-/Protokollvarianten leiten einmal per 301 weiter; http://www.pfotentechnik.de/ erreicht die kanonische Startseite über zwei 301-Schritte (zuerst HTTPS, dann ohne www). Robots und beide Sitemap-Dateien wurden ebenfalls live abgerufen. Keine Netzfehler. **Kein technischer Befund an den Canonicals; eine zweistufige HTTP-www-Hosting-Kette als Optimierungsempfehlung**, 0 interne nicht vorhandene Linkziele. Keine pauschalen Canonical-, Robots-, Sitemap- oder Redirect-Umbauten.

Statischer Hauptinhalt steht bei allen Canonicals unmittelbar im HTML; interaktive Filter und Beraterfunktionen können weiterhin JavaScript benötigen. Strukturierte Daten sind parsebar. Die Foundation-Vorschau bleibt absichtlich noindex und außerhalb der Sitemap; fehlende Navigation zu dieser Vorschau ist kein Indexierungsfehler.

## Vorher und nachher

- Kontextuelle Linkkanten: 1306 → 1326.
- Herstellerprofile ohne Kontextquelle: 2 → 0.
- Produkte ohne eine einzige Kontextquelle: 1 → 0.
- Produkte ohne Kontext aus einer am 02.11. historisch indexierten Seite: 61 → 56. Der heutige Google-Status dieser Quellen ist ungeprüft.
- 6 Ratgeber gezielt bearbeitet, 12 Kontextlinks ausdrücklich ergänzt; 21 zusätzliche Kontextkanten tatsächlich im Build nachgewiesen.
- Keine neuen öffentlichen Seiten, keine Produktdateien verändert, alle 437 Originalhinweise und Scores/Preise/Affiliate-Ziele erhalten.

## Tatsächlich umgesetzte Korrekturen

### /warum-brauchen-gps-tracker-ein-abo/

Historisch indexierter Tarifratgeber verlinkt keines der neuen Modelle; MOVA-/SATELLAI-Profile erhalten bisher keine kontextuellen Zugänge.

Beim hier erfassten Paket des [Invoxia Biotracker 2026](/produkt/invoxia-biotracker-2026/) sind zwölf Monate Max GPS enthalten. Dieses Paketjahr darf beim Kostenvergleich nicht nochmals als Abo-Aufschlag gerechnet werden. Für die Anbieter [MOVA](/hersteller/mova/) und [SATELLAI](/hersteller/satellai/) führen die Herstellerprofile zu den jeweiligen Geräten und den dokumentierten regionalen Tarifgrenzen; EU-Tarif und Verlängerung vor Vertragsabschluss gesondert prüfen.

Belege im Bestand: src/content/products/invoxia-biotracker-2026.md: subscription.includedServiceMonths / price.variantLabel; src/content/manufacturers/mova.md; src/content/manufacturers/satellai.md.

### /reichweite-von-gps-trackern/

MOVA und SATELLAI haben bislang jeweils nur das eigene Herstellerprofil als Kontextquelle; der belegte LTE-Datenweg passt zur Reichweitenfrage.

[MOVA SureTrack Pro](/produkt/mova-suretrack-pro/) und [SATELLAI Collar Go](/produkt/satellai-collar-go/) übertragen laut den erfassten Produktdaten per LTE. Damit ist ihre Suchdistanz nicht wie bei VHF allein durch den Abstand zum Handgerät begrenzt. Ohne unterstütztes Mobilfunknetz kann die Fernanzeige trotzdem ausbleiben; eine funktionierende Standortabfrage belegt außerdem keine rechtzeitige Geofence-Warnung.

Belege im Bestand: src/content/products/mova-suretrack-pro.md: gps.transmission / externalEvidence; src/content/products/satellai-collar-go.md: gps.transmission.

### /gps-tracker-richtig-befestigen/

Konkrete aktuelle Passformgrenzen fehlen im Befestigungsratgeber; Standard und XL sollen nicht als austauschbare Varianten erscheinen.

Die hier verlinkten Tracker unterscheiden sich bei Gewicht und Tiergrenze deutlich: Der [CAT 6 Mini](/produkt/tractive-cat-6-mini/) wiegt inklusive integriertem Halsband 32 g und ist für Katzen von 3 bis 8 kg angegeben. Der [DOG 6](/produkt/tractive-dog-6/) wiegt rund 39 g und ist für Hunde ab 4 kg vorgesehen, der [DOG 6 XL](/produkt/tractive-dog-6-xl/) rund 70 g für Hunde ab 20 kg. Mehr Akkureserve beim XL ist deshalb kein Grund, die dokumentierte Tiergrenze oder Halsbandpassform zu übergehen.

Belege im Bestand: src/content/products/tractive-cat-6-mini.md: specs.Gewicht / Geeignet für; src/content/products/tractive-dog-6.md: specs.Gewicht / Geeignet für; src/content/products/tractive-dog-6-xl.md: specs.Gewicht / Geeignet für.

### /futterautomat-katze/

Die Aussage zum Ausgabeprotokoll widerspricht den bereits dokumentierten PETLIBRO-Cloudgrenzen. Waage/KI und echte Zugangskontrolle benötigen unterschiedliche Kaufentscheidungen.

Der [PETLIBRO Granary 2 Vision](/produkt/petlibro-granary-2-vision/) kombiniert eine Waage mit Kamera und KI-Zuordnung von Aufnahmen; eine Zugangssperre pro Tier ist damit nicht dokumentiert. Der [PETLIBRO ONE RFID Smart Feeder](/produkt/petlibro-one-rfid-smart-feeder/) steuert den Napfzugang dagegen über einen RFID-Halsbandanhänger. Für getrennte Rationen ist diese Unterscheidung wichtiger als das bloße Vorhandensein eines Fütterungsprotokolls.

Zusätzliche Korrektur: „Ein Ausgabeprotokoll sagt nur, dass Futter bereitgestellt wurde. Es sagt nicht, welche Katze es gefressen hat.“ → „Ein App-Protokoll ist kein sicherer Nachweis einer tatsächlichen Ausgabe oder Futteraufnahme. Selbst beobachtetes, bereitgestelltes Futter zeigt noch nicht, welche Katze gefressen hat.“

Belege im Bestand: src/content/products/petlibro-granary-2-vision.md: specs.Waage / Kamera / Tiererkennung / experience.reliability; src/content/products/petlibro-one-rfid-smart-feeder.md: specs.Zugangskontrolle.

### /trinkmenge-katze-messen/

Der FEELNEEDY-8-Liter-Brunnen hat keinen Kontextlink. Sein dokumentiertes Fehlen einer Trinkmengenmessung verdeutlicht den Unterschied von Vorrat und Messung.

Ein großer Vorrat ist keine Messfunktion: Der [FEELNEEDY FN-W18 mit 8 Litern](/produkt/feelneedy-fn-w18-8l-katzenbrunnen/) hat laut den erfassten Produktdaten weder App noch Trinkmengenmessung. Auch bei diesem Modell bleibt die Differenz aus eingefülltem und verbleibendem Wasser eine Näherung einschließlich Verdunstung und Verschütten; sie lässt sich nicht automatisch einer einzelnen Katze zuordnen.

Belege im Bestand: src/content/products/feelneedy-fn-w18-8l-katzenbrunnen.md: specs.Gesamtkapazität / App / Trinkmengenmessung.

### /pumpe-katzentrinkbrunnen-reinigen/

Das neue Philips-Modell erhält bisher keinen Kontextzugang aus einem historisch indexierten Ratgeber; Handreinigung und Wiederanlauf sind konkrete Pflegeunterschiede.

Beim [Philips PAW3210/02](/produkt/philips-pet-series-paw3210-02/) ist Handreinigung vorgesehen; eine Spülmaschinenfreigabe ist nicht belegt. Nach einer Stromunterbrechung sollte der Wasserfluss ausdrücklich kontrolliert werden: Der auf der Produktseite eingeordnete unabhängige Test berichtet, dass ein erneuter Tastendruck nötig sein kann. Das ist ein modellspezifischer Prüfpunkt und keine Aussage über alle Brunnen.

Belege im Bestand: src/content/products/philips-pet-series-paw3210-02.md: specs.Reinigung / experience.reliability / LydBilde-Test.

## Verteilung nach Seitentyp und historischem Indexstatus

- advisor: 1 Seiten; 0 ohne Kontextquelle; 0 Seiten mit technischem Befund.
- comparison: 28 Seiten; 5 ohne Kontextquelle; 0 Seiten mit technischem Befund.
- guide: 85 Seiten; 13 ohne Kontextquelle; 1 Seiten mit technischem Befund.
- homepage: 1 Seiten; 1 ohne Kontextquelle; 0 Seiten mit technischem Befund.
- manufacturer: 37 Seiten; 0 ohne Kontextquelle; 0 Seiten mit technischem Befund.
- product: 108 Seiten; 0 ohne Kontextquelle; 0 Seiten mit technischem Befund.
- utility: 10 Seiten; 3 ohne Kontextquelle; 0 Seiten mit technischem Befund.

- Historisch gecrawlt, nicht indexiert (02.11., falls bekannt): 91 Seiten; 8 ohne Kontextquelle.
- Historisch gefunden, nicht indexiert (02.11., falls bekannt): 78 Seiten; 3 ohne Kontextquelle.
- Historisch indexiert (02.11., falls bekannt): 90 Seiten; 9 ohne Kontextquelle.
- Kein exakter Statusbeleg (02.11., falls bekannt): 11 Seiten; 2 ohne Kontextquelle.

## Eigenständiger Seitenwert und Überschneidungen

Jede URL ist in der JSON-Fassung mit konkreter Nutzerfrage, Überschriften, spezifischen Textbelegen, wiederholten Blöcken, Produktmerkmalen und gegebenenfalls Fazit erfasst. Es gibt keine Mindestwortzahl. 0 Gruppen mit exakt identischer Kombination aus Produktfazit und Empfehlung gefunden.

Die Varianten DOG 6 und DOG 6 XL haben die höchste gemessene Paarähnlichkeit, aber unterschiedliche Gewichts-, Tiergrößen- und Akkugrenzen. Diese Unterschiede werden jetzt aus dem Befestigungsratgeber erreichbar. Bei neuen Einprodukt-Herstellerprofilen überschneiden sich Anbieter- und Produktinformationen; eine größere Neupositionierung bleibt eine Freigabeentscheidung.

- /produkt/tractive-dog-6-xl/ ↔ /produkt/tractive-dog-6/: TF-IDF-Kosinus 0.662. Getrennte Produktabsicht anhand Spezifikationen prüfen; dokumentierte Größen-, Tier- und Funktionsunterschiede sprechen gegen eine automatische Zusammenlegung.
- /hersteller/satellai/ ↔ /produkt/satellai-collar-go/: TF-IDF-Kosinus 0.563. Hersteller-/Produktrolle redaktionell abgrenzen. Eigenständige Vertrags-, Support- und Kompatibilitätsinformationen prüfen, bevor eine Konsolidierung erwogen wird.
- /hersteller/mova/ ↔ /produkt/mova-suretrack-pro/: TF-IDF-Kosinus 0.548. Hersteller-/Produktrolle redaktionell abgrenzen. Eigenständige Vertrags-, Support- und Kompatibilitätsinformationen prüfen, bevor eine Konsolidierung erwogen wird.
- /hersteller/brook/ ↔ /produkt/brook-glass-pet-fountain/: TF-IDF-Kosinus 0.542. Hersteller-/Produktrolle redaktionell abgrenzen. Eigenständige Vertrags-, Support- und Kompatibilitätsinformationen prüfen, bevor eine Konsolidierung erwogen wird.
- /hersteller/prothelis/ ↔ /produkt/prothelis-area-pets/: TF-IDF-Kosinus 0.535. Hersteller-/Produktrolle redaktionell abgrenzen. Eigenständige Vertrags-, Support- und Kompatibilitätsinformationen prüfen, bevor eine Konsolidierung erwogen wird.
- /produkt/sureflap-dualscan-mikrochip-katzenklappe/ ↔ /produkt/sureflap-mikrochip-katzenklappe/: TF-IDF-Kosinus 0.535. Getrennte Produktabsicht anhand Spezifikationen prüfen; dokumentierte Größen-, Tier- und Funktionsunterschiede sprechen gegen eine automatische Zusammenlegung.
- /hersteller/mova/ ↔ /hersteller/satellai/: TF-IDF-Kosinus 0.525. Hersteller-/Produktrolle redaktionell abgrenzen. Eigenständige Vertrags-, Support- und Kompatibilitätsinformationen prüfen, bevor eine Konsolidierung erwogen wird.
- /hund-frisst-nicht/ ↔ /katze-frisst-nicht/: TF-IDF-Kosinus 0.522. Nutzerfrage und Tierart im Volltext gegeneinander prüfen; Textähnlichkeit allein rechtfertigt weder Zusammenlegung noch Noindex.
- /hersteller/reolink/ ↔ /produkt/reolink-e1-zoom/: TF-IDF-Kosinus 0.5. Hersteller-/Produktrolle redaktionell abgrenzen. Eigenständige Vertrags-, Support- und Kompatibilitätsinformationen prüfen, bevor eine Konsolidierung erwogen wird.

**Keine automatische Konsolidierung empfohlen oder ausgeführt.** Alle Paare sind Prüf-, keine Löschkandidaten. Keine Canonicals zusammengelegt, keine Noindex-Anweisung oder Redirect-Regel gesetzt.

## Schutz des Experiments 35.5

Zehn Test- und zehn Kontrollseiten bleiben geschützt. Vorher-HTML aller 20 Seiten ist im unveränderlichen Baselinearchiv gesichert; Inhalt und eingehende Linkkanten werden gegen diese und die bestehende 35.8-Prüfung validiert. Die enge Inhaltsausnahme für 36.1 erlaubt ausschließlich die sechs manifestierten Ratgeberdateien mit exakten Vorher-/Nachher-Hashes; sie lockert keine Experimentprüfung.

Abschlussprüfung: 20/20 HTML-Dateien nach SHA-belegter Bildalias-Normalisierung und der freigegebenen, kanonisch validierten Commerce-Preisprojektion identisch (8 unverändert bis auf das letzte Byte); 205 eingehende Linkzugänge unverändert. 220 Tests bestanden; Build 390 Seiten. Vier Fullpage-Screenshots: 375/1600 Pixel, Light/Dark. Diff geprüft.

## Bestehendes SEO Cockpit

Zwei nachgewiesene Anzeigeinkonsistenzen ebenfalls korrigiert: Der vorhandene Zeitraumtitel zeigt bei fehlenden Vergleichsdaten keinen vermeintlichen Vergleich mehr; ein teilweise abgedeckter CSV-Zeitraum wird nicht als laufende Google-Datenverarbeitung ausgegeben.

Die Indexierungsansicht ist im vorhandenen Search Cockpit integriert. Sie zeigt pro URL historischen Status samt Quelle und Datum, Crawlbeleg, technische Canonical-/Robots-/Sitemap-/HTTP-Signale, Kontextquellen und historisch indexierte Linkquellen, Performance, Priorität, durchgeführte Maßnahmen und 35.5-Schutz. Globale Queries bleiben ausdrücklich ohne URL-Zuordnung. Keine zweite SEO-Verwaltung.

## Zehn wichtigste verbleibende Maßnahmen

1. **Aktuellen Indexierungsstand autorisiert erheben** — Lokaler API-Zugang fehlt. Letzte exakte Coverage-Belege sind vom 02.11.; Google-selected Canonical und aktuelle Crawlzeit fehlen. OAuth/Property autorisieren und tatsächliches URL-Inspection-Kontingent nachweisen; dann priorisierte Stichprobe, keine pauschale API-Verfügbarkeit behaupten. Erwarteter Nutzen: Aktuelle Priorisierung statt Arbeit an möglicherweise überholten Zuständen. URLs: https://pfotentechnik.de/foundation/, https://pfotentechnik.de/hersteller/brook/, https://pfotentechnik.de/hersteller/mova/, https://pfotentechnik.de/hersteller/philips/, https://pfotentechnik.de/hersteller/satellai/, https://pfotentechnik.de/produkt/brook-glass-pet-fountain/, https://pfotentechnik.de/produkt/catit-pixi-standard-trinkbrunnen/, https://pfotentechnik.de/produkt/mova-suretrack-pro/, https://pfotentechnik.de/produkt/philips-pet-series-paw3210-02/, https://pfotentechnik.de/produkt/satellai-collar-go/, https://pfotentechnik.de/ratgeber/technikgeschenke-haustiere/

2. **HTTP-www-Weiterleitung im Hosting auf einen Schritt verkürzen** — Live beobachtet: http://www → https://www → https ohne www, zwei 301-Schritte. Kanonische URLs sind nicht betroffen. Nur als Hostingempfehlung dokumentiert; keine Deployment- oder Redirect-Änderung ausgeführt. Erwarteter Nutzen: Ein Request weniger bei diesem nichtkanonischen Einstieg. URLs: http://www.pfotentechnik.de/

3. **Passenden Kontextzugang für HoneyGuardian A305D Test prüfen** — 1 Kontextquellen insgesamt; keine davon im Coverage-Export vom 02.11. indexiert. Aktueller Indexierungszustand ungeprüft. Geeigneten fachlich passenden Absatz mit konkretem Modelleinsatz belegen. Keine Serienverlinkung aller Produkte. Erwarteter Nutzen: Eine passende bestehende Antwortseite kann die Auswahlgrenzen des Modells erklären und den Detailzugang vereinfachen. URLs: https://pfotentechnik.de/produkt/honeyguardian-a305d/

4. **Passenden Kontextzugang für HoneyGuardian S305D im Check prüfen** — 1 Kontextquellen insgesamt; keine davon im Coverage-Export vom 02.11. indexiert. Aktueller Indexierungszustand ungeprüft. Geeigneten fachlich passenden Absatz mit konkretem Modelleinsatz belegen. Keine Serienverlinkung aller Produkte. Erwarteter Nutzen: Eine passende bestehende Antwortseite kann die Auswahlgrenzen des Modells erklären und den Detailzugang vereinfachen. URLs: https://pfotentechnik.de/produkt/honeyguardian-smart-pet-feeder-s305d/

5. **Passenden Kontextzugang für oneisall 5L Futterautomat für zwei Katzen im Check prüfen** — 1 Kontextquellen insgesamt; keine davon im Coverage-Export vom 02.11. indexiert. Aktueller Indexierungszustand ungeprüft. Geeigneten fachlich passenden Absatz mit konkretem Modelleinsatz belegen. Keine Serienverlinkung aller Produkte. Erwarteter Nutzen: Eine passende bestehende Antwortseite kann die Auswahlgrenzen des Modells erklären und den Detailzugang vereinfachen. URLs: https://pfotentechnik.de/produkt/oneisall-5l-automatic-cat-feeder/

6. **Passenden Kontextzugang für Brook Glass Pet Fountain: Filter, Pflege und Kosten prüfen** — 1 Kontextquellen insgesamt; keine davon im Coverage-Export vom 02.11. indexiert. Aktueller Indexierungszustand ungeprüft. Geeigneten fachlich passenden Absatz mit konkretem Modelleinsatz belegen. Keine Serienverlinkung aller Produkte. Erwarteter Nutzen: Eine passende bestehende Antwortseite kann die Auswahlgrenzen des Modells erklären und den Detailzugang vereinfachen. URLs: https://pfotentechnik.de/produkt/brook-glass-pet-fountain/

7. **Eigenständigen Herstellerwert für MOVA prüfen** — Profil und Einzelprodukt liegen im oberen Bereich der gemessenen Textähnlichkeit; das Profil enthält derzeit nur ein Produkt. Zuerst zusätzliche belegte Herstellerinformationen prüfen. Größere Neupositionierung oder Zusammenlegung nur nach ausdrücklicher Freigabe. Erwarteter Nutzen: Klare Trennung von Anbieter-/Servicefragen und individueller Produktentscheidung. URLs: https://pfotentechnik.de/hersteller/mova/

8. **Eigenständigen Herstellerwert für SATELLAI prüfen** — Profil und Einzelprodukt liegen im oberen Bereich der gemessenen Textähnlichkeit; das Profil enthält derzeit nur ein Produkt. Zuerst zusätzliche belegte Herstellerinformationen prüfen. Größere Neupositionierung oder Zusammenlegung nur nach ausdrücklicher Freigabe. Erwarteter Nutzen: Klare Trennung von Anbieter-/Servicefragen und individueller Produktentscheidung. URLs: https://pfotentechnik.de/hersteller/satellai/

9. **Tractive DOG 6 und DOG 6 XL getrennt weiterbeobachten** — Höchste gemessene Paarähnlichkeit; belegte Unterschiede bei Gewicht, Mindesttiergewicht und Akku. Der Befestigungsratgeber grenzt die Varianten jetzt ausdrücklich ab. Keine Konsolidierung. Nach autorisiertem Zugang echte URL-Query-Paare auswerten; aus globalen Queries keine Kannibalisierung konstruieren. Erwarteter Nutzen: Varianten-Nutzwert erhalten und spätere Query-/URL-Kannibalisierung anhand echter Suchdaten prüfen. URLs: https://pfotentechnik.de/produkt/tractive-dog-6/, https://pfotentechnik.de/produkt/tractive-dog-6-xl/

10. **Experiment 35.5 unverändert zu Ende beobachten** — 20 Seiten und ihre eingehenden Linkzugänge sind geschützt; Verbesserungsbedarf ist kein Freigabegrund. Erst nach Ende oder ausdrücklicher Freigabe am Inhalt beziehungsweise den Linkzugängen arbeiten. Ohne Deployment keine Nachher-Indexierungswirkung behaupten. Erwarteter Nutzen: Auswertbare Versuchsergebnisse statt durch neue Links veränderter Versuchsbedingungen. URLs: https://pfotentechnik.de/futterautomat-hund/, https://pfotentechnik.de/katzentrinkbrunnen-dauerbetrieb-urlaub/, https://pfotentechnik.de/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/, https://pfotentechnik.de/katzentrinkbrunnen-ohne-filter/, https://pfotentechnik.de/produkt/aqara-smart-pet-feeder-c1/, https://pfotentechnik.de/produkt/cat-mate-c200/, https://pfotentechnik.de/produkt/cat-mate-c500/, https://pfotentechnik.de/produkt/catit-pixi-smart-6-meal-feeder/, https://pfotentechnik.de/produkt/oneisall-3-5l-cordless-fountain/, https://pfotentechnik.de/produkt/pawsync-smart-pet-feeder/, https://pfotentechnik.de/produkt/petkit-eversweet-solo-2-fountain/, https://pfotentechnik.de/produkt/petkit-eversweet-solo-se/, https://pfotentechnik.de/produkt/petlibro-dockstream-cordless/, https://pfotentechnik.de/produkt/petlibro-polar-wet-food-feeder/, https://pfotentechnik.de/trinkbrunnen-fuer-kitten-sicher/, https://pfotentechnik.de/trinkbrunnen-hund/, https://pfotentechnik.de/trinkbrunnen-seniorenkatzen/, https://pfotentechnik.de/welcher-futterautomat-ist-der-richtige/, https://pfotentechnik.de/wie-funktioniert-ein-futterautomat/, https://pfotentechnik.de/wie-laut-sind-automatische-futterautomaten/

## Verbleibende Unsicherheiten

- Es gibt keine nach diesem Eingriff erhobene Google-Indexierungswirkung: kein Deployment und kein aktueller autorisierter Coverage-/Inspection-Zugriff.
- Impressionen, HTTP 200, eine korrekte Sitemap und technisch renderbarer Hauptinhalt sind keine Garantie für Aufnahme in den Google-Index.
- Semantische Eigenständigkeit wird mit Titel, Abschnitten, Textbelegen und Produktdaten geprüft. Automatische Textähnlichkeit kann fachlich notwendige Überschneidungen erfassen und ersetzt keine redaktionelle Entscheidung.
- Neue Kontextlinks verbessern belegte Lesepfade. Sie beweisen keine Ursache bisher fehlender Indexierung.

## Vollständiger URL-Nachweis und Reproduktion

Die [JSON-Fassung](indexation-improvements-36.1.json) enthält alle 270 Canonicals und ihre Einzelbefunde. Original-HTTP-Belege, GSC-Zugangsprüfung, Änderungen und Baseline liegen in research/indexation-improvements-36.1.

```sh
node apps/pfotentechnik/scripts/indexation/apply.mjs
npm run build:pfotentechnik
node apps/pfotentechnik/scripts/indexation/verify.mjs
node apps/pfotentechnik/scripts/indexation/report.mjs
npm --workspace apps/pfotentechnik run test:indexation
```

Der Bericht nutzt archivierte HTTP- und GSC-Belege; neue Live-Messungen sind gesondert als neue Messung auszuführen. Die Baseline wird niemals überschrieben. Kein Merge, kein Deployment.
