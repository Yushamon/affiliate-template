# Katzenklappen-Kerncluster 26.0.0

Stand: 04.08.2026. Repository, vorhandene Research-Daten und deutsche/EU-Herstellerquellen wurden geprüft. `research/research.json` war für diesen Cluster veraltet: Es führte den inzwischen vorhandenen Hub weiterhin als Lücke und enthielt keine belastbaren Live-Suchleistungsdaten. Eine lokale GSC-/Bing-Abfrage war nicht Teil des verfügbaren Bestands; daraus werden keine Traffic- oder Rankingbehauptungen abgeleitet.

## Intent-Matrix

| Route / Datei | Aktueller Intent | Soll-Intent | Owner vor Änderung | Risiko | Entscheidung | Konkrete Änderung | Abhängigkeiten | Akzeptanzkriterium |
|---|---|---|---|---|---|---|---|---|
| `/smarte-katzenklappen/` | Breite Auswahl | Kein eigener indexierbarer Intent | alte Hubseite | Sehr hoch neben `/katzenklappen/` | zusammenführen | Inhalt nach `/katzenklappen/` migriert, 301 gesetzt | Redirect-Inventar | Nur `/katzenklappen/` indexierbar; Redirect vorhanden |
| `/katzenklappen/` | fehlte | Cornerstone: Aufgabe → Zugang → Einbau → System | alte Smart-Hubseite | Überschneidung mit Vergleichen bei Modellranking | neu anlegen | breiter Owner ohne Produktdetailduplikate | Vergleiche, Ratgeber, Produkte | Canonical, Journey und Links bauen; keine zweite Hubroute |
| `/vergleiche/beste-mikrochip-katzenklappen/` | fehlte | Modellübergreifende Mikrochip-Evaluation | einzelne Produktseiten | Mittel bei unklaren Produktrollen | neu anlegen | sechs Systeme nach identischen Kernkriterien, Rollen sichtbar | mindestens zwei belegte Klappen | ≥2 Produkte, Kriterien und bestehende Ziele; Product-Details bleiben ausgelagert |
| `/vergleiche/katzenklappen-mit-app-und-beuteerkennung/` | fehlte | App-/Beute-Systementscheidung | Connect und ZeroMOUSE einzeln | Hoch, falls Nachrüstung als Klappe gilt | neu anlegen | Komplettsystem, motorisierte Tür und Nachrüstung explizit trennen | Connect, OnlyCat, petWALK, ZeroMOUSE | Rollenfeld sichtbar; keine Trefferquotenbehauptung |
| `/katzenklappe-einbauen/` | im alten Hub angerissen | Bauteil- und Einbauplanung | Hub/Produktseiten | Niedrig | neu anlegen | Tür, Glas, Wand, Maße, Strom | Produktmaße und Fachbetrieb-Grenze | eigenständige Nutzeraufgabe; keine modellfremden Maße |
| `/katze-an-katzenklappe-gewoehnen/` | fehlte | Training und Support | keiner | Niedrig | neu anlegen | vier Trainingsstufen ohne Zeitversprechen | eingebautes passendes System | mechanische, akustische und elektronische Stufen getrennt |
| `/katzenklappe-fuer-mehrere-katzen/` | im Hub angerissen | Regelmatrix je Tier/Richtung | Hub, DualScan/Connect | Mittel | neu anlegen | Problemseite führt in Vergleich und DualScan | belegte Richtungsrechte | Eintritt, Ausgang, Rückkehr und Training getrennt |
| `/katzenklappe-zugluft-und-waermedaemmung/` | fehlte | Bauphysikalisches Problem einordnen | PetSafe/petWALK Produktangaben | Mittel | neu anlegen | Klappe, Anschluss und Bauteil getrennt | Herstellerwerte, Fachplanung | keine pauschale U-Wert-Übertragung |
| `/katzenklappe-mit-chip-oder-app/` | fehlte | wäre Basisauswahl | Cornerstone | Sehr hoch | verwerfen | Inhalt im Cornerstone konsolidiert | `/katzenklappen/` | Route existiert nicht; Cornerstone beantwortet Frage |
| fünf neue Produktdateien | fehlten | konkrete Modellprüfung | Herstellerseiten extern | Niedrig bei sauberem Scope | neu anlegen | Datenreview, `rating: 0`, Evidenz und Verfügbarkeit | Primärquellen | kein Score/Affiliate; acht Assets; Quellen je Feldgruppe |
| SureFlap Connect | konkrete Produktprüfung | gleich, mit Cluster-Rückweg | Produktseite | Niedrig | schärfen | Kategoriepfad/Links auf neuen Hub; Review-Schema zentral abgesichert | Hub/Vergleiche | kein falsches ReviewRating bei 0 |
| ZeroMOUSE 2.0 | Nachrüstprodukt | gleich, im Systemvergleich als Nachrüstung | Produktseite | Hoch bei Gleichsetzung | schärfen | Hub und App-Vergleich verlinkt | kompatible Klappe | niemals als vollständige Klappe bezeichnet |
| Hersteller Sure Petcare, PetSafe, OnlyCat, petWALK, ZeroMOUSE | Marken-/Vertrauensintent | Markenrolle und belegte Produkte | vorhandene bzw. fehlende Herstellerseiten | Mittel bei Produkttextduplikation | schärfen / neu anlegen | Produktlisten und Clusterübergaben | konkrete Produktseiten | Markenprofile duplizieren keine Detailreviews |
| Cat Mate | Fütterung/Brunnen im Bestand | unverändert | Cat-Mate-Seite | künstliche Clusterzuordnung | bewusst unverändert | keine Katzenklappen-Zuordnung ohne konkretes Produkt | keine | keine neue Clusterkante |
| PetSafe Petporte | konkreter Modellkandidat | keine eigene Route | PetSafe-Shop | zusätzliche nahe PetSafe-Produktseite | verwerfen | nur als geprüfter Kandidat dokumentiert | Markt-/Supportbeobachtung | keine Produktdatei; keine künstliche Sollzahl |

## Reihenfolge und Abhängigkeiten

1. Gemeinsames Schema für `decisionJourney` und `evidenceSources`.
2. Produkt-Evidenz und Verfügbarkeit, anschließend Herstellerzuordnung.
3. Zwei Vergleiche erst auf belegter Produktbasis.
4. Cornerstone-Migration mit Redirect.
5. Vier eigenständige Praxisratgeber und Journey-Kanten.
6. Bildpakete, Tests, Audits und Build.

## Drei naheliegende Verbesserungen

1. Produkt-JSON-LD emittiert `ReviewRating` nur bei einem positiven belegten Score oder Rating.
2. Der alte Smart-Hub wird per 301 konsolidiert; interne Links zeigen direkt auf den kanonischen Owner.
3. Das gemeinsame Content-Schema validiert künftig Intent-Ownership und feldbezogene Evidenz statt untypisierte Sonderfelder zu verlieren.

## Bewusst offene Grenzen

- SureFlap Standard und DualScan waren im deutschen Hersteller-Shop am Prüftag nicht vorrätig; Status bleibt `temporarily-unavailable`.
- OnlyCat-Beuteerkennung, petWALK-Dämm-/Sicherheitswerte und alle Laufzeitangaben sind Herstellerangaben, kein eigener Test.
- Konkrete OnlyCat-Abmessungen waren in der auslesbaren deutschen Spezifikationsseite nicht belastbar vorhanden und werden nicht erfunden.
- Preise bleiben `current: null`; Shoppreise wurden nur zur Marktverfügbarkeit geprüft.
- Petporte bleibt ohne Seite, bis eigenständiger Information Gain gegenüber PetSafe Standard nachgewiesen ist.
