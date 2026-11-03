# 35.5 – Inhaltliche Ähnlichkeit

Alle 259 gerenderten Hauptinhalte wurden vor der Bearbeitung einbezogen: 33.411 Paare, alle Ergebnisse in `content-similarity-pairs.csv`. Das ist eine vollständige lexikalische Suche, keine Behauptung, jedes Paar durch ein semantisches Modell oder redaktionelles Volllektorat abschließend beurteilt zu haben.

Vor dem Vergleich entfernt: globale Navigation, Breadcrumbs, erkannte automatisierte Linkmodule, Script-/Style-/versteckte Inhalte und identische Absatz-/Listen-/Tabellenblöcke auf mindestens acht Seiten. Danach deutsche Stopwörter sowie TF-IDF-Gewichtung von Wort-Unigrammen und -Bigrammen. Produktnamen und technische Begriffe werden nicht als Fehler gewertet; häufige Begriffe erhalten geringeres Gewicht. Zusätzlich misst der Datensatz wiederkehrende 12-Token-Spannen ab acht Dokumenten. Das dient der Beschreibung, nicht als Qualitätsnote.

## Was nach Bereinigung ähnlich bleibt

| Paar / Familie | Bereinigter Kosinus | Inhaltliche Einordnung |
| --- | ---: | --- |
| Tractive DOG 6 / DOG 6 XL | 0,468 | Gleiches Ökosystem und gleiche Grundaufgabe; Baugröße, Eignung, Gewicht und Akku sind echte Variantengrenzen. Ein Ziel ist indexiert, das andere nur gefunden. Weder sameness noch deren Ursache damit belegt. |
| Hersteller Neakasa / Whisker | 0,428 | Ähnlicher Markenüberblick für selbstreinigende Toiletten; Modellfamilien und Verbrauchssysteme sind verschieden. Austauschbare Einleitung/Markenversprechen einzeln prüfen, Profile nicht automatisch zusammenlegen. Beide gefunden. |
| Hersteller Invoxia / Pawfit | 0,392 | Gemeinsamer GPS-/App-/Abo-Rahmen; Tiergrößen, Ortungs-/Gesundheitsfunktionen und Netze unterscheiden die Aufgaben. Keine Gleichsetzung aller Tracker. Beide gefunden. |
| GPS-Katzenvergleich / kleine GPS-Katzentracker | 0,379 | Großer gemeinsamer Kandidatenkreis; Gewicht und Halsbandsystem sind eine spezifische Zusatzfrage. Die bestehende Intentabgrenzung aus 35.4 bleibt maßgeblich. Kein neuer Zusammenschluss ohne Query-/Nutzerdaten. |
| SureFlap Mikrochip / DualScan | 0,376 | Ähnliche Bauform und Vokabular, aber Richtung der Zugangskontrolle ist ein entscheidender Unterschied. Kein Duplikatnachweis durch gleiche Produktfamilie. |

Die höchsten Werte liegen unter 0,5. Daraus folgt **nicht**, dass keine semantisch redundanten oder inhaltlich schwachen Seiten existieren: unterschiedliche Specs/Produktnamen können identische Argumentationsmuster lexikalisch verdecken. Deshalb wurden die Aufgaben der Experimentkandidaten und der 91 gecrawlten Seiten anhand konkreter Textstellen zusätzlich gesichtet (`quality-evidence-review.md`).

## Problematische Muster und harmlose Gemeinsamkeiten trennen

- „Mehr Ausstattung oder ein höherer redaktioneller Score, wenn das Budget zweitrangig ist.“ steht auf 94 Seiten: 22 indexiert, 32 gecrawlt, 40 gefunden. Das ist ein automatischer Alternativenbaustein, kein Nachweis, dass 94 Seiten dieselbe Nutzerfrage beantworten.
- „Statusanzeigen und tatsächliche Nutzung am Tier prüfen. App-Protokolle sind kein vollständiger Nutzungsnachweis.“ steht auf 68 Seiten, davon 15 indexiert. Als Sicherheitsgrenze sinnvoll, als einzige produktspezifische Erfahrungseinordnung zu wenig. Der Kontext entscheidet.
- „Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.“ steht auf 38 Seiten: zwölf indexiert, 23 gecrawlt, drei gefunden. Gemeinsame technische Realität; kein individueller Produkttest.
- Allgemeine Bewertungsmethodik, automatische Entscheidungskarten, Herkunftshinweise und gemeinsame Designkomponenten erklären einen Teil der Wiederholung. Diese wurden nicht als KI-/Spammerkmal klassifiziert.

## Tatsächlicher Zusatznutzen statt nur anderer Formulierungen

Bei den fünf Produkt-Testseiten unterscheiden die neuen Passagen konkret Hub-/Kalibrierungsbedarf, Pumpen- gegenüber Akkubetrieb, tatsächliche Zahl späterer Fachöffnungen, Aufstell-/Laderoutine und Planreserve gegenüber aktiver Kühlung. Die fünf Ratgeber bearbeiten Rechenrundung, belegte Technikbeispiele, Konstruktion/Filterkosten und beobachtbare altersbezogene Zugangs-/Gewöhnungsschritte. Das sind unterschiedliche Nutzerentscheidungen, keine bloß umgeschriebenen Kaufempfehlungen.

Keine URL konsolidiert, gelöscht oder umbenannt. Der ältere Konsolidierungskandidat „Smarte Gadgets“ bleibt eine separate Entscheidung aus 35.4, keine Folgerung aus dem Kosinuswert. Ein exakter bzw. hoher Ähnlichkeitswert allein reicht weder für Zusammenlegung noch für eine Ursache der Nichtindexierung.
