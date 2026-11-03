# 35.5 – Indexation Gap Analysis

**Ergebnis:** Das deutlichste gemessene Muster betrifft die jüngeren, nur gefundenen Seiten. Für bereits gecrawlte Seiten ergibt sich keine belastbare einfache Trennregel aus Textlänge, Quellenzahl, Wiederholung oder Klicktiefe. Konkrete Quellen-/Entscheidungsprobleme existieren, aber auch indexierte Seiten enthalten vergleichbare Schwächen. Die zehn Überarbeitungen sind deshalb ein begrenztes Experiment, keine diagnostizierte siteweite Qualitätsreparatur.

## Datenbasis und Zeitbezug

259 aktuelle Canonicals; exakte GSC-Zuordnung aus 35.4 unverändert: 90 / 91 / 78. Export vom 02.11.2026, Coverage-Diagramm bis 23.10., einzelne Crawldaten bis 24.10. Keine Live-Indexabfrage. Der untersuchte Ausgangsinhalt ist Commit `fda89099` einschließlich 35.4/35.3B; Merkmalsbaseline und Git-Alter beziehen sich auf den 02.11.2026. Fertigstellung der Vorbereitung am 03.11.2026. HTTP-Kontrollen aus 35.3 werden mit ihrem ursprünglichen Prüfzeitpunkt wiederverwendet.

Wichtig: Das jüngste Exporturteil ist älter als die 35.4-Texte. Der Vergleich ist kein Nachweis einer Bewertung dieser Texte durch Google. 23 der indexierten, zwölf der gecrawlten und sechs der gefundenen Canonicals wurden durch 35.4 verändert. Sensitivitätsauswertung ohne diese 41 steht in `group-statistics.json`. Git-Existenz wird nicht als Veröffentlichungsdatum ausgegeben; zusätzliche publizierte Metadaten sind als unbestätigt gekennzeichnet.

Die historische Performance wurde ergänzend aus 25 verifizierten, nicht wegen URL-Umschreibung ausgeschlossenen Dashboardständen und den Original-ZIPs vom 07.09./21.09. zusammengeführt: 10.320 passende Beobachtungszeilen für 122 heutige Canonicals. Überlappende Fenster werden nicht summiert. Exakte kanonische URLs und hostlose Pfadzeilen bleiben getrennt; fehlende Impressionen werden nicht als negativer Indexstatus interpretiert. Startdaten aggregierter Performancefenster sind keine Publikations- oder ersten Impressionstage. Siehe `historical-performance-observations.csv` und Quellenmanifest.

## Zuerst Seitentyp und Themencluster trennen

| Typ | Gesamt | Indexiert | Gecrawlt | Gefunden |
| --- | --- | --- | --- | --- |
| product | 103 | 23 (22,33 %) | 38 (36,893 %) | 42 (40,777 %) |
| guide | 76 | 28 (36,842 %) | 41 (53,947 %) | 7 (9,211 %) |
| comparison | 28 | 19 (67,857 %) | 3 (10,714 %) | 6 (21,429 %) |
| manufacturer | 33 | 8 (24,242 %) | 8 (24,242 %) | 17 (51,515 %) |
| category | 6 | 3 (50,0 %) | 0 (0,0 %) | 3 (50,0 %) |
| other | 13 | 9 (69,231 %) | 1 (7,692 %) | 3 (23,077 %) |

Elf Toilettenprodukte und acht Kameraprodukte stehen vollständig auf „Gefunden“; bei Katzenklappenprodukten sind neun gefunden und eines gecrawlt. In diesen Zellen fehlt eine indexierte Produkt-Kontrollgruppe. Man darf ihre Eigenschaften nicht mit den überwiegend älteren Futterautomaten gleichsetzen.

### Gleicher Typ und ähnlicher Cluster

| Typ/Cluster | Status | n | Git-Alter, Tage | Hauptinhalt, Wörter | Quellenlinks* | Kontext-Inlinks | Ähnlichkeit* |
| --- | --- | --- | --- | --- | --- | --- | --- |
| product:futterautomaten | indexed | 12 | 113,0 | 1033,0 | 2,0 | 1,0 | 0,107 |
| product:futterautomaten | crawled-not-indexed | 23 | 113 | 1046 | 2 | 1 | 0,102 |
| product:futterautomaten | discovered-not-indexed | 3 | 113 | 1047 | 2 | 3 | 0,108 |
| product:trinkbrunnen | indexed | 8 | 112,0 | 1058,5 | 1,0 | 1,5 | 0,109 |
| product:trinkbrunnen | crawled-not-indexed | 13 | 112 | 1079 | 2 | 1 | 0,116 |
| product:trinkbrunnen | discovered-not-indexed | 3 | 78 | 1032 | 3 | 1 | 0,095 |
| guide:futterautomaten | indexed | 6 | 112,5 | 1191,5 | 3,0 | 5,0 | 0,119 |
| guide:futterautomaten | crawled-not-indexed | 16 | 113,0 | 3100,5 | 5,0 | 5,0 | 0,111 |
| guide:trinkbrunnen | indexed | 10 | 112,0 | 875,5 | 3,0 | 4,5 | 0,107 |
| guide:trinkbrunnen | crawled-not-indexed | 14 | 112,0 | 1343,5 | 3,0 | 2,5 | 0,095 |

*Mediane. Quellenlinks sind strukturell erfasste sichtbare externe Belegkandidaten, keine bewertete Quellenqualität; zusätzliche Feldquellen stehen separat in der Matrix. Ähnlichkeit ist bereinigter lexikalischer TF-IDF-Kosinus, keine Qualitätsnote und kein Beweis gleicher Suchintention. Zellen unter zehn sind klein; insbesondere drei gefundene Futterautomaten-/Trinkbrunnenprodukte erlauben keine verlässliche Verallgemeinerung.

Bei Futterautomatenprodukten liegen indexierte und gecrawlte Seiten praktisch gleich: 1.033 gegen 1.046 Wörter, je 113 Git-Tage, je zwei Quellenlinks und je ein kontextueller Inlink im Median. Die ähnliche Quellenzahl schließt konkrete Fehlzuordnungen oder unpassende Belege nicht aus.

Auch nach Bereinigung gemeinsamer Blöcke liegt der Ratgebermedian bei 515 Wörtern für A und 1.989 für B; Produkte liegen mit 265/262,5/261,5 in A/B/C nahezu gleich. Bei Ratgebern bleibt der Längenunterschied auch innerhalb der Cluster: Futterautomaten 1.191,5 gegen 3.100,5 Wörter, Trinkbrunnen 875,5 gegen 1.343,5. Mehr Inhalt oder mehr Quellen allein sind damit kein begründeter Recovery-Hebel. Bei Trinkbrunnenratgebern haben negative Seiten weniger Kontext-Inlinks, bei Futterautomatenratgebern sind die Mediane gleich. Keine einheitliche Verlinkungserklärung.

## Gesamtvergleich: beschreibende Merkmale

| Merkmal | Indexiert (90) | Gecrawlt, nicht indexiert (91) | Gefunden, nicht indexiert (78) |
| --- | --- | --- | --- |
| Erste Git-Existenz, Tage bis Baseline | 112,0 | 112 | 88,0 |
| Wörter im sichtbaren Hauptinhalt | 1048,5 | 1271 | 988,5 |
| Anteil wiederkehrender 12-Token-Spannen | 0,106 | 0,165 | 0,244 |
| Ähnlichkeit zum Typ-/Clusternachbarn | 0,113 | 0,103 | 0,136 |
| Sichtbare Quellenlink-Kandidaten | 2,0 | 3 | 2,0 |
| Unabhängige Quellen-Domainkandidaten | 0,0 | 1 | 0,0 |
| Eingehende kontextuelle Quellseiten | 3,0 | 2 | 2,0 |
| Davon im Export indexierte Quellseiten | 1,0 | 1 | 0,0 |
| Klicktiefe ab Startseite | 2,0 | 2 | 2,0 |

„Gefunden“: Median 88 statt 112 Git-Tage, also 24 Tage beziehungsweise 21,4 % jünger. 65/78 dieser Seiten sind erst nach dem 27.07. im Git belegt. In A und B sind dagegen 88/90 beziehungsweise 90/91 bis dahin belegt. Das passt zu unterschiedlicher Discovery-/Verarbeitungshistorie; es beweist weder eine Alterswirkung noch, dass Google nie später gecrawlt hat.

Keinen strukturell erfassten Kontextlink aus einer im Export indexierten Seite haben 26/90 indexierte Seiten (28,9 %), 30/91 gecrawlte (33,0 %) und 41/78 gefundene (52,6 %). Gegenüber A liegt C um 23,7 Prozentpunkte höher, ungefähr Faktor 1,82. Das kann mit Seitentyp, Themenalter und der historischen Auswahl indexierter Quellen zusammenhängen; Linkrichtung ist hier nicht Ursache/Wirkungsrichtung.

### Effektgrößen und Unsicherheit

| Vergleich | Merkmal | Mediandifferenz | Cliff δ | Exploratives 95%-Bootstrapintervall |
| --- | --- | --- | --- | --- |
| crawled-not-indexed − A | git_age_days | 0,0 | -0,034 | -1,0 bis 1,0 |
| crawled-not-indexed − A | visible_main_words | 222,5 | 0,247 | 7,0 bis 390,0 |
| crawled-not-indexed − A | recurrent_12token_fraction | 0,059 | 0,072 | -0,043 bis 0,097 |
| crawled-not-indexed − A | incoming_contextual_indexed | 0,0 | -0,101 | -1,0 bis 0,0 |
| discovered-not-indexed − A | git_age_days | -24,0 | -0,927 | -26,0 bis -23,0 |
| discovered-not-indexed − A | visible_main_words | -60,0 | -0,179 | -230,0 bis -0,5 |
| discovered-not-indexed − A | recurrent_12token_fraction | 0,138 | 0,364 | 0,07 bis 0,182 |
| discovered-not-indexed − A | incoming_contextual_indexed | -1,0 | -0,394 | -2,0 bis 0,0 |

Cliff δ beschreibt die Richtung/Stärke der Rangunterschiede, hier jeweils B oder C gegen A. Die Intervalle stammen aus 400 reproduzierbaren Resamples der Mediandifferenz; sie sind explorative Unsicherheitsangaben, keine bestätigenden Tests oder Korrektur für die vielen untersuchten Merkmale. Gemeinsame Templates und Themen erzeugen Abhängigkeiten, die diese einfachen Intervalle nicht modellieren. Alle Typ-/Cluster-Effektgrößen, Gruppengrößen, Quartile und relativen Mediandifferenzen stehen in den beigefügten CSV/JSON-Dateien.

Für Alter zeigt B nahezu keinen Unterschied (δ etwa −0,034), C einen starken (δ etwa −0,927). Wiederholung ist bei Produkten in allen drei Gruppen häufig; der globale Unterschied wird teilweise durch den Mix von Produkttypen und Ratgebern bestimmt. Kein komplexes multivariables Modell wurde erzwungen: viele Typ-/Clusterzellen sind klein oder enthalten nur eine Statusgruppe; Merkmale sind stark korreliert und das Google-Urteil ist zeitlich nicht mit dem Textstand synchron.

## Verlinkung und technische Kontrollvariablen

Die Matrix unterscheidet alle eingehenden Quellseiten, strukturell kontextuelle Links in Absatz/Liste/Tabelle sowie Navigation/automatische Module. Breadcrumbs, globale Navigation und erkannte Related-/Next-Steps-/Journey-Listen werden nicht als redaktioneller Kontext gezählt. Inline-Autolinks sind aus dem finalen HTML nicht in jedem Fall von manuell gesetzten Links unterscheidbar; deshalb „strukturell kontextuell“, nicht „ausschließlich manuell redaktionell“. Hubtiefe wird aus dem gerenderten Graphen berechnet; ohne passenden Themenhub bleibt sie unbekannt. Der ausgewiesene Graph-PageRank ist nur ein lokales Strukturmaß.

Alle 259 aktuellen Canonicals haben im wiederverwendeten Liveaudit HTTP 200; Canonicals, Sitemap, indexierbare SSR-Hauptinhalte und strukturierte Daten sind als technische Kontrollen erfasst. Daraus wird kein Indexierungsstatus abgeleitet. Frühere 35.3B-Redirectfehler bleiben separate historische Befunde. Die Kohorte enthält 23 Migrations-/Konsolidierungsziele, davon 17 indexiert; das Ergebnis aus 35.3B wird nicht als neue Discovery-Diagnose ausgegeben.

## Entscheidungsvorlage – zwölf Antworten

1. **Stärkste Unterschiede:** erste belegte Git-Existenz, Seitentyp-/Clustermix und Kontextzugänge aus indexierten Quellen unterscheiden besonders die gefundenen Seiten. Für B fehlt eine ähnlich starke allgemeine Trennregel.
2. **Innerhalb gleicher Typen:** Bei Produkten schrumpfen Wort-/Quellen-/Linkunterschiede stark. Gecrawlte Ratgeber bleiben in vergleichbaren Clustern länger; fehlende Textmenge erklärt diese Fälle nicht.
3. **Alter oder Links:** C ist jünger und hat häufiger keine Kontextquelle aus A. Das ist mit Discovery vereinbar, keine abgeschlossene Erklärung; 13 gefundene Seiten sind ebenfalls alt. Bei B und A ist das Git-Alter praktisch gleich.
4. **Austauschbarkeit:** Gemeinsame Standardpassagen sind belegt; nach deren Entfernung gibt es keinen flächendeckenden Nachweis nahezu identischer Texte. Einzelne ähnliche Intents/Produktvarianten brauchen manuelle Abgrenzung. Niedriger lexikalischer Kosinus beweist keine Eigenständigkeit.
5. **Konkrete Lücken:** Produktseiten brauchen teils belastbarere Modell-/Betriebsgrenzen; Ratgeber teils passende technische Quellen und präzisere Folgerungen aus bestehenden Rechnungen. Das sind belegte Einzelfälle, keine Rangfolge einer gesamten Seitengattung.
6. **Indexierte Gegenbeispiele:** Eversweet 5 Mini, Dockstream RFID und Cat Mate C300 besitzen ebenfalls kurze bzw. allgemeine Erfahrungseinordnungen. Hersteller-/Vergleichsmodule wiederholen sich auch auf indexierten Seiten. Siehe Qualitätsevidenz.
7. **Ungeeignete Alleinindikatoren:** Wortzahl, Quellenanzahl, FAQ-/Überschriftenzahl, einheitliches Design, gemeinsame technische Begriffe, Produktnamen und fehlende eigene Praxistests. KI-Verwendung wurde nicht als Qualitätsfehler oder Abwertungsnachweis behandelt.
8. **Zehn verbesserte Seiten:** fünf Produkte und fünf Ratgeber aus der gecrawlten Gruppe; konkrete Liste und Nutzen in `experiment-selection.md`/`experiment-changes.md`. Auswahl vor Bearbeitung, kein Nachziehen nach Ergebnissen.
9. **Kontrollvergleichbarkeit:** Gleicher historischer Status, Typ/Cluster, mindestens 90 Git-Tage, keine Migration/35.4-Änderung; Matching nach Alter, Tiefe, Inlinks, Umfang und Wiederholungsanteil innerhalb praktischer Themenblöcke. Kleine Paare, unterschiedliche Geräteklassen und Leseraufgaben bleiben Störfaktoren.
10. **Stärkung der Qualitätshypothese:** Bei neuen Crawls, eigenen Google-Canonicals und stabiler Technik würden mehr Test- als Kontrollseiten nach 56 Tagen sowie ein über mehrere Messpunkte konsistenter Unterschied die konkrete Intervention stützen. Keine allgemeine Google-Qualitätsbewertung daraus ableiten.
11. **Gegenbefunde:** Gleich gute/bessere Kontrollen trotz erneuter Crawls und stabiler Canonicals schwächen den angenommenen Zusatznutzen für Indexierung. Keine Veränderung ohne neue Crawls ist dagegen kein aussagekräftiger Test der Textqualität.
12. **Spätere Maßnahmen:** Erst nach vollständiger 56-Tage-Beobachtung über Ausweitung, Zusammenlegung oder zusätzliche Quellenarbeit entscheiden. Technische echte Fehler bleiben sofort gesondert behebbar. Keine automatischen Indexierungsanträge und keine pauschale weitere Seitenbearbeitung.

Aktuell ist nur die Vorbereitung abgeschlossen. GSC-Zugang ist nicht eingerichtet; die aktuelle Vor-Release-Messung der 20 URLs muss manuell ergänzt werden. Kein Release und keine Recoverywirkung werden behauptet.