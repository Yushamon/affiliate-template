# Validation Recovery & Release Readiness 35.6.1

**READY WITH KNOWN ISSUES — für den dokumentierten Release-Diff.**

Alle 19 ursprünglichen Testfehler sind behoben. Finale vollständige Suite: **1.230/1.230 App-Tests**, dazu
**26/26 Core-Tests** und **13/13 Evidenzregressionen**. Production Build: 391 HTML-Dokumente.
Alle acht Release-Gates bestehen. Die fünf Inhaltsänderungen aus 35.6 bleiben erhalten; 35.6.1 fügt keine
neuen redaktionellen Änderungen an Produkt-/Ratgeberseiten hinzu. Die 20 Experimentseiten sind unverändert.

Die Empfehlung enthält ausdrücklich bekannte Alt-Auditprobleme; siehe [Validierung](validation.md),
[verbleibende Punkte](remaining-issues.md) und [Gates](release-gates.md). Die Daten-/Operations-/Score-Ausgaben
sind bytegleich zu den unabhängigen Baselineläufen. Sie werden nicht als bestanden dargestellt.
Drei während der Arbeit parallel geänderte Produktdateien bleiben auf Nutzerwunsch erhalten und sind
aus dem Kandidaten ausgeschlossen. Eine Veröffentlichung muss den [Release-Diff](release-diff.md) einhalten.

## Abschließende Entscheidung

1. **Ursache der 16 Konflikte:** historische Ganzdatei-/Vollfeldverträge vor fünf begründeten Revisionen,
   veraltete abgeleitete Berichte und ein zusätzlich automatisch verlinkter Quellen-Titel.
2. **Korrigiert:** alle 16, mit vollständiger Nachprüfung. Kein Test deaktiviert und kein Inhalt zurückgenommen.
3. **Erneuerte Snapshots:** vier Hashwerte im Entscheidungshinweis-JSON/Markdown 35.7 und der einzelne
   Indexationsreport 36.1 mit Markdown/Cockpit-Projektion. Alte Baselines unverändert; neue exakte Revisionsliste.
4. **Drei Bestandsfehler:** ebenfalls korrigiert.
5. **Ursachen:** falsche sponsored-Pflicht für einen offiziellen Link, Entwürfe im Public-Hero-Loop und
   ein ersetzter DOG-6-XL-Hinweistext. Keine Produktionsfunktion musste dafür geändert werden.
6. **Solo-Identität:** D4-Handbuch ist P570 zugeordnet; exaktes F.A.Z.-Gerät bleibt ungesichert.
   P571/P572-Kameramodelle sind getrennt. Keine Übertragung neuer Testergebnisse.
7. **Fünf Inhaltsänderungen:** Quellen erneut geprüft, Modelle/Generation und Fremdteststatus korrekt
   abgegrenzt; alle Änderungen im finalen HTML sichtbar. Firmwaredaten bleiben bewusst undatiert.
8. **35.5-Experiment:** 20 Quellen/äquivalente DOMs, 205 Zugänge und Gruppenzuteilung erhalten.
9. **Veröffentlichte Dateien bei späterem Release:** ausschließlich [Dateimanifest](release-files.json)
   beziehungsweise `release-paths.txt`; getrennt nach Inhalt 35.6, Prüfcode, Snapshots, Register und Dokumentation.
10. **Kritische Risiken:** kein neuer oder ungeklärter kritischer Release-Blocker im Kandidaten.
    Bestandsprobleme K01–K07 bleiben einzeln ausgewiesen; parallele Preisarbeit ist ausgeschlossen.
11. **Gates:** G1–G8 PASS für genau diesen Kandidaten, keine pauschale Aussage über den gesamten Working Tree.
12. **Kann 35.6 veröffentlicht werden?** Ja, als dokumentierter Kandidat mit den bekannten nicht kritischen
    Bestandsproblemen und anschließender erneuter Live-Verifikation. Es wurde nicht veröffentlicht.

## Nachweise

- [Alle 19 Fehler](test-failure-analysis.md), maschinenlesbar als JSON/CSV.
- [16 Snapshotentscheidungen](snapshot-resolution.md), [drei Bestandsfehler](existing-test-issues.md).
- [Solo](solo-model-verification.md), [Experiment](experiment-integrity.md), `candidate-proof.json`.
- [Alle Kommandos](validation-commands.json), Rohlogs unter `logs/`, Quellenabrufe in `source-checks.json`.

Ausgangsbranch `main`, HEAD `8f3bae47761007b9c5725f5a4add70ff0f898385`.
Die älteren Berichte 35.6 bleiben als damaliger Stand mit 19 Fehlern erhalten; diese Freigabe ist die Folgeprüfung.
**Kein Push, Deployment, Release oder Indexierungsantrag.**
