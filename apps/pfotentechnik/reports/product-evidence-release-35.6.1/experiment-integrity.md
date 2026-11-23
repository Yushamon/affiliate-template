# Experimentintegrität 35.5

**PASS: zehn Testseiten und zehn Kontrollen unverändert.**

Der Auftrag bestätigt, dass 35.4/35.5 veröffentlicht sind. Ihre alten Berichte bleiben historische
Momentaufnahmen; aus deren damaligem „kein Release“ wird kein heutiger Nichtveröffentlichungsstatus abgeleitet.

`candidate-proof.json` vergleicht 668 Quell-/Komponenten-/Routingdateien mit dem Aufgabenstart.
Alle erfassten Inhaltsdateien einschließlich der fünf schon vorhandenen 35.6-Änderungen sind im Kandidaten
hashgleich zum Start von 35.6.1. Keine neue redaktionelle Änderung wurde in 35.6.1 vorgenommen.
Die 20 konkret zugeteilten Experimentquellen werden zusätzlich einzeln mit Gruppe und Canonical aufgeführt.

Die bisherige Integrationsprüfung bestätigt weiterhin **20 äquivalente geschützte HTML-Dokumente und
205 unveränderte Linkzugänge**. Metadaten, Canonicals, Robots-Signale, relevante Links und die
ursprüngliche Zuteilung bleiben erhalten. Die ursprünglichen 35.4-/35.5-Berichtdateien und Locks wurden
nicht aktualisiert. Es gibt keinen kritischen Ausnahmeeingriff auf einer Experimentseite.

Bild-Aliasse werden wie bisher anhand der Bildbytes/Quellenbelege normalisiert. Die isolierte Kopie
ändert zusätzlich ortsabhängige Scope-IDs der unveränderten Komponenten ProductScore und
TableOfContents. Die neue Prüfung verlangt deren identische Quellhashes und ansonsten bytegleiches CSS;
erst danach werden diese beiden Identitäten und bewiesene CSS-Bundle-Namen gleichgesetzt.
Das vollständige verbleibende HTML wird weiterhin exakt verglichen. Farb-/CSS- oder Komponentenänderungen
bestehen die Negativtests nicht. Kein normalisiertes HTML wird auf die Website geschrieben.

Die eine neue Auto-Link-Kante des F.A.Z.-Titels führt von Granary Camera zu `/futterautomat-katze/`.
Sie betrifft keine der 20 geschützten Seiten und verändert keine ihrer 205 Linkkanten.
Es wird weder ein Indexierungserfolg noch ein Experimentergebnis behauptet.
