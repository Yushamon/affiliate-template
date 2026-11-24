# URL-Kohorten: Was tatsächlich nachweisbar ist

**Gruppe A: 0 individuell belegbare Verluste. Das bedeutet nicht, dass keine Verluste stattgefunden haben.** Es fehlt für jede aktuelle Canonical ein jüngerer negativer URL-Befund. `deindexed-canonicals.csv` enthält deshalb ausschließlich die Kopfzeile.

**Gruppe B: 0 aktuell belegte positive Kontrollen.** Die 90 positiven heutigen Canonicals aus dem archivierten 02.11.-Export sind eine historische positive Kohorte, keine aktuelle Kontrollgruppe. **Gruppe C ist ebenfalls nicht aktuell bestimmbar**, weil „aktuell nicht indexiert“ fehlt. Alle 269 heutigen Canonicals erhalten in `historical-indexation.csv` ausdrücklich Gruppe U: aktueller Status unbekannt. 63 bekannte historische/alternative Identitäten bilden Gruppe D; das ist keine Zahl aktuell verlorener historischer URLs.

## Historische Übergänge

Die Statusspalten sind mit Export-/Archivdatum bezeichnet, nicht mit einem rekonstruierten Statuszeitpunkt; der 95er-positive Export und die 89er-Propertyzahl am 02.11. sind nicht zeitgleich gleichzusetzen (siehe Dateninventar).

Die früheren exakten Statusspalten belegen 11 heutige URLs mit „gecrawlt, nicht indexiert“ im Oktoberexport und „indexiert“ im Novemberarchiv. Diese sind in der Matrix einzeln ausgewiesen. Es ist eine Aufnahme zwischen zwei Beobachtungen, keine nachgewiesene Wiederaufnahme nach früherem positivem Status. Es gibt keinen älteren positiven URL-Snapshot vor der negativen Oktoberbeobachtung. Bei an beiden historischen Endpunkten negativen URLs ist der Zwischenverlauf unbekannt; daraus wird keine durchgehende Nichtindexierung behauptet.

Im Novemberarchiv sind 90 heutige Canonicals positiv, 91 gecrawlt negativ, 78 gefunden negativ. Zehn heutige Neuzugänge haben keine 35.5-Merkmale und keinen solchen historischen Status.

## Vergleich A gegen B

Mangels identifizierter A- und aktueller B-Mitglieder ist kein valider Vergleich von Alter, Typ, Cluster, Links, Tiefe, Textumfang oder Quellen möglich. Keine Effektgrößen, p-Werte oder vermeintlichen Deindexierungsmerkmale berechnet. Die alten Befunde aus `indexation-gap-analysis-35.5/group-statistics.json` bleiben verwendbar, aber beantworten eine andere Frage: damaliger Status versus damalige Eigenschaften.

Dort sind die gefundenen Seiten jünger und öfter ohne Kontextzugang aus indexierten Seiten. Bei gecrawlten negativen Seiten trennen viele einfache Umfangs-/Quellenmerkmale die Gruppen nicht zuverlässig. Diese Befunde werden weder bestätigt noch widerlegt, weil ein neues URL-Panel fehlt. Git-Existenz ist kein Veröffentlichungsdatum; eine heutige Produktseite wird nicht mit einer Herstellerübersicht als alleiniger Kontrolle verglichen.

## Historische Bereinigung und Grenzen der Zahl 122

192 auf 70 indexierte Property-URLs vom 28.08. bis 16.11.: **122 weniger, 63,54 % Rückgang**. Der bekannte Gesamtbestand steigt gleichzeitig von 414 auf 421. Am letzten Stichtag ergeben die sechs Ausschlusskategorien exakt 351: 130 gecrawlt negativ, 74 gefunden negativ, 57 alternative Canonicals, 80 Weiterleitungen, sieben 404, drei noindex.

Die 137 Alternativen/Weiterleitungen sind ein **Bestand**, keine 137 nachgewiesenen Übergänge aus dem Index. Sie werden weder zu den 122 Verlusten addiert noch davon abgezogen. Es gibt fünf ehemals positive Varianten außerhalb der aktuellen Canonicals; drei liegen in der belegten Migrationszuordnung. Kein neuer negativer URL-Befund zeigt, welche davon heute ausgeschieden sind. Somit ist **kein konkreter Teilbetrag der 122 URL-genau einer Ursache zuweisbar**; „0 zugeordnet“ heißt fehlende Zuordnung, nicht null Migrationswirkung.

Nur unter der zusätzlichen Annahme strikt vergleichbarer positiver URL-Zählungen würde der Vergleich 90 früher positiver heutiger Canonicals mit höchstens 70 positiven Property-URLs einen mengenmäßigen Mindestverlust von 20 erzwingen. Das ist eine **bedingte Mengenschranke**, keine Liste identifizierter Verluste und kein Ersatz für fehlende Google-Canonical-/Stichtagsdaten. Die historische Bereinigung allein ist deshalb nicht einfach als vollständige Erklärung belegt.

35.3B dokumentiert reale historische Soft-404-/Host-/Aliasprobleme, aber auch viele indexierte migrierte Ziele und Ausschlüsse unveränderter Canonicals. Keine erneute Redirectprüfung und kein aus Performancezeilen rekonstruierter Coverage-Status.
