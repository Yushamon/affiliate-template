# Verbleibende, nicht kritische Bestandsprobleme

Die vollständige App-Suite hat keinen verbleibenden Fehler. Die folgenden Punkte sind ausdrücklich
keine bestandenen Audits. Ihre Unabhängigkeit ist in `independent-audit-comparison.json` beziehungsweise
den unveränderten früheren Lint-/Renderbelegen nachvollziehbar.

## K01 · Editorial-Lint · P2

231 Bestandswarnungen bei null Fehlern. Risiko: formale Stil-/Strukturmängel; kein neuer Sachfehler und
keine zusätzliche Warnung. Folgeauftrag: einzelne Warnungen außerhalb des Experiments redaktionell prüfen,
keine pauschale FAQ-/Textverlängerung. Strict-Exit bleibt 1.

## K02 · Produktdaten-Audit · P2

14 fehlende Vergleichsfeldmeldungen: je vier bei MOVA SureTrack Pro und SATELLAI Collar Go
(Ortung, Übertragung, Reichweite, Geeignet-für), je drei bei den gesperrten Granary-2-/Vision-Duo-Entwürfen
(Futterart, Geeignet-für, Portionierung). Risiko: unvollständige beziehungsweise nicht korrekt zugeordnete
Vergleichsfelder. Keine dieser Dateien gehört zu den fünf Änderungen; die beiden Entwürfe bleiben gesperrt.
Folgeauftrag: vorhandene Specs und Vergleichsdaten-Adapter für genau diese Modelle abgleichen, ohne
unbelegte Werte zu ergänzen. Das ist keine neue öffentliche Routing-/Schema-Regression.

## K03 · Product Operations · P2

88 bereits bestehende Abweichungen gespeicherter Pflege-/Preiszeit-/Verfügbarkeitsfelder von ihrer aktuellen
Ableitung. Risiko: inkonsistente Verwaltungs-/Pflegesignale. Aktuelle Commerce-Ausgabe und sämtliche
Kaufziele werden unabhängig in den erfolgreichen App-Tests kontrolliert; keine neue Lieferzusage.
Folgeauftrag: Derivationsvertrag und gespeicherte Spiegelwerte gezielt synchronisieren. Kein Anlass für
automatische Preisrecherche oder eine Änderung geschützter Experimentinhalte in diesem Auftrag.

## K04 · Historisches Score-Audit · P2

Das alte Skript prüft einen einfachen Kriterienmittelwert und markiert auch 90+-Werte. Die produktive
Logik bevorzugt explizite redaktionelle Scores. Bestehende Rohwert-/Kriterienabweichungen bleiben sichtbar
in `logs/scores.log`; sie sind zum Ausgangsstand bytegleich. Risiko: redaktioneller Pflegebedarf und
uneinheitliche Rohdarstellungen, kein neu verschobenes Ranking. Folgeauftrag: zulässige Abweichungen
fachlich entscheiden und Prüfvertrag an die gültige Bewertungsmethodik binden. Keine pauschale Rekalibrierung.

## K05 · Legacy-Ratingnormalisierung · P2

`ratings:check` kann wegen der fehlenden Abhängigkeit `yaml` nicht ausgeführt werden. Build, eigentliche
Scorelogik und ihre Tests funktionieren. Risiko: dieser zusätzliche alte Normalisierungscheck steht nicht
zur Verfügung. Folgeauftrag: Werkzeugabhängigkeit beziehungsweise Parser gezielt reparieren; vorher
Auswirkungen eines Normalisierungslaufs getrennt prüfen. Keine neue Abhängigkeit oder Datenmigration hier.

## K06 · Mobile Bestandsdarstellung · P2

35.6 belegte bei geöffneten Produktdetails 12 px horizontalen Überstand bereits vorher und nachher.
Risiko: kleiner horizontaler Scrollbereich. Kein zusätzlicher Layoutcode wurde verändert.
Folgeauftrag: separat reproduzierter, enger Layoutfix mit Schutz des laufenden Experiments.

## K07 · Solo-Testgerät · P1 Recherche, kein Release-Blocker

Die offizielle D4-Anleitung nennt P570; das konkrete Testgerät ist trotzdem nicht per Typenschild oder
Hersteller-/ASIN-Zuordnung verifiziert. Keine Testergebnisse übertragen. Daher kein Sachrisiko für die
fünf freigegebenen Korrekturen. Fehlender Beleg und Modellabgrenzung: `solo-model-verification.md`.

## Veröffentlichungszustand und getrennte lokale Arbeit

Die lokalen Korrekturen bleiben unveröffentlicht. Nach einem späteren autorisierten Release sind ihre
Live-Ausgaben erneut zu kontrollieren; bis dahin kein Wechsel im Befundregister.
Die drei vom Nutzer parallel geänderten Produktdateien bleiben separat erhalten und sind nicht Teil des
getesteten Release-Diffs. Freigabe gilt ausschließlich für `release-files.json`/`release-paths.txt`.
Kein ungeprüftes Komplett-Deployment des Working Trees daraus ableiten.
