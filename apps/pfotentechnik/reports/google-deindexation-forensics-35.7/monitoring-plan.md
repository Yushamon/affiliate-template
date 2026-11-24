# Acht Wochen im vorhandenen Monitoring

Planungsanker 23.11.2026, **kein behauptetes Experiment-T0**. Acht wöchentliche Erhebungen: 2026-11-30, 2026-12-07, 2026-12-14, 2026-12-21, 2026-12-28, 2027-01-04, 2027-01-11, 2027-01-18. Keine Automation angelegt oder terminiert.

Bestehende Strukturen: `scripts/seo/import-gsc-coverage.py`, vorhandene Recovery-Snapshots/`--previous`-Auswertung aus 35.3 und `indexation-gap-analysis-35.5/monitoring-observations-template.csv` mit `scripts/evaluate-monitoring.py`. Originale jeweils mit Exportzeitpunkt/SHA archivieren; nicht alte Beobachtungen überschreiben und nicht dieselbe Quelle als neue Messung importieren. Keine zweite Datenbank oder Dashboardpipeline erstellen.

Jede Woche getrennt dokumentieren:

- **Property:** datierter Aggregatbestand indexiert/nicht indexiert und Ausschlussbestände, tägliche Property-Impressionen/Klicks im letzten nachweislich vollständigen Siebentagefenster. Gemeldetes Datum und Abrufdatum getrennt; GSC-Verzögerung nicht als Null ausfüllen.
- **Aktueller Canonical-Bestand:** aktuelle Sitemapmenge mit Revision sichern; bekannte positive, gecrawlte negative, gefundene negative und unbekannte exakte URLs aus echten Coverage-/Inspectionbelegen. Neu hinzugekommene URLs separat. Indexierte Canonicals nur zählen, wenn genau dieser Bestand beobachtet ist; bei Teilpanel bekannten Nenner und unbekannten Rest anzeigen.
- **Übergänge:** Vorher positiv/Nachher negativ und umgekehrt pro exakter URL zählen; unbekannte Zwischenstände offen lassen. Neue positive Beobachtung ohne frühere positive Historie heißt Aufnahme, nicht automatisch Wiederaufnahme. Keine Schlüsse aus Verschwinden einer Exportzeile.
- **Historische URLs:** dieselben Alt-/Neupaare getrennt; Weiterleitungen/Alternativen nicht als aktuelle Inhaltsfehler zählen. Kein voller neuer Redirectcrawl.
- **Sieben priorisierte Vergleiche:** Google-Status und Seitenimpressionen/Klicks getrennt für Deutschland und Gesamtmarkt, gleiches vollständiges Zeitfenster. Fehlende Query-/Seitenzeilen als fehlende Exportwerte kennzeichnen, nicht mit null auffüllen. Keine Seitensummen zu Propertysummen addieren.
- **Experiment:** zehn Test- und zehn Kontrollseiten unverändert in ihren Paaren. Vorgesehene relative Tage 0/7/14/28/56 im vorhandenen Evaluator beibehalten. Zusätzliche Wochenbelege zunächst nur als datierte Rohquellen archivieren; **keine Tage 21/35/42/49 in die alte CSV eintragen**, deren Validator sie nicht unterstützt. Keine neue parallele Experimentauswertung. Fehlende T0-Daten nicht rekonstruieren.

Entscheidung nach acht Wochen beziehungsweise dem später korrekt verankerten 56-Tage-Endpunkt: Erst echte A/B-Gruppen vergleichen, möglichst innerhalb gleicher Typ-/Clusterblöcke mit den alten 35.5-Merkmalen. Veränderte Merkmale nur bei notwendiger konkreter Entscheidung neu erheben. Endpunkt unbekannt bleibt unbekannt; vorhandener Evaluator darf `ready: false` liefern. Positive HTTP-/Buildprüfungen ersetzen keine Indexierungsbefunde.

Tatsächliches Veröffentlichungsdatum 35.5 im vorhandenen Archiv unbekannt; Veröffentlichung ist durch die Nutzerangabe belegt. Schon das Vorbereitungsdatum Anfang November liegt weniger als 56 Tage zurück. Deshalb heute ausschließlich Zwischenstand, keine Wirksamkeitseinschätzung. Gleichzeitige andere Releases und der separat autorisierte Commerce-Lauf vom 23.11. sind als Ereignisse zu notieren.
