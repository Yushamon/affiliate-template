# Produktpflege-Reparatur 37.3A

Stand: 17.11.2026. Auftrag einschließlich Nachtrag „Preisaktualität und Amazon-Verfügbarkeit“.

## Entscheidung

**GO für die lokale Produktpflege-Reparatur und den geprüften Produktionsbuild.** Alle 350 relevanten Tests bestehen, keine Fehler, keine übersprungenen Fälle. Produktionsbuild: 391 Seiten. Strikter SEO-Buildaudit: 0 Fehler, 0 Warnungen. Kein Merge, kein Deployment.

Prüfumfang: Produktintegration 145, Geschenkfinder 38, Domain-/Preis-/Operations-/Freigabetests 137, SEO-/Indexierungs-/URL-Tests 30. Der Domainblock enthält die vollständigen 14 neuen Operations-Regressionen und neun Freigabe-/Manipulationstests. Jeder zuvor fehlgeschlagene Fall bleibt enthalten. Zusätzlich bestehen der direkte Release-Gate-Check, die Geschenkfinder-Prüfung mit 60 Szenarien und der HTML-/Linkschutz. [Maschinenlesbares Abschlussergebnis](product-operations-recovery-37.3a-qa/validation.json), [Produktintegration-Log](product-operations-recovery-37.3a-qa/tests-integration.log), [Domain-Log](product-operations-recovery-37.3a-qa/tests-domain.log), [SEO-Log](product-operations-recovery-37.3a-qa/tests-seo.log), [Geschenkfinder-Log](product-operations-recovery-37.3a-qa/tests-gift.log), [Build-Log](product-operations-recovery-37.3a-qa/production-build.log).

## Ursachen und reparierte Bedienung

Die zentrale Browserblockade war ein serverseitiger Import im Client: `commerce-view.mjs` importierte die Operations-Policy, diese über die Entscheidungsdatenprüfung `node:crypto`. Vite externalisierte das Modul; der Zugriff auf `createHash` brach die Initialisierung ab. Damit wurden vorhandene Handler, Synchronisierung und Editoren nicht zuverlässig angeschlossen. Browserfähige Formatierung und Kennzahlen liegen jetzt im gemeinsamen, Node-freien Modul `display.mjs`.

Weitere konkrete Lücken: Für Produkte ohne Angebote fehlte die Linkanlage; Link-CRUD war nicht vollständig an persistente Endpunkte angeschlossen. Der globale Aktualisierungsbutton bot keinen nachvollziehbaren laufenden Fortschritt. Ein fokussierter Entfernen-Button verhinderte nach einer Linkänderung die Aktualisierung des Formular-Hashes. Client und Server berechneten Kennzahlen teilweise unterschiedlich. Ein Editor konnte bei reinen Metadatenänderungen unbeabsichtigt einen Preis erneut bestätigen.

Repariert sind Linkanlage, Änderung und Entfernen, Anbieterwahl einschließlich freier Anbieter, direkte Produkt-URL, vollständige Affiliate-URL, Netzwerk, unterstützte Anbieterkennung/ASIN, Preis- und Verfügbarkeitspflege, Empfehlbarkeitsbeschränkung, Pflegepriorität, Speichern und Neuladen. Eingehende Werte werden serverseitig validiert. HTTPS, Amazon-ASIN-Zuordnung, explizite Produktidentität, doppelte IDs/Ziele und konkurrierende Änderungen werden geprüft. Schreibzugriffe verwenden den bestehenden atomaren Frontmatter-Writer und einen geprüften Ausgangshash. Neue oder wesentlich geänderte Angebotsidentitäten übernehmen keinen alten Preis-/Liefernachweis. Unbeteiligte Angebote, Hauptlinks, Inhalte und Scores bleiben erhalten.

Vorhandene PartnerNet-, Awin- und sonstige vollständige Affiliate-Links verwenden dieselbe Commerce-Architektur. PETLIBRO/Awin nutzt die bestehende Programmkonfiguration; weitere Anbieter können mit vollständigem geprüftem Ziel gespeichert werden. Es gibt keinen zweiten Commerce-Datenspeicher und keine neue Dependency.

Der globale Button arbeitet die tatsächlich geeigneten Produkte über die vorhandene Einzelprodukt-Pipeline ab. Er zeigt Fortschritt, bestätigte Ergebnisse, Produkte ohne Ergebnis und fehlgeschlagene Quellen getrennt an. Ein Teilerfolg versteckt keinen Quellenfehler. Auf öffentlichem/statischem Host bleiben Schreibbuttons deaktiviert. Auf localhost werden sie erst nach erfolgreicher Verbindung zum lokalen Adminservice freigeschaltet; fehlende Verbindung nennt den erforderlichen Startbefehl. Keine scheinbar erfolgreiche statische Schreibaktion.

## Browsernachweis und Persistenz

Die ursprüngliche Laufzeitexception wurde im gestarteten Browser beobachtet. Die abschließende Interaktionsprüfung nutzte einen eigenen lokalen Chrome-Prozess mit nativen CDP-Maus-/Tastaturereignissen; 34 vertrauenswürdige Klicks, keine JavaScript-Ausnahmen. Die reguläre Browsersteuerung war in dieser Sitzung nicht erreichbar.

Die Prüfung lief gegen den echten lokalen Admin-Endpunkt und isolierte Kopien der 110 Produktdateien. Sie belegt Linkanlage, Bearbeitung, Neuladen, Ablehnung einer ungültigen HTTP-URL ohne Änderung, Entfernen bei Erhalt des ursprünglichen Hauptlinks, Preisänderung ohne Erneuerung des Lieferdatums, manuelle Verfügbarkeit, Empfehlbarkeit/Priorität, Kennzahlfilter und den globalen Aktualisierungsworkflow. Der gespeicherte neue Link wurde zusätzlich über den öffentlichen Commerce-Resolver als Kaufziel gelesen. Testpreise und example.com-Testlinks wurden ausschließlich in den isolierten Kopien gespeichert.

Nachweise: [Browserergebnis](product-operations-recovery-37.3a-qa/browser.json), [Linkanlage vor dem Neuladen](product-operations-recovery-37.3a-qa/link-added.png), reproduzierbares Skript `scripts/product-operations/browser-37.3a.mjs`. Das alte Diagnosebild ist kein belastbarer Vorherbeleg der ursprünglichen Exception und wird dafür nicht verwendet.

## Vollständige Analyse der 44 alten Preiskennzeichen

Die [maschinenlesbare Produktdiagnose](product-operations-recovery-37.3a-qa/product-diagnosis.json) enthält alle 110 Produkte, die vollständigen 44 ursprünglichen Altersfälle und sämtliche 70 unbekannten Verfügbarkeiten. Pro Produkt sind Hersteller, Händlerangebote, Preisbetrag, Quelle, Affiliate-Ziel, Preisbestätigung, dokumentierte Recherche/Versuche, Fehler, Änderungsdaten soweit belegt, Cockpit-/Frontend-Wert, ausgewähltes Angebot und begründete Ursachenkategorie enthalten. Ein Dateimodifikationsdatum wird ausdrücklich nicht als Preisänderungsdatum ausgegeben. Wo die Historie fehlt, wird weder „nie ausgeführt“ noch ein technischer Fehler erfunden.

Die 44 ursprünglichen Meldungen zerfallen in drei disjunkte Gruppen:

- **3 bereits aktuell im Commerce-Bestand bestätigt:** Dockstream 2 Smart, Dockstream 2 Smart Cordless und Polar Wet Food Feeder. Die alte Kennzahl las das ältere Hauptpreisdatum statt des bereits bestätigten alternativen Angebots vom 16.11.2026. Nun werden Betrag, Händler und Bestätigungsdatum gemeinsam gewählt.
- **20 Beträge mit gespeicherter Bestätigung älter als 30 Tage**, davon 13 älter als 90 Tage. Innerhalb dieser 20 existieren für sieben Produkte zusätzliche aktuelle, aber ausdrücklich nur lesende Recherchebelege; siehe unten.
- **21 ohne gespeicherten aktuellen Betrag.** Alte generische `priceUpdated`-Werte beziehungsweise übrig gebliebene Datumswerte wurden als „alter Preis“ gezählt. Ohne Preisbetrag gibt es kein Preisalter; fehlender Preis und überalterte Bestätigung sind getrennte Befunde.

Die zusätzlichen sieben Recherchen vom 16.11. stehen in `research/editorial-price-automation-audit-2026-11-16.json`: Cat Mate Elite 355W (78,39 €), Catit PIXI Smart Trinkbrunnen (93,49 €), Furbo 360 Katzenkamera (159 €), Litter-Robot 4 (799 €), Pawfit 3 (64,99 €), PETKIT Purobot Max 3 (444,11 €), PetSafe Streamside (70,99 €). Der damalige Audit war ausdrücklich lesend; diese Beobachtungen wurden nicht als gespeicherte Preisbestätigungen übernommen. Sie werden hier mit Quelle und Datum dokumentiert, nicht nachträglich als heute erfolgreich geprüfte Preise gespeichert. Drei Beträge waren bereits unverändert; vier unterschieden sich vom gespeicherten Betrag.

Damit sind **3 der 44 im gespeicherten Commerce-Bestand frisch bestätigt**, weitere **7 kürzlich lesend recherchiert**, **13 ohne neueren belastbaren Preisrecherchebeleg** und **21 ohne gespeicherten Betrag**. „Wirklich veraltet“ bezeichnet hier die gespeicherte Bestätigung, keinen nachgewiesenen falschen Preis. Historische Fetch-Größenfehler, fehlende Preise, unvollständige URLs und falsche Modellzuordnungen bleiben mit ihrem damaligen Beleg dokumentiert; daraus folgt kein unbelegter heutiger Abruffehler.

Die aktuelle korrigierte Zählung lautet 20 über 30 und 13 über 90 Tage. Es wurden keine Produktpreise oder Prüfdatumswerte künstlich aufgefrischt.

## Datumslogik und gemeinsame Preisquelle

`price.checkedAt` ist die erfolgreiche Preisbestätigung, entsprechend `lastVerifiedAt`. `offer.lastAttemptAt` und das vorhandene Commerce-Auditjournal dokumentieren Versuche, entsprechend `lastAttemptAt`. `price.changedAt` wird ausschließlich bei tatsächlicher Betrags-/Währungsänderung gespeichert, entsprechend `priceChangedAt`; es wird historisch nicht zurückgerechnet.

Erfolgreiche Prüfung bei gleichem Betrag erneuert `checkedAt`, ohne `changedAt` zu verändern. Betragsänderung erneuert beide. Fehlgeschlagene Prüfung protokolliert den Versuch und Fehler, ohne die letzte erfolgreiche Bestätigung zu erneuern. Reine Link-, Prioritäts- oder Metadatenpflege bestätigt keinen Preis; der Hauptpreis kann im Editor ausdrücklich als heute geprüft bestätigt werden. Eine reine Preisprüfung bestätigt keine Lieferbarkeit.

`selectCommercePrice` vereinheitlicht die Auswahl für Operations-Policy, Preisindex, Produktseite, Vergleiche und Geschenkfinder: bestätigte Modellzuordnung, EUR/Deutschland, gültiges Ziel, Frische, separat dokumentierter Angebotsstatus und stabile Händlerreihenfolge. Unter frischen Alternativen bleibt die bisherige Händlerpriorität erhalten; ein frisches gültiges Alternativangebot kann einen alten Hauptpreis ersetzen. Betrag, Datum und Ziel gehören immer zum selben ausgewählten Angebot. Der Roh-Hauptpreis bleibt im ausdrücklich bezeichneten Hauptpreis-Editor sichtbar.

Öffentlich gilt weiterhin die Grenze `ageDays > 14`; bei auf volle Tage abgerundetem Alter kippt die Anzeige nach 15 vollen Tagen. Die 30-/90-Tage-Kennzahlen sind Pflegeansichten, keine abweichende Preisquelle. Der Preisindex kann einen historischen Betrag als solchen bereitstellen; der öffentliche Kauf-/Geschenkpreis nutzt zusätzlich die zentrale Frischeprüfung. Der allgemeine Produkt-/Archivstatus ist vom Händlerangebotsstatus getrennt. Eine einzelne positive Quelle schreibt keinen unbelegten Herstellerstatus fest.

## Amazon und reale Commerce-Proben

Amazon-Verfügbarkeit wird nur bei eindeutig passender ASIN, aktuellem EUR-Preis im primären Kaufformular, konkreter Angebotskennung, aktivem sichtbarem Kaufbutton und passender Amazon-Warenkorbaktion bestätigt. Preis ohne Bestellnachweis bleibt ohne neue Lieferbestätigung. Unpassende generische JSON-LD-Daten ersetzen diese Prüfung nicht. Positive und negative Varianten sowie Persistenz sind automatisiert abgesichert.

Die [lesenden Live-Proben](product-operations-recovery-37.3a-qa/live-source-probes.json) liefern:

- PETLIBRO Dockstream 2 Smart Cordless: bestätigte Shopify-Variante, Preis und Verfügbarkeit erfolgreich gelesen.
- PETLIBRO Air: offizieller Adapter scheitert korrekt an ungeklärter Produkt-URL (`unresolved`).
- Das bestehende Hauptziel dieses Air-Modells liefert über MediaMarkt Preis und InStock. Der alte Providertext lautet zwar „amazon“; der tatsächliche Host ist MediaMarkt. Dieser Befund ist **kein Amazon-Nachweis**.
- Separates echtes Amazon-Ziel Invoxia BioTracker: kein belastbarer exakter Preis-/Bestellnachweis aus der Antwort extrahierbar; keine Bestätigung gespeichert.

**Nachweislich aktuell bestellbare Amazon-Angebote in diesen Live-Proben: 0.** Ein Amazon-Ziel wurde live geprüft; dies ist keine Aussage über die Bestellbarkeit aller 91 diagnostizierten Amazon-Links. **Produktive Verfügbarkeitskorrekturen: 0.** Im isolierten Browserdurchlauf wurde ein Händlerstatus durch den echten Updateworkflow erfolgreich gespeichert; eine zweite Quelle desselben Produkts meldete einen Fehler. Das wird als Teilerfolg ausgewiesen.

Die Pipeline funktioniert für unterstützte und identifizierte Quellen; sie kann fehlende Modellzuordnungen und blockierte Händlerantworten nicht ersetzen. Der vorhandene Amazon-Workflow liest öffentliches HTML; ein PA-API-Client ist dort nicht implementiert. PETLIBRO/Awin ist konfiguriert, liest Preise aus öffentlichem Shopify-JSON und behauptet keinen vorhandenen Awin-Preisfeed. Für Tractive/ADCELL fehlen bestätigte Programm-/Publisherkennungen und Linkvorlage; das Programm bleibt deaktiviert. Weitere Hersteller benötigen passende bestätigte Quellen/Adapter. Es wurden keine Zugänge oder Programmdaten erfunden.

## Die 70 unbekannten Verfügbarkeiten und Überschneidungen

Alle 70 sind in der Produktdiagnose einzeln begründet: 50 ohne dokumentierten belastbaren Nachweis, 12 mit ausdrücklich unbekanntem Status trotz älterem Statusdatum, 5 mit unvollständigen beziehungsweise nicht separat belegten historischen Händlerdaten und 3 mit dokumentiert fehlgeschlagener Recherche. „Ohne dokumentierten Nachweis“ ist kein Beweis, dass nie recherchiert wurde. Es erfolgte keine pauschale Lieferbarkeitsannahme aus einem Preis. Unbekannt wird auch nicht allein aufgrund eines Altersdatums zu nicht lieferbar.

Die Bestandsgruppen überlappen: 14 der 19 nicht lieferbaren Produkte sind archiviert, das eine eingestellte Produkt ebenfalls. Keines der 70 unbekannten Produkte ist archiviert. Von den ursprünglichen 44 Altersmeldungen sind 15 archiviert und 17 zugleich von unbekannter Verfügbarkeit betroffen. Diese Zahlen dürfen nicht zu unabhängigen Fehlerzahlen addiert werden.

## Pflegequote und Kennzahlen

Die alte Quote war **(21 vollständige + 15 archivierte Datensätze) / 110 = 32,7 %**. Jedes Produkt zählt einmal, ohne Gewichtung. Der Nenner umfasst auch Entwürfe und Archive: Die Kennzahl misst abgeschlossene Pflegefälle im Gesamtbestand, weder öffentliche Veröffentlichungsreife noch einen gewichteten Qualitätsgrad.

Pflichtdaten sind Slug, Titel, Hersteller, Kategorie, Empfehlung, Review-Zusammenfassung/-Fazit, Hero und Rating. Bei aktiver automatischer Commerce-Pflege zählen insbesondere fehlender Preis, fehlendes Ziel und unbekannte Verfügbarkeit als Pflichtfälle. Archivierte und bewusst nicht verfügbare Produkte erzeugen keine gewöhnliche Commerce-Aufgabe. Redaktionelle Preisführung ist eine explizite Ausnahme für die passende Preis-/Commerce-Aufgabe, kein globaler Qualitätsbonus. Optionale Galerie-/Abo-/Zusatzdaten werden nicht zu Pflichtfeldern umgewidmet. Preiswarnung: 90 Tage, zusätzliche Bestandsfilter: 30/90 Tage. Dieselbe Prüfung kann mehrere Kennzahlen betreffen, aber nur einen Pflegefall erzeugen.

Die Formel wurde nicht abgesenkt. Korrekte Datenwahl und die Entfernung von Altersfällen ohne Betrag führen zu **(25 vollständig + 15 archiviert) / 110 = 36,4 %**. Granary 2 und Granary 2 Vision Duo hatten bereits gültige alternative Angebote; Neakasa M1 Lite und SureFeed Connect erhielten zuvor eine Alterswarnung ohne Preisbetrag. Das hebt weder Veröffentlichungssperren noch Produktanforderungen auf.

Aktuell: 110 Produkte, 88 mit gespeicherter Preisbasis, 107 mit hinterlegtem Händlerziel, 40 mit bekanntem Status, 70 unbekannt, 19 nicht lieferbar, 1 eingestellt, 15 archiviert. Ein hinterlegtes Händlerziel ist nicht automatisch ein technisch freigegebener Kauf-CTA; ungültige Zuordnungen bleiben separat sichtbar. Aktive Pflegefälle: 1 fehlender Preis, 2 fehlende Händlerziele, 64 notwendige und 6 empfohlene Pflegefälle. Die ursprünglichen Werte waren 3, 2, 66 und 8.

Kennzahlen sind anklickbar und filtern exakt die betroffenen Produkte. Bestand, Aktualität und Pflegefälle sind beschriftet; die Quote erklärt ihre Formel und die Einbeziehung des Archivs. Client und Server verwenden dieselbe Kennzahlenfunktion. Die ruhige Gestaltung bleibt erhalten.

## Schutz des Experiments und übriger Daten

Der Auftraggeber hat aktuelle Preise in allen Ansichten ausdrücklich freigegeben; Texte, Scores, Modellauswahl und Links bleiben geschützt. Die historischen Baselines wurden nicht überschrieben. Die Prüfung validiert aktuelle Beträge gegen den zentralen Preisindex und projiziert ausschließlich identifizierte Preisfelder für den historischen Vergleich. Dasselbe gilt für die daraus berechnete Preisklasse im vorhandenen Fit-JSON; übrige JSON-Felder, Markup und Attribute bleiben im zusätzlichen HTML-Vergleich geschützt. Manipulierte Beträge, falsche Preisklassen, Scores, Modelle und Ziele werden erkannt.

Drei bestehende Alternativenzuordnungen sind am historischen Bestand fixiert, damit geänderte Preisbereiche keine Modelle beziehungsweise eingehende Experimentlinks verschieben. Es werden keine Preise eingefroren. Alle 20 geschützten Seiten und 205 eingehenden Linkkanten bleiben erhalten. Alle 110 Produktdateien einschließlich Preisen, Datumswerten, Scores, Links und Texten sowie sechs historische Baseline-Dateien sind bytegleich zum Inventar von 37.4. Die 437 gesperrten Originalhinweise bleiben unverändert. [Einzelne dynamische Preisabweichungen und vollständiger Schutzstatus](product-operations-recovery-37.3a-qa/experiment-price-diff.json).

Die ältere Indexierungsprüfung berücksichtigt nun zusätzlich genau den bereits freigegebenen Geschenkfinder: 270 öffentliche Canonicals, 269 Sitemap-URLs. Einzige ausgeschlossene URL bleibt `/foundation/`, mit noindex und ausdrücklichem Ausschluss der internen Designvorschau. Zwölf ursprüngliche Kontextlinks behalten ihren historischen Quellenbeleg; neun Links aus dem neueren Geschenkfinder erhalten keinen erfundenen historischen Indexstatus. Indexierungsberichte wurden aus dem aktuellen Build neu berechnet, ihre historischen Belegdateien bleiben erhalten.

## Reproduktion und Grenzen

Lokaler Modus: `npm --workspace apps/pfotentechnik run dev` und separat `npm --workspace apps/pfotentechnik run seo:admin`; dann `/admin/seo/prices/`. Der Dev-Befehl verwendet wie vorgegeben `astro dev --background`. Der Browser-QA-Lauf benötigt zusätzlich die ausdrücklich isolierten Produktkopien über `PFOTENTECHNIK_PRODUCT_FIXTURES`; niemals das Browser-Schreibskript ungeprüft gegen den normalen Bestand ausführen.

Die vollständigen neuen Regressionen prüfen unveränderten/veränderten/fehlgeschlagenen Preisabruf, getrennte Bestätigungs-/Änderungsdaten, Amazon mit/ohne Bestellnachweis, mehrere Händler mit unterschiedlichen Prüfständen, altes Haupt-/frisches Alternativangebot, identische Cockpit-/Preisindexquelle, Link-CRUD, Validierung/Hashkonflikte ohne Schreibeffekt, Persistenz, Fehlerbehandlung und gemeinsame Kennzahlen. Echte Browserinteraktionen ergänzen diese Tests.

Bestehende unbelegte Daten bleiben sichtbar. Die Reparatur erklärt und behebt Datenfluss- und Bedienfehler; sie behauptet keine vollständige aktuelle Recherche sämtlicher Händlerangebote oder eine Google-Indexierungswirkung ohne Deployment. Fehlende externe Zugänge und Modellzuordnungen bleiben konkrete offene Pflegeaufgaben, keine erfolgreichen Aktualisierungen.

Die isolierten Admin- und Astro-Testdienste wurden nach dem Prüflauf beendet. Der nächste normale lokale Start verwendet ohne Fixture-Umgebungsvariable wieder die regulären Produktdateien.
