# Topical-Authority-Roadmap: Katzenklappen

Stand: 2026-08-04  
Entscheidung: kleiner Grundausbau mit einem Cornerstone und einer belegten Bestands-Journey; keine formale Auffüllung auf Sollzahlen.

## Repository- und Search-Befund

- Der kanonische Research-Bestand nennt den Cluster als Chance, ist beim Produktbestand aber veraltet: `research/research.json` markiert SureFlap Connect noch als fehlend, obwohl die Produktdatei seit 2026-08-02 existiert.
- `reports/search/search-report.json`, `bing-search-report.json` und die Search-Dashboard-Daten enthalten keine Katzenklappen-Query, aus der eine zusätzliche Route belastbar priorisiert werden könnte.
- Tatsächlich vorhanden sind eine vollständige appfähige Mikrochip-Klappe, ein Beuteerkennungs-Nachrüstmodul sowie die Hersteller-Owner SureFeed/SureFlap/Sure Petcare und ZeroMOUSE.
- Cat Mate ist im Repository zwar als Hersteller vorhanden, die Seite besitzt aktuell aber Futterautomaten-Intent. Ohne konkrete Katzenklappen-Produkte bleibt sie außerhalb der aktiven Cluster-Journey.
- Der anfängliche Internal-Link-Audit meldete für `/produkt/zeromouse-2-0/` keinen eingehenden Link. Die neue Journey behebt genau diesen belegten Orphan-Befund.

## Intent-Matrix

| Route oder Datei | Aktuelle Nutzer- und Suchintention | Soll-Intent | Aktueller Intent-Owner | Überschneidung / Kannibalisierung | Entscheidung | Konkrete Änderung | Abhängigkeiten | Objektives Akzeptanzkriterium |
|---|---|---|---|---|---|---|---|---|
| `/smarte-haustiertechnik/` · `src/content/pages/smarte-haustiertechnik.md` | Breiter Überblick über Pet-Tech-Kategorien | Katzenklappen nur entdecken und an den Fach-Hub übergeben | Route selbst für den Pet-Tech-Überblick | Würde bei ausführlicher Katzenklappen-Kaufberatung mit dem neuen Hub konkurrieren | Journey neu ordnen | Themenkarte und ein kontextueller Übergabelink zum Fach-Hub | Fach-Hub muss existieren | Genau ein klarer Cluster-Einstieg im Quick-Facts-Block und ein kontextueller Body-Link |
| `/smarte-katzenklappen/` · `src/content/pages/smarte-katzenklappen.md` | Fehlte | Breite Auswahl zwischen Mikrochip-Zugang, App-Schicht, Einbauprüfung und Nachrüstung | Neuer Cornerstone | Muss Produktmaße und Einzelprodukt-Review an Produktseiten abgeben; darf keinen unechten Bestenvergleich simulieren | Neu anlegen | Auswahl- und Abgrenzungs-Hub mit zwei konkreten nächsten Produktpfaden und expliziten Gates für spätere Vergleiche | Bestehende Produkt- und Herstellerseiten | Route baut; `category=katzenklappen`, `intent=buying-guide`; Links zu beiden Produkten und zurück zum Pet-Tech-Überblick; keine erfundene Vergleichsroute |
| `/produkt/sureflap-mikrochip-katzenklappe-connect/` · `src/content/products/sureflap-mikrochip-katzenklappe-connect.md` | Konkretes Modell prüfen: Maße, DualScan, Hub, App, Einbau | Unverändert konkreter Produkt-Owner; breite Auswahl an Hub abgeben | Diese Produktseite | Hohes Risiko, wenn ein App-Vergleich mit nur diesem Modell angelegt würde | Schärfen | Kategoriepfad auf Fach-Hub und expliziter Rücklink; keine Score- oder Empfehlungsaufwertung | Fach-Hub | Kategoriepfad ist `/smarte-katzenklappen/`; Body enthält genau die Intent-Abgrenzung und einen Rücklink |
| `/produkt/zeromouse-2-0/` · `src/content/products/zeromouse-2-0.md` | Konkrete Beuteerkennungs-Nachrüstung prüfen | Als Zusatzmodul schärfen, nicht als vollständige Klappe | Diese Produktseite | Darf nicht als zweites Katzenklappen-Modell in einer Rangliste erscheinen | Schärfen | Kategoriepfad korrigieren und Abgrenzung samt Rücklink ergänzen | Fach-Hub | Kategorie zeigt auf Fach-Hub; Seite bezeichnet ZeroMOUSE explizit als Zusatzmodul und besitzt einen Rücklink |
| `/hersteller/surefeed/` · `src/content/manufacturers/surefeed.md` | Hersteller- und Ökosystemprofil für SureFeed/SureFlap/Sure Petcare | Markenarchitektur behalten; Auswahl an neutralen Hub abgeben | Diese konsolidierte Herstellerseite | Separate SureFlap-Herstellerseite wäre weitgehend doppelt | Behalten und schärfen | Ein kontextueller Hub-Link im Katzenklappen-Abschnitt | Fach-Hub | Bestehende Konsolidierungsbegründung bleibt; Hub-Link vorhanden |
| `/hersteller/zeromouse/` · `src/content/manufacturers/zeromouse.md` | Herstellerprofil der Beuteerkennungs-Nachrüstung | Spezialanbieter erklären und zur neutralen Auswahl zurückführen | Diese Herstellerseite | Überschneidung zur Produktseite bei Funktionsdetails | Schärfen | Hub- und Produkt-Weiterleitung mit klarer Rollenabgrenzung | Fach-Hub und Produktseite | Beide nächsten Schritte sind explizit verlinkt; Herstellerseite beansprucht keinen allgemeinen Klappenvergleich |
| `/hersteller/cat-mate/` · `src/content/manufacturers/cat-mate.md` | Cat-Mate-Futterautomaten und Marke | Unverändert, bis ein konkretes Katzenklappen-Produkt belegt ist | Diese Herstellerseite für Cat Mate | Künstlicher Cluster-Link nur aufgrund der Marke | Bewusst unverändert | Keine Änderung | Konkrete Produktfrage fehlt | Kein Katzenklappen-Link ohne betroffene Produktseite |
| `/vergleiche/beste-mikrochip-katzenklappen/` | Fehlte | Erst bei mehreren vollständigen, gleichartig belegten Klappen | Derzeit keiner; Auswahl-Intent liegt vorläufig beim Hub | Mit nur SureFlap würde die Route deren Produktseite duplizieren; ZeroMOUSE ist kein Vergleichsmodell | Verwerfen / später neu bewerten | Keine Route anlegen | Mindestens ein weiteres vollständiges, nach gemeinsamen Kriterien belegtes Klappenmodell | Erst neu prüfen, wenn mindestens zwei vollständige Klappen mit Maß, Einbau, Erkennung, Richtungsregeln und Stromversorgung im Repository vorliegen |
| `/vergleiche/katzenklappe-mit-app/` | Fehlte | Appfähige vollständige Klappen vergleichen | Derzeit SureFlap-Produktseite für den einzigen konkreten App-Fall | Aktuell nahezu vollständige Kannibalisierung der SureFlap-Seite | Verwerfen / später neu bewerten | Keine Route anlegen | Mindestens zwei appfähige vollständige Klappen mit belegten Fern-/Protokollfunktionen | Erst neu prüfen, wenn zwei vergleichbare App-Klappen im Repository vorhanden sind |
| Einbau-Praxisratgeber | Fehlte | Herstellerübergreifende Nutzeraufgabe Tür/Glas/Wand | Derzeit produktspezifische Einbauangaben bei SureFlap | Mit nur einer belegten Klappe zu nah am Produktdetail | Bewusst verwerfen | Kein Ratgeber in dieser Iteration | Mehrere belegte Bauarten oder eine konkrete herstellerübergreifende offene Einbaufrage | Neue Route erst bei belegtem, modellübergreifendem Information Gain |

## Reihenfolge und drei Verbesserungen

1. Cornerstone `/smarte-katzenklappen/` als breiten Intent-Owner anlegen.
2. Bestehende Überblicks-, Produkt- und Herstellerseiten über kontextuelle Übergaben in eine geschlossene Journey bringen.
3. Die sieben tatsächlich gewünschten Kanten in `journey-completion.ts` zentral messen und regressionsprüfen; keine Vergleichskante verlangen, solange kein belastbarer Vergleich existiert.

## Offene Fragen und Grenzen

- Ob ein weiteres vollständiges Katzenklappen-Modell aufgenommen werden soll, bleibt eine konkrete Produktfrage und ist nicht Teil dieser Roadmap-Umsetzung.
- Mangels vorhandener Katzenklappen-Querydaten wird keine Nachfragebehauptung aus dem Search-Report abgeleitet.
- Die bestehende Research-Importdatei bleibt als historischer Import unverändert. Ihr veralteter `repositoryMatch` ist kein aktueller Repository-Beleg.
- Sollzahlen von vier Ratgebern, zwei Vergleichen und vier Produkten sind Monitoring-Ziele, keine Freigabe zur Seitenerstellung.
