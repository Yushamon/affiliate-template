# Redaktionelle Befundverwaltung

Die versionierte Arbeitsdatei ist `research/editorial-findings.json`. Die Berichte unter
`reports/product-evidence-update-35.6/` bewahren die Erstprüfung. Für neue Wochenprüfungen neue
Quellenbelege ablegen und die bestehende ID weiterverwenden; eine erledigte Meldung nicht duplizieren.

Jeder Datensatz trennt Behauptung, vorhandenen Website-Text, vorgeschlagene Maßnahme und tatsächliche
Umsetzung. `firstKnown: null` bedeutet, dass das erste Bekanntwerden nicht datierbar ist.
`firstRecorded` ist der Beginn der strukturierten Erfassung. `gitCommit: null` bedeutet uncommittiert
oder nicht ermittelt. Der Ausgangscommit des Audits ist kein Korrekturcommit.

Zulässige Statuswerte sind „Neu“, „Bestätigt“, „Zur Korrektur vorgesehen“,
„Korrigiert, aber unveröffentlicht“, „Live verifiziert“ und „Verworfen“.
Jede Änderung braucht einen neuen `history`-Eintrag mit Datum und konkretem Evidenzverweis.
Keine automatischen Statuswechsel aus Alter, fehlendem Suchtreffer oder erfolgreichem Build ableiten.

„Bestätigt“ bestätigt den konkreten Sachverhalt, nicht automatisch einen Website-Fehler.
`kind` unterscheidet redaktionelle Probleme, ergänzte Evidenz, Releasebeobachtungen, Verifikationen und
abgeschlossene Ereignisse. Beim PETKIT-Release wurde die Ableitung eines Feeder-Updates verworfen,
nicht die Existenz des App-Releases. Ein abgeschlossener Cloudvorfall bleibt als Ereignis erhalten.

Für „Live verifiziert“ sind je betroffenem Canonical ein tatsächlicher HTTP-200-Abruf,
Prüfdatum, Body-Prüfsumme und eine inhaltliche Beobachtung erforderlich. Die angegebene Quelle muss
den Abruf nachvollziehbar machen. Ein lokaler Fix bleibt bis zur erneuten Live-Prüfung unveröffentlicht.
Nach einem separat autorisierten Release Commit und Live-Belege nachtragen; diese Verwaltung
veröffentlicht nichts selbst.

Prüfung aus dem Repository-Root:

```sh
node apps/pfotentechnik/scripts/product-evidence/check-findings.mjs
node --test apps/pfotentechnik/test/editorial-evidence-update-35.6.test.mjs
```

Die Prüfung validiert die Aufzeichnung und erkennt fehlende Live-Belege. Sie ersetzt keine
inhaltliche Quellenprüfung. Kontroll- und Testseiten aus 35.5 vor jeder Änderung separat abgleichen.
