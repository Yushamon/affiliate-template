# Inhaltsbezogene Clusteranalyse

Stand: 16.10.2026. Bewertet wurden die aktuellen gerenderten Hauptinhalte und ihre Quelltexte. Die Analyse belegt Inhalte und Überschneidungen, keine Google-Qualitätsentscheidung. Das bestehende Content-Quality-Verfahren meldet im aktuellen Bestand keine exakten oder Near-Duplikate. Das schließt eine gleiche Nutzeraufgabe bei unterschiedlich formulierten Texten nicht aus.

Die Werte in `current/overlap-candidates.json` verwenden den bestehenden Haupttextvergleich: 38 % Token-Jaccard und 62 % Fünfwortgruppen-Jaccard. Navigation wird aus dem Haupttext entfernt; wiederkehrende Inhaltskomponenten bleiben teilweise enthalten. Ein Wert von 0,4072 ist keine „40,72 % Duplicate Content“-Diagnose. Automatische Kandidaten dienen nur der Sichtung. Die vollständige Inventur vermerkt pro URL bis zu drei solche Nachbarn; für Produkte/Hersteller gilt zusätzlich der bestehende Exact-/Near-Duplicate-Audit, keine unkontrollierte Keyword-Gleichsetzung.

## Futterautomaten

**Konkrete Nähe:** `/vergleiche/beste-futterautomaten-fuer-berufstaetige/` und `/vergleiche/beste-futterautomaten-mit-akku/` präsentieren aktuell dieselben Finalisten **Xiaomi Smart Pet Food Feeder 2** und **PetSafe Smart Feed 2.0**. Die Entscheidungsbühne enthält dieselben Überschriften „Nimm das Modell, das deinen Alltag wirklich löst“ und „Was sich im Alltag wirklich unterscheidet“. Ihr Haupttextvergleich liegt bei 0,4188. Das ist eine tatsächliche Wiederholung der Auswahl und Präsentation, nicht bloß Keyword-Nähe.

**Belegte Unterschiede:** Die Berufstätigen-Seite verwendet Zeitpläne, Offline-Betrieb, Stromreserve, Störungsmeldungen, Vorrat und Kontrollierbarkeit. Die Akku-Seite behandelt ausdrücklich „Akku und Batterie-Backup sind nicht dasselbe“ und „Typische Fehler im Notstromkonzept“. Beide beantworten daher nicht vollständig dieselbe Frage. Beide sind im vorhandenen Export **gefunden**, nicht Mitglieder des 84er-Crawled-Teilbestands.

**Bezug zu den 84:** `/vergleiche/futterautomat-mit-app/` wurde dagegen als **gecrawlt, nicht indexiert** exportiert. Dort sind PETKIT YumShare Dual-Hopper 2 und Xiaomi die Finalisten; Protokolle, WLAN, Offline-Funktion und Datenschutz erweitern die App-Aufgabe. Ebenso im 84er-Bestand: `/vergleiche/beste-futterautomaten-fuer-zwei-katzen/` und `/vergleiche/beste-futterautomaten-ohne-wlan/`. Bei zwei Katzen sind Portionsteilung und tatsächliche Zugangskontrolle zu unterscheiden; Offline-Betrieb ist wiederum nicht identisch mit Akkuversorgung. Diese Grenzen erst anhand der Google-Canonical-/Query-Daten prüfen, bevor Texte geändert werden.

**Empfehlung:** Pro Vergleich den konkreten Auswahlauftrag gegen die bereits sichtbaren Finalisten/Kriterien prüfen. Bei weiterem Ausschluss nach dem kontrollierten Versuch zuerst die App-/Offline-/Backup-Abgrenzung prüfen. Keine automatische Zusammenführung, keine neue generische Landingpage. `/futterautomat-katze/` beantwortet Eignung und Futterarten; `/vergleiche/beste-futterautomaten-fuer-katzen/` beantwortet die konkrete Modellwahl. Dies ist eine plausible, zu kontrollierende Intent-Grenze, kein belegter Konflikt.

## Automatische Katzentoiletten

`/automatische-katzentoiletten/` erklärt Einstieg, Gewicht, Bauform, Sensoren, Streu und Reinigung vor der Modellwahl. `/vergleiche/beste-automatische-katzentoiletten/` vergleicht zehn Kaufrollen, Sicherheits-/Ausschlusslogik und Verbrauchssysteme; die aktuelle Bühne stellt Litter-Robot 4 und PetSnowy SNOW+ gegenüber.

**Bewertung:** Eigenständiger Nutzen der Kategorie ist belegt. Beide URLs sind **gefunden, nicht indexiert**, keine der beiden gehört zur 84er-Crawled-Gruppe. Deshalb ist ein vermeintlich schwacher Kategorienutzen hier keine durch den 84er-Bestand gestützte Ursache. Die frühere Crawling-/Google-Canonical-Entscheidung ist unbekannt. Keine Kategorienkonsolidierung vornehmen.

## Haustierkameras

`/haustierkameras/` ordnet festen Blickpunkt, Interaktion, mobilen Kameraroboter, Speicherweg und Bezahlplan ein. `/vergleiche/beste-haustierkameras/` zeigt konkret Reolink E1 Zoom und PetTec Cam 360, ergänzt „Speicherweg vor Auflösung entscheiden“, „Katzeninteraktion ist eine eigene Kaufrolle“ und lokale Speicherung ohne Pflichtabo.

**Bewertung:** Gemeinsame Kriterien, aber belegbare Trennung von Anforderungen und Modellauswahl. Beide sind **gefunden, nicht indexiert**. Im 73er-Bestand aktueller Crawled-Canonicals gibt es keinen Haustierkamera-Cluster. Kein Beleg, dass Google diese Kategorie wegen mangelnder Eigenständigkeit abgelehnt hat.

## GPS-Tracker

**Wichtigster Vergleichskandidat der Crawled-Gruppe:** `/vergleiche/kleine-gps-tracker-fuer-katzen/` gegenüber `/vergleiche/beste-gps-tracker-fuer-katzen/`. Beide zeigen **Weenect XS und Tractive CAT 6 Mini**. Der Haupttextvergleich liegt bei 0,4072. Beide diskutieren Gerätegewicht, Tragesystem, Passform, sichere Befestigung, Abo und Akku. Die allgemeine Seite enthält bereits „Gerätegewicht und Tragesystem getrennt bewerten“ und „Welche Katze passt nicht zu den drei Modellen?“ – Themen, die auch den kleinen Trackervergleich tragen.

**Tatsächliche Eigenständigkeit:** Die Spezialseite beginnt mit dem leichtesten reinen Gerätewert und behandelt „Passformtest statt Küchenwaage“. Die allgemeine Seite ergänzt Gesundheits-/Plattformfragen und ROLA-Abgrenzung. Eine ähnliche Shortlist beweist noch keine identische Antwort.

**Priorität:** Die kleine Tracker-Seite ist als **gecrawlt, nicht indexiert** exportiert und hat nur **zwei** eingehende Quellseiten. Der allgemeine Vergleich ist **gefunden, nicht indexiert**. Das ist ein enger Ansatzpunkt für URL-Inspection und eine spätere, separat gemessene Abgrenzung; keine belegte Google-Canonical-Konkurrenz. Beide URLs inspizieren, aber im ersten Versuch nur die kleine Tracker-Seite einmal anfordern. `/vergleiche/gps-tracker-mit-langer-akkulaufzeit/` ist mit 0,3863 ein weiterer Nachbar der kleinen Tracker-Seite, enthält jedoch die eigene Regel „gleiche Betriebsart oder keine Rangfolge“. Keine Akkulaufzeiten verschiedener Betriebsarten zu einer neuen Rangfolge umdeuten.

## Katzenklappen

`/katzenklappen/` ordnet Tiermaße, Zugang und Einbau vor smarten Funktionen. `/vergleiche/beste-mikrochip-katzenklappen/` enthält Chip-Kompatibilität, pro Tier geltende Rechte sowie Batteriewechsel/Speicher. `/vergleiche/katzenklappen-mit-app-und-beuteerkennung/` trennt Identitätszugang, App und Beutefunktion; ZeroMOUSE und SureFlap Connect erfüllen unterschiedliche Aufgaben.

`/katzenklappe-einbauen/` beantwortet Tür-, Glas-, Wand- und modellbezogene Tunnel-/Metallfragen. `/katzenklappe-zugluft-und-waermedaemmung/` trennt Klappe, Einbauanschluss und Bauteilsystem. Ähnliche Einbaubegriffe machen die Luft-/Wärmefrage nicht zur Montageanleitung.

**Bewertung:** Sachlich eigenständige Rollen vorhanden, kein Katzenklappenfall im aktuellen Crawled-Canonical-Teilbestand. Kategorie und Hauptvergleich sind **gefunden, nicht indexiert**. Keine technische oder inhaltliche Zusammenlegung begründet.

## Trinkbrunnen

`/trinkbrunnen/` erklärt Trinkfläche, Zugänglichkeit der Pumpe, Material, Filter-/Ersatzversorgung. `/vergleiche/beste-trinkbrunnen-fuer-katzen/` stellt konkrete Modelle und den Haushaltseinsatz gegenüber. `/vergleiche/beste-trinkbrunnen-fuer-hunde/` ist ein eigener **Crawled-Fall** mit **21 eingehenden Quellseiten**; die hundegerechte Trinkfläche ist eine andere Kaufrolle als eine rein katzenbezogene Shortlist.

**Ratgeber-Grenzen:** `/katzentrinkbrunnen-richtig-reinigen/` ist als **gecrawlt, nicht indexiert** exportiert und hat **14** eingehende Quellseiten. Der Text enthält Gesamtgerät, Intervalle und Problemverteilung. `/pumpe-katzentrinkbrunnen-reinigen/` behandelt Ausbau/Impeller und eine sechsstufige Pumpenreinigung. `/biofilm-im-katzentrinkbrunnen/` behandelt den schleimigen Belag und Rückfallvermeidung. Inhaltliche Schnittmengen sind real, aber diese Spezialisierung ist ebenfalls real. Google-Canonical dieser drei Seiten erheben, bevor eine größere Änderung empfohlen wird.

## Clusterübergreifende Ratgeber-Nähe

`/hund-trinkt-viel/` und `/hund-trinkt-ploetzlich-viel/` beantworten beide Ursachen, Warnzeichen, Messung und tierärztlichen Handlungsbedarf; beide behandeln Wasserzugang und Durst plus Urinabsatz. Die erste Seite enthält „Trinkmenge korrekt erfassen“ und einen Entscheidungsbaum, die zweite ebenfalls „Mögliche Ursachen“ und „Entscheidungshilfe“. Der Zusatz „plötzlich“ allein beweist keine eigenständige Nutzeraufgabe.

**Empfehlung:** Dies ist eine inhaltlich begründete Intent-Prüfung, kein erwiesener Google-Konflikt. Keine der beiden exakten kanonischen URLs gehört zu den 73 aktuellen Crawled-URLs; `/hund-trinkt-viel/` hat ein aktuelles GSC-Leistungssignal, aber dadurch keinen nachgewiesenen heutigen Indexstatus. Kein automatisches Umschreiben oder Zusammenlegen medizinischer Texte.

## Übergreifende Einordnung

- Wiederkehrende Entscheidungsbühnen sind in den Vergleichsseiten sichtbar; besonders ähnliche Finalisten bei GPS und Futterautomaten können die wahrgenommene zusätzliche Antwort schwächen. **Plausible Qualitätshypothese**, nicht bekannte Google-Ursache.
- Die 73 aktuellen Crawled-URLs sind keine bloß wortarmen Seiten: Median des gerenderten Haupttextes **1.593 Wörter**, teilweise einschließlich gemeinsamer Module. Das widerlegt die pauschale Diagnose „alle zu kurz“, beweist aber keine gute Antwortqualität.
- Unter den 25 Crawled-Produkten sind **21 `editorial-review`**, **vier `manufacturer-data`**. Im expliziten `editorial.testedHandsOn`-Feld sind drei `false`, 22 Angaben fehlen; daraus lassen sich keine eigenen Praxistests erfinden. Vergleichbare Dokumentations-/Template-Merkmale existieren auch außerhalb des Teilbestands. Es fehlt eine belegte aktuell indexierte Vergleichsgruppe.
- Interne Linkmenge erklärt nicht die ganze Gruppe: Der Median sind **acht** eingehende Quellseiten; selbst `/produkt/petkit-yumshare-dual-hopper/` mit **55** und `/hersteller/petlibro/` mit **50** wurden als gecrawlt, nicht indexiert exportiert. Sieben aktuelle Fälle haben höchstens zwei eingehende Quellseiten und verdienen separate Beobachtung. Niedrige Linkzahl ist dort eine Priorisierungshypothese, kein belegter Crawlblocker.
