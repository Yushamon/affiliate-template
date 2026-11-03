# 35.5 – Auswahl und Zuteilung

Vor jeder Textbearbeitung wurden Commit, GSC-Snapshot, Inhalts-/Linkmerkmale, Quelle-/HTML-Hashes und der konkrete Verbesserungsbedarf gesichert. Startcommit: `fda8909997fe148e553fa656433bfdc96870056a`. Auswahlzeitpunkt: 2026-11-02T18:31:54.148084+00:00.

## Regeln

- Historische Gruppe B: gecrawlt, nicht indexiert; keine aktuelle Indexierungsbehauptung.
- Mindestens 90 Tage erste Git-Existenz, früh bestehende URLs; keine Migration, keine Änderung aus 35.4; HTTP-/Canonical-/Sitemapkontrollen ohne offenen Blocker.
- Mindestens eine konkrete redaktionelle Entscheidungslücke mit Textbeleg und realistisch verfügbarer Primärquelle. Keine Mindestwortzahl oder numerische Qualitätsnote als Eignungstest.
- Manuell vorgeprüfter Pool von 20 Seiten, sachliche Geräte-/Nutzerfragenblöcke. Keine behauptete Zufallsstichprobe aus der gesamten Website.
- Innerhalb der Blöcke erschöpfendes Minimum-Distanz-Matching: gleicher Typ/Cluster, Alter höchstens 14 Tage auseinander, Klicktiefe höchstens eins auseinander, Verhältnis sichtbarer Wortzahl höchstens 2,5. Abstand berücksichtigt Alter, Klicktiefe, Kontext-Inlinks, Umfang und Wiederholungsanteil; exakte Formel und Eingaben in `selection-lock.json`.
- Zuteilung innerhalb jedes Paares per festem Seed **35520261102**, ein Test/eine Kontrolle, kein Neuziehen. Das ist eine randomisierte Zuteilung in einer kleinen selektierten Stichprobe, kein kontrollierter Nachweis einer allgemeinen Google-Qualitätswirkung.

Die drei B-Vergleichsseiten erlauben kein geeignetes experimentelles Paar: zwei haben Migrationshistorie, der dritte ist allein in seinem passenden Typ-/Clustersegment. Späte C-Seiten und akute medizinische Ratgeber wurden für diese Hardware-/Entscheidungsintervention nicht hineingemischt. Daraus ergeben sich fünf Produkte und fünf Ratgeber statt einer erzwungenen Verteilung.

## Feste Paare

| Paar | Testseite | Unveränderte Kontrolle | Alter Test/Kontrolle | Tiefe | Kontext-Inlinks | Abstand |
| --- | --- | --- | --- | --- | --- | --- |
| P01 | /futterautomat-hund/ | /welcher-futterautomat-ist-der-richtige/ | 117/116 | 2/2 | 11/13 | 0.61 |
| P02 | /wie-funktioniert-ein-futterautomat/ | /wie-laut-sind-automatische-futterautomaten/ | 116/113 | 2/2 | 4/1 | 1.66 |
| P03 | /katzentrinkbrunnen-ohne-filter/ | /katzentrinkbrunnen-dauerbetrieb-urlaub/ | 112/112 | 2/2 | 1/0 | 0.94 |
| P04 | /trinkbrunnen-seniorenkatzen/ | /katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/ | 112/112 | 2/2 | 2/3 | 0.48 |
| P05 | /trinkbrunnen-fuer-kitten-sicher/ | /trinkbrunnen-hund/ | 112/106 | 2/2 | 0/0 | 1.02 |
| P06 | /produkt/aqara-smart-pet-feeder-c1/ | /produkt/pawsync-smart-pet-feeder/ | 112/112 | 2/2 | 1/1 | 0.06 |
| P07 | /produkt/oneisall-3-5l-cordless-fountain/ | /produkt/petlibro-dockstream-cordless/ | 112/112 | 3/3 | 1/1 | 0.07 |
| P08 | /produkt/petkit-eversweet-solo-2-fountain/ | /produkt/petkit-eversweet-solo-se/ | 112/112 | 2/3 | 2/1 | 2.54 |
| P09 | /produkt/cat-mate-c200/ | /produkt/cat-mate-c500/ | 113/113 | 2/2 | 1/6 | 1.43 |
| P10 | /produkt/petlibro-polar-wet-food-feeder/ | /produkt/catit-pixi-smart-6-meal-feeder/ | 113/112 | 2/2 | 3/2 | 0.47 |

Alle 20: ursprünglicher GSC-Status B; 35.4 direkt geändert: nein; historische Migration: nein. Die Baseline-CSV enthält den letzten bekannten Crawl, Sitemap/Canonical, HTTP-Prüfdatum, Dateihash und Platzhalter für aktuelle GSC-Messwerte.

## Vergleichbarkeit und Grenzen

Die Paare kontrollieren Typ, Cluster und mehrere Strukturmerkmale. C200/C500 unterscheiden etwa analoge/digitale Bedienung, Polar/PIXI aktive/passive Kühlung. Leserfrage und Ausgangslage sind also ähnlich, nicht identisch. Beim Solo-2/SE-Paar unterscheidet sich die Klicktiefe um eins; beim Aquarium-/Kitten-/Seniorenkontext bleiben verschiedene Nutzungsfragen. Vorhandene Inhaltsqualität wird über die vorab dokumentierte Lücke und Wiederholungsmuster beschrieben, nicht durch eine erfundene Gesamtnote.

Die aktuelle Vor-Release-Eignung ist mangels GSC-Zugang noch offen. Wird eine URL vor Start bereits indexiert gefunden, darf das nicht als Erfolg der Intervention gezählt werden. Vor Release das ganze betroffene Paar und die Präregistrierung prüfen; kein selektives Entfernen nach Beginn oder nach beobachtetem Erfolg.

## Quellen-Gegenprüfung und unveränderte Zuteilung

Der zunächst allein aus dem Catit-URLslug abgeleitete Modellfehler wurde beim Abruf widerlegt. Der Artikel beschreibt den Feeder. Die Eignungsbegründung wurde am 03.11. berichtigt; alle Paarungen und die Zufallszuteilung blieben unverändert. `pre-verification-selection-lock.json` bewahrt den ursprünglichen Stand, der aktuelle Lock die Korrektur und deren Beleg. Das ist keine nachträgliche Optimierung anhand von Indexierungsergebnissen; solche Ergebnisse liegen nicht vor.

35.4/35.3B sind im Ausgangscommit bereits erhalten. Keine ihrer Dateien oder bestehenden Berichte wurde absichtlich überschrieben. Ein gemeinsames späteres Release, globale Verlinkungseffekte, Google-Updates und natürliche Wiederaufnahme bleiben mögliche gleichzeitige Eingriffe; die 20 URLs haben selbst keine direkte 35.4-Vorbehandlung.